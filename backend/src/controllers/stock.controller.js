const stockService = require('../services/stock.service');
const ApiResponse = require('../utils/apiResponse');

const getStockOverview = async (req, res, next) => {
  try {
    const result = await stockService.getStockOverview(req.user._id);
    return ApiResponse.success(res, result, 'Stock overview retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateStock = async (req, res, next) => {
  try {
    const result = await stockService.updateStock(req.user._id, req.params.medicineId, req.body);
    return ApiResponse.success(res, { stock: result }, 'Medicine stock updated successfully');
  } catch (error) {
    next(error);
  }
};

const getLowStock = async (req, res, next) => {
  try {
    const result = await stockService.getLowStockMedicines(req.user._id);
    return ApiResponse.success(res, result, 'Low stock medicines retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getExpiring = async (req, res, next) => {
  try {
    const { days } = req.query;
    const result = await stockService.getExpiringMedicines(req.user._id, days || 30);
    return ApiResponse.success(res, result, 'Expiring medicines retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStockOverview,
  updateStock,
  getLowStock,
  getExpiring
};
