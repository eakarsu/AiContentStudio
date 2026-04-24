function auditLog(action, resource) {
  return async (req, res, next) => {
    // Store original json to intercept response
    const originalJson = res.json.bind(res);
    res.json = async (data) => {
      try {
        if (res.statusCode < 400 && req.userId) {
          await req.prisma.auditLog.create({
            data: {
              action,
              resource,
              resourceId: parseInt(req.params.id) || data?.id || null,
              details: JSON.stringify({ method: req.method, path: req.path }),
              ipAddress: req.ip || req.connection?.remoteAddress,
              userId: req.userId,
            }
          });
        }
      } catch (e) {
        console.error('Audit log error:', e.message);
      }
      return originalJson(data);
    };
    next();
  };
}

module.exports = { auditLog };
