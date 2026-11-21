const express = require('express');
const shopController = require('../../controllers/shop.controller');
const { validate } = require('../../middleware/validate.middleware');
const { shopSearchSchema } = require('../../validators/shop.validator');

const router = express.Router();

/**
 * @openapi
 * /shop/search:
 *   get:
 *     summary: Search medicines across partner retailers with prices and delivery time
 *     tags: [Shop & Marketplace]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [price_asc, price_desc, rating]
 *     responses:
 *       200:
 *         description: Medicine catalogue with live stock and retailer details
 */
router.get('/search', validate(shopSearchSchema), shopController.searchMedicines);

/**
 * @openapi
 * /shop/alternatives/{medicineId}:
 *   get:
 *     summary: Suggest cheaper generic alternatives with the same salt composition
 *     tags: [Shop & Marketplace]
 *     parameters:
 *       - in: path
 *         name: medicineId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of cheaper generic alternatives and savings percentage
 */
router.get('/alternatives/:medicineId', shopController.getGenericAlternatives);

module.exports = router;
