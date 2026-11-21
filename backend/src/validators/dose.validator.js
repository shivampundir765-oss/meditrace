const { z } = require('zod');

const logActionSchema = z.object({
  notes: z.string().trim().optional(),
  taken_time: z.string().datetime().optional()
});

module.exports = {
  logActionSchema
};
