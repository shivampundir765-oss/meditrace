const authService = require('../services/auth.service');
const ApiResponse = require('../utils/apiResponse');

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return ApiResponse.success(res, result, 'Registration successful.', 201);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    return ApiResponse.success(res, result, 'Login successful.');
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshAccessToken(refreshToken);
    return ApiResponse.success(res, result, 'Token refreshed successfully.');
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body.email);
    return ApiResponse.success(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const result = await authService.resetPassword(token, password);
    return ApiResponse.success(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.logout(req.user._id, refreshToken);
    return ApiResponse.success(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refresh,
  forgotPassword,
  resetPassword,
  logout
};
