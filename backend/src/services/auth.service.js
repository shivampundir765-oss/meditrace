const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models/user.model');
const env = require('../config/env');

/**
 * Generate a short-lived JWT access token.
 */
const generateAccessToken = (userId, role) => {
  return jwt.sign({ userId, role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN
  });
};

/**
 * Generate a long-lived JWT refresh token with a unique jti.
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh', jti: crypto.randomBytes(16).toString('hex') },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  );
};

/**
 * Register a new user account.
 */
const register = async ({ name, email, password, role, phone }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error('An account with this email already exists.');
    error.statusCode = 409;
    error.errorCode = 'EMAIL_ALREADY_EXISTS';
    throw error;
  }

  const user = await User.create({ name, email, password, role, phone });

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  // Persist refresh token
  await User.findByIdAndUpdate(user._id, {
    $push: { refreshTokens: refreshToken }
  });

  return {
    user: user.toJSON(),
    accessToken,
    refreshToken
  };
};

/**
 * Authenticate a user with email & password.
 */
const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    error.errorCode = 'INVALID_CREDENTIALS';
    throw error;
  }

  if (!user.isActive) {
    const error = new Error('Account has been deactivated. Contact support.');
    error.statusCode = 403;
    error.errorCode = 'ACCOUNT_DEACTIVATED';
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    error.errorCode = 'INVALID_CREDENTIALS';
    throw error;
  }

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  // Persist refresh token
  await User.findByIdAndUpdate(user._id, {
    $push: { refreshTokens: refreshToken }
  });

  return {
    user: user.toJSON(),
    accessToken,
    refreshToken
  };
};

/**
 * Rotate the refresh token: validate the old one, issue a new pair.
 */
const refreshAccessToken = async (oldRefreshToken) => {
  let decoded;
  try {
    decoded = jwt.verify(oldRefreshToken, env.JWT_REFRESH_SECRET);
  } catch (_err) {
    const error = new Error('Invalid or expired refresh token.');
    error.statusCode = 401;
    error.errorCode = 'INVALID_REFRESH_TOKEN';
    throw error;
  }

  const user = await User.findById(decoded.userId).select('+refreshTokens');
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 401;
    error.errorCode = 'USER_NOT_FOUND';
    throw error;
  }

  // Check the token is in the stored list (prevents reuse after rotation)
  if (!user.refreshTokens || !user.refreshTokens.includes(oldRefreshToken)) {
    // Possible token reuse attack – invalidate all sessions
    await User.findByIdAndUpdate(user._id, { refreshTokens: [] });
    const error = new Error('Refresh token reuse detected. All sessions invalidated.');
    error.statusCode = 401;
    error.errorCode = 'TOKEN_REUSE';
    throw error;
  }

  // Remove old token and store new one (can't $pull + $push same field atomically)
  const newAccessToken = generateAccessToken(user._id, user.role);
  const newRefreshToken = generateRefreshToken(user._id);

  const updatedTokens = user.refreshTokens.filter((t) => t !== oldRefreshToken);
  updatedTokens.push(newRefreshToken);
  await User.findByIdAndUpdate(user._id, { $set: { refreshTokens: updatedTokens } });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  };
};

/**
 * Generate a password reset token and return it.
 * In production this would be emailed, not returned directly.
 */
const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal whether email exists – return success either way
    return { message: 'If that email is registered, a reset link has been sent.' };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save({ validateBeforeSave: false });

  // In production: send resetToken via email using Nodemailer
  return {
    message: 'If that email is registered, a reset link has been sent.',
    // Returned only in dev/test for convenience
    ...(env.NODE_ENV !== 'production' && { resetToken })
  };
};

/**
 * Reset password using the token from forgotPassword.
 */
const resetPassword = async (rawToken, newPassword) => {
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() }
  }).select('+password +refreshTokens');

  if (!user) {
    const error = new Error('Reset token is invalid or has expired.');
    error.statusCode = 400;
    error.errorCode = 'INVALID_RESET_TOKEN';
    throw error;
  }

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokens = []; // Invalidate all sessions
  await user.save();

  return { message: 'Password has been reset successfully. Please log in again.' };
};

/**
 * Logout – remove a specific refresh token.
 */
const logout = async (userId, refreshToken) => {
  await User.findByIdAndUpdate(userId, {
    $pull: { refreshTokens: refreshToken }
  });
  return { message: 'Logged out successfully.' };
};

module.exports = {
  register,
  login,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  logout,
  generateAccessToken,
  generateRefreshToken
};
