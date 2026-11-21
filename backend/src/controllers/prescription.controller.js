const prescriptionService = require('../services/prescription.service');
const ApiResponse = require('../utils/apiResponse');

const createPrescription = async (req, res, next) => {
  try {
    const prescription = await prescriptionService.createPrescription(req.user._id, req.body);
    return ApiResponse.success(res, { prescription }, 'Prescription created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getPrescriptions = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;
    const result = await prescriptionService.getPrescriptions(req.user._id, {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
      status
    });
    return ApiResponse.success(res, result, 'Prescriptions retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getPrescriptionById = async (req, res, next) => {
  try {
    const result = await prescriptionService.getPrescriptionById(req.user._id, req.params.id);
    return ApiResponse.success(res, result, 'Prescription retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updatePrescription = async (req, res, next) => {
  try {
    const prescription = await prescriptionService.updatePrescription(req.user._id, req.params.id, req.body);
    return ApiResponse.success(res, { prescription }, 'Prescription updated successfully');
  } catch (error) {
    next(error);
  }
};

const deletePrescription = async (req, res, next) => {
  try {
    const result = await prescriptionService.deletePrescription(req.user._id, req.params.id);
    return ApiResponse.success(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
  updatePrescription,
  deletePrescription
};
