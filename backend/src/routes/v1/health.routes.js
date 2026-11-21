const express = require('express');
const { getHealthStatus } = require('../../controllers/health.controller');

const router = express.Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health Check endpoint
 *     description: Returns API status, uptime, system metrics, and database connectivity.
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: Health information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Meditrace API is healthy and operational
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: UP
 *                     timestamp:
 *                       type: string
 *                     uptimeSeconds:
 *                       type: number
 *                     services:
 *                       type: object
 */
router.get('/', getHealthStatus);

module.exports = router;
