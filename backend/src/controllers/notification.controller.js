const notificationService = require('../services/notification.service');
const ApiResponse = require('../utils/apiResponse');

const getNotifications = async (req, res, next) => {
  try {
    const { page, limit, type, is_read } = req.query;
    const result = await notificationService.getNotifications(req.user._id, {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
      type,
      is_read
    });
    return ApiResponse.success(res, result, 'Notifications retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.user._id, req.params.id);
    return ApiResponse.success(res, { notification }, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user._id);
    return ApiResponse.success(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

const saveDeviceToken = async (req, res, next) => {
  try {
    const result = await notificationService.saveDeviceToken(req.user._id, req.body.deviceToken);
    return ApiResponse.success(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

const getSettings = async (req, res, next) => {
  try {
    const settings = await notificationService.getNotificationSettings(req.user._id);
    return ApiResponse.success(res, { settings }, 'Notification settings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const settings = await notificationService.updateNotificationSettings(req.user._id, req.body);
    return ApiResponse.success(res, { settings }, 'Notification settings updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  saveDeviceToken,
  getSettings,
  updateSettings
};
