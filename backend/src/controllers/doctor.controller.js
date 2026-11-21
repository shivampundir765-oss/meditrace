const doctorService = require('../services/doctor.service');
const ApiResponse = require('../utils/apiResponse');

const searchDoctors = async (req, res, next) => {
  try {
    const { name, specialization, city, page, limit } = req.query;
    const result = await doctorService.searchDoctors({
      name,
      specialization,
      city,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20
    });
    return ApiResponse.success(res, result, 'Doctors retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getDoctorById = async (req, res, next) => {
  try {
    const doctor = await doctorService.getDoctorById(req.params.id);
    return ApiResponse.success(res, { doctor }, 'Doctor details retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getFreeSlots = async (req, res, next) => {
  try {
    const { date } = req.query;
    const result = await doctorService.getFreeSlots(req.params.id, date);
    return ApiResponse.success(res, result, 'Doctor slots retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const upsertProfile = async (req, res, next) => {
  try {
    const doctor = await doctorService.upsertProfile(req.user._id, req.body);
    return ApiResponse.success(res, { doctor }, 'Doctor profile saved successfully');
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const doctor = await doctorService.getProfile(req.user._id);
    return ApiResponse.success(res, { doctor }, 'Doctor profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchDoctors,
  getDoctorById,
  getFreeSlots,
  upsertProfile,
  getProfile
};
