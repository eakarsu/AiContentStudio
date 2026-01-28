const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateSEOContent } = require('../services/openrouter');

router.get('/', auth, async (req, res) => {
  try {
    const seoContents = await req.prisma.sEOContent.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(seoContents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch SEO content' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const seo = await req.prisma.sEOContent.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!seo) return res.status(404).json({ error: 'SEO content not found' });
    res.json(seo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch SEO content' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, keyword } = req.body;
    const seo = await req.prisma.sEOContent.create({
      data: {
        title,
        keyword,
        userId: req.userId,
        status: 'pending'
      }
    });
    res.status(201).json(seo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create SEO content' });
  }
});

router.post('/:id/generate', auth, async (req, res) => {
  try {
    const seo = await req.prisma.sEOContent.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!seo) return res.status(404).json({ error: 'SEO content not found' });

    await req.prisma.sEOContent.update({
      where: { id: seo.id },
      data: { status: 'processing' }
    });

    const content = await generateSEOContent(seo.keyword);
    const lines = content.split('\n');
    const metaTitle = lines[0]?.replace(/^#?\s*/, '').slice(0, 60) || seo.title;
    const metaDesc = lines.slice(1, 3).join(' ').slice(0, 160);

    const updated = await req.prisma.sEOContent.update({
      where: { id: seo.id },
      data: { content, metaTitle, metaDesc, status: 'completed' }
    });
    res.json(updated);
  } catch (error) {
    await req.prisma.sEOContent.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'failed' }
    });
    res.status(500).json({ error: 'Failed to generate SEO content' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await req.prisma.sEOContent.deleteMany({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    res.json({ message: 'SEO content deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete SEO content' });
  }
});

module.exports = router;
