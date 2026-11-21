const doseService = require('../services/dose.service');
const ApiResponse = require('../utils/apiResponse');

const markDoseTaken = async (req, res, next) => {
  try {
    const result = await doseService.markDoseTaken(req.user._id, req.params.id, req.body);
    return ApiResponse.success(res, result, 'Dose marked as taken successfully');
  } catch (error) {
    next(error);
  }
};

const markDoseSkipped = async (req, res, next) => {
  try {
    const result = await doseService.markDoseSkipped(req.user._id, req.params.id, req.body);
    return ApiResponse.success(res, result, 'Dose marked as skipped');
  } catch (error) {
    next(error);
  }
};

const markDoseMissed = async (req, res, next) => {
  try {
    const result = await doseService.markDoseMissed(req.user._id, req.params.id, req.body);
    return ApiResponse.success(res, result, 'Dose marked as missed');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  markDoseTaken,
  markDoseSkipped,
  markDoseMissed
};
