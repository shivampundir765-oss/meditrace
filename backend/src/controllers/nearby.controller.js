const facilityService = require('../services/facility.service');
const { Retailer } = require('../models/retailer.model');
const ApiResponse = require('../utils/apiResponse');

// 5-minute cache for nearby lookups
const nearbyCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCached(key) {
  const item = nearbyCache.get(key);
  if (item && Date.now() - item.timestamp < CACHE_TTL_MS) {
    return item.data;
  }
  return null;
}

function setCache(key, data) {
  nearbyCache.set(key, { data, timestamp: Date.now() });
}

exports.getNearbyChemists = async (req, res, next) => {
  try {
    const lat = req.query.lat || req.query.latitude || 12.9716;
    const lng = req.query.lng || req.query.longitude || 77.5946;
    const radius = req.query.radius || req.query.radiusKm || 10;
    const search = req.query.search || req.query.query || '';

    const cacheKey = `chemists_${lat}_${lng}_${radius}_${search}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return ApiResponse.success(res, cached, 'Nearby chemists retrieved (cached)');
    }

    // 1. Get pharmacies from facility service
    const facilityRes = await facilityService.getNearbyFacilities({
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      radiusKm: parseFloat(radius),
      type: 'pharmacy',
      query: search,
      limit: 50
    });

    // 2. Also query registered retailers to merge real store stock
    let registeredRetailers = [];
    try {
      registeredRetailers = await Retailer.find({
        is_verified: true,
        is_active: true
      }).lean();
    } catch (_e) {}

    const mappedRetailers = registeredRetailers.map(r => {
      const coords = r.location?.coordinates || [77.5946, 12.9716];
      const dist = facilityService.calculateHaversineDistance(parseFloat(lat), parseFloat(lng), coords[1], coords[0]);
      return {
        _id: r._id,
        name: r.store_name,
        type: 'pharmacy',
        phone: r.phone,
        opening_hours: '08:00 - 23:00',
        rating: 4.8,
        address: {
          street: r.address?.street || '',
          city: r.address?.city || 'Bangalore',
          state: r.address?.state || 'Karnataka',
          pincode: r.address?.pincode || '560001'
        },
        coordinates: {
          latitude: coords[1],
          longitude: coords[0]
        },
        services: ['Prescription Medicines', 'OTC Delivery', 'ABDM Verified'],
        distanceKm: dist,
        is_registered_partner: true,
        google_maps_url: `https://www.google.com/maps/dir/?api=1&destination=${coords[1]},${coords[0]}`
      };
    }).filter(r => r.distanceKm <= parseFloat(radius));

    // Combine and deduplicate
    const combined = [...mappedRetailers, ...facilityRes.facilities]
      .filter((v, i, a) => a.findIndex(t => t.name.toLowerCase() === v.name.toLowerCase()) === i)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    const result = {
      searchLocation: { latitude: parseFloat(lat), longitude: parseFloat(lng) },
      radiusKm: parseFloat(radius),
      totalFound: combined.length,
      places: combined
    };

    setCache(cacheKey, result);
    return ApiResponse.success(res, result, 'Nearby chemists retrieved successfully');
  } catch (error) {
    next(error);
  }
};

exports.getNearbyHospitals = async (req, res, next) => {
  try {
    const lat = req.query.lat || req.query.latitude || 12.9716;
    const lng = req.query.lng || req.query.longitude || 77.5946;
    const radius = req.query.radius || req.query.radiusKm || 10;
    const search = req.query.search || req.query.query || '';

    const cacheKey = `hospitals_${lat}_${lng}_${radius}_${search}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return ApiResponse.success(res, cached, 'Nearby hospitals retrieved (cached)');
    }

    const facilityRes = await facilityService.getNearbyFacilities({
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      radiusKm: parseFloat(radius),
      type: 'hospital',
      query: search,
      limit: 50
    });

    const result = {
      searchLocation: { latitude: parseFloat(lat), longitude: parseFloat(lng) },
      radiusKm: parseFloat(radius),
      totalFound: facilityRes.facilities.length,
      places: facilityRes.facilities
    };

    setCache(cacheKey, result);
    return ApiResponse.success(res, result, 'Nearby hospitals retrieved successfully');
  } catch (error) {
    next(error);
  }
};
