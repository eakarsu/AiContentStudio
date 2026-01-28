const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateAudioContent } = require('../services/openrouter');
const { generateTTS, mapVoice } = require('../services/openai-media');

router.get('/', auth, async (req, res) => {
  try {
    const voiceovers = await req.prisma.voiceover.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(voiceovers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch voiceovers' });
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

    // Generate real audio with OpenAI TTS
    const voice = mapVoice(voiceover.voice);
    const ttsResult = await generateTTS(voiceover.text, {
      voice,
      filename: `voiceover_${voiceover.id}_${Date.now()}.mp3`
    });

    const updated = await req.prisma.voiceover.update({
      where: { id: voiceover.id },
      data: {
        audioUrl: ttsResult.url,
        duration: ttsResult.duration,
        status: 'completed'
      }
    });
    res.json(updated);
  } catch (error) {
    await req.prisma.voiceover.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'failed' }
    });
    res.status(500).json({ error: 'Failed to generate voiceover' });
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
