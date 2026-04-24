const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generatePressRelease } = require('../services/openrouter');

// Get all press releases
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
        { companyName: { contains: search, mode: 'insensitive' } },
        { announcement: { contains: search, mode: 'insensitive' } },
        { headline: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      req.prisma.pressRelease.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limitNum
      }),
      req.prisma.pressRelease.count({ where })
    ]);

    res.json({ items, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    console.error('Error fetching press releases:', error);
    res.status(500).json({ error: 'Failed to fetch press releases' });
  }
});

// Export CSV
router.get('/export/csv', auth, async (req, res) => {
  try {
    const { generateCSV } = require('../utils/export');
    const items = await req.prisma.pressRelease.findMany({
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
    res.setHeader('Content-Disposition', `attachment; filename="press-releases-export.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// Export PDF
router.get('/export/pdf', auth, async (req, res) => {
  try {
    const { generatePDF } = require('../utils/export');
    const items = await req.prisma.pressRelease.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    const fields = [
      { label: 'ID', value: 'id' },
      { label: 'Title', value: 'title' },
      { label: 'Status', value: 'status' },
      { label: 'Created', value: 'createdAt' },
    ];
    const pdf = await generatePDF(items, 'Press Release Export', fields);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="press-releases-export.pdf"`);
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export PDF' });
  }
});

// Get single press release
router.get('/:id', auth, async (req, res) => {
  try {
    const item = await req.prisma.pressRelease.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!item) return res.status(404).json({ error: 'Press release not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch press release' });
  }
});

// Create press release request
router.post('/', auth, async (req, res) => {
  try {
    const { title, companyName, announcement, targetMedia } = req.body;
    const item = await req.prisma.pressRelease.create({
      data: {
        title,
        companyName,
        announcement,
        targetMedia,
        userId: req.userId,
        status: 'pending'
      }
    });
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating press release request:', error);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

// Generate press release
router.post('/:id/generate', auth, async (req, res) => {
  try {
    const item = await req.prisma.pressRelease.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!item) return res.status(404).json({ error: 'Request not found' });

    await req.prisma.pressRelease.update({
      where: { id: item.id },
      data: { status: 'processing' }
    });

    const result = await generatePressRelease(item.companyName, item.announcement, item.targetMedia);

    // Extract JSON from response (handles ```json ... ``` wrapping)
    let jsonStr = result.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();

    let content = result;
    let headline = '';
    let subheadline = '';
    let boilerplate = '';
    let contactInfo = '';
    let quotes = '';

    try {
      const parsed = JSON.parse(jsonStr);
      headline = parsed.headline || item.title;
      subheadline = parsed.subheadline || '';
      boilerplate = parsed.boilerplate || '';
      contactInfo = JSON.stringify(parsed.contactInfo || {});
      quotes = JSON.stringify(parsed.quotes || []);

      // Use the full release if available, otherwise build it
      if (parsed.fullRelease) {
        content = parsed.fullRelease;
      } else {
        content = `# ${headline}
${subheadline ? `## ${subheadline}` : ''}

---

**FOR IMMEDIATE RELEASE**

${parsed.dateline || 'CITY, State --'}

${parsed.leadParagraph || ''}

${(parsed.bodyParagraphs || []).join('\n\n')}

${parsed.quotes && parsed.quotes.length > 0 ? `
---
### Quotes

${parsed.quotes.map(q => `> "${q.quote}"
>
> — **${q.speaker}**`).join('\n\n')}
` : ''}

---

### About ${item.companyName}

${parsed.boilerplate || `${item.companyName} is a leading company in its industry.`}

---

### Media Contact

${parsed.contactInfo ? `
**${parsed.contactInfo.type || 'Media Contact'}**
${parsed.contactInfo.name || '[Name]'}
Email: ${parsed.contactInfo.email || '[email]'}
Phone: ${parsed.contactInfo.phone || '[phone]'}
` : '[Contact information]'}

---

## Distribution Notes

### Media Angle
${parsed.mediaAngle || 'This announcement represents a significant development in the industry.'}

### Target Publications
${(parsed.targetPublications || ['Industry publications', 'Business news outlets']).map(p => `- ${p}`).join('\n')}

### Follow-up Tips
${(parsed.followUpTips || ['Follow up within 48 hours', 'Prepare spokesperson for interviews']).map((t, i) => `${i + 1}. ${t}`).join('\n')}

### Social Media Teaser
${parsed.socialMediaTeaser || 'Exciting news from ' + item.companyName + '!'}

---

**###**`;
      }
    } catch (e) {
      // If JSON fails, format raw text nicely
      content = `# Press Release: ${item.title}\n\n> **Company:** ${item.companyName} | **Target:** ${item.targetMedia || 'General'}\n\n---\n\n${result}\n\n---\n*Press release for: "${item.companyName}"*`;
    }

    // Extract structured fields
    let structuredFields = {};
    try {
      const p = JSON.parse(jsonStr);
      structuredFields = {
        dateline: p.dateline || null,
        leadParagraph: p.leadParagraph || null,
        mediaAngle: p.mediaAngle || null,
        targetPublications: p.targetPublications ? JSON.stringify(p.targetPublications) : null,
        followUpTips: p.followUpTips ? JSON.stringify(p.followUpTips) : null,
        socialMediaTeaser: p.socialMediaTeaser || null,
      };
    } catch (e) {
      // structured fields stay empty if not valid JSON
    }

    const updated = await req.prisma.pressRelease.update({
      where: { id: item.id },
      data: {
        content,
        headline,
        subheadline,
        boilerplate,
        contactInfo,
        quotes,
        status: 'completed',
        ...structuredFields,
      }
    });
    res.json(updated);
  } catch (error) {
    console.error('Error generating press release:', error);
    await req.prisma.pressRelease.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'failed' }
    });
    res.status(500).json({ error: 'Failed to generate press release' });
  }
});

// Update press release
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, companyName, announcement, targetMedia, status } = req.body;
    const updated = await req.prisma.pressRelease.updateMany({
      where: { id: parseInt(req.params.id), userId: req.userId },
      data: { title, companyName, announcement, targetMedia, status }
    });
    if (updated.count === 0) return res.status(404).json({ error: 'Press release not found' });
    const item = await req.prisma.pressRelease.findFirst({ where: { id: parseInt(req.params.id) } });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update press release' });
  }
});

// Bulk delete press releases
router.post('/bulk-delete', auth, async (req, res) => {
  try {
    const { ids } = req.body;
    const result = await req.prisma.pressRelease.deleteMany({
      where: { id: { in: ids }, userId: req.userId }
    });
    res.json({ message: `${result.count} press releases deleted` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk delete press releases' });
  }
});

// Bulk update press releases
router.post('/bulk-update', auth, async (req, res) => {
  try {
    const { ids, data } = req.body;
    const result = await req.prisma.pressRelease.updateMany({
      where: { id: { in: ids }, userId: req.userId },
      data
    });
    res.json({ message: `${result.count} press releases updated` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk update press releases' });
  }
});

// Delete press release
router.delete('/:id', auth, async (req, res) => {
  try {
    await req.prisma.pressRelease.deleteMany({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    res.json({ message: 'Press release deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete press release' });
  }
});

module.exports = router;
