const { z } = require('zod');

const updateStockSchema = z.object({
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
  low_stock_threshold: z.number().int().min(0).optional(),
  action: z.enum(['set', 'add']).default('set') // 'set' exact quantity or 'add' for a refill
});

module.exports = {
  updateStockSchema
};
