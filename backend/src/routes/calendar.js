const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateContentCalendarSuggestions } = require('../services/openrouter');

// GET /api/calendar/week?start_date= — week view of scheduled content
router.get('/week', auth, async (req, res) => {
  try {
    const { start_date } = req.query;
    const start = start_date ? new Date(start_date) : new Date();
    // Normalize to start of day Monday
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(start.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const items = await req.prisma.contentCalendar.findMany({
      where: {
        userId: req.userId,
        scheduledDate: { gte: weekStart, lt: weekEnd }
      },
      orderBy: { scheduledDate: 'asc' }
    });

    // Group by day
    const days = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      days[key] = [];
    }
    items.forEach(item => {
      const key = new Date(item.scheduledDate).toISOString().split('T')[0];
      if (days[key]) days[key].push(item);
    });

    res.json({ week_start: weekStart.toISOString().split('T')[0], week_end: weekEnd.toISOString().split('T')[0], days });
  } catch (error) {
    console.error('Error fetching week view:', error);
    res.status(500).json({ error: 'Failed to fetch week view' });
  }
});

// POST /api/calendar/bulk-schedule — create multiple calendar entries at once
router.post('/bulk-schedule', auth, async (req, res) => {
  try {
    const { entries } = req.body;
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: 'entries must be a non-empty array' });
    }

    const created = [];
    const errors = [];

    for (const entry of entries) {
      const { content_id, platform, scheduled_at, title, contentType, topic } = entry;
      if (!scheduled_at) {
        errors.push({ entry, error: 'scheduled_at is required' });
        continue;
      }
      try {
        const item = await req.prisma.contentCalendar.create({
          data: {
            title: title || `Scheduled Content`,
            contentType: contentType || 'post',
            scheduledDate: new Date(scheduled_at),
            platform: platform || null,
            topic: topic || null,
            userId: req.userId,
            status: 'pending',
            ...(content_id ? { contentId: content_id } : {})
          }
        });
        created.push(item);
      } catch (e) {
        errors.push({ entry, error: e.message });
      }
    }

    res.status(201).json({
      created: created.length,
      items: created,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error bulk scheduling:', error);
    res.status(500).json({ error: 'Failed to bulk schedule content' });
  }
});

// Get all calendar items
router.get('/', auth, async (req, res) => {
  try {
    const { search, status, sortBy = 'scheduledDate', sortOrder = 'asc', page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = { userId: req.userId };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { topic: { contains: search, mode: 'insensitive' } },
        { platform: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      req.prisma.contentCalendar.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limitNum
      }),
      req.prisma.contentCalendar.count({ where })
    ]);

    res.json({ items, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    console.error('Error fetching calendar items:', error);
    res.status(500).json({ error: 'Failed to fetch calendar items' });
  }
});

// Export CSV
router.get('/export/csv', auth, async (req, res) => {
  try {
    const { generateCSV } = require('../utils/export');
    const items = await req.prisma.contentCalendar.findMany({
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
    res.setHeader('Content-Disposition', `attachment; filename="calendar-export.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// Export PDF
router.get('/export/pdf', auth, async (req, res) => {
  try {
    const { generatePDF } = require('../utils/export');
    const items = await req.prisma.contentCalendar.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    const fields = [
      { label: 'ID', value: 'id' },
      { label: 'Title', value: 'title' },
      { label: 'Status', value: 'status' },
      { label: 'Created', value: 'createdAt' },
    ];
    const pdf = await generatePDF(items, 'Content Calendar Export', fields);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="calendar-export.pdf"`);
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export PDF' });
  }
});

// Get single calendar item
router.get('/:id', auth, async (req, res) => {
  try {
    const item = await req.prisma.contentCalendar.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!item) return res.status(404).json({ error: 'Calendar item not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch calendar item' });
  }
});

// Create calendar item
router.post('/', auth, async (req, res) => {
  try {
    const { title, contentType, scheduledDate, platform, topic } = req.body;
    const item = await req.prisma.contentCalendar.create({
      data: {
        title,
        contentType,
        scheduledDate: new Date(scheduledDate),
        platform,
        topic,
        userId: req.userId,
        status: 'pending'
      }
    });
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating calendar item:', error);
    res.status(500).json({ error: 'Failed to create calendar item' });
  }
});

// Generate AI suggestions for calendar item
router.post('/:id/generate', auth, async (req, res) => {
  try {
    const item = await req.prisma.contentCalendar.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!item) return res.status(404).json({ error: 'Calendar item not found' });

    await req.prisma.contentCalendar.update({
      where: { id: item.id },
      data: { status: 'processing' }
    });

    const suggestions = await generateContentCalendarSuggestions(
      item.topic,
      item.contentType,
      item.platform,
      item.scheduledDate.toISOString()
    );

    // Extract JSON from response (handles ```json ... ``` wrapping)
    let jsonStr = suggestions.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();

    // Try to parse JSON, generate professional content
    let content = suggestions;
    let structuredFields = {};
    try {
      const parsed = JSON.parse(jsonStr);

      // Build professional markdown content
      content = `# ${parsed.title || item.title}

> **Content Type:** ${item.contentType} | **Platform:** ${item.platform || 'General'} | **Scheduled:** ${item.scheduledDate.toLocaleDateString()}

---

## Content Brief

${parsed.contentBrief || 'No content brief available.'}

---

## Key Points

${(parsed.keyPoints || []).map((p, i) => `${i + 1}. ${p}`).join('\n')}

---

## Content Hooks

${(parsed.contentHooks || []).map(h => `- ${h}`).join('\n')}

---

## Call to Action

> **${parsed.callToAction || 'Engage with your audience!'}**

---

## Posting Strategy

- **Best Time to Post:** ${parsed.bestTimeToPost || 'Check platform analytics'}
- **Tone & Style:** ${parsed.toneGuidance || 'Match your brand voice'}

## Hashtags

${(parsed.suggestedHashtags || []).map(h => `\`#${h.replace(/^#/, '')}\``).join('  ')}

## Visual Suggestions

${parsed.visualSuggestions || 'Use high-quality images that match your content theme.'}

## Related Topics

${(parsed.relatedTopics || []).map(t => `- ${t}`).join('\n')}

---

*AI Content Plan for: "${item.topic}" | Platform: ${item.platform || 'General'}*`;

      structuredFields = {
        contentBrief: parsed.contentBrief || null,
        keyPoints: parsed.keyPoints ? JSON.stringify(parsed.keyPoints) : null,
        suggestedHashtags: parsed.suggestedHashtags ? JSON.stringify(parsed.suggestedHashtags) : null,
        bestTimeToPost: parsed.bestTimeToPost || null,
        contentHooks: parsed.contentHooks ? JSON.stringify(parsed.contentHooks) : null,
        callToAction: parsed.callToAction || null,
        relatedTopics: parsed.relatedTopics ? JSON.stringify(parsed.relatedTopics) : null,
        visualSuggestions: parsed.visualSuggestions || null,
        toneGuidance: parsed.toneGuidance || null,
      };
    } catch (e) {
      // If JSON parsing fails, format the raw text nicely
      content = `# Content Plan: ${item.title}\n\n> **Topic:** ${item.topic} | **Type:** ${item.contentType} | **Platform:** ${item.platform || 'General'}\n\n---\n\n${suggestions}\n\n---\n*Generated for: "${item.topic}"*`;
    }

    const updated = await req.prisma.contentCalendar.update({
      where: { id: item.id },
      data: {
        content,
        aiSuggestions: suggestions,
        status: 'completed',
        ...structuredFields,
      }
    });
    res.json(updated);
  } catch (error) {
    console.error('Error generating calendar suggestions:', error);
    await req.prisma.contentCalendar.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'failed' }
    });
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

// Update calendar item
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, contentType, scheduledDate, platform, topic, status } = req.body;
    const updated = await req.prisma.contentCalendar.updateMany({
      where: { id: parseInt(req.params.id), userId: req.userId },
      data: { title, contentType, scheduledDate: new Date(scheduledDate), platform, topic, status }
    });
    if (updated.count === 0) return res.status(404).json({ error: 'Calendar item not found' });

    const item = await req.prisma.contentCalendar.findFirst({
      where: { id: parseInt(req.params.id) }
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update calendar item' });
  }
});

// Bulk delete calendar items
router.post('/bulk-delete', auth, async (req, res) => {
  try {
    const { ids } = req.body;
    const result = await req.prisma.contentCalendar.deleteMany({
      where: { id: { in: ids }, userId: req.userId }
    });
    res.json({ message: `${result.count} calendar items deleted` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk delete calendar items' });
  }
});

// Bulk update calendar items
router.post('/bulk-update', auth, async (req, res) => {
  try {
    const { ids, data } = req.body;
    const result = await req.prisma.contentCalendar.updateMany({
      where: { id: { in: ids }, userId: req.userId },
      data
    });
    res.json({ message: `${result.count} calendar items updated` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk update calendar items' });
  }
});

// Delete calendar item
router.delete('/:id', auth, async (req, res) => {
  try {
    await req.prisma.contentCalendar.deleteMany({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    res.json({ message: 'Calendar item deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete calendar item' });
  }
});

module.exports = router;
