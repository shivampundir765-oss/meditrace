const express = require('express');
const notificationController = require('../../controllers/notification.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');
const {
  deviceTokenSchema,
  notificationSettingsSchema
} = require('../../validators/notification.validator');

const router = express.Router();

router.use(authenticate);

/**
 * @openapi
 * /notifications:
 *   get:
 *     summary: List user notifications with unread count
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 */
router.get('/', notificationController.getNotifications);

/**
 * @openapi
 * /notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 */
router.put('/read-all', notificationController.markAllAsRead);

/**
 * @openapi
 * /notifications/device-token:
 *   post:
 *     summary: Register mobile/web push device token
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 */
router.post('/device-token', validate(deviceTokenSchema), notificationController.saveDeviceToken);

/**
 * @openapi
 * /notifications/settings:
 *   get:
 *     summary: Get notification preferences & quiet hours
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *   put:
 *     summary: Update notification preferences & quiet hours
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 */
router.route('/settings')
  .get(notificationController.getSettings)
  .put(validate(notificationSettingsSchema), notificationController.updateSettings);

/**
 * @openapi
 * /notifications/{id}/read:
 *   put:
 *     summary: Mark a single notification as read
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 */
router.put('/:id/read', notificationController.markAsRead);

module.exports = router;
