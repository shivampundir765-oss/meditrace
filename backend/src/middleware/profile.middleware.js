const { Profile } = require('../models/profile.model');

/**
 * Middleware to resolve and enforce active profile context for multi-profile/family mode.
 * Resolves active profile from:
 *  1. Header `x-profile-id`
 *  2. Query param `profile_id`
 *  3. Body `profile_id`
 * Fallback: Finds or creates the default 'self' profile for req.user._id.
 */
async function resolveProfile(req, res, next) {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const requestedProfileId =
      req.headers['x-profile-id'] ||
      req.query.profile_id ||
      (req.body && req.body.profile_id);

    let activeProfile = null;

    if (requestedProfileId) {
      // Find requested profile
      activeProfile = await Profile.findById(requestedProfileId);
      if (!activeProfile) {
        return res.status(404).json({ success: false, error: 'Profile not found' });
      }

      // Check access permission
      const isOwner = activeProfile.user_id.toString() === req.user._id.toString();
      const isAuthorizedCaregiver = activeProfile.authorized_caregivers.some(
        (c) => c.user_id.toString() === req.user._id.toString()
      );
      const isPrivilegedRole = ['admin', 'doctor', 'pharmacist'].includes(req.user.role);

      if (!isOwner && !isAuthorizedCaregiver && !isPrivilegedRole) {
        return res.status(403).json({ success: false, error: 'Access to this profile is unauthorized' });
      }

      // Check read-only permission for mutations
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && !isOwner && !isPrivilegedRole) {
        const caregiverRecord = activeProfile.authorized_caregivers.find(
          (c) => c.user_id.toString() === req.user._id.toString()
        );
        if (caregiverRecord && caregiverRecord.access_level === 'caregiver_view') {
          return res.status(403).json({ success: false, error: 'View-only access: modifications are not permitted for this profile' });
        }
      }
    } else {
      // Find or create default 'self' profile
      activeProfile = await Profile.findOne({ user_id: req.user._id, is_default: true });
      if (!activeProfile) {
        activeProfile = await Profile.findOne({ user_id: req.user._id, relationship: 'self' });
      }
      if (!activeProfile) {
        // Auto-create default self profile for this user
        activeProfile = await Profile.create({
          user_id: req.user._id,
          name: req.user.name || 'My Profile',
          relationship: 'self',
          is_default: true,
          date_of_birth: req.user.date_of_birth || null,
          gender: req.user.gender || 'other',
          blood_group: req.user.blood_group || '',
          allergies: req.user.allergies || [],
          chronic_conditions: req.user.chronic_conditions || []
        });
      }
    }

    req.profile = activeProfile;
    req.profile_id = activeProfile._id;
    next();
  } catch (error) {
    console.error('Error in resolveProfile middleware:', error);
    res.status(500).json({ success: false, error: 'Internal server error resolving profile context' });
  }
}

module.exports = { resolveProfile };
