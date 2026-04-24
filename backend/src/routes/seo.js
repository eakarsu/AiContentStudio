const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateSEOContent } = require('../services/openrouter');

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
        { keyword: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      req.prisma.sEOContent.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limitNum
      }),
      req.prisma.sEOContent.count({ where })
    ]);

    res.json({ items, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch SEO content' });
  }
});

// Export CSV
router.get('/export/csv', auth, async (req, res) => {
  try {
    const { generateCSV } = require('../utils/export');
    const items = await req.prisma.sEOContent.findMany({
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
    res.setHeader('Content-Disposition', `attachment; filename="seo-export.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// Export PDF
router.get('/export/pdf', auth, async (req, res) => {
  try {
    const { generatePDF } = require('../utils/export');
    const items = await req.prisma.sEOContent.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    const fields = [
      { label: 'ID', value: 'id' },
      { label: 'Title', value: 'title' },
      { label: 'Status', value: 'status' },
      { label: 'Created', value: 'createdAt' },
    ];
    const pdf = await generatePDF(items, 'SEO Content Export', fields);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="seo-export.pdf"`);
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export PDF' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const seo = await req.prisma.sEOContent.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!seo) return res.status(404).json({ error: 'SEO content not found' });
    res.json(seo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch SEO content' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, keyword } = req.body;
    const seo = await req.prisma.sEOContent.create({
      data: {
        title,
        keyword,
        userId: req.userId,
        status: 'pending'
      }
    });
    res.status(201).json(seo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create SEO content' });
  }
});

router.post('/:id/generate', auth, async (req, res) => {
  try {
    const seo = await req.prisma.sEOContent.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!seo) return res.status(404).json({ error: 'SEO content not found' });

    await req.prisma.sEOContent.update({
      where: { id: seo.id },
      data: { status: 'processing' }
    });

    const rawContent = await generateSEOContent(seo.keyword);

    // Clean up and ensure professional formatting
    let content = rawContent.trim();
    if (!content.startsWith('#')) {
      content = `# SEO Content: ${seo.keyword}\n\n${content}`;
    }

    // Extract meta title from first H1 or meta description block
    const lines = content.split('\n');
    const titleLine = lines.find(l => l.startsWith('# '));
    const metaTitle = titleLine ? titleLine.replace(/^#\s*/, '').slice(0, 60) : seo.title;

    // Extract meta description - look for the "Meta Description" section
    let metaDesc = '';
    const metaIdx = lines.findIndex(l => l.toLowerCase().includes('meta description'));
    if (metaIdx >= 0) {
      const metaLine = lines[metaIdx].replace(/^.*meta\s*description[:\s]*/i, '').replace(/^\*\*|\*\*$/g, '').trim();
      if (metaLine && metaLine.length > 10) {
        metaDesc = metaLine.slice(0, 160);
      } else if (lines[metaIdx + 1]) {
        metaDesc = lines[metaIdx + 1].replace(/^[>\s]+/, '').replace(/^\*\*|\*\*$/g, '').trim().slice(0, 160);
      }
    }
    if (!metaDesc) {
      metaDesc = lines.filter(l => l.trim() && !l.startsWith('#') && !l.startsWith('>')).slice(0, 2).join(' ').slice(0, 160);
    }

    // Add metadata footer
    content += `\n\n---\n*Target keyword: "${seo.keyword}" | Generated: ${new Date().toLocaleDateString()}*`;

    const updated = await req.prisma.sEOContent.update({
      where: { id: seo.id },
      data: { content, metaTitle, metaDesc, status: 'completed' }
    });
    res.json(updated);
  } catch (error) {
    await req.prisma.sEOContent.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'failed' }
    });
    res.status(500).json({ error: 'Failed to generate SEO content' });
  }
});

// Update SEO content
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, keyword, status } = req.body;
    const updated = await req.prisma.sEOContent.updateMany({
      where: { id: parseInt(req.params.id), userId: req.userId },
      data: { title, keyword, status }
    });
    if (updated.count === 0) return res.status(404).json({ error: 'SEO content not found' });
    const item = await req.prisma.sEOContent.findFirst({ where: { id: parseInt(req.params.id) } });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update SEO content' });
  }
});

// Bulk delete SEO content
router.post('/bulk-delete', auth, async (req, res) => {
  try {
    const { ids } = req.body;
    const result = await req.prisma.sEOContent.deleteMany({
      where: { id: { in: ids }, userId: req.userId }
    });
    res.json({ message: `${result.count} SEO items deleted` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk delete SEO content' });
  }
});

// Bulk update SEO content
router.post('/bulk-update', auth, async (req, res) => {
  try {
    const { ids, data } = req.body;
    const result = await req.prisma.sEOContent.updateMany({
      where: { id: { in: ids }, userId: req.userId },
      data
    });
    res.json({ message: `${result.count} SEO items updated` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk update SEO content' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await req.prisma.sEOContent.deleteMany({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    res.json({ message: 'SEO content deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete SEO content' });
  }
});

module.exports = router;
