const localMedicines = require('../data/medicineLookup.json');
const { AbdmDrug } = require('../models/abdmDrug.model');

/**
 * Service to lookup clinical medicine metadata (description, purpose, category, cautions, nickname)
 */
class MedicineLookupService {
  /**
   * Find medicine metadata by name or salt
   * @param {string} rawName 
   * @param {string} salt 
   * @returns {Promise<Object>}
   */
  async lookup(rawName = '', salt = '') {
    if (!rawName && !salt) {
      return this._defaultEmpty();
    }

    const cleanName = String(rawName).trim().toLowerCase();
    const cleanSalt = String(salt).trim().toLowerCase();

    // 1. Direct match in local rich Indian registry
    for (const item of localMedicines) {
      const itemName = item.name.toLowerCase();
      const itemSalt = item.salt.toLowerCase();

      if (
        cleanName.includes(itemName) ||
        itemName.includes(cleanName) ||
        (cleanSalt && (itemSalt.includes(cleanSalt) || cleanSalt.includes(itemSalt)))
      ) {
        return {
          description: item.description,
          usedFor: item.usedFor,
          category: item.category,
          cautions: item.cautions,
          nickname: item.suggestedNickname || '',
          dosage_form: item.dosage_form || 'tablet',
          strength: item.strength || '',
          source: 'database'
        };
      }
    }

    // 2. ABDM Drug Registry Lookup
    try {
      const abdmMatch = await AbdmDrug.findOne({
        $or: [
          { brand_name: { $regex: cleanName, $options: 'i' } },
          { generic_name: { $regex: cleanName, $options: 'i' } },
          ...(cleanSalt ? [{ composition: { $regex: cleanSalt, $options: 'i' } }] : [])
        ]
      }).lean();

      if (abdmMatch) {
        let category = 'Common';
        if (abdmMatch.schedule_classification === 'Schedule H1' || abdmMatch.schedule_classification === 'Schedule X') {
          category = 'Serious';
        } else if (abdmMatch.therapeutic_class?.toLowerCase().includes('diabetes') || 
                   abdmMatch.therapeutic_class?.toLowerCase().includes('cardiovascular') ||
                   abdmMatch.therapeutic_class?.toLowerCase().includes('hypertension')) {
          category = 'Chronic';
        }

        return {
          description: `${abdmMatch.brand_name} (${abdmMatch.generic_name}) - ${abdmMatch.therapeutic_class || 'Pharmaceutical Formulation'}. Strength: ${abdmMatch.strength || 'Standard'}.`,
          usedFor: abdmMatch.therapeutic_class || 'Therapeutic treatment',
          category,
          cautions: abdmMatch.schedule_warning || 'Use strictly as directed by a healthcare professional.',
          nickname: '',
          dosage_form: (abdmMatch.dosage_form || 'tablet').toLowerCase(),
          strength: abdmMatch.strength || '',
          source: 'database'
        };
      }
    } catch (e) {
      // ABDM query failed or table not ready, continue
    }

    // 3. Fallback to OpenFDA (short timeout so it never blocks or slows down)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);

      const fdaRes = await fetch(
        `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(cleanName)}"&limit=1`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (fdaRes.ok) {
        const data = await fdaRes.json();
        const doc = data.results?.[0];
        if (doc) {
          const indications = doc.indications_and_usage?.[0] || doc.purpose?.[0] || '';
          const warnings = doc.warnings?.[0] || doc.do_not_use?.[0] || 'Take as instructed.';

          return {
            description: doc.description?.[0]?.slice(0, 200) || `Prescribed formulation for ${rawName}.`,
            usedFor: indications.slice(0, 150) || 'General therapeutic use',
            category: 'Common',
            cautions: warnings.slice(0, 150),
            nickname: '',
            dosage_form: 'tablet',
            strength: '',
            source: 'database'
          };
        }
      }
    } catch (e) {
      // FDA timeout or network offline - graceful fallback
    }

    return this._defaultEmpty();
  }

  _defaultEmpty() {
    return {
      description: '',
      usedFor: '',
      category: 'Common',
      cautions: '',
      nickname: '',
      source: 'manual'
    };
  }
}

module.exports = new MedicineLookupService();
