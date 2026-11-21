const express = require('express');
const paymentController = require('../../controllers/payment.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');
const {
  createPaymentSchema,
  paymentWebhookSchema
} = require('../../validators/payment.validator');

const router = express.Router();

/**
 * @openapi
 * /payments/create:
 *   post:
 *     summary: Initialize payment session (Razorpay/Stripe test mode or Cash on Delivery)
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 */
router.post('/create', authenticate, validate(createPaymentSchema), paymentController.createPayment);

/**
 * @openapi
 * /payments/webhook:
 *   post:
 *     summary: Payment gateway webhook simulation to confirm order payment
 *     tags: [Payments]
 */
router.post('/webhook', validate(paymentWebhookSchema), paymentController.handleWebhook);

module.exports = router;
