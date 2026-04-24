require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const rateLimit = require('express-rate-limit');

// Existing routes
const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/videos');
const audioRoutes = require('./routes/audio');
const textRoutes = require('./routes/text');
const imageRoutes = require('./routes/images');
const translationRoutes = require('./routes/translations');
const summaryRoutes = require('./routes/summaries');
const seoRoutes = require('./routes/seo');
const socialRoutes = require('./routes/social');
const emailRoutes = require('./routes/emails');
const blogRoutes = require('./routes/blogs');
const marketingRoutes = require('./routes/marketing');
const scriptRoutes = require('./routes/scripts');
const podcastRoutes = require('./routes/podcasts');
const voiceoverRoutes = require('./routes/voiceovers');
const musicRoutes = require('./routes/music');

// New AI Content Studio routes
const calendarRoutes = require('./routes/calendar');
const repurposeRoutes = require('./routes/repurpose');
const plagiarismRoutes = require('./routes/plagiarism');
const imageSuggesterRoutes = require('./routes/image-suggester');
const performanceRoutes = require('./routes/performance');
const blogOutlineRoutes = require('./routes/blog-outlines');
const newsletterRoutes = require('./routes/newsletters');
const pressReleaseRoutes = require('./routes/press-releases');

// New routes
const apiKeyRoutes = require('./routes/api-keys');

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// Global rate limiter - 200 requests per minute
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' }
});
app.use('/api', globalLimiter);

// Strict auth rate limiter - 10 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts, please try again later' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Serve static files (generated audio, images, videos)
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Make prisma available to routes
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

// RBAC: viewers can only GET on feature routes (not auth/api-keys)
const { requireRole } = require('./middleware/rbac');
const { auditLog } = require('./middleware/audit');

// Apply RBAC to write operations on all feature routes
const featureRoutePatterns = [
  '/api/videos', '/api/audio', '/api/text', '/api/images', '/api/translations',
  '/api/summaries', '/api/seo', '/api/social', '/api/emails', '/api/blogs',
  '/api/marketing', '/api/scripts', '/api/podcasts', '/api/voiceovers', '/api/music',
  '/api/calendar', '/api/repurpose', '/api/plagiarism', '/api/image-suggester',
  '/api/performance', '/api/blog-outlines', '/api/newsletters', '/api/press-releases'
];

featureRoutePatterns.forEach(pattern => {
  // POST, PUT, DELETE require editor or admin role
  app.post(pattern + '*', requireRole('admin', 'editor'));
  app.put(pattern + '*', requireRole('admin', 'editor'));
  app.delete(pattern + '*', requireRole('admin', 'editor'));
  // Audit logging for write operations
  app.post(pattern + '*', auditLog('create', pattern.replace('/api/', '')));
  app.put(pattern + '*', auditLog('update', pattern.replace('/api/', '')));
  app.delete(pattern + '*', auditLog('delete', pattern.replace('/api/', '')));
});

// Existing Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/text', textRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/translations', translationRoutes);
app.use('/api/summaries', summaryRoutes);
app.use('/api/seo', seoRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/marketing', marketingRoutes);
app.use('/api/scripts', scriptRoutes);
app.use('/api/podcasts', podcastRoutes);
app.use('/api/voiceovers', voiceoverRoutes);
app.use('/api/music', musicRoutes);

// New AI Content Studio Routes
app.use('/api/calendar', calendarRoutes);
app.use('/api/repurpose', repurposeRoutes);
app.use('/api/plagiarism', plagiarismRoutes);
app.use('/api/image-suggester', imageSuggesterRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/blog-outlines', blogOutlineRoutes);
app.use('/api/newsletters', newsletterRoutes);
app.use('/api/press-releases', pressReleaseRoutes);

// API Keys route
app.use('/api/api-keys', apiKeyRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AI Content Studio API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5001;

function startServer() {
  const server = app.listen(PORT, () => {
    console.log(`🚀 AI Content Studio API running on port ${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️  Port ${PORT} is busy, killing old process and retrying...`);
      const { execSync } = require('child_process');
      try {
        execSync(`lsof -ti:${PORT} | xargs kill -9 2>/dev/null`, { stdio: 'ignore' });
      } catch (e) { /* ignore */ }
      setTimeout(() => startServer(), 1500);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });

  // Graceful shutdown - close server before exiting so port is freed
  const gracefulShutdown = async (signal) => {
    console.log(`\n🛑 ${signal} received, shutting down gracefully...`);
    server.close(() => {
      prisma.$disconnect().then(() => process.exit(0));
    });
    setTimeout(() => process.exit(0), 5000);
  };

  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGUSR2', gracefulShutdown); // nodemon sends SIGUSR2 on restart
}

startServer();
