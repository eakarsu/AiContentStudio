const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { translateText } = require('../services/openrouter');

router.get('/', auth, async (req, res) => {
  try {
    const translations = await req.prisma.translation.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(translations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch translations' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const translation = await req.prisma.translation.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!translation) return res.status(404).json({ error: 'Translation not found' });
    res.json(translation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch translation' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, originalText, sourceLang, targetLang } = req.body;
    const translation = await req.prisma.translation.create({
      data: {
        title,
        originalText,
        sourceLang: sourceLang || 'en',
        targetLang: targetLang || 'es',
        userId: req.userId,
        status: 'pending'
      }
    });
    res.status(201).json(translation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create translation' });
  }
});

router.post('/:id/generate', auth, async (req, res) => {
  try {
    const translation = await req.prisma.translation.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!translation) return res.status(404).json({ error: 'Translation not found' });

    await req.prisma.translation.update({
      where: { id: translation.id },
      data: { status: 'processing' }
    });

    const translatedText = await translateText(
      translation.originalText,
      translation.sourceLang,
      translation.targetLang
    );

    const updated = await req.prisma.translation.update({
      where: { id: translation.id },
      data: { translatedText, status: 'completed' }
    });
    res.json(updated);
  } catch (error) {
    await req.prisma.translation.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'failed' }
    });
    res.status(500).json({ error: 'Failed to generate translation' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await req.prisma.translation.deleteMany({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    res.json({ message: 'Translation deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete translation' });
  }
});

module.exports = router;
