const { z } = require('zod');

const createRetailerProfileSchema = z.object({
  shop_name: z.string().min(2, 'Shop name is required').trim(),
  licence_number: z.string().min(3, 'Drug licence number is required').trim(),
  phone: z.string().trim().optional(),
  email: z.string().email().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().default('India')
  }),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  opening_hours: z.string().optional(),
  delivery_available: z.boolean().default(true)
});

const updateRetailerProfileSchema = z.object({
  shop_name: z.string().min(2).trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().email().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional()
  }).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  opening_hours: z.string().optional(),
  delivery_available: z.boolean().optional()
});

const createInventoryItemSchema = z.object({
  medicine_name: z.string().min(1, 'Medicine name is required').trim(),
  generic_name: z.string().trim().optional(),
  salt_composition: z.string().trim().optional(),
  dosage_form: z.string().default('tablet'),
  strength: z.string().trim().optional(),
  manufacturer: z.string().trim().optional(),
  batch_number: z.string().trim().optional(),
  expiry_date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  price: z.number().min(0, 'Price cannot be negative'),
  discount_percentage: z.number().min(0).max(100).default(0),
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
  requires_prescription: z.boolean().default(false),
  is_available: z.boolean().default(true)
});

const updateInventoryItemSchema = z.object({
  medicine_name: z.string().min(1).trim().optional(),
  generic_name: z.string().trim().optional(),
  salt_composition: z.string().trim().optional(),
  dosage_form: z.string().optional(),
  strength: z.string().trim().optional(),
  manufacturer: z.string().trim().optional(),
  batch_number: z.string().trim().optional(),
  expiry_date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  price: z.number().min(0).optional(),
  discount_percentage: z.number().min(0).max(100).optional(),
  quantity: z.number().int().min(0).optional(),
  requires_prescription: z.boolean().optional(),
  is_available: z.boolean().optional()
});

const nearbyChemistsQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(0.1).max(100).default(10) // radius in kilometers
});

module.exports = {
  createRetailerProfileSchema,
  updateRetailerProfileSchema,
  createInventoryItemSchema,
  updateInventoryItemSchema,
  nearbyChemistsQuerySchema
};
