const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');
const env = require('../config/env');

const errorHandler = (err, req, res, _next) => {
  logger.error(`[Error Middleware] ${err.message}`, err.stack);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errorCode = err.errorCode || 'INTERNAL_ERROR';

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    const fields = Object.values(err.errors).map(val => val.message);
    message = `Validation Error: ${fields.join(', ')}`;
  }

  // Handle Mongoose Duplicate Key Error
  if (err.code === 11000) {
    statusCode = 409;
    errorCode = 'DUPLICATE_KEY_ERROR';
    const field = Object.keys(err.keyValue || {})[0];
    message = `Duplicate field value entered for: ${field}`;
  }

  // Handle Mongoose Cast Error (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = 'INVALID_ID';
    message = `Invalid format for resource ID: ${err.value}`;
  }

  // Handle JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    message = 'Authentication token is invalid.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired.';
  }

  // Handle Zod Validation Error
  if (err.name === 'ZodError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
  }

  return ApiResponse.error(
    res,
    message,
    statusCode,
    errorCode,
    env.NODE_ENV === 'development' ? { stack: err.stack } : null
  );
};

module.exports = errorHandler;
