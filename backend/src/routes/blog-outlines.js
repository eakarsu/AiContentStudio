const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateBlogOutline } = require('../services/openrouter');

// Get all blog outlines
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
        { keywords: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      req.prisma.blogOutline.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limitNum
      }),
      req.prisma.blogOutline.count({ where })
    ]);

    res.json({ items, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    console.error('Error fetching blog outlines:', error);
    res.status(500).json({ error: 'Failed to fetch blog outlines' });
  }
});

// Export CSV
router.get('/export/csv', auth, async (req, res) => {
  try {
    const { generateCSV } = require('../utils/export');
    const items = await req.prisma.blogOutline.findMany({
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
    res.setHeader('Content-Disposition', `attachment; filename="blog-outlines-export.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// Export PDF
router.get('/export/pdf', auth, async (req, res) => {
  try {
    const { generatePDF } = require('../utils/export');
    const items = await req.prisma.blogOutline.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    const fields = [
      { label: 'ID', value: 'id' },
      { label: 'Title', value: 'title' },
      { label: 'Status', value: 'status' },
      { label: 'Created', value: 'createdAt' },
    ];
    const pdf = await generatePDF(items, 'Blog Outline Export', fields);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="blog-outlines-export.pdf"`);
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export PDF' });
  }
});

// Get single outline
router.get('/:id', auth, async (req, res) => {
  try {
    const item = await req.prisma.blogOutline.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!item) return res.status(404).json({ error: 'Outline not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch outline' });
  }
});

// Create blog outline request
router.post('/', auth, async (req, res) => {
  try {
    const { title, topic, targetAudience, keywords } = req.body;
    const item = await req.prisma.blogOutline.create({
      data: {
        title,
        topic,
        targetAudience,
        keywords,
        userId: req.userId,
        status: 'pending'
      }
    });
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating blog outline request:', error);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

// Generate blog outline
router.post('/:id/generate', auth, async (req, res) => {
  try {
    const item = await req.prisma.blogOutline.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!item) return res.status(404).json({ error: 'Request not found' });

    await req.prisma.blogOutline.update({
      where: { id: item.id },
      data: { status: 'processing' }
    });

    const result = await generateBlogOutline(item.topic, item.targetAudience, item.keywords);

    // Extract JSON from response (handles ```json ... ``` wrapping)
    let jsonStr = result.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();

    let outline = result;
    let estimatedLength = 1500;
    let seoScore = 75;
    let suggestions = '';

    try {
      const parsed = JSON.parse(jsonStr);
      estimatedLength = parsed.estimatedWordCount || 1500;
      seoScore = parsed.seoScore || 75;
      suggestions = JSON.stringify(parsed.seoSuggestions || []);

      // Create readable outline
      outline = `## ${parsed.title || item.title}
${parsed.subtitle ? `### ${parsed.subtitle}` : ''}

**Meta Description:** ${parsed.metaDescription || ''}

**Estimated Read Time:** ${parsed.estimatedReadTime || '5-7 minutes'}
**Target Word Count:** ${parsed.estimatedWordCount || 1500} words
**SEO Score:** ${parsed.seoScore || 75}/100

---

### Target Keywords
${(parsed.targetKeywords || []).map(k => `- ${k}`).join('\n')}

---

## Detailed Outline

${(parsed.outline || []).map((section, i) => `
### ${i + 1}. ${section.heading}
**Section:** ${section.section}
**Word Count:** ~${section.wordCount || 200} words

**Key Points:**
${(section.keyPoints || []).map(p => `- ${p}`).join('\n')}

${section.suggestedContent ? `**Content Notes:** ${section.suggestedContent}` : ''}

${section.subheadings ? `**Subheadings:**
${section.subheadings.map(sub => `
#### ${sub.heading}
${(sub.keyPoints || []).map(p => `  - ${p}`).join('\n')}
`).join('\n')}` : ''}
`).join('\n---\n')}

---

## Content Hooks
${(parsed.contentHooks || []).map(h => `- ${h}`).join('\n')}

## Call to Action
${parsed.callToAction || 'Include a clear call to action at the end of your post.'}

## Related Topics for Future Posts
${(parsed.relatedTopics || []).map(t => `- ${t}`).join('\n')}

## Visual Suggestions
${(parsed.visualSuggestions || []).map(v => `- ${v}`).join('\n')}

---

## SEO Recommendations
${(parsed.seoSuggestions || []).map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
    } catch (e) {
      // If JSON fails, format raw text nicely
      outline = `# Blog Outline: ${item.title}\n\n> **Topic:** ${item.topic} | **Audience:** ${item.targetAudience || 'General'}\n\n---\n\n${result}\n\n---\n*Generated for: "${item.topic}"*`;
    }

    // Extract structured fields
    let structuredFields = {};
    try {
      const p = JSON.parse(jsonStr);
      structuredFields = {
        subtitle: p.subtitle || null,
        metaDescription: p.metaDescription || null,
        estimatedReadTime: p.estimatedReadTime || null,
        targetKeywords: p.targetKeywords ? JSON.stringify(p.targetKeywords) : null,
        contentHooks: p.contentHooks ? JSON.stringify(p.contentHooks) : null,
        callToAction: p.callToAction || null,
        relatedTopics: p.relatedTopics ? JSON.stringify(p.relatedTopics) : null,
        visualSuggestions: p.visualSuggestions ? JSON.stringify(p.visualSuggestions) : null,
      };
    } catch (e) {
      // structured fields stay empty if not valid JSON
    }

    const updated = await req.prisma.blogOutline.update({
      where: { id: item.id },
      data: {
        outline,
        estimatedLength,
        seoScore,
        suggestions,
        status: 'completed',
        ...structuredFields,
      }
    });
    res.json(updated);
  } catch (error) {
    console.error('Error generating blog outline:', error);
    await req.prisma.blogOutline.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'failed' }
    });
    res.status(500).json({ error: 'Failed to generate outline' });
  }
});

// Update blog outline
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, topic, targetAudience, keywords, status } = req.body;
    const updated = await req.prisma.blogOutline.updateMany({
      where: { id: parseInt(req.params.id), userId: req.userId },
      data: { title, topic, targetAudience, keywords, status }
    });
    if (updated.count === 0) return res.status(404).json({ error: 'Outline not found' });
    const item = await req.prisma.blogOutline.findFirst({ where: { id: parseInt(req.params.id) } });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update blog outline' });
  }
});

// Bulk delete blog outlines
router.post('/bulk-delete', auth, async (req, res) => {
  try {
    const { ids } = req.body;
    const result = await req.prisma.blogOutline.deleteMany({
      where: { id: { in: ids }, userId: req.userId }
    });
    res.json({ message: `${result.count} outlines deleted` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk delete blog outlines' });
  }
});

// Bulk update blog outlines
router.post('/bulk-update', auth, async (req, res) => {
  try {
    const { ids, data } = req.body;
    const result = await req.prisma.blogOutline.updateMany({
      where: { id: { in: ids }, userId: req.userId },
      data
    });
    res.json({ message: `${result.count} outlines updated` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk update blog outlines' });
  }
});

// Delete outline
router.delete('/:id', auth, async (req, res) => {
  try {
    await req.prisma.blogOutline.deleteMany({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    res.json({ message: 'Outline deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete outline' });
  }
});

module.exports = router;
