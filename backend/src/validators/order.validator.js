const { z } = require('zod');
const { ORDER_STATUSES } = require('../models/order.model');

const createOrderSchema = z.object({
  retailer_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Retailer ID'),
  items: z.array(
    z.object({
      inventory_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Inventory ID'),
      quantity: z.number().int().min(1, 'Quantity must be at least 1')
    })
  ).min(1, 'Order must contain at least one item'),
  payment_method: z.enum(['online', 'cod']).default('online'),
  delivery_address: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    phone: z.string().min(5, 'Contact phone is required')
  }),
  prescription_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Prescription ID').optional().nullable()
});

const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().trim().optional()
});

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema
};
