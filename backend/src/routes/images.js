const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateImagePrompt } = require('../services/openrouter');
const { generateImage } = require('../services/openai-media');

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
      req.prisma.image.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limitNum
      }),
      req.prisma.image.count({ where })
    ]);

    res.json({ items, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

// Export CSV
router.get('/export/csv', auth, async (req, res) => {
  try {
    const { generateCSV } = require('../utils/export');
    const items = await req.prisma.image.findMany({
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
    res.setHeader('Content-Disposition', `attachment; filename="images-export.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// Export PDF
router.get('/export/pdf', auth, async (req, res) => {
  try {
    const { generatePDF } = require('../utils/export');
    const items = await req.prisma.image.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    const fields = [
      { label: 'ID', value: 'id' },
      { label: 'Title', value: 'title' },
      { label: 'Status', value: 'status' },
      { label: 'Created', value: 'createdAt' },
    ];
    const pdf = await generatePDF(items, 'Image Export', fields);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="images-export.pdf"`);
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export PDF' });
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

    // Format description professionally
    const revisedPrompt = imageResult.revisedPrompt || image.prompt;
    const description = `## Generated Image: ${image.title}\n\n> **Style:** ${image.style} | **Resolution:** ${image.resolution}\n\n---\n\n### AI Prompt Used\n${revisedPrompt}\n\n### Original Request\n${image.prompt}\n\n---\n*Style: ${image.style} | Resolution: ${image.resolution}*`;

    const updatedImage = await req.prisma.image.update({
      where: { id: image.id },
      data: {
        description,
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

// Update image
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, prompt, style, resolution, status } = req.body;
    const updated = await req.prisma.image.updateMany({
      where: { id: parseInt(req.params.id), userId: req.userId },
      data: { title, description, prompt, style, resolution, status }
    });
    if (updated.count === 0) return res.status(404).json({ error: 'Image not found' });
    const item = await req.prisma.image.findFirst({ where: { id: parseInt(req.params.id) } });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update image' });
  }
});

// Bulk delete images
router.post('/bulk-delete', auth, async (req, res) => {
  try {
    const { ids } = req.body;
    const result = await req.prisma.image.deleteMany({
      where: { id: { in: ids }, userId: req.userId }
    });
    res.json({ message: `${result.count} images deleted` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk delete images' });
  }
});

// Bulk update images
router.post('/bulk-update', auth, async (req, res) => {
  try {
    const { ids, data } = req.body;
    const result = await req.prisma.image.updateMany({
      where: { id: { in: ids }, userId: req.userId },
      data
    });
    res.json({ message: `${result.count} images updated` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk update images' });
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
