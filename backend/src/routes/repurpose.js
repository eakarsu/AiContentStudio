const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { repurposeContent } = require('../services/openrouter');

// Get all repurposed content
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
        { originalContent: { contains: search, mode: 'insensitive' } },
        { repurposedContent: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      req.prisma.repurposedContent.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limitNum
      }),
      req.prisma.repurposedContent.count({ where })
    ]);

    res.json({ items, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    console.error('Error fetching repurposed content:', error);
    res.status(500).json({ error: 'Failed to fetch repurposed content' });
  }
});

// Export CSV
router.get('/export/csv', auth, async (req, res) => {
  try {
    const { generateCSV } = require('../utils/export');
    const items = await req.prisma.repurposedContent.findMany({
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
    res.setHeader('Content-Disposition', `attachment; filename="repurpose-export.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// Export PDF
router.get('/export/pdf', auth, async (req, res) => {
  try {
    const { generatePDF } = require('../utils/export');
    const items = await req.prisma.repurposedContent.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    const fields = [
      { label: 'ID', value: 'id' },
      { label: 'Title', value: 'title' },
      { label: 'Status', value: 'status' },
      { label: 'Created', value: 'createdAt' },
    ];
    const pdf = await generatePDF(items, 'Repurposed Content Export', fields);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="repurpose-export.pdf"`);
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export PDF' });
  }
});

// Get single item
router.get('/:id', auth, async (req, res) => {
  try {
    const item = await req.prisma.repurposedContent.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// Create repurpose request
router.post('/', auth, async (req, res) => {
  try {
    const { title, originalContent, originalType, targetType, targetPlatform } = req.body;
    const item = await req.prisma.repurposedContent.create({
      data: {
        title,
        originalContent,
        originalType,
        targetType,
        targetPlatform,
        userId: req.userId,
        status: 'pending'
      }
    });
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating repurpose request:', error);
    res.status(500).json({ error: 'Failed to create repurpose request' });
  }
});

// Generate repurposed content
router.post('/:id/generate', auth, async (req, res) => {
  try {
    const item = await req.prisma.repurposedContent.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    await req.prisma.repurposedContent.update({
      where: { id: item.id },
      data: { status: 'processing' }
    });

    const rawContent = await repurposeContent(
      item.originalContent,
      item.originalType,
      item.targetType,
      item.targetPlatform
    );

    // Clean up and ensure professional formatting
    let content = rawContent.trim();
    if (!content.startsWith('#')) {
      content = `# Repurposed Content: ${item.originalType} → ${item.targetType}\n\n> **Platform:** ${item.targetPlatform || 'General'}\n\n---\n\n${content}`;
    }

    // Add metadata footer
    content += `\n\n---\n*Repurposed from: ${item.originalType} → ${item.targetType}${item.targetPlatform ? ` | Platform: ${item.targetPlatform}` : ''}*`;

    const updated = await req.prisma.repurposedContent.update({
      where: { id: item.id },
      data: {
        repurposedContent: content,
        status: 'completed'
      }
    });
    res.json(updated);
  } catch (error) {
    console.error('Error generating repurposed content:', error);
    await req.prisma.repurposedContent.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'failed' }
    });
    res.status(500).json({ error: 'Failed to generate repurposed content' });
  }
});

// Update repurposed content
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, originalContent, originalType, targetType, targetPlatform, status } = req.body;
    const updated = await req.prisma.repurposedContent.updateMany({
      where: { id: parseInt(req.params.id), userId: req.userId },
      data: { title, originalContent, originalType, targetType, targetPlatform, status }
    });
    if (updated.count === 0) return res.status(404).json({ error: 'Item not found' });
    const item = await req.prisma.repurposedContent.findFirst({ where: { id: parseInt(req.params.id) } });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update repurposed content' });
  }
});

// Bulk delete repurposed content
router.post('/bulk-delete', auth, async (req, res) => {
  try {
    const { ids } = req.body;
    const result = await req.prisma.repurposedContent.deleteMany({
      where: { id: { in: ids }, userId: req.userId }
    });
    res.json({ message: `${result.count} items deleted` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk delete repurposed content' });
  }
});

// Bulk update repurposed content
router.post('/bulk-update', auth, async (req, res) => {
  try {
    const { ids, data } = req.body;
    const result = await req.prisma.repurposedContent.updateMany({
      where: { id: { in: ids }, userId: req.userId },
      data
    });
    res.json({ message: `${result.count} items updated` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk update repurposed content' });
  }
});

// Delete item
router.delete('/:id', auth, async (req, res) => {
  try {
    await req.prisma.repurposedContent.deleteMany({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    res.json({ message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

module.exports = router;
