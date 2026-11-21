const express = require('express');
const healthRoutes = require('./health.routes');

const router = express.Router();

// Health check route: /api/v1/health
router.use('/health', healthRoutes);

module.exports = router;
