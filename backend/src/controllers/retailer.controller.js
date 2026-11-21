const retailerService = require('../services/retailer.service');
const ApiResponse = require('../utils/apiResponse');

const getProfile = async (req, res, next) => {
  try {
    const profile = await retailerService.getProfile(req.user._id);
    return ApiResponse.success(res, { profile }, 'Retailer profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const upsertProfile = async (req, res, next) => {
  try {
    const profile = await retailerService.upsertProfile(req.user._id, req.body);
    return ApiResponse.success(res, { profile }, 'Retailer profile updated successfully');
  } catch (error) {
    next(error);
  }
};

const addInventoryItem = async (req, res, next) => {
  try {
    const item = await retailerService.addInventoryItem(req.user._id, req.body);
    return ApiResponse.success(res, { item }, 'Medicine added to retailer inventory', 201);
  } catch (error) {
    next(error);
  }
};

const listInventory = async (req, res, next) => {
  try {
    const { page, limit, search, is_available } = req.query;
    const result = await retailerService.listInventory(req.user._id, {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
      search,
      is_available
    });
    return ApiResponse.success(res, result, 'Retailer inventory retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateInventoryItem = async (req, res, next) => {
  try {
    const item = await retailerService.updateInventoryItem(req.user._id, req.params.id, req.body);
    return ApiResponse.success(res, { item }, 'Inventory item updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteInventoryItem = async (req, res, next) => {
  try {
    const result = await retailerService.deleteInventoryItem(req.user._id, req.params.id);
    return ApiResponse.success(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  upsertProfile,
  addInventoryItem,
  listInventory,
  updateInventoryItem,
  deleteInventoryItem
};
