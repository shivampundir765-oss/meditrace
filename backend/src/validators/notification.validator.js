const { z } = require('zod');

const deviceTokenSchema = z.object({
  deviceToken: z.string().min(1, 'Device token is required').trim(),
  platform: z.enum(['ios', 'android', 'web']).optional()
});

const notificationSettingsSchema = z.object({
  push: z.boolean().optional(),
  email: z.boolean().optional(),
  inApp: z.boolean().optional(),
  doseAlerts: z.boolean().optional(),
  lowStockAlerts: z.boolean().optional(),
  expiryAlerts: z.boolean().optional(),
  quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/, 'Must be in HH:MM format').optional().nullable(),
  quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/, 'Must be in HH:MM format').optional().nullable()
});

module.exports = {
  deviceTokenSchema,
  notificationSettingsSchema
};
