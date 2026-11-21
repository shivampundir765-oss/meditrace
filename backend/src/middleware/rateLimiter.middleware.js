const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const ApiResponse = require('../utils/apiResponse');

const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return ApiResponse.error(
      res,
      'Too many requests from this IP address, please try again later.',
      429,
      'RATE_LIMIT_EXCEEDED'
    );
  },
  skip: () => env.NODE_ENV === 'test' // Skip rate limiting during testing
});

module.exports = { apiLimiter };
