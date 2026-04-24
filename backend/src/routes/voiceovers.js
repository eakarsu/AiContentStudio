const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateAudioContent } = require('../services/openrouter');
const { generateTTS, mapVoice } = require('../services/openai-media');

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
        { text: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      req.prisma.voiceover.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limitNum
      }),
      req.prisma.voiceover.count({ where })
    ]);

    res.json({ items, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch voiceovers' });
  }
});

// Export CSV
router.get('/export/csv', auth, async (req, res) => {
  try {
    const { generateCSV } = require('../utils/export');
    const items = await req.prisma.voiceover.findMany({
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
    res.setHeader('Content-Disposition', `attachment; filename="voiceovers-export.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// Export PDF
router.get('/export/pdf', auth, async (req, res) => {
  try {
    const { generatePDF } = require('../utils/export');
    const items = await req.prisma.voiceover.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    const fields = [
      { label: 'ID', value: 'id' },
      { label: 'Title', value: 'title' },
      { label: 'Status', value: 'status' },
      { label: 'Created', value: 'createdAt' },
    ];
    const pdf = await generatePDF(items, 'Voiceover Export', fields);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="voiceovers-export.pdf"`);
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export PDF' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const voiceover = await req.prisma.voiceover.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!voiceover) return res.status(404).json({ error: 'Voiceover not found' });
    res.json(voiceover);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch voiceover' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, text, voice, language } = req.body;
    const voiceover = await req.prisma.voiceover.create({
      data: {
        title,
        text,
        voice: voice || 'neutral',
        language: language || 'en',
        userId: req.userId,
        status: 'pending'
      }
    });
    res.status(201).json(voiceover);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create voiceover' });
  }
});

router.post('/:id/generate', auth, async (req, res) => {
  try {
    const voiceover = await req.prisma.voiceover.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!voiceover) return res.status(404).json({ error: 'Voiceover not found' });

    await req.prisma.voiceover.update({
      where: { id: voiceover.id },
      data: { status: 'processing' }
    });

    // Step 1: Generate professional voiceover script with AI
    const rawScript = await generateAudioContent(voiceover.text, 'voiceover');
    let script = rawScript.trim();
    if (!script.startsWith('#')) {
      script = `# Voiceover Script: ${voiceover.title}\n\n> **Voice:** ${voiceover.voice} | **Language:** ${voiceover.language}\n\n---\n\n${script}`;
    }
    const wordCount = script.split(/\s+/).length;
    script += `\n\n---\n*Voiceover: "${voiceover.title}" | Voice: ${voiceover.voice} | Language: ${voiceover.language} | ~${wordCount} words*`;

    // Extract plain text for TTS (strip markdown formatting)
    const plainScript = rawScript.replace(/^#+\s+.*/gm, '').replace(/>\s?\*\*.*/gm, '').replace(/---/g, '').replace(/\*\*\[.*?\]\*\*/g, '').replace(/\[PAUSE\]/gi, '...').replace(/\*\*/g, '').replace(/\*/g, '').replace(/\n{3,}/g, '\n\n').trim();

    // Step 2: Generate audio with OpenAI TTS
    const voice = mapVoice(voiceover.voice);
    const ttsResult = await generateTTS(plainScript.slice(0, 4096), {
      voice,
      filename: `voiceover_${voiceover.id}_${Date.now()}.mp3`
    });

    const updated = await req.prisma.voiceover.update({
      where: { id: voiceover.id },
      data: {
        text: script,
        audioUrl: ttsResult.url,
        duration: ttsResult.duration,
        status: 'completed'
      }
    });
    res.json(updated);
  } catch (error) {
    console.error('Generate voiceover error:', error);
    await req.prisma.voiceover.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'failed' }
    });
    res.status(500).json({ error: 'Failed to generate voiceover' });
  }
});

// Update voiceover
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, text, voice, language, status } = req.body;
    const updated = await req.prisma.voiceover.updateMany({
      where: { id: parseInt(req.params.id), userId: req.userId },
      data: { title, text, voice, language, status }
    });
    if (updated.count === 0) return res.status(404).json({ error: 'Voiceover not found' });
    const item = await req.prisma.voiceover.findFirst({ where: { id: parseInt(req.params.id) } });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update voiceover' });
  }
});

// Bulk delete voiceovers
router.post('/bulk-delete', auth, async (req, res) => {
  try {
    const { ids } = req.body;
    const result = await req.prisma.voiceover.deleteMany({
      where: { id: { in: ids }, userId: req.userId }
    });
    res.json({ message: `${result.count} voiceovers deleted` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk delete voiceovers' });
  }
});

// Bulk update voiceovers
router.post('/bulk-update', auth, async (req, res) => {
  try {
    const { ids, data } = req.body;
    const result = await req.prisma.voiceover.updateMany({
      where: { id: { in: ids }, userId: req.userId },
      data
    });
    res.json({ message: `${result.count} voiceovers updated` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk update voiceovers' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await req.prisma.voiceover.deleteMany({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    res.json({ message: 'Voiceover deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete voiceover' });
  }
});

module.exports = router;
