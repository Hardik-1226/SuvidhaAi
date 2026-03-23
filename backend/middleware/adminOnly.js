/**
 * Admin-Only Role Guard Middleware
 * Must be used AFTER the `protect` middleware
 * Restricts access to admin users only
 */

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied — Admin only',
  });
};

/**
 * Role-based access guard (flexible — accepts multiple roles)
 * Usage: authorize('admin', 'provider')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

module.exports = { adminOnly, authorize };
