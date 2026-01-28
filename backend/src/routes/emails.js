const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateEmail } = require('../services/openrouter');

router.get('/', auth, async (req, res) => {
  try {
    const emails = await req.prisma.email.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(emails);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const email = await req.prisma.email.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!email) return res.status(404).json({ error: 'Email not found' });
    res.json(email);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch email' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, type, prompt } = req.body;
    const email = await req.prisma.email.create({
      data: {
        title,
        type: type || 'marketing',
        prompt,
        userId: req.userId,
        status: 'pending'
      }
    });
    res.status(201).json(email);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create email' });
  }
});

router.post('/:id/generate', auth, async (req, res) => {
  try {
    const email = await req.prisma.email.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!email) return res.status(404).json({ error: 'Email not found' });

    await req.prisma.email.update({
      where: { id: email.id },
      data: { status: 'processing' }
    });

    const content = await generateEmail(email.type, email.prompt);
    const lines = content.split('\n');
    const subjectLine = lines.find(l => l.toLowerCase().includes('subject'));
    const subject = subjectLine ? subjectLine.replace(/^.*subject[:\s]*/i, '').trim() : email.title;

    const updated = await req.prisma.email.update({
      where: { id: email.id },
      data: { subject, body: content, status: 'completed' }
    });
    res.json(updated);
  } catch (error) {
    await req.prisma.email.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'failed' }
    });
    res.status(500).json({ error: 'Failed to generate email' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await req.prisma.email.deleteMany({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    res.json({ message: 'Email deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete email' });
  }
});

module.exports = router;
