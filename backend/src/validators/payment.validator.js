const { z } = require('zod');
const { PAYMENT_METHODS } = require('../models/payment.model');

const createPaymentSchema = z.object({
  order_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Order ID'),
  method: z.enum(PAYMENT_METHODS).default('upi')
});

const paymentWebhookSchema = z.object({
  order_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Order ID'),
  gateway_payment_id: z.string().min(1, 'Payment ID required'),
  status: z.enum(['captured', 'failed', 'cod'])
});

module.exports = {
  createPaymentSchema,
  paymentWebhookSchema
};
