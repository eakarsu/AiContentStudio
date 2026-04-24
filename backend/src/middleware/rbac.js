function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(403).json({ error: 'Access denied - no role assigned' });
    }
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ error: `Access denied - requires role: ${roles.join(' or ')}` });
    }
    next();
  };
}

module.exports = { requireRole };
