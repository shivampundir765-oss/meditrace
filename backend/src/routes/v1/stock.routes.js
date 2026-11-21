const express = require('express');
const stockController = require('../../controllers/stock.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { updateStockSchema } = require('../../validators/stock.validator');

const router = express.Router();

router.use(authenticate);

/**
 * @openapi
 * /stock:
 *   get:
 *     summary: Stock overview for all patient medicines with predicted finish dates
 *     tags: [Stock]
 *     security:
 *       - BearerAuth: []
 */
router.get('/', stockController.getStockOverview);

/**
 * @openapi
 * /stock/low:
 *   get:
 *     summary: List medicines with low stock (<= threshold or <= 3 days supply)
 *     tags: [Stock]
 *     security:
 *       - BearerAuth: []
 */
router.get('/low', stockController.getLowStock);

/**
 * @openapi
 * /stock/expiring:
 *   get:
 *     summary: List medicines expiring soon or already expired
 *     tags: [Stock]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 */
router.get('/expiring', stockController.getExpiring);

/**
 * @openapi
 * /stock/{medicineId}:
 *   put:
 *     summary: Update stock quantity / log a refill
 *     tags: [Stock]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: medicineId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity:
 *                 type: number
 *               action:
 *                 type: string
 *                 enum: [set, add]
 */
router.put('/:medicineId', validate(updateStockSchema), stockController.updateStock);

module.exports = router;
