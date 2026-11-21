const { Notification } = require('../models/notification.model');
const { User } = require('../models/user.model');
const logger = require('../utils/logger');

/**
 * Checks if current time is within user's quiet hours
 */
const isQuietHours = (quietHoursStart, quietHoursEnd) => {
  if (!quietHoursStart || !quietHoursEnd) return false;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = quietHoursStart.split(':').map(Number);
  const [endH, endM] = quietHoursEnd.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  } else {
    // Overnight quiet hours, e.g., 22:00 to 07:00
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }
};

const createNotification = async (userId, {
  type,
  title,
  message,
  channel = 'in_app',
  action_type = 'none',
  action_url = null,
  reference_id = null
}) => {
  const user = await User.findById(userId);
  if (!user) return null;

  // Check alert type toggles
  const settings = user.notificationSettings || {};
  if (type === 'dose' && settings.doseAlerts === false) return null;
  if (type === 'low_stock' && settings.lowStockAlerts === false) return null;
  if (type === 'expiry' && settings.expiryAlerts === false) return null;

  // In quiet hours, keep in-app only, suppress external push/email noise
  let effectiveChannel = channel;
  if (isQuietHours(settings.quietHoursStart, settings.quietHoursEnd)) {
    effectiveChannel = 'in_app';
  }

  const notification = await Notification.create({
    user_id: userId,
    type,
    title,
    message,
    channel: effectiveChannel,
    action_type,
    action_url,
    reference_id,
    sent_at: new Date()
  });

  logger.info(`Notification dispatched to user ${userId} [${type} - ${effectiveChannel}]: ${title}`);
  return notification;
};

const getNotifications = async (userId, { page = 1, limit = 20, type, is_read }) => {
  const query = { user_id: userId };
  if (type) query.type = type;
  if (is_read !== undefined) query.is_read = is_read === 'true' || is_read === true;

  const skip = (page - 1) * limit;
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query).sort({ created_at: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(query),
    Notification.countDocuments({ user_id: userId, is_read: false })
  ]);

  return {
    unreadCount,
    notifications,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

const markAsRead = async (userId, notificationId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user_id: userId },
    { $set: { is_read: true } },
    { new: true }
  );

  if (!notification) {
    const error = new Error('Notification not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  return notification;
};

const markAllAsRead = async (userId) => {
  await Notification.updateMany(
    { user_id: userId, is_read: false },
    { $set: { is_read: true } }
  );
  return { message: 'All notifications marked as read' };
};

const saveDeviceToken = async (userId, deviceToken) => {
  await User.findByIdAndUpdate(userId, {
    $addToSet: { deviceTokens: deviceToken }
  });
  return { message: 'Device token saved successfully' };
};

const getNotificationSettings = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }
  return user.notificationSettings;
};

const updateNotificationSettings = async (userId, settings) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  user.notificationSettings = {
    ...user.notificationSettings,
    ...settings
  };

  await user.save();
  return user.notificationSettings;
};

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  saveDeviceToken,
  getNotificationSettings,
  updateNotificationSettings,
  isQuietHours
};
