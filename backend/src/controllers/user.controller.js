const userService = require('../services/user.service');
const ApiResponse = require('../utils/apiResponse');

const getProfile = async (req, res, next) => {
  try {
    const user = await userService.getProfile(req.user._id);
    return ApiResponse.success(res, { user }, 'Profile retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await userService.updateProfile(req.user._id, req.body);
    return ApiResponse.success(res, { user }, 'Profile updated successfully.');
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await userService.changePassword(req.user._id, currentPassword, newPassword);
    return ApiResponse.success(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    const result = await userService.deleteAccount(req.user._id);
    return ApiResponse.success(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

const listUsers = async (req, res, next) => {
  try {
    const { page, limit, role, search } = req.query;
    const result = await userService.listUsers({
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
      role,
      search
    });
    return ApiResponse.success(res, result, 'Users retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  listUsers
};
