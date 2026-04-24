const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { summarizeText } = require('../services/openrouter');

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
        { originalText: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      req.prisma.summary.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limitNum
      }),
      req.prisma.summary.count({ where })
    ]);

    res.json({ items, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch summaries' });
  }
});

// Export CSV
router.get('/export/csv', auth, async (req, res) => {
  try {
    const { generateCSV } = require('../utils/export');
    const items = await req.prisma.summary.findMany({
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
    res.setHeader('Content-Disposition', `attachment; filename="summaries-export.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// Export PDF
router.get('/export/pdf', auth, async (req, res) => {
  try {
    const { generatePDF } = require('../utils/export');
    const items = await req.prisma.summary.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    const fields = [
      { label: 'ID', value: 'id' },
      { label: 'Title', value: 'title' },
      { label: 'Status', value: 'status' },
      { label: 'Created', value: 'createdAt' },
    ];
    const pdf = await generatePDF(items, 'Summary Export', fields);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="summaries-export.pdf"`);
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export PDF' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const summary = await req.prisma.summary.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!summary) return res.status(404).json({ error: 'Summary not found' });
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, originalText, length } = req.body;
    const summary = await req.prisma.summary.create({
      data: {
        title,
        originalText,
        length: length || 'medium',
        userId: req.userId,
        status: 'pending'
      }
    });
    res.status(201).json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create summary' });
  }
});

router.post('/:id/generate', auth, async (req, res) => {
  try {
    const summary = await req.prisma.summary.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!summary) return res.status(404).json({ error: 'Summary not found' });

    await req.prisma.summary.update({
      where: { id: summary.id },
      data: { status: 'processing' }
    });

    const rawSummary = await summarizeText(summary.originalText, summary.length);

    // Clean up and ensure professional formatting
    let summaryText = rawSummary.trim();
    if (!summaryText.startsWith('#')) {
      summaryText = `## Summary\n\n${summaryText}`;
    }

    // Add metadata
    const originalWordCount = summary.originalText.split(/\s+/).length;
    const summaryWordCount = summaryText.split(/\s+/).length;
    const compressionRatio = Math.round((1 - summaryWordCount / originalWordCount) * 100);
    summaryText += `\n\n---\n*Original: ~${originalWordCount} words | Summary: ~${summaryWordCount} words | Compression: ${compressionRatio}% | Length: ${summary.length}*`;

    const updated = await req.prisma.summary.update({
      where: { id: summary.id },
      data: { summary: summaryText, status: 'completed' }
    });
    res.json(updated);
  } catch (error) {
    await req.prisma.summary.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'failed' }
    });
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// Update summary
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, originalText, length, status } = req.body;
    const updated = await req.prisma.summary.updateMany({
      where: { id: parseInt(req.params.id), userId: req.userId },
      data: { title, originalText, length, status }
    });
    if (updated.count === 0) return res.status(404).json({ error: 'Summary not found' });
    const item = await req.prisma.summary.findFirst({ where: { id: parseInt(req.params.id) } });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update summary' });
  }
});

// Bulk delete summaries
router.post('/bulk-delete', auth, async (req, res) => {
  try {
    const { ids } = req.body;
    const result = await req.prisma.summary.deleteMany({
      where: { id: { in: ids }, userId: req.userId }
    });
    res.json({ message: `${result.count} summaries deleted` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk delete summaries' });
  }
});

// Bulk update summaries
router.post('/bulk-update', auth, async (req, res) => {
  try {
    const { ids, data } = req.body;
    const result = await req.prisma.summary.updateMany({
      where: { id: { in: ids }, userId: req.userId },
      data
    });
    res.json({ message: `${result.count} summaries updated` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk update summaries' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await req.prisma.summary.deleteMany({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    res.json({ message: 'Summary deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete summary' });
  }
});

module.exports = router;
