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
        { prompt: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      req.prisma.audio.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limitNum
      }),
      req.prisma.audio.count({ where })
    ]);

    res.json({ items, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audio files' });
  }
});

// Export CSV
router.get('/export/csv', auth, async (req, res) => {
  try {
    const { generateCSV } = require('../utils/export');
    const items = await req.prisma.audio.findMany({
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
    res.setHeader('Content-Disposition', `attachment; filename="audio-export.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// Export PDF
router.get('/export/pdf', auth, async (req, res) => {
  try {
    const { generatePDF } = require('../utils/export');
    const items = await req.prisma.audio.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    const fields = [
      { label: 'ID', value: 'id' },
      { label: 'Title', value: 'title' },
      { label: 'Status', value: 'status' },
      { label: 'Created', value: 'createdAt' },
    ];
    const pdf = await generatePDF(items, 'Audio Export', fields);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="audio-export.pdf"`);
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export PDF' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const audio = await req.prisma.audio.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!audio) return res.status(404).json({ error: 'Audio not found' });
    res.json(audio);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audio' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, description, prompt, voice, language } = req.body;
    const audio = await req.prisma.audio.create({
      data: {
        title,
        description,
        prompt,
        voice: voice || 'neutral',
        language: language || 'en',
        userId: req.userId,
        status: 'pending'
      }
    });
    res.status(201).json(audio);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create audio' });
  }
});

router.post('/:id/generate', auth, async (req, res) => {
  try {
    const audio = await req.prisma.audio.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!audio) return res.status(404).json({ error: 'Audio not found' });

    await req.prisma.audio.update({
      where: { id: audio.id },
      data: { status: 'processing' }
    });

    // First generate script with AI
    const rawScript = await generateAudioContent(audio.prompt, 'voiceover');

    // Clean up and ensure professional formatting
    let description = rawScript.trim();
    if (!description.startsWith('#')) {
      description = `# Audio Script: ${audio.title}\n\n> **Voice:** ${audio.voice} | **Language:** ${audio.language}\n\n---\n\n${description}`;
    }

    const wordCount = description.split(/\s+/).length;
    description += `\n\n---\n*Audio: "${audio.title}" | Voice: ${audio.voice} | ~${wordCount} words*`;

    // Then generate real audio with OpenAI TTS
    const voice = mapVoice(audio.voice);
    const ttsResult = await generateTTS(rawScript, {
      voice,
      filename: `audio_${audio.id}_${Date.now()}.mp3`
    });

    const updatedAudio = await req.prisma.audio.update({
      where: { id: audio.id },
      data: {
        description,
        status: 'completed',
        audioUrl: ttsResult.url,
        duration: ttsResult.duration
      }
    });
    res.json(updatedAudio);
  } catch (error) {
    await req.prisma.audio.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'failed' }
    });
    res.status(500).json({ error: 'Failed to generate audio' });
  }
});

// Update audio
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, prompt, voice, language, status } = req.body;
    const updated = await req.prisma.audio.updateMany({
      where: { id: parseInt(req.params.id), userId: req.userId },
      data: { title, description, prompt, voice, language, status }
    });
    if (updated.count === 0) return res.status(404).json({ error: 'Audio not found' });
    const item = await req.prisma.audio.findFirst({ where: { id: parseInt(req.params.id) } });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update audio' });
  }
});

// Bulk delete audio
router.post('/bulk-delete', auth, async (req, res) => {
  try {
    const { ids } = req.body;
    const result = await req.prisma.audio.deleteMany({
      where: { id: { in: ids }, userId: req.userId }
    });
    res.json({ message: `${result.count} audio files deleted` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk delete audio' });
  }
});

// Bulk update audio
router.post('/bulk-update', auth, async (req, res) => {
  try {
    const { ids, data } = req.body;
    const result = await req.prisma.audio.updateMany({
      where: { id: { in: ids }, userId: req.userId },
      data
    });
    res.json({ message: `${result.count} audio files updated` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk update audio' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await req.prisma.audio.deleteMany({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    res.json({ message: 'Audio deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete audio' });
  }
});

module.exports = router;
