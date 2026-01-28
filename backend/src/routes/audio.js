const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateAudioContent } = require('../services/openrouter');
const { generateTTS, mapVoice } = require('../services/openai-media');

router.get('/', auth, async (req, res) => {
  try {
    const audio = await req.prisma.audio.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(audio);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audio files' });
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
    const script = await generateAudioContent(audio.prompt, 'voiceover');

    // Then generate real audio with OpenAI TTS
    const voice = mapVoice(audio.voice);
    const ttsResult = await generateTTS(script, {
      voice,
      filename: `audio_${audio.id}_${Date.now()}.mp3`
    });

    const updatedAudio = await req.prisma.audio.update({
      where: { id: audio.id },
      data: {
        description: script,
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
