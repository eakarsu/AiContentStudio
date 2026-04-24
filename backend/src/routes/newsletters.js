const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateNewsletter } = require('../services/openrouter');

// Get all newsletters
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
        { subject: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      req.prisma.newsletter.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limitNum
      }),
      req.prisma.newsletter.count({ where })
    ]);

    res.json({ items, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    console.error('Error fetching newsletters:', error);
    res.status(500).json({ error: 'Failed to fetch newsletters' });
  }
});

// Export CSV
router.get('/export/csv', auth, async (req, res) => {
  try {
    const { generateCSV } = require('../utils/export');
    const items = await req.prisma.newsletter.findMany({
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
    res.setHeader('Content-Disposition', `attachment; filename="newsletters-export.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// Export PDF
router.get('/export/pdf', auth, async (req, res) => {
  try {
    const { generatePDF } = require('../utils/export');
    const items = await req.prisma.newsletter.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    const fields = [
      { label: 'ID', value: 'id' },
      { label: 'Title', value: 'title' },
      { label: 'Status', value: 'status' },
      { label: 'Created', value: 'createdAt' },
    ];
    const pdf = await generatePDF(items, 'Newsletter Export', fields);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="newsletters-export.pdf"`);
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export PDF' });
  }
});

// Get single newsletter
router.get('/:id', auth, async (req, res) => {
  try {
    const item = await req.prisma.newsletter.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!item) return res.status(404).json({ error: 'Newsletter not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch newsletter' });
  }
});

// Create newsletter request
router.post('/', auth, async (req, res) => {
  try {
    const { title, topic, audience, frequency } = req.body;
    const item = await req.prisma.newsletter.create({
      data: {
        title,
        topic,
        audience,
        frequency,
        userId: req.userId,
        status: 'pending'
      }
    });
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating newsletter request:', error);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

// Generate newsletter
router.post('/:id/generate', auth, async (req, res) => {
  try {
    const item = await req.prisma.newsletter.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!item) return res.status(404).json({ error: 'Request not found' });

    await req.prisma.newsletter.update({
      where: { id: item.id },
      data: { status: 'processing' }
    });

    const result = await generateNewsletter(item.topic, item.audience, item.frequency);

    // Extract JSON from response (handles ```json ... ``` wrapping)
    let jsonStr = result.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();

    let content = result;
    let subject = '';
    let preheader = '';
    let sections = '';
    let callToAction = '';

    try {
      const parsed = JSON.parse(jsonStr);
      subject = parsed.subject || `Newsletter: ${item.topic}`;
      preheader = parsed.preheader || '';
      sections = JSON.stringify(parsed.sections || []);
      callToAction = parsed.sections?.find(s => s.type === 'cta')?.content || '';

      // Use the full content if available, otherwise build from sections
      if (parsed.fullContent) {
        content = parsed.fullContent;
      } else {
        content = `## ${item.title}

**Subject Line:** ${subject}
**Preview Text:** ${preheader}

---

${(parsed.sections || []).map(section => {
  switch(section.type) {
    case 'header':
      return `### Welcome\n${section.content}`;
    case 'featured':
      return `## Featured: ${section.title}\n${section.content}\n\n**[${section.cta}]**`;
    case 'quickBites':
      return `## Quick Bites\n${(section.items || []).map(item => `
### ${item.title}
${item.summary}
[${item.link}]
`).join('\n')}`;
    case 'tips':
      return `## ${section.title}\n${(section.tips || []).map((t, i) => `${i + 1}. ${t}`).join('\n')}`;
    case 'cta':
      return `---\n## Take Action\n${section.content}`;
    case 'footer':
      return `---\n${section.content}`;
    default:
      return section.content || '';
  }
}).join('\n\n')}

---

### Alternative Subject Lines
${(parsed.alternativeSubjectLines || []).map((s, i) => `${i + 1}. ${s}`).join('\n')}

### Best Time to Send
${parsed.sendTimeSuggestion || 'Tuesday or Thursday morning, 9-10 AM'}

### Target Segment
${parsed.segmentationSuggestion || 'All subscribers'}`;
      }
    } catch (e) {
      // If JSON fails, format raw text nicely
      content = `# Newsletter: ${item.title}\n\n> **Topic:** ${item.topic} | **Audience:** ${item.audience || 'Subscribers'} | **Frequency:** ${item.frequency || 'Weekly'}\n\n---\n\n${result}\n\n---\n*Generated for: "${item.topic}"*`;
    }

    // Extract structured fields
    let structuredFields = {};
    try {
      const p = JSON.parse(jsonStr);
      structuredFields = {
        alternativeSubjectLines: p.alternativeSubjectLines ? JSON.stringify(p.alternativeSubjectLines) : null,
        sendTimeSuggestion: p.sendTimeSuggestion || null,
        segmentationSuggestion: p.segmentationSuggestion || null,
      };
    } catch (e) {
      // structured fields stay empty if not valid JSON
    }

    const updated = await req.prisma.newsletter.update({
      where: { id: item.id },
      data: {
        content,
        subject,
        preheader,
        sections,
        callToAction,
        status: 'completed',
        ...structuredFields,
      }
    });
    res.json(updated);
  } catch (error) {
    console.error('Error generating newsletter:', error);
    await req.prisma.newsletter.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'failed' }
    });
    res.status(500).json({ error: 'Failed to generate newsletter' });
  }
});

// Update newsletter
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, topic, audience, frequency, status } = req.body;
    const updated = await req.prisma.newsletter.updateMany({
      where: { id: parseInt(req.params.id), userId: req.userId },
      data: { title, topic, audience, frequency, status }
    });
    if (updated.count === 0) return res.status(404).json({ error: 'Newsletter not found' });
    const item = await req.prisma.newsletter.findFirst({ where: { id: parseInt(req.params.id) } });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update newsletter' });
  }
});

// Bulk delete newsletters
router.post('/bulk-delete', auth, async (req, res) => {
  try {
    const { ids } = req.body;
    const result = await req.prisma.newsletter.deleteMany({
      where: { id: { in: ids }, userId: req.userId }
    });
    res.json({ message: `${result.count} newsletters deleted` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk delete newsletters' });
  }
});

// Bulk update newsletters
router.post('/bulk-update', auth, async (req, res) => {
  try {
    const { ids, data } = req.body;
    const result = await req.prisma.newsletter.updateMany({
      where: { id: { in: ids }, userId: req.userId },
      data
    });
    res.json({ message: `${result.count} newsletters updated` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk update newsletters' });
  }
});

// Delete newsletter
router.delete('/:id', auth, async (req, res) => {
  try {
    await req.prisma.newsletter.deleteMany({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    res.json({ message: 'Newsletter deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete newsletter' });
  }
});

module.exports = router;
