const jwt = require('jsonwebtoken');
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must be at least 32 characters');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.tenantId || !decoded.userId) return res.status(403).json({ error: 'Token lacks tenant identity' });

    req.userId = decoded.userId;
    req.tenantId = decoded.tenantId;

    // Attach user role for RBAC
    if (req.prisma) {
      const user = await req.prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { role: true, tenantId: true }
      });
      if (!user || user.tenantId !== decoded.tenantId) return res.status(403).json({ error: 'Tenant identity mismatch' });
      req.userRole = user?.role || 'editor';
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;
