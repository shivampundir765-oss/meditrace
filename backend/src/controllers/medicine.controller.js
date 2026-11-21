const medicineService = require('../services/medicine.service');
const scheduleService = require('../services/schedule.service');
const ApiResponse = require('../utils/apiResponse');

const createMedicine = async (req, res, next) => {
  try {
    const medicine = await medicineService.createMedicine(req.user._id, req.body);
    return ApiResponse.success(res, { medicine }, 'Medicine added successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getMedicines = async (req, res, next) => {
  try {
    const { page, limit, status, filter, search } = req.query;
    const result = await medicineService.getMedicines(req.user._id, {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
      status,
      filter,
      search
    });
    return ApiResponse.success(res, result, 'Medicines retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getMedicineById = async (req, res, next) => {
  try {
    const result = await medicineService.getMedicineById(req.user._id, req.params.id);
    return ApiResponse.success(res, result, 'Medicine retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateMedicine = async (req, res, next) => {
  try {
    const medicine = await medicineService.updateMedicine(req.user._id, req.params.id, req.body);
    return ApiResponse.success(res, { medicine }, 'Medicine updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteMedicine = async (req, res, next) => {
  try {
    const result = await medicineService.deleteMedicine(req.user._id, req.params.id);
    return ApiResponse.success(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

const createMedicineSchedule = async (req, res, next) => {
  try {
    const schedule = await scheduleService.createSchedule(req.user._id, req.params.id, req.body);
    return ApiResponse.success(res, { schedule }, 'Dose schedule created successfully', 201);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMedicine,
  getMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine,
  createMedicineSchedule
};
