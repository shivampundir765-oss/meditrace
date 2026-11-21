const express = require('express');
const retailerController = require('../../controllers/retailer.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');
const {
  createRetailerProfileSchema,
  createInventoryItemSchema,
  updateInventoryItemSchema
} = require('../../validators/retailer.validator');

const router = express.Router();

// Retailer management routes require authentication + retailer or admin role
router.use(authenticate, authorize('retailer', 'admin'));

/**
 * @openapi
 * /retailer/profile:
 *   get:
 *     summary: Get logged-in retailer store profile
 *     tags: [Retailer Portal]
 *     security:
 *       - BearerAuth: []
 *   post:
 *     summary: Create or update retailer store profile
 *     tags: [Retailer Portal]
 *     security:
 *       - BearerAuth: []
 */
router.route('/profile')
  .get(retailerController.getProfile)
  .post(validate(createRetailerProfileSchema), retailerController.upsertProfile);

/**
 * @openapi
 * /retailer/inventory:
 *   get:
 *     summary: List retailer inventory
 *     tags: [Retailer Portal]
 *     security:
 *       - BearerAuth: []
 *   post:
 *     summary: Add new medicine to retailer inventory
 *     tags: [Retailer Portal]
 *     security:
 *       - BearerAuth: []
 */
router.route('/inventory')
  .get(retailerController.listInventory)
  .post(validate(createInventoryItemSchema), retailerController.addInventoryItem);

/**
 * @openapi
 * /retailer/inventory/{id}:
 *   put:
 *     summary: Update stock quantity, price or availability
 *     tags: [Retailer Portal]
 *     security:
 *       - BearerAuth: []
 *   delete:
 *     summary: Remove item from inventory
 *     tags: [Retailer Portal]
 *     security:
 *       - BearerAuth: []
 */
router.route('/inventory/:id')
  .put(validate(updateInventoryItemSchema), retailerController.updateInventoryItem)
  .delete(retailerController.deleteInventoryItem);

module.exports = router;
