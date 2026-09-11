const AppError = require('../utils/AppError');

/**
 * Usage: authorize('admin'), authorize('admin', 'teacher')
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authorized', 401));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Role '${req.user.role}' is not allowed to access this resource`,
          403
        )
      );
    }
    next();
  };
}

module.exports = { authorize };
