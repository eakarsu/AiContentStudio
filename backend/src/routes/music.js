const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateMusicDescription } = require('../services/openrouter');

router.get('/', auth, async (req, res) => {
  try {
    const tracks = await req.prisma.musicTrack.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tracks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch music tracks' });
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

    const description = await generateMusicDescription(track.genre, track.mood, 'background');

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
