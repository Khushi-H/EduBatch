const AppError = require('../utils/AppError');

/**
 * Usage: validate(zodSchema) - validates req.body and replaces it with the parsed value.
 */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join(', ');
      return next(new AppError(message, 400));
    }
    req.body = result.data;
    next();
  };
}

module.exports = { validate };
