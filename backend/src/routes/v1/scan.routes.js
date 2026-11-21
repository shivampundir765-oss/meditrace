const express = require('express');
const scanController = require('../../controllers/scan.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');
const {
  scanImageSchema,
  scanBarcodeSchema
} = require('../../validators/scan.validator');

const router = express.Router();

router.use(authenticate);

/**
 * @openapi
 * /scan/image:
 *   post:
 *     summary: Parse medicine packaging text (OCR) and return cleaned fields, confidence score, and autofill payload
 *     tags: [Scanning]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               raw_text:
 *                 type: string
 *               image_url:
 *                 type: string
 *     responses:
 *       200:
 *         description: OCR extracted data with confidence score and autofill fields
 */
router.post('/image', validate(scanImageSchema), scanController.scanImage);

/**
 * @openapi
 * /scan/barcode:
 *   post:
 *     summary: Look up medicine by barcode / GTIN and return prefilled details
 *     tags: [Scanning]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [barcode]
 *             properties:
 *               barcode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Barcode matched details
 */
router.post('/barcode', validate(scanBarcodeSchema), scanController.scanBarcode);

/**
 * @openapi
 * /scan/history:
 *   get:
 *     summary: Get patient scan history
 *     tags: [Scanning]
 *     security:
 *       - BearerAuth: []
 */
router.get('/history', scanController.getScanHistory);

module.exports = router;
