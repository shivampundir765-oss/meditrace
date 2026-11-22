/**
 * Base interface for Drug Information Providers.
 * Implementations should return canonical medicine information or null when not found.
 * Never invent or synthesize fake medical information.
 */
class DrugInfoProvider {
  /**
   * Look up medicine metadata by brand or generic name and optional salt composition.
   * @param {string} name
   * @param {string} [salt]
   * @returns {Promise<Object|null>} Canonical medicine info or null
   */
  async lookupByName(_name, _salt = '') {
    throw new Error('Method lookupByName() must be implemented');
  }

  /**
   * Look up medicine metadata by packaging barcode or GTIN.
   * @param {string} barcode
   * @returns {Promise<Object|null>} Canonical medicine info or null
   */
  async lookupByBarcode(_barcode) {
    throw new Error('Method lookupByBarcode() must be implemented');
  }

  /**
   * Search database by text query.
   * @param {string} query
   * @param {Object} [options]
   * @returns {Promise<Array<Object>>}
   */
  async search(_query, _options = {}) {
    throw new Error('Method search() must be implemented');
  }
}

module.exports = { DrugInfoProvider };
