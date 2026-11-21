const shopService = require('../services/shop.service');
const ApiResponse = require('../utils/apiResponse');

const searchMedicines = async (req, res, next) => {
  try {
    const { query, city, sortBy, page, limit } = req.query;
    const result = await shopService.searchMedicines({
      query,
      city,
      sortBy,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20
    });
    return ApiResponse.success(res, result, 'Medicines retrieved from partner retailers');
  } catch (error) {
    next(error);
  }
};

const getGenericAlternatives = async (req, res, next) => {
  try {
    const result = await shopService.getGenericAlternatives(req.params.medicineId);
    return ApiResponse.success(res, result, 'Generic alternatives retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchMedicines,
  getGenericAlternatives
};
