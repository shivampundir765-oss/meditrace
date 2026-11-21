const ApiResponse = require('../utils/apiResponse');

/**
 * Zod validation middleware factory.
 * Validates req.body against the given Zod schema.
 */
const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const messages = result.error.errors.map(
        (e) => `${e.path.join('.')}: ${e.message}`
      );
      return ApiResponse.error(
        res,
        messages.join('; '),
        400,
        'VALIDATION_ERROR'
      );
    }
    // Replace body with parsed/coerced data
    req.body = result.data;
    next();
  };
};

module.exports = { validate };
