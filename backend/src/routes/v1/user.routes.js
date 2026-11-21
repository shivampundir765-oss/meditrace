const express = require('express');
const userController = require('../../controllers/user.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { updateProfileSchema, changePasswordSchema } = require('../../validators/user.validator');

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

/**
 * @openapi
 * /users/me:
 *   get:
 *     summary: Get authenticated user profile
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 */
router.get('/me', userController.getProfile);

/**
 * @openapi
 * /users/me:
 *   put:
 *     summary: Update authenticated user profile
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *               address:
 *                 type: object
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put('/me', validate(updateProfileSchema), userController.updateProfile);

/**
 * @openapi
 * /users/me/password:
 *   put:
 *     summary: Change authenticated user's password
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed
 *       401:
 *         description: Current password is incorrect
 */
router.put('/me/password', validate(changePasswordSchema), userController.changePassword);

/**
 * @openapi
 * /users/me:
 *   delete:
 *     summary: Deactivate authenticated user's account
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Account deactivated
 */
router.delete('/me', userController.deleteAccount);

module.exports = router;
