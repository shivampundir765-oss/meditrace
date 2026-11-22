/**
 * Reusable Audit Stamp Helper
 * Records exact ISO timestamp, timezone, user actor, and geolocation metadata.
 * If location is denied or unavailable, gracefully records "Location not shared".
 */

function createAuditStamp(options = {}) {
  const opts = (options && typeof options === 'object') ? options : {};

  // Support options directly or options.location
  const location = opts.location !== undefined 
    ? opts.location 
    : ((opts.latitude !== undefined || opts.lat !== undefined || opts.place_name) ? opts : null);

  const userId = opts.userId || opts.user_id || null;
  const userName = opts.userName || opts.user_name || 'User';
  const userRole = opts.userRole || opts.user_role || 'patient';
  const action = opts.action || 'created';
  const notes = opts.notes || '';

  const now = new Date();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';

  let locationObj = {
    latitude: null,
    longitude: null,
    place_name: 'Location not shared',
    is_shared: false
  };

  if (location && typeof location === 'object') {
    const lat = location.latitude ?? location.lat;
    const lng = location.longitude ?? location.lng;
    const place = location.place_name || location.address || location.city;

    if (lat !== undefined && lng !== undefined && lat !== null && lng !== null) {
      locationObj = {
        latitude: Number(lat),
        longitude: Number(lng),
        place_name: place ? String(place).trim() : `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`,
        is_shared: true
      };
    } else if (place) {
      locationObj = {
        latitude: null,
        longitude: null,
        place_name: String(place).trim(),
        is_shared: true
      };
    }
  }

  return {
    timestamp: now.toISOString(),
    date: now.toISOString().split('T')[0],
    time: now.toLocaleTimeString('en-US', { hour12: false, timeZone: tz }),
    timezone: tz,
    user_id: userId || null,
    user_name: userName,
    user_role: userRole,
    action,
    location: locationObj,
    notes: notes || ''
  };
}

module.exports = {
  createAuditStamp
};
