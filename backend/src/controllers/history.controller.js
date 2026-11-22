const historyService = require('../services/history.service');
const ApiResponse = require('../utils/apiResponse');

exports.getHistory = async (req, res, next) => {
  try {
    const { days, catalogId } = req.query;
    const result = await historyService.getAdherenceHistory(req.user._id, {
      days: days ? parseInt(days, 10) : 7,
      catalogId
    });
    return ApiResponse.success(res, result, 'Adherence history retrieved successfully');
  } catch (error) {
    next(error);
  }
};

exports.markLateDose = async (req, res, next) => {
  try {
    const result = await historyService.markLateDose(req.user._id, req.params.id, req.body);
    return ApiResponse.success(res, result, 'Late dose recorded successfully');
  } catch (error) {
    next(error);
  }
};
