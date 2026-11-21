const express = require('express');
const userController = require('../../controllers/user.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(authenticate, authorize('admin'));

/**
 * @openapi
 * /admin/users:
 *   get:
 *     summary: List all users (admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [patient, doctor, retailer, admin]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Users listed successfully
 *       403:
 *         description: Insufficient role
 */
router.get('/users', userController.listUsers);

module.exports = router;
