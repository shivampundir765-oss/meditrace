const express = require('express');
const chemistController = require('../../controllers/chemist.controller');

const router = express.Router();

/**
 * @openapi
 * /chemists/nearby:
 *   get:
 *     summary: Find nearby chemists by latitude, longitude and radius using 2dsphere index
 *     tags: [Chemists]
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 10
 *     responses:
 *       200:
 *         description: List of nearby chemists with distances and OpenStreetMap coordinates
 */
router.get('/nearby', chemistController.getNearbyChemists);

/**
 * @openapi
 * /chemists/search:
 *   get:
 *     summary: Search which chemists currently stock a medicine
 *     tags: [Chemists]
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: latitude
 *         schema:
 *           type: number
 *       - in: query
 *         name: longitude
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Chemists stocking the queried medicine with price and stock count
 */
router.get('/search', chemistController.searchChemistsWithMedicine);

/**
 * @openapi
 * /chemists/{id}:
 *   get:
 *     summary: Get chemist details, opening hours, contact, and inventory
 *     tags: [Chemists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chemist details
 */
router.get('/:id', chemistController.getChemistById);

module.exports = router;
