const { z } = require('zod');

const createPrescriptionSchema = z.object({
  doctor_name: z.string().trim().optional(),
  hospital_name: z.string().trim().optional(),
  prescription_date: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  notes: z.string().trim().optional(),
  image_url: z.string().url().optional().nullable(),
  status: z.enum(['active', 'expired', 'archived']).default('active')
});

const updatePrescriptionSchema = z.object({
  doctor_name: z.string().trim().optional(),
  hospital_name: z.string().trim().optional(),
  prescription_date: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  notes: z.string().trim().optional(),
  image_url: z.string().url().optional().nullable(),
  status: z.enum(['active', 'expired', 'archived']).optional()
});

module.exports = {
  createPrescriptionSchema,
  updatePrescriptionSchema
};
