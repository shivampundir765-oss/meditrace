const express = require('express');
const router = express.Router();
const nearbyController = require('../../controllers/nearby.controller');

router.get('/chemists', nearbyController.getNearbyChemists);
router.get('/hospitals', nearbyController.getNearbyHospitals);

module.exports = router;
