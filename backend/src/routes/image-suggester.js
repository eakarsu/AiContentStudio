const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { suggestImagesForContent } = require('../services/openrouter');

// Get all image suggestions
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
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      req.prisma.imageSuggestion.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limitNum
      }),
      req.prisma.imageSuggestion.count({ where })
    ]);

    res.json({ items, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    console.error('Error fetching image suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch image suggestions' });
  }
});

// Export CSV
router.get('/export/csv', auth, async (req, res) => {
  try {
    const { generateCSV } = require('../utils/export');
    const items = await req.prisma.imageSuggestion.findMany({
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
    res.setHeader('Content-Disposition', `attachment; filename="image-suggestions-export.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// Export PDF
router.get('/export/pdf', auth, async (req, res) => {
  try {
    const { generatePDF } = require('../utils/export');
    const items = await req.prisma.imageSuggestion.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    const fields = [
      { label: 'ID', value: 'id' },
      { label: 'Title', value: 'title' },
      { label: 'Status', value: 'status' },
      { label: 'Created', value: 'createdAt' },
    ];
    const pdf = await generatePDF(items, 'Image Suggestion Export', fields);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="image-suggestions-export.pdf"`);
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export PDF' });
  }
});

// Get single suggestion
router.get('/:id', auth, async (req, res) => {
  try {
    const item = await req.prisma.imageSuggestion.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!item) return res.status(404).json({ error: 'Suggestion not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch suggestion' });
  }
});

// Create image suggestion request
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, contentType } = req.body;
    const item = await req.prisma.imageSuggestion.create({
      data: {
        title,
        content,
        contentType,
        userId: req.userId,
        status: 'pending'
      }
    });
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating image suggestion request:', error);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

// Generate image suggestions
router.post('/:id/generate', auth, async (req, res) => {
  try {
    const item = await req.prisma.imageSuggestion.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!item) return res.status(404).json({ error: 'Request not found' });

    await req.prisma.imageSuggestion.update({
      where: { id: item.id },
      data: { status: 'processing' }
    });

    const result = await suggestImagesForContent(item.content, item.contentType);

    // Extract JSON from response (handles ```json ... ``` wrapping)
    let jsonStr = result.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();

    let suggestions = result;
    let imagePrompts = '';
    let stockKeywords = '';

    try {
      const parsed = JSON.parse(jsonStr);

      // Format suggestions professionally
      suggestions = `# Image Suggestions for Your ${item.contentType}

> **Content Type:** ${item.contentType} | **Title:** ${item.title}

---

## Recommended Images

${(parsed.imageSuggestions || []).map((s, i) => `### ${i + 1}. ${(s.position || 'general').toUpperCase()} Image

- **Description:** ${s.description}
- **Purpose:** ${s.purpose}
- **Style:** ${s.style}
- **Mood:** ${s.mood}
`).join('\n---\n\n')}

---

## AI Image Generation Prompts

${(parsed.aiImagePrompts || []).map((p, i) => `### Prompt ${i + 1}

\`\`\`
${p.prompt}
\`\`\`

| Setting | Value |
|---------|-------|
| **Style** | ${p.style} |
| **Aspect Ratio** | ${p.aspectRatio} |
`).join('\n')}

---

## Stock Photo Keywords

${(parsed.stockPhotoKeywords || []).map((k, i) => `### Set ${i + 1}
- **Keywords:** ${(k.keywords || []).map(kw => `\`${kw}\``).join(', ')}
- **Filters:** ${k.filters}
`).join('\n')}

---

## Color Palette

${(parsed.colorPalette || []).map(c => `\`${c}\``).join('  ')}

## Branding Notes

${parsed.brandingNotes || 'Maintain consistency with your brand colors and style.'}

## Accessibility Guidelines

${parsed.accessibilityNotes || 'Remember to add descriptive alt text to all images.'}

---

*Image suggestions for: "${item.title}"*`;

      imagePrompts = JSON.stringify(parsed.aiImagePrompts || []);
      stockKeywords = JSON.stringify(parsed.stockPhotoKeywords || []);
    } catch (e) {
      // If JSON fails, format raw text nicely
      suggestions = `# Image Suggestions\n\n> **Content:** ${item.title} | **Type:** ${item.contentType}\n\n---\n\n${result}\n\n---\n*Generated for: "${item.title}"*`;
    }

    // Extract structured fields
    let structuredFields = {};
    try {
      const p = JSON.parse(jsonStr);
      structuredFields = {
        colorPalette: p.colorPalette ? JSON.stringify(p.colorPalette) : null,
        brandingNotes: p.brandingNotes || null,
        accessibilityNotes: p.accessibilityNotes || null,
      };
    } catch (e) {
      // structured fields stay empty if not valid JSON
    }

    const updated = await req.prisma.imageSuggestion.update({
      where: { id: item.id },
      data: {
        suggestions,
        imagePrompts,
        stockKeywords,
        status: 'completed',
        ...structuredFields,
      }
    });
    res.json(updated);
  } catch (error) {
    console.error('Error generating image suggestions:', error);
    await req.prisma.imageSuggestion.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'failed' }
    });
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

// Update image suggestion
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, content, contentType, status } = req.body;
    const updated = await req.prisma.imageSuggestion.updateMany({
      where: { id: parseInt(req.params.id), userId: req.userId },
      data: { title, content, contentType, status }
    });
    if (updated.count === 0) return res.status(404).json({ error: 'Suggestion not found' });
    const item = await req.prisma.imageSuggestion.findFirst({ where: { id: parseInt(req.params.id) } });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update image suggestion' });
  }
});

// Bulk delete image suggestions
router.post('/bulk-delete', auth, async (req, res) => {
  try {
    const { ids } = req.body;
    const result = await req.prisma.imageSuggestion.deleteMany({
      where: { id: { in: ids }, userId: req.userId }
    });
    res.json({ message: `${result.count} suggestions deleted` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk delete image suggestions' });
  }
});

// Bulk update image suggestions
router.post('/bulk-update', auth, async (req, res) => {
  try {
    const { ids, data } = req.body;
    const result = await req.prisma.imageSuggestion.updateMany({
      where: { id: { in: ids }, userId: req.userId },
      data
    });
    res.json({ message: `${result.count} suggestions updated` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk update image suggestions' });
  }
});

// Delete suggestion
router.delete('/:id', auth, async (req, res) => {
  try {
    await req.prisma.imageSuggestion.deleteMany({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    res.json({ message: 'Suggestion deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete suggestion' });
  }
});

module.exports = router;
