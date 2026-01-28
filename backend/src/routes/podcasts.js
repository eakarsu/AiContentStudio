const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateAudioContent } = require('../services/openrouter');
const { generateTTS } = require('../services/openai-media');

router.get('/', auth, async (req, res) => {
  try {
    const podcasts = await req.prisma.podcast.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(podcasts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch podcasts' });
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
    const script = await generateAudioContent(podcast.topic, 'podcast');

    // Generate real audio with OpenAI TTS
    const ttsResult = await generateTTS(script, {
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
    await req.prisma.podcast.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'failed' }
    });
    res.status(500).json({ error: 'Failed to generate podcast' });
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
