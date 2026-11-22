const medicineService = require('../services/medicine.service');
const scheduleService = require('../services/schedule.service');
const ApiResponse = require('../utils/apiResponse');

const createMedicine = async (req, res, next) => {
  try {
    const profileId = req.profile_id || null;
    const locationPayload = req.body.location || null;
    const medicine = await medicineService.createMedicine(
      req.user._id,
      profileId,
      req.body,
      req.user,
      locationPayload
    );
    return ApiResponse.success(res, { medicine }, 'Medicine added successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getMedicines = async (req, res, next) => {
  try {
    const { page, limit, status, filter, search, category, cabinet_id, catalog_id } = req.query;
    const profileId = req.profile_id || null;
    const result = await medicineService.getMedicines(req.user._id, profileId, {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 50,
      status,
      filter,
      search,
      category,
      cabinet_id,
      catalog_id
    });
    return ApiResponse.success(res, result, 'Medicines retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getMedicineById = async (req, res, next) => {
  try {
    const profileId = req.profile_id || null;
    const result = await medicineService.getMedicineById(req.user._id, profileId, req.params.id);
    return ApiResponse.success(res, result, 'Medicine retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateMedicine = async (req, res, next) => {
  try {
    const locationPayload = req.body.location || null;
    const medicine = await medicineService.updateMedicine(
      req.user._id,
      req.params.id,
      req.body,
      req.user,
      locationPayload
    );
    return ApiResponse.success(res, { medicine }, 'Medicine updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteMedicine = async (req, res, next) => {
  try {
    const result = await medicineService.deleteMedicine(req.user._id, req.params.id, req.user);
    return ApiResponse.success(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

const getMedicineRevisions = async (req, res, next) => {
  try {
    const revisions = await medicineService.getMedicineRevisions(req.params.id);
    return ApiResponse.success(res, { revisions }, 'Medicine revision history retrieved successfully');
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
  getMedicineRevisions,
  createMedicineSchedule
};
