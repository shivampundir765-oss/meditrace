const { z } = require('zod');

const scanImageSchema = z.object({
  raw_text: z.string().trim().optional(),
  image_url: z.string().url().optional(),
  image_base64: z.string().optional()
}).refine((data) => data.raw_text || data.image_url || data.image_base64, {
  message: 'Either raw_text, image_url, or image_base64 must be provided'
});

const scanBarcodeSchema = z.object({
  barcode: z.string().min(3, 'Barcode must be at least 3 characters').trim()
});

module.exports = {
  scanImageSchema,
  scanBarcodeSchema
};
