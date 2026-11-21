const { z } = require('zod');

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  phone: z.string().trim().optional(),
  dateOfBirth: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  gender: z.enum(['male', 'female', 'other']).optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      country: z.string().optional()
    })
    .optional(),
  avatar: z.string().url().optional(),
  notificationSettings: z
    .object({
      push: z.boolean().optional(),
      email: z.boolean().optional(),
      inApp: z.boolean().optional(),
      quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format').optional().nullable(),
      quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format').optional().nullable()
    })
    .optional()
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
});

module.exports = {
  updateProfileSchema,
  changePasswordSchema
};
