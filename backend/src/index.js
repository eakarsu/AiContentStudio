require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

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

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Serve static files (generated audio, images, videos)
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Make prisma available to routes
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

// Routes
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AI Content Studio API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 AI Content Studio API running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
