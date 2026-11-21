const paymentService = require('../services/payment.service');
const ApiResponse = require('../utils/apiResponse');

const createPayment = async (req, res, next) => {
  try {
    const session = await paymentService.createPaymentSession(req.user._id, req.body);
    return ApiResponse.success(res, session, 'Payment session initialized');
  } catch (error) {
    next(error);
  }
};

const handleWebhook = async (req, res, next) => {
  try {
    const result = await paymentService.processWebhook(req.body);
    return ApiResponse.success(res, result, 'Payment webhook processed successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPayment,
  handleWebhook
};
