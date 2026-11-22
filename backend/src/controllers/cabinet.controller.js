const cabinetService = require('../services/cabinet.service');
const ApiResponse = require('../utils/apiResponse');

exports.getCabinets = async (req, res, next) => {
  try {
    const profileId = req.profile_id || null;
    const cabinets = await cabinetService.listCabinetsWithMedicines(req.user._id, profileId);
    return ApiResponse.success(res, { cabinets }, 'Cabinets retrieved successfully');
  } catch (error) {
    next(error);
  }
};

exports.getCabinetById = async (req, res, next) => {
  try {
    const profileId = req.profile_id || null;
    const cabinet = await cabinetService.getCabinetById(req.user._id, req.params.id, profileId);
    return ApiResponse.success(res, { cabinet }, 'Cabinet retrieved successfully');
  } catch (error) {
    next(error);
  }
};

exports.createCabinet = async (req, res, next) => {
  try {
    const profileId = req.profile_id || null;
    const locationPayload = req.body.location || null;
    const cabinet = await cabinetService.createCabinet(
      req.user._id,
      profileId,
      req.body,
      locationPayload
    );
    return ApiResponse.success(res, { cabinet }, 'Cabinet created successfully', 201);
  } catch (error) {
    next(error);
  }
};

exports.updateCabinet = async (req, res, next) => {
  try {
    const locationPayload = req.body.location || null;
    const cabinet = await cabinetService.updateCabinet(
      req.user._id,
      req.params.id,
      req.body,
      locationPayload
    );
    return ApiResponse.success(res, { cabinet }, 'Cabinet updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.deleteCabinet = async (req, res, next) => {
  try {
    const result = await cabinetService.deleteCabinet(req.user._id, req.params.id);
    return ApiResponse.success(res, result, 'Cabinet deleted successfully');
  } catch (error) {
    next(error);
  }
};

exports.addMedicineToCabinet = async (req, res, next) => {
  try {
    const profileId = req.profile_id || null;
    const mapping = await cabinetService.addMedicineToCabinet(
      req.user._id,
      profileId,
      req.params.id,
      req.body
    );
    return ApiResponse.success(res, { mapping }, 'Medicine added to cabinet successfully', 201);
  } catch (error) {
    next(error);
  }
};

exports.removeMedicineFromCabinet = async (req, res, next) => {
  try {
    const result = await cabinetService.removeMedicineFromCabinet(
      req.user._id,
      req.params.id,
      req.params.medId
    );
    return ApiResponse.success(res, result, 'Medicine removed from cabinet successfully');
  } catch (error) {
    next(error);
  }
};

exports.addPrescriptionToCabinet = async (req, res, next) => {
  try {
    const profileId = req.profile_id || null;
    const locationPayload = req.body.location || null;
    const prescription = await cabinetService.addPrescriptionToCabinet(
      req.user._id,
      profileId,
      req.params.id,
      req.body,
      locationPayload
    );
    return ApiResponse.success(res, { prescription }, 'Prescription added to cabinet successfully', 201);
  } catch (error) {
    next(error);
  }
};
