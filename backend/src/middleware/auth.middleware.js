const jwt = require('jsonwebtoken');
const { User } = require('../models/user.model');
const ApiResponse = require('../utils/apiResponse');
const env = require('../config/env');

/**
 * Verify JWT access token from Authorization header.
 * Attaches req.user on success.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiResponse.error(
        res,
        'Access denied. No authentication token provided.',
        401,
        'NO_TOKEN'
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return ApiResponse.error(
        res,
        'User account not found or has been deleted.',
        401,
        'USER_NOT_FOUND'
      );
    }

    if (!user.isActive) {
      return ApiResponse.error(
        res,
        'User account has been deactivated.',
        403,
        'ACCOUNT_DEACTIVATED'
      );
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.error(
        res,
        'Authentication token has expired. Please refresh your session.',
        401,
        'TOKEN_EXPIRED'
      );
    }
    if (error.name === 'JsonWebTokenError') {
      return ApiResponse.error(
        res,
        'Invalid authentication token.',
        401,
        'INVALID_TOKEN'
      );
    }
    next(error);
  }
};

/**
 * Role-based access control middleware factory.
 * Usage: authorize('admin', 'doctor')
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.error(
        res,
        'Authentication required before authorization.',
        401,
        'NOT_AUTHENTICATED'
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return ApiResponse.error(
        res,
        `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}.`,
        403,
        'INSUFFICIENT_ROLE'
      );
    }

    next();
  };
};

module.exports = { authenticate, authorize };
