const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { translateText } = require('../services/openrouter');

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
        { translatedText: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      req.prisma.translation.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limitNum
      }),
      req.prisma.translation.count({ where })
    ]);

    res.json({ items, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch translations' });
  }
});

// Export CSV
router.get('/export/csv', auth, async (req, res) => {
  try {
    const { generateCSV } = require('../utils/export');
    const items = await req.prisma.translation.findMany({
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
    res.setHeader('Content-Disposition', `attachment; filename="translations-export.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// Export PDF
router.get('/export/pdf', auth, async (req, res) => {
  try {
    const { generatePDF } = require('../utils/export');
    const items = await req.prisma.translation.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    const fields = [
      { label: 'ID', value: 'id' },
      { label: 'Title', value: 'title' },
      { label: 'Status', value: 'status' },
      { label: 'Created', value: 'createdAt' },
    ];
    const pdf = await generatePDF(items, 'Translation Export', fields);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="translations-export.pdf"`);
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export PDF' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const translation = await req.prisma.translation.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!translation) return res.status(404).json({ error: 'Translation not found' });
    res.json(translation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch translation' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, originalText, sourceLang, targetLang } = req.body;
    const translation = await req.prisma.translation.create({
      data: {
        title,
        originalText,
        sourceLang: sourceLang || 'en',
        targetLang: targetLang || 'es',
        userId: req.userId,
        status: 'pending'
      }
    });
    res.status(201).json(translation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create translation' });
  }
});

router.post('/:id/generate', auth, async (req, res) => {
  try {
    const translation = await req.prisma.translation.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!translation) return res.status(404).json({ error: 'Translation not found' });

    await req.prisma.translation.update({
      where: { id: translation.id },
      data: { status: 'processing' }
    });

    const rawTranslation = await translateText(
      translation.originalText,
      translation.sourceLang,
      translation.targetLang
    );

    // Clean up and ensure professional formatting
    let translatedText = rawTranslation.trim();
    if (!translatedText.startsWith('#')) {
      translatedText = `## Translation (${translation.sourceLang} → ${translation.targetLang})\n\n${translatedText}`;
    }

    // Add metadata
    const wordCount = translatedText.split(/\s+/).length;
    translatedText += `\n\n---\n*From: ${translation.sourceLang} | To: ${translation.targetLang} | Words: ~${wordCount}*`;

    const updated = await req.prisma.translation.update({
      where: { id: translation.id },
      data: { translatedText, status: 'completed' }
    });
    res.json(updated);
  } catch (error) {
    await req.prisma.translation.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'failed' }
    });
    res.status(500).json({ error: 'Failed to generate translation' });
  }
});

// Update translation
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, originalText, sourceLang, targetLang, status } = req.body;
    const updated = await req.prisma.translation.updateMany({
      where: { id: parseInt(req.params.id), userId: req.userId },
      data: { title, originalText, sourceLang, targetLang, status }
    });
    if (updated.count === 0) return res.status(404).json({ error: 'Translation not found' });
    const item = await req.prisma.translation.findFirst({ where: { id: parseInt(req.params.id) } });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update translation' });
  }
});

// Bulk delete translations
router.post('/bulk-delete', auth, async (req, res) => {
  try {
    const { ids } = req.body;
    const result = await req.prisma.translation.deleteMany({
      where: { id: { in: ids }, userId: req.userId }
    });
    res.json({ message: `${result.count} translations deleted` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk delete translations' });
  }
});

// Bulk update translations
router.post('/bulk-update', auth, async (req, res) => {
  try {
    const { ids, data } = req.body;
    const result = await req.prisma.translation.updateMany({
      where: { id: { in: ids }, userId: req.userId },
      data
    });
    res.json({ message: `${result.count} translations updated` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk update translations' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await req.prisma.translation.deleteMany({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    res.json({ message: 'Translation deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete translation' });
  }
});

module.exports = router;
