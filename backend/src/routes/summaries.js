const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { summarizeText } = require('../services/openrouter');

router.get('/', auth, async (req, res) => {
  try {
    const summaries = await req.prisma.summary.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(summaries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch summaries' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const summary = await req.prisma.summary.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!summary) return res.status(404).json({ error: 'Summary not found' });
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, originalText, length } = req.body;
    const summary = await req.prisma.summary.create({
      data: {
        title,
        originalText,
        length: length || 'medium',
        userId: req.userId,
        status: 'pending'
      }
    });
    res.status(201).json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create summary' });
  }
});

router.post('/:id/generate', auth, async (req, res) => {
  try {
    const summary = await req.prisma.summary.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!summary) return res.status(404).json({ error: 'Summary not found' });

    await req.prisma.summary.update({
      where: { id: summary.id },
      data: { status: 'processing' }
    });

    const summaryText = await summarizeText(summary.originalText, summary.length);

    const updated = await req.prisma.summary.update({
      where: { id: summary.id },
      data: { summary: summaryText, status: 'completed' }
    });
    res.json(updated);
  } catch (error) {
    await req.prisma.summary.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'failed' }
    });
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await req.prisma.summary.deleteMany({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    res.json({ message: 'Summary deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete summary' });
  }
});

module.exports = router;
