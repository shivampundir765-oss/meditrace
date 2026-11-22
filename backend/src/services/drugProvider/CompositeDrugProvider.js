const { DrugInfoProvider } = require('./DrugInfoProvider');
const { AbdmNationalDrugAdapter } = require('./AbdmNationalDrugAdapter');
const { OpenFdaAdapter } = require('./OpenFdaAdapter');

/**
 * Composite Drug Information Provider.
 * Chained lookup: India's ABDM/CDSCO National Drug Registry -> OpenFDA fallback.
 * Strictly returns null or empty fields if no match exists; never invents data.
 */
class CompositeDrugProvider extends DrugInfoProvider {
  constructor(options = {}) {
    super();
    this.name = 'CompositeDrugProvider';
    this.primaryProvider = new AbdmNationalDrugAdapter();
    this.fallbackProvider = new OpenFdaAdapter();
    this.providerMode = options.mode || process.env.DRUG_INFO_PROVIDER || 'COMPOSITE';
  }

  async lookupByName(name = '', salt = '') {
    if (!name && !salt) return null;

    if (this.providerMode === 'OPENFDA') {
      return await this.fallbackProvider.lookupByName(name, salt);
    }

    // 1. Try National Indian Drug Registry first (ABDM + CDSCO)
    const primaryResult = await this.primaryProvider.lookupByName(name, salt);
    if (primaryResult) {
      return primaryResult;
    }

    // 2. Try OpenFDA fallback if allowed
    if (this.providerMode !== 'ABDM_ONLY') {
      const fallbackResult = await this.fallbackProvider.lookupByName(name, salt);
      if (fallbackResult) {
        return fallbackResult;
      }
    }

    // No match found in official registries; return null
    return null;
  }

  async lookupByBarcode(barcode = '') {
    if (!barcode) return null;

    const primaryResult = await this.primaryProvider.lookupByBarcode(barcode);
    if (primaryResult) return primaryResult;

    if (this.providerMode !== 'ABDM_ONLY') {
      const fallbackResult = await this.fallbackProvider.lookupByBarcode(barcode);
      if (fallbackResult) return fallbackResult;
    }

    return null;
  }

  async search(query = '', options = {}) {
    if (!query) return [];

    const primaryResults = await this.primaryProvider.search(query, options);
    if (primaryResults && primaryResults.length > 0) {
      return primaryResults;
    }

    if (this.providerMode !== 'ABDM_ONLY') {
      return await this.fallbackProvider.search(query, options);
    }

    return [];
  }
}

module.exports = { CompositeDrugProvider };
