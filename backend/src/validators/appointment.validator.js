const { z } = require('zod');
const { CONSULTATION_TYPES } = require('../models/appointment.model');

const bookAppointmentSchema = z.object({
  doctor_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Doctor ID'),
  slot_start: z.string().datetime(),
  slot_end: z.string().datetime().optional(), // If not provided, computed from doctor's slot_duration
  reason: z.string().trim().default('General Consultation'),
  consultation_type: z.enum(CONSULTATION_TYPES).default('in_person'),
  notes: z.string().trim().optional()
});

const rescheduleAppointmentSchema = z.object({
  slot_start: z.string().datetime(),
  slot_end: z.string().datetime().optional(),
  reason: z.string().trim().optional()
});

module.exports = {
  bookAppointmentSchema,
  rescheduleAppointmentSchema
};
