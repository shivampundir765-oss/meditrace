const { DrugInfoProvider } = require('./DrugInfoProvider');
const { AbdmDrug } = require('../../models/abdmDrug.model');
const { ABDM_REGISTRY_ENTRIES } = require('../../data/abdmRegistryData');
const localMedicines = require('../../data/medicineLookup.json');

/**
 * Adapter for India's National Drug Database (ABDM & CDSCO National Formulary).
 * Searches local MongoDB registry and in-memory official dataset.
 */
class AbdmNationalDrugAdapter extends DrugInfoProvider {
  constructor() {
    super();
    this.name = 'ABDM_CDSCO_INDIA';
  }

  /**
   * Normalize an entry into standard MediTrace medicine format.
   */
  _formatAbdmEntry(entry) {
    if (!entry) return null;

    let category = 'Common';
    const sched = entry.schedule_classification || '';
    const tc = (entry.therapeutic_class || '').toLowerCase();

    if (sched === 'Schedule H1' || sched === 'Schedule X' || sched === 'Schedule H') {
      category = 'Serious';
    } else if (
      tc.includes('diabetes') ||
      tc.includes('cardio') ||
      tc.includes('hyperten') ||
      tc.includes('thyroid') ||
      tc.includes('chronic')
    ) {
      category = 'Chronic';
    }

    // Default nickname mapping based on therapeutic class or common condition
    let nickname = '';
    if (tc.includes('analgesic') || tc.includes('antipyretic')) {
      nickname = 'Fever / Pain';
    } else if (tc.includes('antihistamin') || tc.includes('allergy')) {
      nickname = 'Allergy';
    } else if (tc.includes('cough') || tc.includes('cold') || tc.includes('expectorant')) {
      nickname = 'Cold';
    } else if (tc.includes('antacid') || tc.includes('proton-pump') || tc.includes('gastric')) {
      nickname = 'Acidity';
    } else if (tc.includes('diabetes') || tc.includes('antidiabetic')) {
      nickname = 'Diabetes';
    } else if (tc.includes('hypertension') || tc.includes('cardio')) {
      nickname = 'Blood Pressure';
    }

    return {
      name: entry.brand_name || entry.generic_name,
      brand_name: entry.brand_name,
      generic_name: entry.generic_name,
      salt_composition: entry.salt_composition || '',
      dosage_form: (entry.dosage_form || 'tablet').toLowerCase(),
      strength: entry.strength || '',
      manufacturer: entry.manufacturer_name || '',
      description: `${entry.brand_name} (${entry.generic_name}) - ${entry.therapeutic_class || 'Medicinal preparation'}. Strength: ${entry.strength || 'Standard'}. Standard Pack: ${entry.standard_pack_size || 'Strip'}.`,
      usedFor: entry.therapeutic_class || 'Therapeutic treatment',
      category,
      cautions: entry.schedule_warning || (entry.contraindications_and_warnings ? entry.contraindications_and_warnings : 'Use strictly as directed by a healthcare professional.'),
      nickname,
      storage_guidelines: entry.storage_guidelines || 'Store in a cool and dry place.',
      schedule_classification: entry.schedule_classification || 'OTC',
      cdsco_approval_status: entry.cdsco_approval_status || 'Approved by CDSCO',
      abdm_drug_code: entry.abdm_drug_code || '',
      barcodes: entry.barcodes || [],
      source: 'database',
      provider: this.name
    };
  }

  async lookupByName(name = '', salt = '') {
    const cleanName = String(name || '').trim();
    const cleanSalt = String(salt || '').trim();
    if (!cleanName && !cleanSalt) return null;

    // Check local enriched medicines first
    const cleanNameLower = cleanName.toLowerCase();
    const cleanSaltLower = cleanSalt.toLowerCase();

    for (const item of localMedicines) {
      const itemName = item.name.toLowerCase();
      const itemSalt = (item.salt || '').toLowerCase();
      if (
        cleanNameLower.includes(itemName) ||
        itemName.includes(cleanNameLower) ||
        (cleanSaltLower && (itemSalt.includes(cleanSaltLower) || cleanSaltLower.includes(itemSalt)))
      ) {
        return {
          name: item.name,
          brand_name: item.name,
          generic_name: item.salt,
          salt_composition: item.salt,
          dosage_form: item.dosage_form || 'tablet',
          strength: item.strength || '',
          manufacturer: item.manufacturer || 'Indian Pharma',
          description: item.description,
          usedFor: item.usedFor,
          category: item.category,
          cautions: item.cautions,
          nickname: item.suggestedNickname || '',
          storage_guidelines: 'Store below 25°C in a dry place.',
          schedule_classification: 'OTC',
          cdsco_approval_status: 'Approved - CDSCO National Formulary 2024',
          abdm_drug_code: `ABDM-${item.name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}-001`,
          barcodes: item.barcode ? [item.barcode] : [],
          source: 'database',
          provider: this.name
        };
      }
    }

    // Try MongoDB AbdmDrug collection
    try {
      const queryOr = [];
      if (cleanName) {
        queryOr.push({ brand_name: { $regex: cleanName, $options: 'i' } });
        queryOr.push({ generic_name: { $regex: cleanName, $options: 'i' } });
      }
      if (cleanSalt) {
        queryOr.push({ salt_composition: { $regex: cleanSalt, $options: 'i' } });
      }

      if (queryOr.length > 0) {
        const doc = await AbdmDrug.findOne({ $or: queryOr }).lean();
        if (doc) return this._formatAbdmEntry(doc);
      }
    } catch (err) {
      // In-memory static dataset fallback
    }

    // Fallback to static ABDM_REGISTRY_ENTRIES
    const regexName = cleanName ? new RegExp(cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;
    const regexSalt = cleanSalt ? new RegExp(cleanSalt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;

    const matched = ABDM_REGISTRY_ENTRIES.find((entry) => {
      if (regexName && (regexName.test(entry.brand_name) || regexName.test(entry.generic_name))) {
        return true;
      }
      if (regexSalt && regexSalt.test(entry.salt_composition)) {
        return true;
      }
      return false;
    });

    return matched ? this._formatAbdmEntry(matched) : null;
  }

  async lookupByBarcode(barcode = '') {
    const clean = String(barcode || '').trim();
    if (!clean) return null;

    // Check localMedicines
    const localMatch = localMedicines.find((m) => m.barcode === clean);
    if (localMatch) {
      return this.lookupByName(localMatch.name, localMatch.salt);
    }

    // Check Mongo collection
    try {
      const doc = await AbdmDrug.findOne({ barcodes: clean }).lean();
      if (doc) return this._formatAbdmEntry(doc);
    } catch (_err) {
      // fallback to static list
    }

    // Check static list
    const staticMatch = ABDM_REGISTRY_ENTRIES.find(
      (e) => (e.barcodes && e.barcodes.includes(clean)) || e.abdm_drug_code === clean
    );
    return staticMatch ? this._formatAbdmEntry(staticMatch) : null;
  }

  async search(query = '', { limit = 20 } = {}) {
    const trimmed = String(query || '').trim();
    if (!trimmed) {
      return ABDM_REGISTRY_ENTRIES.slice(0, limit).map((e) => this._formatAbdmEntry(e));
    }

    const regex = new RegExp(trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    try {
      const docs = await AbdmDrug.find({
        $or: [
          { brand_name: regex },
          { generic_name: regex },
          { salt_composition: regex },
          { therapeutic_class: regex },
          { abdm_drug_code: regex }
        ]
      })
        .limit(Number(limit))
        .lean();

      if (docs && docs.length > 0) {
        return docs.map((d) => this._formatAbdmEntry(d));
      }
    } catch (_e) {
      // fallback to static list
    }

    const matchedStatic = ABDM_REGISTRY_ENTRIES.filter(
      (e) =>
        regex.test(e.brand_name) ||
        regex.test(e.generic_name) ||
        regex.test(e.salt_composition) ||
        regex.test(e.therapeutic_class) ||
        regex.test(e.abdm_drug_code)
    ).slice(0, limit);

    return matchedStatic.map((e) => this._formatAbdmEntry(e));
  }
}

module.exports = { AbdmNationalDrugAdapter };
