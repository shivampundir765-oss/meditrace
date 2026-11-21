const { Retailer } = require('../models/retailer.model');
const { RetailerInventory } = require('../models/retailerInventory.model');

/**
 * Calculate distance between two coordinates using the Haversine formula (km)
 */
const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100; // 2 decimal places
};

const getNearbyChemists = async ({ latitude, longitude, radius = 10, limit = 20 }) => {
  const maxDistanceMeters = radius * 1000;

  // Geospatial $near query on 2dsphere location index
  const retailers = await Retailer.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [Number(longitude), Number(latitude)]
        },
        $maxDistance: maxDistanceMeters
      }
    }
  }).limit(Number(limit));

  const results = retailers.map((r) => {
    const [lng, lat] = r.location.coordinates;
    const distanceKm = calculateHaversineDistance(latitude, longitude, lat, lng);
    return {
      _id: r._id,
      shop_name: r.shop_name,
      licence_number: r.licence_number,
      phone: r.phone,
      email: r.email,
      address: r.address,
      opening_hours: r.opening_hours,
      is_verified: r.is_verified,
      delivery_available: r.delivery_available,
      rating: r.rating,
      coordinates: {
        latitude: lat,
        longitude: lng
      },
      distance_km: distanceKm
    };
  });

  return {
    searchCenter: { latitude: Number(latitude), longitude: Number(longitude) },
    radius_km: Number(radius),
    totalFound: results.length,
    chemists: results
  };
};

const searchChemistsWithMedicine = async ({ medicine_name, latitude, longitude, radius = 25 }) => {
  if (!medicine_name) {
    const error = new Error('Medicine name query parameter is required');
    error.statusCode = 400;
    error.errorCode = 'VALIDATION_ERROR';
    throw error;
  }

  // Find inventory rows matching the medicine name
  const inventoryMatches = await RetailerInventory.find({
    medicine_name: { $regex: medicine_name, $options: 'i' },
    is_available: true,
    quantity: { $gt: 0 }
  }).populate('retailer_id');

  const chemistStockList = [];

  for (const item of inventoryMatches) {
    const retailer = item.retailer_id;
    if (!retailer) continue;

    const [lng, lat] = retailer.location.coordinates;
    let distanceKm = null;
    if (latitude !== undefined && longitude !== undefined) {
      distanceKm = calculateHaversineDistance(Number(latitude), Number(longitude), lat, lng);
      if (radius && distanceKm > radius) continue; // Skip if beyond radius
    }

    chemistStockList.push({
      inventory_id: item._id,
      medicine_name: item.medicine_name,
      generic_name: item.generic_name,
      salt_composition: item.salt_composition,
      dosage_form: item.dosage_form,
      strength: item.strength,
      price: item.price,
      discount_percentage: item.discount_percentage,
      final_price: Math.round(item.price * (1 - item.discount_percentage / 100)),
      in_stock_quantity: item.quantity,
      requires_prescription: item.requires_prescription,
      chemist: {
        _id: retailer._id,
        shop_name: retailer.shop_name,
        phone: retailer.phone,
        address: retailer.address,
        opening_hours: retailer.opening_hours,
        is_verified: retailer.is_verified,
        coordinates: { latitude: lat, longitude: lng },
        distance_km: distanceKm
      }
    });
  }

  // Sort by distance if user location is supplied
  if (latitude !== undefined && longitude !== undefined) {
    chemistStockList.sort((a, b) => (a.chemist.distance_km || 0) - (b.chemist.distance_km || 0));
  }

  return {
    query: medicine_name,
    totalStockists: chemistStockList.length,
    results: chemistStockList
  };
};

const getChemistById = async (chemistId) => {
  const retailer = await Retailer.findById(chemistId);
  if (!retailer) {
    const error = new Error('Chemist not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  const inventory = await RetailerInventory.find({
    retailer_id: chemistId,
    is_available: true
  }).sort({ medicine_name: 1 });

  const [lng, lat] = retailer.location.coordinates;

  return {
    chemist: {
      ...retailer.toObject(),
      coordinates: { latitude: lat, longitude: lng }
    },
    inventoryCount: inventory.length,
    inventory
  };
};

module.exports = {
  calculateHaversineDistance,
  getNearbyChemists,
  searchChemistsWithMedicine,
  getChemistById
};
