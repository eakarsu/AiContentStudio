const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateScript } = require('../services/openrouter');

router.get('/', auth, async (req, res) => {
  try {
    const scripts = await req.prisma.script.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(scripts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch scripts' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const script = await req.prisma.script.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!script) return res.status(404).json({ error: 'Script not found' });
    res.json(script);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch script' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, type, topic, duration } = req.body;
    const script = await req.prisma.script.create({
      data: {
        title,
        type: type || 'video',
        topic,
        duration: duration || 5,
        userId: req.userId,
        status: 'pending'
      }
    });
    res.status(201).json(script);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create script' });
  }
});

router.post('/:id/generate', auth, async (req, res) => {
  try {
    const script = await req.prisma.script.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!script) return res.status(404).json({ error: 'Script not found' });

    await req.prisma.script.update({
      where: { id: script.id },
      data: { status: 'processing' }
    });

    const content = await generateScript(script.type, script.topic, script.duration);

    const updated = await req.prisma.script.update({
      where: { id: script.id },
      data: { content, status: 'completed' }
    });
    res.json(updated);
  } catch (error) {
    await req.prisma.script.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'failed' }
    });
    res.status(500).json({ error: 'Failed to generate script' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await req.prisma.script.deleteMany({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    res.json({ message: 'Script deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete script' });
  }
});

module.exports = router;
