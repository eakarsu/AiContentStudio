const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generatePressRelease, generateText } = require('../services/openrouter');

// Helper: snapshot a content item into ContentVersion
async function createVersionSnapshot(prisma, contentType, contentId, data, userId) {
  const last = await prisma.contentVersion.findFirst({
    where: { contentType, contentId },
    orderBy: { version: 'desc' },
    select: { version: true }
  });
  const version = (last?.version ?? 0) + 1;
  await prisma.contentVersion.create({
    data: { contentType, contentId, version, data, userId }
  });
}

// POST /api/press-releases/generate — one-shot generate without pre-creating a record
router.post('/generate', auth, async (req, res) => {
  try {
    const { company, product, announcement, tone, targetAudience } = req.body;
    if (!company || !announcement) {
      return res.status(400).json({ error: 'company and announcement are required' });
    }

    // Create a pending record first so we have an id
    const item = await req.prisma.pressRelease.create({
      data: {
        title: `${company} — ${announcement.slice(0, 60)}`,
        companyName: company,
        product: product || null,
        announcement,
        tone: tone || 'professional',
        targetAudience: targetAudience || null,
        userId: req.userId,
        status: 'processing'
      }
    });

    // Build enhanced prompt using tone & audience
    const systemPrompt = `You are a senior PR professional writing press releases in a ${tone || 'professional'} tone for ${targetAudience || 'general business audiences'}. Always respond with valid JSON only.`;
    const userPrompt = `Create a professional press release for:
Company: "${company}"
${product ? `Product/Service: "${product}"` : ''}
Announcement: "${announcement}"
Tone: ${tone || 'professional'}
Target Audience: ${targetAudience || 'general business press'}

Respond with this JSON structure:
{
  "headline": "Attention-grabbing headline (max 100 chars)",
  "subheadline": "Supporting subheadline",
  "dateline": "CITY, State -- Date --",
  "leadParagraph": "Who, what, when, where, why in first paragraph",
  "bodyParagraphs": ["Paragraph 2", "Paragraph 3", "Paragraph 4"],
  "quotes": [{"speaker": "Name, Title at Company", "quote": "Statement"}],
  "boilerplate": "About ${company} — standard company description",
  "contactInfo": {"type": "Media Contact", "name": "[Contact Name]", "email": "[email@company.com]", "phone": "[+1-555-000-0000]"},
  "fullRelease": "Complete formatted press release ready to distribute",
  "mediaAngle": "The newsworthy story angle",
  "targetPublications": ["Publication 1", "Publication 2", "Publication 3"],
  "followUpTips": ["Tip 1", "Tip 2"],
  "socialMediaTeaser": "Short teaser for social media (280 chars)"
}`;

    const result = await generateText(userPrompt, {
      systemPrompt,
      maxTokens: 3500,
      temperature: 0.6
    });

    let content = result;
    let headline = item.title;
    let subheadline = '';
    let boilerplate = '';
    let contactInfo = '';
    let quotes = '';
    let structuredFields = {};

    let jsonStr = result.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();

    try {
      const parsed = JSON.parse(jsonStr);
      headline = parsed.headline || item.title;
      subheadline = parsed.subheadline || '';
      boilerplate = parsed.boilerplate || '';
      contactInfo = JSON.stringify(parsed.contactInfo || {});
      quotes = JSON.stringify(parsed.quotes || []);

      if (parsed.fullRelease) {
        content = parsed.fullRelease;
      } else {
        content = `# ${headline}\n${subheadline ? `## ${subheadline}\n` : ''}\n---\n\n**FOR IMMEDIATE RELEASE**\n\n${parsed.dateline || ''}\n\n${parsed.leadParagraph || ''}\n\n${(parsed.bodyParagraphs || []).join('\n\n')}\n\n---\n\n### About ${company}\n\n${parsed.boilerplate || ''}\n\n---\n\n### Media Contact\n\n${parsed.contactInfo ? `**${parsed.contactInfo.name || '[Name]'}**\nEmail: ${parsed.contactInfo.email || '[email]'}\nPhone: ${parsed.contactInfo.phone || '[phone]'}` : '[Contact information]'}\n\n---\n\n**###**`;
      }

      structuredFields = {
        dateline: parsed.dateline || null,
        leadParagraph: parsed.leadParagraph || null,
        mediaAngle: parsed.mediaAngle || null,
        targetPublications: parsed.targetPublications ? JSON.stringify(parsed.targetPublications) : null,
        followUpTips: parsed.followUpTips ? JSON.stringify(parsed.followUpTips) : null,
        socialMediaTeaser: parsed.socialMediaTeaser || null,
      };
    } catch (e) {
      content = `# Press Release: ${item.title}\n\n> **Company:** ${company}${product ? ` | **Product:** ${product}` : ''} | **Tone:** ${tone || 'professional'}\n\n---\n\n${result}\n\n---\n*Press release for: "${company}"*`;
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
        ...structuredFields
      }
    });

    res.status(201).json(updated);
  } catch (error) {
    console.error('Error in press release generate:', error);
    res.status(500).json({ error: 'Failed to generate press release' });
  }
});

// GET /api/press-releases — paginated list with search
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

// Update press release (saves version snapshot before overwrite)
router.put('/:id', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, companyName, announcement, targetMedia, tone, targetAudience, product, status, content } = req.body;

    const existing = await req.prisma.pressRelease.findFirst({
      where: { id, userId: req.userId }
    });
    if (!existing) return res.status(404).json({ error: 'Press release not found' });

    // Snapshot current state before overwriting
    await createVersionSnapshot(req.prisma, 'pressRelease', id, existing, req.userId);

    const updated = await req.prisma.pressRelease.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(companyName !== undefined && { companyName }),
        ...(announcement !== undefined && { announcement }),
        ...(targetMedia !== undefined && { targetMedia }),
        ...(tone !== undefined && { tone }),
        ...(targetAudience !== undefined && { targetAudience }),
        ...(product !== undefined && { product }),
        ...(status !== undefined && { status }),
        ...(content !== undefined && { content }),
      }
    });
    res.json(updated);
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

// GET /api/press-releases/:id/versions — list all versions
router.get('/:id/versions', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Verify ownership
    const item = await req.prisma.pressRelease.findFirst({ where: { id, userId: req.userId } });
    if (!item) return res.status(404).json({ error: 'Press release not found' });

    const versions = await req.prisma.contentVersion.findMany({
      where: { contentType: 'pressRelease', contentId: id },
      orderBy: { version: 'desc' }
    });
    res.json(versions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch versions' });
  }
});

// POST /api/press-releases/:id/versions/:versionId/restore — restore a version
router.post('/:id/versions/:versionId/restore', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const versionId = parseInt(req.params.versionId);

    const item = await req.prisma.pressRelease.findFirst({ where: { id, userId: req.userId } });
    if (!item) return res.status(404).json({ error: 'Press release not found' });

    const versionRecord = await req.prisma.contentVersion.findFirst({
      where: { id: versionId, contentType: 'pressRelease', contentId: id }
    });
    if (!versionRecord) return res.status(404).json({ error: 'Version not found' });

    // Snapshot current state before restore
    await createVersionSnapshot(req.prisma, 'pressRelease', id, item, req.userId);

    // Restore — strip system fields that should not be overwritten
    const { id: _id, userId: _uid, createdAt: _ca, updatedAt: _ua, ...restoreData } = versionRecord.data;
    const restored = await req.prisma.pressRelease.update({
      where: { id },
      data: restoreData
    });
    res.json({ message: 'Version restored', item: restored });
  } catch (error) {
    res.status(500).json({ error: 'Failed to restore version' });
  }
});

module.exports = router;
