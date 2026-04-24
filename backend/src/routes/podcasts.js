const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateAudioContent } = require('../services/openrouter');
const { generateTTS } = require('../services/openai-media');

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
        { topic: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { script: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      req.prisma.podcast.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limitNum
      }),
      req.prisma.podcast.count({ where })
    ]);

    res.json({ items, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch podcasts' });
  }
});

// Export CSV
router.get('/export/csv', auth, async (req, res) => {
  try {
    const { generateCSV } = require('../utils/export');
    const items = await req.prisma.podcast.findMany({
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
    res.setHeader('Content-Disposition', `attachment; filename="podcasts-export.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// Export PDF
router.get('/export/pdf', auth, async (req, res) => {
  try {
    const { generatePDF } = require('../utils/export');
    const items = await req.prisma.podcast.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    const fields = [
      { label: 'ID', value: 'id' },
      { label: 'Title', value: 'title' },
      { label: 'Status', value: 'status' },
      { label: 'Created', value: 'createdAt' },
    ];
    const pdf = await generatePDF(items, 'Podcast Export', fields);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="podcasts-export.pdf"`);
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export PDF' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const podcast = await req.prisma.podcast.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!podcast) return res.status(404).json({ error: 'Podcast not found' });
    res.json(podcast);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch podcast' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, topic, description } = req.body;
    const podcast = await req.prisma.podcast.create({
      data: {
        title,
        topic,
        description,
        userId: req.userId,
        status: 'pending'
      }
    });
    res.status(201).json(podcast);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create podcast' });
  }
});

router.post('/:id/generate', auth, async (req, res) => {
  try {
    const podcast = await req.prisma.podcast.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!podcast) return res.status(404).json({ error: 'Podcast not found' });

    await req.prisma.podcast.update({
      where: { id: podcast.id },
      data: { status: 'processing' }
    });

    // Generate script with AI
    const rawScript = await generateAudioContent(podcast.topic, 'podcast');

    // Clean up and ensure professional formatting
    let script = rawScript.trim();
    if (!script.startsWith('#')) {
      script = `# PODCAST SCRIPT: ${podcast.title}\n\n> **Topic:** ${podcast.topic}\n\n---\n\n${script}`;
    }

    // Add metadata
    const wordCount = script.split(/\s+/).length;
    const estimatedMinutes = Math.round(wordCount / 150);
    script += `\n\n---\n*Podcast: "${podcast.title}" | Topic: "${podcast.topic}" | ~${wordCount} words (~${estimatedMinutes} min)*`;

    // Generate real audio with OpenAI TTS
    const ttsResult = await generateTTS(rawScript, {
      voice: 'alloy',
      filename: `podcast_${podcast.id}_${Date.now()}.mp3`
    });

    const updated = await req.prisma.podcast.update({
      where: { id: podcast.id },
      data: {
        script,
        audioUrl: ttsResult.url,
        duration: ttsResult.duration,
        status: 'completed'
      }
    });
    res.json(updated);
  } catch (error) {
    console.error('Error generating podcast:', error);
    await req.prisma.podcast.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'failed' }
    });
    res.status(500).json({ error: 'Failed to generate podcast' });
  }
});

// Update podcast
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, topic, description, status } = req.body;
    const updated = await req.prisma.podcast.updateMany({
      where: { id: parseInt(req.params.id), userId: req.userId },
      data: { title, topic, description, status }
    });
    if (updated.count === 0) return res.status(404).json({ error: 'Podcast not found' });
    const item = await req.prisma.podcast.findFirst({ where: { id: parseInt(req.params.id) } });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update podcast' });
  }
});

// Bulk delete podcasts
router.post('/bulk-delete', auth, async (req, res) => {
  try {
    const { ids } = req.body;
    const result = await req.prisma.podcast.deleteMany({
      where: { id: { in: ids }, userId: req.userId }
    });
    res.json({ message: `${result.count} podcasts deleted` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk delete podcasts' });
  }
});

// Bulk update podcasts
router.post('/bulk-update', auth, async (req, res) => {
  try {
    const { ids, data } = req.body;
    const result = await req.prisma.podcast.updateMany({
      where: { id: { in: ids }, userId: req.userId },
      data
    });
    res.json({ message: `${result.count} podcasts updated` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk update podcasts' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await req.prisma.podcast.deleteMany({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    res.json({ message: 'Podcast deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete podcast' });
  }
});

module.exports = router;
