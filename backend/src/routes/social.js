const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateSocialPost } = require('../services/openrouter');

router.get('/', auth, async (req, res) => {
  try {
    const { search, status, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = { userId: req.userId };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { prompt: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      req.prisma.socialPost.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limitNum
      }),
      req.prisma.socialPost.count({ where })
    ]);

    res.json({ items, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch social posts' });
  }
});

// Export CSV
router.get('/export/csv', auth, async (req, res) => {
  try {
    const { generateCSV } = require('../utils/export');
    const items = await req.prisma.socialPost.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    const fields = [
      { label: 'ID', value: 'id' },
      { label: 'Title', value: 'title' },
      { label: 'Status', value: 'status' },
      { label: 'Created', value: 'createdAt' },
    ];
    const csv = generateCSV(items, fields.map(f => f.value));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="social-export.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// Export PDF
router.get('/export/pdf', auth, async (req, res) => {
  try {
    const { generatePDF } = require('../utils/export');
    const items = await req.prisma.socialPost.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    const fields = [
      { label: 'ID', value: 'id' },
      { label: 'Title', value: 'title' },
      { label: 'Status', value: 'status' },
      { label: 'Created', value: 'createdAt' },
    ];
    const pdf = await generatePDF(items, 'Social Post Export', fields);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="social-export.pdf"`);
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export PDF' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const post = await req.prisma.socialPost.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!post) return res.status(404).json({ error: 'Social post not found' });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch social post' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, platform, prompt } = req.body;
    const post = await req.prisma.socialPost.create({
      data: {
        title,
        platform: platform || 'instagram',
        prompt,
        userId: req.userId,
        status: 'pending'
      }
    });
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create social post' });
  }
});

router.post('/:id/generate', auth, async (req, res) => {
  try {
    const post = await req.prisma.socialPost.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!post) return res.status(404).json({ error: 'Social post not found' });

    await req.prisma.socialPost.update({
      where: { id: post.id },
      data: { status: 'processing' }
    });

    const rawContent = await generateSocialPost(post.platform, post.prompt);

    // Clean up and ensure professional formatting
    let content = rawContent.trim();
    if (!content.startsWith('#')) {
      content = `## ${post.platform.charAt(0).toUpperCase() + post.platform.slice(1)} Post\n\n${content}`;
    }

    // Extract hashtags
    const hashtagMatch = content.match(/#\w+/g);
    const hashtags = hashtagMatch ? [...new Set(hashtagMatch)].join(' ') : '';

    // Add metadata footer
    content += `\n\n---\n*Platform: ${post.platform} | Generated from: "${post.prompt}"*`;

    const updated = await req.prisma.socialPost.update({
      where: { id: post.id },
      data: { content, hashtags, status: 'completed' }
    });
    res.json(updated);
  } catch (error) {
    await req.prisma.socialPost.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'failed' }
    });
    res.status(500).json({ error: 'Failed to generate social post' });
  }
});

// Update social post
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, prompt, platform, status } = req.body;
    const updated = await req.prisma.socialPost.updateMany({
      where: { id: parseInt(req.params.id), userId: req.userId },
      data: { title, prompt, platform, status }
    });
    if (updated.count === 0) return res.status(404).json({ error: 'Social post not found' });
    const item = await req.prisma.socialPost.findFirst({ where: { id: parseInt(req.params.id) } });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update social post' });
  }
});

// Bulk delete social posts
router.post('/bulk-delete', auth, async (req, res) => {
  try {
    const { ids } = req.body;
    const result = await req.prisma.socialPost.deleteMany({
      where: { id: { in: ids }, userId: req.userId }
    });
    res.json({ message: `${result.count} social posts deleted` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk delete social posts' });
  }
});

// Bulk update social posts
router.post('/bulk-update', auth, async (req, res) => {
  try {
    const { ids, data } = req.body;
    const result = await req.prisma.socialPost.updateMany({
      where: { id: { in: ids }, userId: req.userId },
      data
    });
    res.json({ message: `${result.count} social posts updated` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk update social posts' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await req.prisma.socialPost.deleteMany({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    res.json({ message: 'Social post deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete social post' });
  }
});

module.exports = router;
