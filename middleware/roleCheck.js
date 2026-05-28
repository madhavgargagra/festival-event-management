// Role checking authorization middleware
module.exports = (...allowedRoles) => {
  return (req, res, next) => {
    // 1. Verify user exists and role is in the list of allowed roles
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      if (req.originalUrl.startsWith('/api/')) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Requires one of these roles: ${allowedRoles.join(', ')}`
        });
      }
      return res.status(403).send('<h1>403 Forbidden</h1><p>You do not have permissions to access this resource.</p><a href="/login">Go to Login</a>');
    }
    next();
  };
};
