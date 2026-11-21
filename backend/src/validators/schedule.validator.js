const { z } = require('zod');
const { FOOD_INSTRUCTIONS } = require('../models/doseSchedule.model');

const createScheduleSchema = z.object({
  dose_amount: z.string().min(1, 'Dose amount is required').trim(),
  times_per_day: z.number().int().min(1).max(24),
  specific_times: z.array(z.string().regex(/^\d{2}:\d{2}$/, 'Must be in HH:MM format')).min(1),
  start_date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  end_date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  food_instruction: z.enum(FOOD_INSTRUCTIONS).default('regardless'),
  instructions: z.string().trim().optional(),
  days_of_week: z.array(z.number().int().min(0).max(6)).default([0, 1, 2, 3, 4, 5, 6])
});

const updateScheduleSchema = z.object({
  dose_amount: z.string().min(1).trim().optional(),
  times_per_day: z.number().int().min(1).max(24).optional(),
  specific_times: z.array(z.string().regex(/^\d{2}:\d{2}$/)).min(1).optional(),
  start_date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  end_date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  food_instruction: z.enum(FOOD_INSTRUCTIONS).optional(),
  instructions: z.string().trim().optional(),
  is_active: z.boolean().optional(),
  days_of_week: z.array(z.number().int().min(0).max(6)).optional()
});

module.exports = {
  createScheduleSchema,
  updateScheduleSchema
};
