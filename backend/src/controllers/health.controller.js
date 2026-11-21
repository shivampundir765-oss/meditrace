const mongoose = require('mongoose');
const ApiResponse = require('../utils/apiResponse');

const getHealthStatus = async (req, res, next) => {
  try {
    const dbStatusMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    const dbState = mongoose.connection.readyState;
    const dbStatus = dbStatusMap[dbState] || 'unknown';

    const healthData = {
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: {
          status: dbStatus,
          connected: dbState === 1
        },
        api: {
          version: '1.0.0',
          prefix: '/api/v1'
        }
      },
      memory: {
        heapUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        rssMB: Math.round(process.memoryUsage().rss / 1024 / 1024)
      }
    };

    return ApiResponse.success(res, healthData, 'Meditrace API is healthy and operational', 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHealthStatus
};
