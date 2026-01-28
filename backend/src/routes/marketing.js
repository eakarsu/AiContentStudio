const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateMarketingCopy } = require('../services/openrouter');

router.get('/', auth, async (req, res) => {
  try {
    const copies = await req.prisma.marketingCopy.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(copies);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch marketing copy' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const copy = await req.prisma.marketingCopy.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!copy) return res.status(404).json({ error: 'Marketing copy not found' });
    res.json(copy);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch marketing copy' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, product, targetAud } = req.body;
    const copy = await req.prisma.marketingCopy.create({
      data: {
        title,
        product,
        targetAud,
        userId: req.userId,
        status: 'pending'
      }
    });
    res.status(201).json(copy);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create marketing copy' });
  }
});

router.post('/:id/generate', auth, async (req, res) => {
  try {
    const copy = await req.prisma.marketingCopy.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!copy) return res.status(404).json({ error: 'Marketing copy not found' });

    await req.prisma.marketingCopy.update({
      where: { id: copy.id },
      data: { status: 'processing' }
    });

    const content = await generateMarketingCopy(copy.product, copy.targetAud);
    const lines = content.split('\n').filter(l => l.trim());
    const headline = lines[0]?.replace(/^#?\s*/, '') || copy.title;
    const cta = lines.find(l => l.toLowerCase().includes('call') || l.toLowerCase().includes('cta')) || 'Get Started Today!';

    const updated = await req.prisma.marketingCopy.update({
      where: { id: copy.id },
      data: { content, headline, callToAction: cta, status: 'completed' }
    });
    res.json(updated);
  } catch (error) {
    await req.prisma.marketingCopy.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'failed' }
    });
    res.status(500).json({ error: 'Failed to generate marketing copy' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await req.prisma.marketingCopy.deleteMany({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    res.json({ message: 'Marketing copy deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete marketing copy' });
  }
});

module.exports = router;
