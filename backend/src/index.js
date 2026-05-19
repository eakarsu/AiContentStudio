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
const repurchaseBatchRoutes = require('./routes/repurpose-batch');
const brandVoiceRoutes = require('./routes/brand-voice');
const versionsRoutes = require('./routes/versions');
const aiNewRoutes = require('./routes/aiNew');
const exportsRoutes = require('./routes/exports');

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

// AI generation rate limiter - 30 AI calls per minute per IP
// Applied to all AI-heavy endpoints: generate, analyze, apply, batch
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI generation rate limit exceeded — max 30 requests per minute. Please wait before trying again.' },
  // Key by user IP; if you have auth middleware earlier you can key by req.userId instead
  keyGenerator: (req) => req.ip
});

// Apply AI limiter to every /generate, /analyze, /apply, and /batch endpoint across all feature routes
const aiRoutePatterns = [
  '/api/videos/:id/generate', '/api/audio/:id/generate', '/api/text/:id/generate',
  '/api/images/:id/generate', '/api/translations/:id/generate', '/api/summaries/:id/generate',
  '/api/seo/:id/generate', '/api/social/:id/generate', '/api/emails/:id/generate',
  '/api/blogs/:id/generate', '/api/marketing/:id/generate', '/api/scripts/:id/generate',
  '/api/podcasts/:id/generate', '/api/voiceovers/:id/generate', '/api/music/:id/generate',
  '/api/calendar/:id/generate', '/api/repurpose/:id/generate', '/api/plagiarism/:id/generate',
  '/api/image-suggester/:id/generate', '/api/performance/:id/generate',
  '/api/blog-outlines/:id/generate', '/api/newsletters/:id/generate',
  '/api/press-releases/generate', '/api/press-releases/:id/generate',
  '/api/brand-voice/analyze', '/api/brand-voice/apply',
  '/api/repurpose/batch',
  '/api/ai/content-cluster', '/api/ai/repurpose-video', '/api/ai/brand-story'
];
aiRoutePatterns.forEach(pattern => {
  app.post(pattern, aiLimiter);
});

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
  '/api/performance', '/api/blog-outlines', '/api/newsletters', '/api/press-releases',
  '/api/brand-voice', '/api/versions'
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

// Batch repurpose pipeline
app.use('/api/repurpose', repurchaseBatchRoutes);

// Brand voice
app.use('/api/brand-voice', brandVoiceRoutes);

// Content versioning (generic: GET /api/versions/:type/:id, POST /api/versions/:type/:id/restore/:versionId)
app.use('/api/versions', versionsRoutes);

// New AI endpoints (content cluster, repurpose video, brand story)
app.use('/api/ai', aiNewRoutes);






app.use('/api/ai', require('./routes/influencer-outreach'));
app.use('/api/ai', require('./routes/whitelabel'));
app.use('/api/ai', require('./routes/roi-scoring'));
app.use('/api/ai', require('./routes/ab-testing'));
app.use('/api/ai', require('./routes/content-brief'));
// Comprehensive export routes
app.use('/api/export', exportsRoutes);

// Custom Studio Views (4 endpoints: calendar, engagement, brief PDF, SEO keywords)
app.use('/api/custom-views', require('./routes/customViews'));

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

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-all-content-routes-lack-dedicated-ai-generation-endpoints-mi', require('./routes/gap_all_content_routes_lack_dedicated_ai_generation_endpoints_mi'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-team-collaboration-or-granular-permission-management', require('./routes/gap_no_team_collaboration_or_granular_permission_management'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-approval-workflow', require('./routes/gap_no_approval_workflow'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-real-time-publishing-integrations-wordpress-webflow-mediu', require('./routes/gap_no_real_time_publishing_integrations_wordpress_webflow_mediu'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-cross-platform-published-content-analytics-aggregation', require('./routes/gap_no_cross_platform_published_content_analytics_aggregation'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-payment-billing-module', require('./routes/gap_no_payment_billing_module'));
