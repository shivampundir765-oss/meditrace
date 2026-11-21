const express = require('express');
const orderController = require('../../controllers/order.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');
const {
  createOrderSchema,
  updateOrderStatusSchema
} = require('../../validators/order.validator');

const router = express.Router();

router.use(authenticate);

/**
 * @openapi
 * /orders:
 *   post:
 *     summary: Place a medicine order
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *   get:
 *     summary: List orders (patient sees placed orders, retailer sees incoming store orders)
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 */
router.route('/')
  .post(validate(createOrderSchema), orderController.createOrder)
  .get(orderController.listOrders);

/**
 * @openapi
 * /orders/{id}:
 *   get:
 *     summary: Track order status and delivery timeline
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 */
router.get('/:id', orderController.getOrderById);

/**
 * @openapi
 * /orders/{id}/status:
 *   put:
 *     summary: Retailer updates order status (placed -> confirmed -> packed -> out_for_delivery -> delivered). Updates patient stock automatically on delivery!
 *     tags: [Orders, Retailer Portal]
 *     security:
 *       - BearerAuth: []
 */
router.put(
  '/:id/status',
  authorize('retailer', 'admin'),
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus
);

module.exports = router;
