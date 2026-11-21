const { z } = require('zod');

const shopSearchSchema = z.object({
  query: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  city: z.string().optional(),
  sortBy: z.enum(['price_asc', 'price_desc', 'rating']).default('price_asc')
});

const addToCartSchema = z.object({
  inventory_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid inventory ID'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1)
});

const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, 'Quantity must be at least 1')
});

module.exports = {
  shopSearchSchema,
  addToCartSchema,
  updateCartItemSchema
};
