/**
 * Standardized API Response formatter
 * Format: { success, data, message, errorCode? }
 */
class ApiResponse {
  static success(res, data = null, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      data,
      message
    });
  }

  static error(res, message = 'An error occurred', statusCode = 500, errorCode = 'INTERNAL_ERROR', data = null) {
    const payload = {
      success: false,
      data,
      message,
      errorCode
    };
    return res.status(statusCode).json(payload);
  }
}

module.exports = ApiResponse;
