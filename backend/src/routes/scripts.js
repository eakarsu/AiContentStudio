const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateScript } = require('../services/openrouter');

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
        { topic: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      req.prisma.script.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limitNum
      }),
      req.prisma.script.count({ where })
    ]);

    res.json({ items, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch scripts' });
  }
});

// Export CSV
router.get('/export/csv', auth, async (req, res) => {
  try {
    const { generateCSV } = require('../utils/export');
    const items = await req.prisma.script.findMany({
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
    res.setHeader('Content-Disposition', `attachment; filename="scripts-export.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// Export PDF
router.get('/export/pdf', auth, async (req, res) => {
  try {
    const { generatePDF } = require('../utils/export');
    const items = await req.prisma.script.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    const fields = [
      { label: 'ID', value: 'id' },
      { label: 'Title', value: 'title' },
      { label: 'Status', value: 'status' },
      { label: 'Created', value: 'createdAt' },
    ];
    const pdf = await generatePDF(items, 'Script Export', fields);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="scripts-export.pdf"`);
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export PDF' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const script = await req.prisma.script.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!script) return res.status(404).json({ error: 'Script not found' });
    res.json(script);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch script' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, type, topic, duration } = req.body;
    const script = await req.prisma.script.create({
      data: {
        title,
        type: type || 'video',
        topic,
        duration: duration || 5,
        userId: req.userId,
        status: 'pending'
      }
    });
    res.status(201).json(script);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create script' });
  }
});

router.post('/:id/generate', auth, async (req, res) => {
  try {
    const script = await req.prisma.script.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!script) return res.status(404).json({ error: 'Script not found' });

    await req.prisma.script.update({
      where: { id: script.id },
      data: { status: 'processing' }
    });

    const rawContent = await generateScript(script.type, script.topic, script.duration);

    // Clean up and ensure professional formatting
    let content = rawContent.trim();
    if (!content.startsWith('#')) {
      content = `# ${script.type.toUpperCase()} SCRIPT: ${script.title}\n\n> **Duration:** ${script.duration} min | **Type:** ${script.type}\n\n---\n\n${content}`;
    }

    // Add metadata footer
    const wordCount = content.split(/\s+/).length;
    const estimatedMinutes = Math.round(wordCount / 150);
    content += `\n\n---\n*Script for: "${script.topic}" | Type: ${script.type} | ~${wordCount} words (~${estimatedMinutes} min read-aloud)*`;

    const updated = await req.prisma.script.update({
      where: { id: script.id },
      data: { content, status: 'completed' }
    });
    res.json(updated);
  } catch (error) {
    await req.prisma.script.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'failed' }
    });
    res.status(500).json({ error: 'Failed to generate script' });
  }
});

// Update script
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, topic, type, duration, status } = req.body;
    const updated = await req.prisma.script.updateMany({
      where: { id: parseInt(req.params.id), userId: req.userId },
      data: { title, topic, type, duration, status }
    });
    if (updated.count === 0) return res.status(404).json({ error: 'Script not found' });
    const item = await req.prisma.script.findFirst({ where: { id: parseInt(req.params.id) } });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update script' });
  }
});

// Bulk delete scripts
router.post('/bulk-delete', auth, async (req, res) => {
  try {
    const { ids } = req.body;
    const result = await req.prisma.script.deleteMany({
      where: { id: { in: ids }, userId: req.userId }
    });
    res.json({ message: `${result.count} scripts deleted` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk delete scripts' });
  }
});

// Bulk update scripts
router.post('/bulk-update', auth, async (req, res) => {
  try {
    const { ids, data } = req.body;
    const result = await req.prisma.script.updateMany({
      where: { id: { in: ids }, userId: req.userId },
      data
    });
    res.json({ message: `${result.count} scripts updated` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk update scripts' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await req.prisma.script.deleteMany({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    res.json({ message: 'Script deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete script' });
  }
});

module.exports = router;
