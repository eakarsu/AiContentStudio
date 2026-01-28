const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateImagePrompt } = require('../services/openrouter');
const { generateImage } = require('../services/openai-media');

router.get('/', auth, async (req, res) => {
  try {
    const images = await req.prisma.image.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(images);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const image = await req.prisma.image.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!image) return res.status(404).json({ error: 'Image not found' });
    res.json(image);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch image' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, description, prompt, style, resolution } = req.body;
    const image = await req.prisma.image.create({
      data: {
        title,
        description,
        prompt,
        style: style || 'realistic',
        resolution: resolution || '1024x1024',
        userId: req.userId,
        status: 'pending'
      }
    });
    res.status(201).json(image);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create image' });
  }
});

router.post('/:id/generate', auth, async (req, res) => {
  try {
    const image = await req.prisma.image.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!image) return res.status(404).json({ error: 'Image not found' });

    await req.prisma.image.update({
      where: { id: image.id },
      data: { status: 'processing' }
    });

    // Generate real image with DALL-E
    const imageResult = await generateImage(image.prompt, {
      size: image.resolution === '1920x1080' ? '1792x1024' : '1024x1024',
      filename: `image_${image.id}_${Date.now()}.png`
    });

    const updatedImage = await req.prisma.image.update({
      where: { id: image.id },
      data: {
        description: imageResult.revisedPrompt || image.prompt,
        status: 'completed',
        imageUrl: imageResult.url
      }
    });
    res.json(updatedImage);
  } catch (error) {
    await req.prisma.image.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'failed' }
    });
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await req.prisma.image.deleteMany({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    res.json({ message: 'Image deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

module.exports = router;
