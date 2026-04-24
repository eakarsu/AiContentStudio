const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateMarketingCopy } = require('../services/openrouter');

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
        { product: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { headline: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      req.prisma.marketingCopy.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limitNum
      }),
      req.prisma.marketingCopy.count({ where })
    ]);

    res.json({ items, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch marketing copy' });
  }
});

// Export CSV
router.get('/export/csv', auth, async (req, res) => {
  try {
    const { generateCSV } = require('../utils/export');
    const items = await req.prisma.marketingCopy.findMany({
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
    res.setHeader('Content-Disposition', `attachment; filename="marketing-export.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// Export PDF
router.get('/export/pdf', auth, async (req, res) => {
  try {
    const { generatePDF } = require('../utils/export');
    const items = await req.prisma.marketingCopy.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    const fields = [
      { label: 'ID', value: 'id' },
      { label: 'Title', value: 'title' },
      { label: 'Status', value: 'status' },
      { label: 'Created', value: 'createdAt' },
    ];
    const pdf = await generatePDF(items, 'Marketing Copy Export', fields);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="marketing-export.pdf"`);
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export PDF' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const copy = await req.prisma.marketingCopy.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!copy) return res.status(404).json({ error: 'Marketing copy not found' });
    res.json(copy);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch marketing copy' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, product, targetAud } = req.body;
    const copy = await req.prisma.marketingCopy.create({
      data: {
        title,
        product,
        targetAud,
        userId: req.userId,
        status: 'pending'
      }
    });
    res.status(201).json(copy);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create marketing copy' });
  }
});

router.post('/:id/generate', auth, async (req, res) => {
  try {
    const copy = await req.prisma.marketingCopy.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!copy) return res.status(404).json({ error: 'Marketing copy not found' });

    await req.prisma.marketingCopy.update({
      where: { id: copy.id },
      data: { status: 'processing' }
    });

    const rawContent = await generateMarketingCopy(copy.product, copy.targetAud);

    // Clean up and ensure professional formatting
    let content = rawContent.trim();
    if (!content.startsWith('#')) {
      content = `# Marketing Copy: ${copy.title}\n\n${content}`;
    }

    // Extract headline from first H1
    const lines = content.split('\n').filter(l => l.trim());
    const headlineMatch = lines.find(l => l.startsWith('# '));
    const headline = headlineMatch ? headlineMatch.replace(/^#\s*/, '') : copy.title;

    // Extract CTA - look for "Call to Action" section or CTA keywords
    let cta = 'Get Started Today!';
    const ctaSectionIdx = lines.findIndex(l => l.toLowerCase().includes('call to action') || l.toLowerCase().includes('### cta'));
    if (ctaSectionIdx >= 0 && lines[ctaSectionIdx + 1]) {
      cta = lines[ctaSectionIdx + 1].replace(/^\*\*|\*\*$/g, '').replace(/^#+\s*/, '').trim();
    }

    // Add metadata footer
    content += `\n\n---\n*Generated for: "${copy.product}"${copy.targetAud ? ` | Target: ${copy.targetAud}` : ''}*`;

    const updated = await req.prisma.marketingCopy.update({
      where: { id: copy.id },
      data: { content, headline, callToAction: cta, status: 'completed' }
    });
    res.json(updated);
  } catch (error) {
    await req.prisma.marketingCopy.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'failed' }
    });
    res.status(500).json({ error: 'Failed to generate marketing copy' });
  }
});

// Update marketing copy
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, product, targetAud, status } = req.body;
    const updated = await req.prisma.marketingCopy.updateMany({
      where: { id: parseInt(req.params.id), userId: req.userId },
      data: { title, product, targetAud, status }
    });
    if (updated.count === 0) return res.status(404).json({ error: 'Marketing copy not found' });
    const item = await req.prisma.marketingCopy.findFirst({ where: { id: parseInt(req.params.id) } });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update marketing copy' });
  }
});

// Bulk delete marketing copy
router.post('/bulk-delete', auth, async (req, res) => {
  try {
    const { ids } = req.body;
    const result = await req.prisma.marketingCopy.deleteMany({
      where: { id: { in: ids }, userId: req.userId }
    });
    res.json({ message: `${result.count} marketing copies deleted` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk delete marketing copy' });
  }
});

// Bulk update marketing copy
router.post('/bulk-update', auth, async (req, res) => {
  try {
    const { ids, data } = req.body;
    const result = await req.prisma.marketingCopy.updateMany({
      where: { id: { in: ids }, userId: req.userId },
      data
    });
    res.json({ message: `${result.count} marketing copies updated` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk update marketing copy' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await req.prisma.marketingCopy.deleteMany({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    res.json({ message: 'Marketing copy deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete marketing copy' });
  }
});

module.exports = router;
