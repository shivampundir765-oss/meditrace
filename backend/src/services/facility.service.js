const { Facility } = require('../models/facility.model');
const { HEALTHCARE_FACILITIES } = require('../data/facilityData');

/**
 * Calculate distance between two coordinates using Haversine formula (in km)
 */
const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Round to 1 decimal place
};

/**
 * Ensure facilities are seeded in database
 */
const ensureFacilitiesSeeded = async () => {
  try {
    const count = await Facility.countDocuments();
    if (count === 0) {
      await Facility.insertMany(HEALTHCARE_FACILITIES);
    }
  } catch (_e) {
    // Non-blocking seeding error
  }
};

/**
 * Find nearby healthcare facilities (chemists, hospitals, clinics)
 */
const getNearbyFacilities = async ({
  latitude = 12.9716,
  longitude = 77.5946,
  radiusKm = 25,
  type = 'all',
  emergencyOnly = false,
  query = '',
  limit = 30
}) => {
  await ensureFacilitiesSeeded();

  const userLat = Number(latitude);
  const userLng = Number(longitude);
  const radius = Number(radiusKm);

  // Fetch facilities
  let facilities = [];
  try {
    const mongoQuery = {};
    if (type && type !== 'all') {
      if (type === 'pharmacy' || type === 'chemist') {
        mongoQuery.type = { $in: ['chemist', 'pharmacy'] };
      } else if (type === 'hospital') {
        mongoQuery.type = { $in: ['hospital', 'clinic'] };
      } else {
        mongoQuery.type = type;
      }
    }
    if (emergencyOnly) {
      mongoQuery.is_emergency_24x7 = true;
    }
    if (query && query.trim()) {
      mongoQuery.$or = [
        { name: { $regex: query.trim(), $options: 'i' } },
        { services: { $regex: query.trim(), $options: 'i' } },
        { specialties: { $regex: query.trim(), $options: 'i' } },
        { 'address.street': { $regex: query.trim(), $options: 'i' } }
      ];
    }

    facilities = await Facility.find(mongoQuery);
  } catch (_e) {
    facilities = [];
  }

  // Fallback to in-memory dataset if database returned empty
  if (!facilities || facilities.length === 0) {
    facilities = HEALTHCARE_FACILITIES.filter(f => {
      if (type && type !== 'all') {
        if ((type === 'pharmacy' || type === 'chemist') && !['chemist', 'pharmacy'].includes(f.type)) return false;
        if (type === 'hospital' && !['hospital', 'clinic'].includes(f.type)) return false;
      }
      if (emergencyOnly && !f.is_emergency_24x7) return false;
      if (query && query.trim()) {
        const q = query.trim().toLowerCase();
        const matchesName = f.name.toLowerCase().includes(q);
        const matchesServices = f.services.some(s => s.toLowerCase().includes(q));
        const matchesSpecialties = f.specialties.some(s => s.toLowerCase().includes(q));
        const matchesStreet = f.address.street.toLowerCase().includes(q);
        return matchesName || matchesServices || matchesSpecialties || matchesStreet;
      }
      return true;
    });
  }

  // Calculate exact distances, format Google Maps URLs, and sort by distance
  const mapped = facilities.map(f => {
    const coords = f.location?.coordinates || [77.5946, 12.9716];
    const lng = coords[0];
    const lat = coords[1];
    const distanceKm = calculateHaversineDistance(userLat, userLng, lat, lng);
    const googleDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

    return {
      _id: f._id || `fac-${Math.random()}`,
      name: f.name,
      type: f.type,
      phone: f.phone,
      emergency_phone: f.emergency_phone,
      email: f.email,
      opening_hours: f.opening_hours,
      is_emergency_24x7: f.is_emergency_24x7,
      rating: f.rating,
      address: f.address,
      coordinates: {
        latitude: lat,
        longitude: lng
      },
      services: f.services || [],
      specialties: f.specialties || [],
      total_beds: f.total_beds || 0,
      distanceKm,
      google_maps_url: googleDirectionsUrl
    };
  });

  // Filter within radius if applicable, or return closest sorted
  const withinRadius = mapped.filter(f => f.distanceKm <= radius);
  const sorted = (withinRadius.length > 0 ? withinRadius : mapped)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, Number(limit));

  return {
    searchLocation: { latitude: userLat, longitude: userLng },
    radiusKm: radius,
    typeFilter: type,
    totalFound: sorted.length,
    facilities: sorted
  };
};

module.exports = {
  calculateHaversineDistance,
  ensureFacilitiesSeeded,
  getNearbyFacilities
};
