const chemistService = require('../services/chemist.service');
const ApiResponse = require('../utils/apiResponse');

const getNearbyChemists = async (req, res, next) => {
  try {
    const { latitude, longitude, radius, radiusKm, limit } = req.query;
    const lat = latitude ? parseFloat(latitude) : 12.9716;
    const lng = longitude ? parseFloat(longitude) : 77.5946;
    const rad = radiusKm ? parseFloat(radiusKm) : (radius ? parseFloat(radius) : 10);

    const result = await chemistService.getNearbyChemists({
      latitude: lat,
      longitude: lng,
      radius: rad,
      limit: limit ? parseInt(limit, 10) : 20
    });

    return ApiResponse.success(res, result, 'Nearby chemists found successfully');
  } catch (error) {
    next(error);
  }
};

const searchChemistsWithMedicine = async (req, res, next) => {
  try {
    const { name, latitude, longitude, radius } = req.query;
    const result = await chemistService.searchChemistsWithMedicine({
      medicine_name: name,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      radius: radius ? parseFloat(radius) : undefined
    });

    return ApiResponse.success(res, result, 'Chemist medicine search completed successfully');
  } catch (error) {
    next(error);
  }
};

const getChemistById = async (req, res, next) => {
  try {
    const result = await chemistService.getChemistById(req.params.id);
    return ApiResponse.success(res, result, 'Chemist details retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNearbyChemists,
  searchChemistsWithMedicine,
  getChemistById
};
