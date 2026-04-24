const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateEmail } = require('../services/openrouter');

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
        { subject: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      req.prisma.email.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limitNum
      }),
      req.prisma.email.count({ where })
    ]);

    res.json({ items, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

// Export CSV
router.get('/export/csv', auth, async (req, res) => {
  try {
    const { generateCSV } = require('../utils/export');
    const items = await req.prisma.email.findMany({
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
    res.setHeader('Content-Disposition', `attachment; filename="emails-export.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// Export PDF
router.get('/export/pdf', auth, async (req, res) => {
  try {
    const { generatePDF } = require('../utils/export');
    const items = await req.prisma.email.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    const fields = [
      { label: 'ID', value: 'id' },
      { label: 'Title', value: 'title' },
      { label: 'Status', value: 'status' },
      { label: 'Created', value: 'createdAt' },
    ];
    const pdf = await generatePDF(items, 'Email Export', fields);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="emails-export.pdf"`);
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export PDF' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const email = await req.prisma.email.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!email) return res.status(404).json({ error: 'Email not found' });
    res.json(email);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch email' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, type, prompt } = req.body;
    const email = await req.prisma.email.create({
      data: {
        title,
        type: type || 'marketing',
        prompt,
        userId: req.userId,
        status: 'pending'
      }
    });
    res.status(201).json(email);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create email' });
  }
});

router.post('/:id/generate', auth, async (req, res) => {
  try {
    const email = await req.prisma.email.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!email) return res.status(404).json({ error: 'Email not found' });

    await req.prisma.email.update({
      where: { id: email.id },
      data: { status: 'processing' }
    });

    const rawContent = await generateEmail(email.type, email.prompt);

    // Clean up and ensure professional formatting
    let body = rawContent.trim();
    if (!body.startsWith('#')) {
      body = `## ${email.type.charAt(0).toUpperCase() + email.type.slice(1)} Email\n\n${body}`;
    }

    // Extract subject line more robustly
    const lines = body.split('\n');
    let subject = email.title;
    const subjectIdx = lines.findIndex(l => l.toLowerCase().includes('subject line') || l.toLowerCase().match(/^##?\s*subject/));
    if (subjectIdx >= 0) {
      // Check current line for inline subject or next line
      const inline = lines[subjectIdx].replace(/^.*subject\s*line[:\s]*/i, '').replace(/^\*\*|\*\*$/g, '').trim();
      if (inline && inline.length > 3) {
        subject = inline;
      } else if (lines[subjectIdx + 1]) {
        subject = lines[subjectIdx + 1].replace(/^\*\*|\*\*$/g, '').replace(/^[>\-\s]+/, '').trim();
      }
    }

    // Add metadata footer
    body += `\n\n---\n*Email type: ${email.type} | Generated from: "${email.prompt}"*`;

    const updated = await req.prisma.email.update({
      where: { id: email.id },
      data: { subject, body, status: 'completed' }
    });
    res.json(updated);
  } catch (error) {
    await req.prisma.email.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'failed' }
    });
    res.status(500).json({ error: 'Failed to generate email' });
  }
});

// Update email
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, prompt, type, status } = req.body;
    const updated = await req.prisma.email.updateMany({
      where: { id: parseInt(req.params.id), userId: req.userId },
      data: { title, prompt, type, status }
    });
    if (updated.count === 0) return res.status(404).json({ error: 'Email not found' });
    const item = await req.prisma.email.findFirst({ where: { id: parseInt(req.params.id) } });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update email' });
  }
});

// Bulk delete emails
router.post('/bulk-delete', auth, async (req, res) => {
  try {
    const { ids } = req.body;
    const result = await req.prisma.email.deleteMany({
      where: { id: { in: ids }, userId: req.userId }
    });
    res.json({ message: `${result.count} emails deleted` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk delete emails' });
  }
});

// Bulk update emails
router.post('/bulk-update', auth, async (req, res) => {
  try {
    const { ids, data } = req.body;
    const result = await req.prisma.email.updateMany({
      where: { id: { in: ids }, userId: req.userId },
      data
    });
    res.json({ message: `${result.count} emails updated` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk update emails' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await req.prisma.email.deleteMany({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    res.json({ message: 'Email deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete email' });
  }
});

module.exports = router;
