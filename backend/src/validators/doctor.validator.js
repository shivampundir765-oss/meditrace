const { z } = require('zod');
const { SPECIALIZATIONS } = require('../models/doctor.model');

const doctorProfileSchema = z.object({
  name: z.string().min(2, 'Doctor name is required').trim(),
  specialization: z.string().min(2, 'Specialization is required'),
  qualification: z.string().min(2, 'Qualification is required'),
  experience_years: z.number().int().min(0).default(1),
  clinic_address: z.object({
    clinic_name: z.string().optional(),
    street: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().optional(),
    zipCode: z.string().optional()
  }),
  fee: z.number().min(0, 'Consultation fee cannot be negative'),
  available_days: z.array(z.number().int().min(0).max(6)).default([1, 2, 3, 4, 5, 6]),
  available_time_slots: z.array(
    z.object({
      start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Must be in HH:MM format'),
      end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Must be in HH:MM format')
    })
  ).default([{ start_time: '09:00', end_time: '17:00' }]),
  slot_duration_minutes: z.number().int().min(10).max(120).default(30)
});

const doctorSearchSchema = z.object({
  name: z.string().optional(),
  specialization: z.string().optional(),
  city: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

module.exports = {
  doctorProfileSchema,
  doctorSearchSchema,
  SPECIALIZATIONS
};
