const facilityService = require('../services/facility.service');
const ApiResponse = require('../utils/apiResponse');

const getNearbyPlaces = async (req, res, next) => {
  try {
    const {
      latitude,
      longitude,
      radius,
      radiusKm,
      type,
      emergencyOnly,
      query,
      limit
    } = req.query;

    const result = await facilityService.getNearbyFacilities({
      latitude: latitude ? parseFloat(latitude) : 12.9716,
      longitude: longitude ? parseFloat(longitude) : 77.5946,
      radiusKm: radiusKm ? parseFloat(radiusKm) : (radius ? parseFloat(radius) : 25),
      type: type || 'all',
      emergencyOnly: emergencyOnly === 'true' || emergencyOnly === true,
      query: query || '',
      limit: limit ? parseInt(limit, 10) : 30
    });

    return ApiResponse.success(res, result, 'Nearby healthcare facilities retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNearbyPlaces
};
