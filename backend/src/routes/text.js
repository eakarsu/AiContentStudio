const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateText, rewriteContent } = require('../services/openrouter');

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
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      req.prisma.textContent.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limitNum
      }),
      req.prisma.textContent.count({ where })
    ]);

    res.json({ items, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch text content' });
  }
});

// Export CSV
router.get('/export/csv', auth, async (req, res) => {
  try {
    const { generateCSV } = require('../utils/export');
    const items = await req.prisma.textContent.findMany({
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
    res.setHeader('Content-Disposition', `attachment; filename="text-export.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// Export PDF
router.get('/export/pdf', auth, async (req, res) => {
  try {
    const { generatePDF } = require('../utils/export');
    const items = await req.prisma.textContent.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    const fields = [
      { label: 'ID', value: 'id' },
      { label: 'Title', value: 'title' },
      { label: 'Status', value: 'status' },
      { label: 'Created', value: 'createdAt' },
    ];
    const pdf = await generatePDF(items, 'Text Content Export', fields);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="text-export.pdf"`);
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export PDF' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const text = await req.prisma.textContent.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!text) return res.status(404).json({ error: 'Text content not found' });
    res.json(text);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch text content' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, description, prompt, type, tone } = req.body;
    const text = await req.prisma.textContent.create({
      data: {
        title,
        description,
        prompt,
        type: type || 'general',
        tone: tone || 'professional',
        userId: req.userId,
        status: 'pending'
      }
    });
    res.status(201).json(text);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create text content' });
  }
});

router.post('/:id/generate', auth, async (req, res) => {
  try {
    const text = await req.prisma.textContent.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!text) return res.status(404).json({ error: 'Text content not found' });

    await req.prisma.textContent.update({
      where: { id: text.id },
      data: { status: 'processing' }
    });

    const rawContent = await generateText(text.prompt, {
      systemPrompt: `You are an expert content writer. Write in a ${text.tone} tone. Use professional markdown formatting with headers, bold text, and bullet points where appropriate.`
    });

    // Clean up and ensure professional formatting
    let content = rawContent.trim();
    if (!content.startsWith('#')) {
      content = `# ${text.title}\n\n> **Type:** ${text.type} | **Tone:** ${text.tone}\n\n---\n\n${content}`;
    }

    const wordCount = content.split(/\s+/).length;
    content += `\n\n---\n*Type: ${text.type} | Tone: ${text.tone} | Words: ~${wordCount}*`;

    const updatedText = await req.prisma.textContent.update({
      where: { id: text.id },
      data: {
        content,
        status: 'completed',
        wordCount
      }
    });
    res.json(updatedText);
  } catch (error) {
    await req.prisma.textContent.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'failed' }
    });
    res.status(500).json({ error: 'Failed to generate text content' });
  }
});

// Update text content
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, prompt, type, tone, status } = req.body;
    const updated = await req.prisma.textContent.updateMany({
      where: { id: parseInt(req.params.id), userId: req.userId },
      data: { title, description, prompt, type, tone, status }
    });
    if (updated.count === 0) return res.status(404).json({ error: 'Text content not found' });
    const item = await req.prisma.textContent.findFirst({ where: { id: parseInt(req.params.id) } });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update text content' });
  }
});

// Bulk delete text content
router.post('/bulk-delete', auth, async (req, res) => {
  try {
    const { ids } = req.body;
    const result = await req.prisma.textContent.deleteMany({
      where: { id: { in: ids }, userId: req.userId }
    });
    res.json({ message: `${result.count} text items deleted` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk delete text content' });
  }
});

// Bulk update text content
router.post('/bulk-update', auth, async (req, res) => {
  try {
    const { ids, data } = req.body;
    const result = await req.prisma.textContent.updateMany({
      where: { id: { in: ids }, userId: req.userId },
      data
    });
    res.json({ message: `${result.count} text items updated` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk update text content' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await req.prisma.textContent.deleteMany({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    res.json({ message: 'Text content deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete text content' });
  }
});

module.exports = router;
