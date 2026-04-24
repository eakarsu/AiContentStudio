const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateMusicDescription } = require('../services/openrouter');

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
        { genre: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      req.prisma.musicTrack.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limitNum
      }),
      req.prisma.musicTrack.count({ where })
    ]);

    res.json({ items, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch music tracks' });
  }
});

// Export CSV
router.get('/export/csv', auth, async (req, res) => {
  try {
    const { generateCSV } = require('../utils/export');
    const items = await req.prisma.musicTrack.findMany({
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
    res.setHeader('Content-Disposition', `attachment; filename="music-export.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// Export PDF
router.get('/export/pdf', auth, async (req, res) => {
  try {
    const { generatePDF } = require('../utils/export');
    const items = await req.prisma.musicTrack.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    const fields = [
      { label: 'ID', value: 'id' },
      { label: 'Title', value: 'title' },
      { label: 'Status', value: 'status' },
      { label: 'Created', value: 'createdAt' },
    ];
    const pdf = await generatePDF(items, 'Music Track Export', fields);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="music-export.pdf"`);
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export PDF' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const track = await req.prisma.musicTrack.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!track) return res.status(404).json({ error: 'Music track not found' });
    res.json(track);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch music track' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, genre, mood, prompt } = req.body;
    const track = await req.prisma.musicTrack.create({
      data: {
        title,
        genre: genre || 'ambient',
        mood: mood || 'calm',
        prompt,
        userId: req.userId,
        status: 'pending'
      }
    });
    res.status(201).json(track);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create music track' });
  }
});

router.post('/:id/generate', auth, async (req, res) => {
  try {
    const track = await req.prisma.musicTrack.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!track) return res.status(404).json({ error: 'Music track not found' });

    await req.prisma.musicTrack.update({
      where: { id: track.id },
      data: { status: 'processing' }
    });

    const rawDescription = await generateMusicDescription(track.genre, track.mood, 'background');

    // Clean up and ensure professional formatting
    let description = rawDescription.trim();
    if (!description.startsWith('#')) {
      description = `# Music Composition Brief: ${track.title}\n\n> **Genre:** ${track.genre} | **Mood:** ${track.mood}\n\n---\n\n${description}`;
    }

    description += `\n\n---\n*Track: "${track.title}" | Genre: ${track.genre} | Mood: ${track.mood}*`;

    const updated = await req.prisma.musicTrack.update({
      where: { id: track.id },
      data: {
        prompt: description,
        audioUrl: `https://example.com/music/${track.id}.mp3`,
        duration: Math.floor(Math.random() * 240) + 60,
        status: 'completed'
      }
    });
    res.json(updated);
  } catch (error) {
    await req.prisma.musicTrack.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'failed' }
    });
    res.status(500).json({ error: 'Failed to generate music track' });
  }
});

// Update music track
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, prompt, genre, mood, status } = req.body;
    const updated = await req.prisma.musicTrack.updateMany({
      where: { id: parseInt(req.params.id), userId: req.userId },
      data: { title, prompt, genre, mood, status }
    });
    if (updated.count === 0) return res.status(404).json({ error: 'Music track not found' });
    const item = await req.prisma.musicTrack.findFirst({ where: { id: parseInt(req.params.id) } });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update music track' });
  }
});

// Bulk delete music tracks
router.post('/bulk-delete', auth, async (req, res) => {
  try {
    const { ids } = req.body;
    const result = await req.prisma.musicTrack.deleteMany({
      where: { id: { in: ids }, userId: req.userId }
    });
    res.json({ message: `${result.count} music tracks deleted` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk delete music tracks' });
  }
});

// Bulk update music tracks
router.post('/bulk-update', auth, async (req, res) => {
  try {
    const { ids, data } = req.body;
    const result = await req.prisma.musicTrack.updateMany({
      where: { id: { in: ids }, userId: req.userId },
      data
    });
    res.json({ message: `${result.count} music tracks updated` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk update music tracks' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await req.prisma.musicTrack.deleteMany({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    res.json({ message: 'Music track deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete music track' });
  }
});

module.exports = router;
