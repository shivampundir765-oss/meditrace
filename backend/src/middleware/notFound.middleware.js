const ApiResponse = require('../utils/apiResponse');

const notFoundHandler = (req, res, _next) => {
  return ApiResponse.error(
    res,
    `Route not found - ${req.originalUrl}`,
    404,
    'NOT_FOUND'
  );
};

module.exports = notFoundHandler;
