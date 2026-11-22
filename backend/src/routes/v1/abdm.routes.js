const express = require('express');
const abdmController = require('../../controllers/abdm.controller');

const router = express.Router();

/**
 * @openapi
 * /abdm/drugs/search:
 *   get:
 *     summary: Search official ABDM (Ayushman Bharat Digital Mission) National Drug Registry
 *     tags: [ABDM]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search brand name, generic name, salt composition, or ABDM drug code
 *     responses:
 *       200:
 *         description: Matching official ABDM drug records
 */
router.get('/drugs/search', abdmController.searchDrugs);

/**
 * @openapi
 * /abdm/drugs/{identifier}:
 *   get:
 *     summary: Look up an ABDM registered drug by ABDM Code or Barcode/GTIN
 *     tags: [ABDM]
 *     parameters:
 *       - in: path
 *         name: identifier
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Official verified ABDM drug formulation details
 */
router.get('/drugs/:identifier', abdmController.getDrugByIdentifier);

module.exports = router;
