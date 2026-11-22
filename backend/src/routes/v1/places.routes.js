const express = require('express');
const placesController = require('../../controllers/places.controller');

const router = express.Router();

/**
 * @openapi
 * /places/nearby:
 *   get:
 *     summary: Find nearby healthcare facilities (chemist shops, hospitals, clinics) with Google Maps integration
 *     tags: [Places & Healthcare Locator]
 *     parameters:
 *       - in: query
 *         name: latitude
 *         schema:
 *           type: number
 *       - in: query
 *         name: longitude
 *         schema:
 *           type: number
 *       - in: query
 *         name: radiusKm
 *         schema:
 *           type: number
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, chemist, hospital, clinic]
 *       - in: query
 *         name: emergencyOnly
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Nearby healthcare facilities with coordinates, distances, and Google Maps directions links
 */
router.get('/nearby', placesController.getNearbyPlaces);

module.exports = router;
