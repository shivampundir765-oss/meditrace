const { User } = require('../models/user.model');

/**
 * Get the full profile of the authenticated user.
 */
const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    error.errorCode = 'USER_NOT_FOUND';
    throw error;
  }
  return user.toJSON();
};

/**
 * Update profile fields for the authenticated user.
 */
const updateProfile = async (userId, updateData) => {
  // Prevent role or password changes through this endpoint
  delete updateData.role;
  delete updateData.password;
  delete updateData.email;
  delete updateData.refreshTokens;

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    error.errorCode = 'USER_NOT_FOUND';
    throw error;
  }

  return user.toJSON();
};

/**
 * Change password for the authenticated user.
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+password +refreshTokens');
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    error.errorCode = 'USER_NOT_FOUND';
    throw error;
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    const error = new Error('Current password is incorrect.');
    error.statusCode = 401;
    error.errorCode = 'INVALID_PASSWORD';
    throw error;
  }

  user.password = newPassword;
  user.refreshTokens = []; // Invalidate all sessions
  await user.save();

  return { message: 'Password changed successfully. Please log in again.' };
};

/**
 * Soft-delete / deactivate the authenticated user's account.
 */
const deleteAccount = async (userId) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { isActive: false, refreshTokens: [] },
    { new: true }
  );

  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    error.errorCode = 'USER_NOT_FOUND';
    throw error;
  }

  return { message: 'Account deactivated successfully.' };
};

/**
 * Admin: list all users with pagination and optional role filter.
 */
const listUsers = async ({ page = 1, limit = 20, role, search }) => {
  const filter = {};
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter)
  ]);

  return {
    users: users.map((u) => u.toJSON()),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  listUsers
};
