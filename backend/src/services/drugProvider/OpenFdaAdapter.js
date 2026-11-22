const { DrugInfoProvider } = require('./DrugInfoProvider');

/**
 * Adapter for OpenFDA API as a clinical fallback for international medicines.
 */
class OpenFdaAdapter extends DrugInfoProvider {
  constructor() {
    super();
    this.name = 'OPEN_FDA';
    this.baseUrl = 'https://api.fda.gov/drug/label.json';
    this.timeoutMs = 3000;
  }

  async lookupByName(name = '', salt = '') {
    const clean = String(name || '').trim();
    if (!clean) return null;

    try {
      const term = encodeURIComponent(clean.split(' ')[0]);
      const url = `${this.baseUrl}?search=(openfda.brand_name:"${term}"+openfda.generic_name:"${term}")&limit=1`;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (!response.ok) return null;

      const data = await response.json();
      const item = data.results && data.results[0];
      if (!item) return null;

      const openfda = item.openfda || {};
      const brandName = (openfda.brand_name && openfda.brand_name[0]) || clean;
      const genericName = (openfda.generic_name && openfda.generic_name[0]) || salt || '';
      const purpose = (item.purpose && item.purpose[0]) || (item.indications_and_usage && item.indications_and_usage[0]) || 'General therapeutic use';
      const warnings = (item.warnings && item.warnings[0]) || 'Use as directed by physician';

      return {
        name: brandName,
        brand_name: brandName,
        generic_name: genericName,
        salt_composition: genericName,
        dosage_form: (openfda.dosage_form && openfda.dosage_form[0]?.toLowerCase()) || 'tablet',
        strength: (openfda.substance_name && openfda.substance_name[0]) || '',
        manufacturer: (openfda.manufacturer_name && openfda.manufacturer_name[0]) || 'FDA Approved Manufacturer',
        description: `${brandName} (${genericName}). ${purpose.substring(0, 150)}...`,
        usedFor: purpose.substring(0, 80),
        category: 'Common',
        cautions: warnings.substring(0, 120),
        nickname: '',
        storage_guidelines: 'Store in a cool dry place',
        schedule_classification: 'OTC',
        cdsco_approval_status: 'FDA Listed',
        abdm_drug_code: '',
        barcodes: [],
        source: 'database',
        provider: this.name
      };
    } catch (err) {
      // Offline, network timeout, or not found -> return null safely
      return null;
    }
  }

  async lookupByBarcode(_barcode = '') {
    // OpenFDA does not have a reliable global UPC index for all Indian barcodes
    return null;
  }

  async search(query = '', _options = {}) {
    const res = await this.lookupByName(query);
    return res ? [res] : [];
  }
}

module.exports = { OpenFdaAdapter };
