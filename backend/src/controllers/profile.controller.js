const { Profile } = require('../models/profile.model');
const { User } = require('../models/user.model');
const ApiResponse = require('../utils/apiResponse');

/**
 * List all profiles accessible to the user: owned profiles + caregiver shared profiles
 */
exports.getProfiles = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Find profiles owned by user OR where user is an authorized caregiver
    const profiles = await Profile.find({
      $or: [
        { user_id: userId },
        { 'authorized_caregivers.user_id': userId }
      ]
    }).populate('authorized_caregivers.user_id', 'name email role phone').lean();

    // Attach role flag relative to current user
    const formatted = profiles.map((p) => {
      const isOwner = String(p.user_id) === String(userId);
      let userAccessLevel = 'owner';
      if (!isOwner) {
        const cg = p.authorized_caregivers?.find((c) => String(c.user_id?._id || c.user_id) === String(userId));
        userAccessLevel = cg ? cg.access_level : 'caregiver_view';
      }
      return {
        ...p,
        is_owner: isOwner,
        user_access_level: userAccessLevel
      };
    });

    return ApiResponse.success(res, { profiles: formatted }, 'Profiles retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new family member profile
 */
exports.createProfile = async (req, res, next) => {
  try {
    const {
      name,
      relationship,
      date_of_birth,
      gender,
      blood_group,
      allergies,
      chronic_conditions,
      avatar_url
    } = req.body;

    if (!name) {
      return ApiResponse.error(res, 'Profile name is required', 400);
    }

    const profile = await Profile.create({
      user_id: req.user._id,
      name: name.trim(),
      relationship: relationship || 'other',
      date_of_birth: date_of_birth || null,
      gender: gender || 'other',
      blood_group: blood_group || '',
      allergies: allergies || [],
      chronic_conditions: chronic_conditions || [],
      avatar_url: avatar_url || null,
      is_default: false
    });

    return ApiResponse.success(res, { profile }, 'Family profile created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get profile details
 */
exports.getProfileById = async (req, res, next) => {
  try {
    const profile = await Profile.findById(req.params.id)
      .populate('authorized_caregivers.user_id', 'name email role phone')
      .lean();

    if (!profile) {
      return ApiResponse.error(res, 'Profile not found', 404);
    }

    const isOwner = String(profile.user_id) === String(req.user._id);
    const isCaregiver = profile.authorized_caregivers?.some(
      (c) => String(c.user_id?._id || c.user_id) === String(req.user._id)
    );

    if (!isOwner && !isCaregiver && !['admin', 'doctor', 'pharmacist'].includes(req.user.role)) {
      return ApiResponse.error(res, 'Access denied', 403);
    }

    return ApiResponse.success(res, { profile }, 'Profile details retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update family member profile
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) {
      return ApiResponse.error(res, 'Profile not found', 404);
    }

    const isOwner = String(profile.user_id) === String(req.user._id);
    if (!isOwner && req.user.role !== 'admin') {
      const caregiver = profile.authorized_caregivers.find(
        (c) => String(c.user_id) === String(req.user._id)
      );
      if (!caregiver || caregiver.access_level !== 'caregiver_edit') {
        return ApiResponse.error(res, 'You do not have permission to edit this profile', 403);
      }
    }

    const updates = ['name', 'relationship', 'date_of_birth', 'gender', 'blood_group', 'allergies', 'chronic_conditions', 'avatar_url'];
    updates.forEach((field) => {
      if (req.body[field] !== undefined) {
        profile[field] = req.body[field];
      }
    });

    await profile.save();
    return ApiResponse.success(res, { profile }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete family member profile (cannot delete default profile)
 */
exports.deleteProfile = async (req, res, next) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) {
      return ApiResponse.error(res, 'Profile not found', 404);
    }

    if (String(profile.user_id) !== String(req.user._id) && req.user.role !== 'admin') {
      return ApiResponse.error(res, 'Only the profile owner can delete this profile', 403);
    }

    if (profile.is_default || profile.relationship === 'self') {
      return ApiResponse.error(res, 'Cannot delete primary default profile', 400);
    }

    await Profile.findByIdAndDelete(req.params.id);
    return ApiResponse.success(res, { success: true }, 'Profile removed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Authorize a caregiver by email or user ID
 */
exports.addCaregiver = async (req, res, next) => {
  try {
    const { email, user_id, access_level = 'caregiver_view' } = req.body;
    const profile = await Profile.findById(req.params.id);

    if (!profile) {
      return ApiResponse.error(res, 'Profile not found', 404);
    }

    if (String(profile.user_id) !== String(req.user._id) && req.user.role !== 'admin') {
      return ApiResponse.error(res, 'Only the profile owner can authorize caregivers', 403);
    }

    let targetUser = null;
    if (user_id) {
      targetUser = await User.findById(user_id);
    } else if (email) {
      targetUser = await User.findOne({ email: email.toLowerCase().trim() });
    }

    if (!targetUser) {
      return ApiResponse.error(res, 'Target user not found to add as caregiver', 404);
    }

    if (String(targetUser._id) === String(profile.user_id)) {
      return ApiResponse.error(res, 'Owner is already authorized', 400);
    }

    // Check if already authorized
    const existingIdx = profile.authorized_caregivers.findIndex(
      (c) => String(c.user_id) === String(targetUser._id)
    );

    if (existingIdx >= 0) {
      profile.authorized_caregivers[existingIdx].access_level = access_level;
    } else {
      profile.authorized_caregivers.push({
        user_id: targetUser._id,
        access_level: access_level === 'caregiver_edit' ? 'caregiver_edit' : 'caregiver_view'
      });
    }

    await profile.save();
    return ApiResponse.success(res, { profile }, 'Caregiver access updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Revoke caregiver access
 */
exports.removeCaregiver = async (req, res, next) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) {
      return ApiResponse.error(res, 'Profile not found', 404);
    }

    if (String(profile.user_id) !== String(req.user._id) && req.user.role !== 'admin') {
      return ApiResponse.error(res, 'Only the profile owner can revoke caregiver access', 403);
    }

    profile.authorized_caregivers = profile.authorized_caregivers.filter(
      (c) => String(c.user_id) !== String(req.params.caregiverId)
    );

    await profile.save();
    return ApiResponse.success(res, { profile }, 'Caregiver access revoked successfully');
  } catch (error) {
    next(error);
  }
};
