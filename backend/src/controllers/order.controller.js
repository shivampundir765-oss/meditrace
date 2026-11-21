const orderService = require('../services/order.service');
const ApiResponse = require('../utils/apiResponse');

const createOrder = async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.user._id, req.body);
    return ApiResponse.success(res, { order }, 'Order placed successfully', 201);
  } catch (error) {
    next(error);
  }
};

const listOrders = async (req, res, next) => {
  try {
    const { status, page, limit } = req.query;
    const result = await orderService.listOrders(req.user, {
      status,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20
    });
    return ApiResponse.success(res, result, 'Orders retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.user, req.params.id);
    return ApiResponse.success(res, { order }, 'Order retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await orderService.updateOrderStatus(req.user, req.params.id, req.body);
    return ApiResponse.success(res, { order }, 'Order status updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  listOrders,
  getOrderById,
  updateOrderStatus
};
