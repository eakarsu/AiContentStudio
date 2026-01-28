const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateText, rewriteContent } = require('../services/openrouter');

router.get('/', auth, async (req, res) => {
  try {
    const texts = await req.prisma.textContent.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(texts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch text content' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const text = await req.prisma.textContent.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!text) return res.status(404).json({ error: 'Text content not found' });
    res.json(text);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch text content' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, description, prompt, type, tone } = req.body;
    const text = await req.prisma.textContent.create({
      data: {
        title,
        description,
        prompt,
        type: type || 'general',
        tone: tone || 'professional',
        userId: req.userId,
        status: 'pending'
      }
    });
    res.status(201).json(text);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create text content' });
  }
});

router.post('/:id/generate', auth, async (req, res) => {
  try {
    const text = await req.prisma.textContent.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!text) return res.status(404).json({ error: 'Text content not found' });

    await req.prisma.textContent.update({
      where: { id: text.id },
      data: { status: 'processing' }
    });

    const content = await generateText(text.prompt, {
      systemPrompt: `You are an expert content writer. Write in a ${text.tone} tone.`
    });

    const updatedText = await req.prisma.textContent.update({
      where: { id: text.id },
      data: {
        content,
        status: 'completed',
        wordCount: content.split(/\s+/).length
      }
    });
    res.json(updatedText);
  } catch (error) {
    await req.prisma.textContent.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'failed' }
    });
    res.status(500).json({ error: 'Failed to generate text content' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await req.prisma.textContent.deleteMany({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    res.json({ message: 'Text content deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete text content' });
  }
});

module.exports = router;
