const cartService = require('../services/cart.service');
const ApiResponse = require('../utils/apiResponse');

const getCart = async (req, res, next) => {
  try {
    const result = await cartService.getCart(req.user._id);
    return ApiResponse.success(res, result, 'Cart retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const result = await cartService.addToCart(req.user._id, req.body);
    return ApiResponse.success(res, result, 'Item added to cart', 201);
  } catch (error) {
    next(error);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const result = await cartService.updateCartItem(req.user._id, req.params.itemId, req.body.quantity);
    return ApiResponse.success(res, result, 'Cart item updated successfully');
  } catch (error) {
    next(error);
  }
};

const removeFromCart = async (req, res, next) => {
  try {
    const result = await cartService.removeFromCart(req.user._id, req.params.itemId);
    return ApiResponse.success(res, result, 'Item removed from cart');
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const result = await cartService.clearCart(req.user._id);
    return ApiResponse.success(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};
