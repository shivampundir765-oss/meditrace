const { z } = require('zod');
const { DOSAGE_FORMS, ADDED_VIA } = require('../models/medicine.model');

const createMedicineSchema = z.object({
  name: z.string().min(1, 'Medicine name is required').trim(),
  prescription_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid prescription ID').optional().nullable(),
  generic_name: z.string().trim().optional(),
  salt_composition: z.string().trim().optional(),
  dosage_form: z.enum(DOSAGE_FORMS).default('tablet'),
  strength: z.string().trim().optional(),
  manufacturer: z.string().trim().optional(),
  batch_number: z.string().trim().optional(),
  expiry_date: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()).nullable(),
  quantity: z.number().min(0, 'Quantity cannot be negative').default(0),
  low_stock_threshold: z.number().min(0).default(5),
  notes: z.string().trim().optional(),
  status: z.enum(['active', 'completed', 'expired', 'discontinued']).default('active'),
  added_via: z.enum(ADDED_VIA).default('manual'),
  requires_prescription: z.boolean().default(false)
});

const updateMedicineSchema = z.object({
  name: z.string().min(1).trim().optional(),
  prescription_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid prescription ID').optional().nullable(),
  generic_name: z.string().trim().optional(),
  salt_composition: z.string().trim().optional(),
  dosage_form: z.enum(DOSAGE_FORMS).optional(),
  strength: z.string().trim().optional(),
  manufacturer: z.string().trim().optional(),
  batch_number: z.string().trim().optional(),
  expiry_date: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()).nullable(),
  quantity: z.number().min(0).optional(),
  low_stock_threshold: z.number().min(0).optional(),
  notes: z.string().trim().optional(),
  status: z.enum(['active', 'completed', 'expired', 'discontinued']).optional(),
  requires_prescription: z.boolean().optional()
});

module.exports = {
  createMedicineSchema,
  updateMedicineSchema
};
