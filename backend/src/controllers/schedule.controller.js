const scheduleService = require('../services/schedule.service');
const ApiResponse = require('../utils/apiResponse');

const getScheduleToday = async (req, res, next) => {
  try {
    const { date } = req.query;
    const result = await scheduleService.getScheduleToday(req.user._id, date);
    return ApiResponse.success(res, result, 'Today schedule retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateSchedule = async (req, res, next) => {
  try {
    const schedule = await scheduleService.updateSchedule(req.user._id, req.params.id, req.body);
    return ApiResponse.success(res, { schedule }, 'Dose schedule updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteSchedule = async (req, res, next) => {
  try {
    const result = await scheduleService.deleteSchedule(req.user._id, req.params.id);
    return ApiResponse.success(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getScheduleToday,
  updateSchedule,
  deleteSchedule
};
