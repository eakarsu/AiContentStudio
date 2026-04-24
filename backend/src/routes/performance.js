const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { predictContentPerformance } = require('../services/openrouter');

// Get all predictions
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
      req.prisma.performancePrediction.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limitNum
      }),
      req.prisma.performancePrediction.count({ where })
    ]);

    res.json({ items, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    console.error('Error fetching predictions:', error);
    res.status(500).json({ error: 'Failed to fetch predictions' });
  }
});

// Export CSV
router.get('/export/csv', auth, async (req, res) => {
  try {
    const { generateCSV } = require('../utils/export');
    const items = await req.prisma.performancePrediction.findMany({
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
    res.setHeader('Content-Disposition', `attachment; filename="performance-export.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// Export PDF
router.get('/export/pdf', auth, async (req, res) => {
  try {
    const { generatePDF } = require('../utils/export');
    const items = await req.prisma.performancePrediction.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    const fields = [
      { label: 'ID', value: 'id' },
      { label: 'Title', value: 'title' },
      { label: 'Status', value: 'status' },
      { label: 'Created', value: 'createdAt' },
    ];
    const pdf = await generatePDF(items, 'Performance Prediction Export', fields);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="performance-export.pdf"`);
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export PDF' });
  }
});

// Get single prediction
router.get('/:id', auth, async (req, res) => {
  try {
    const item = await req.prisma.performancePrediction.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!item) return res.status(404).json({ error: 'Prediction not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch prediction' });
  }
});

// Create prediction request
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, contentType, platform } = req.body;
    const item = await req.prisma.performancePrediction.create({
      data: {
        title,
        content,
        contentType,
        platform,
        userId: req.userId,
        status: 'pending'
      }
    });
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating prediction request:', error);
    res.status(500).json({ error: 'Failed to create prediction request' });
  }
});

// Generate prediction
router.post('/:id/generate', auth, async (req, res) => {
  try {
    const item = await req.prisma.performancePrediction.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!item) return res.status(404).json({ error: 'Request not found' });

    await req.prisma.performancePrediction.update({
      where: { id: item.id },
      data: { status: 'processing' }
    });

    const result = await predictContentPerformance(item.content, item.contentType, item.platform);

    // Extract JSON from response (handles ```json ... ``` wrapping)
    let jsonStr = result.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();

    let predictedScore = 75;
    let viralityScore = 50;
    let engagementPrediction = '';
    let recommendations = '';
    let analysisDetails = result;

    try {
      const parsed = JSON.parse(jsonStr);
      predictedScore = parsed.overallScore || 75;
      viralityScore = parsed.viralityScore || 50;
      engagementPrediction = JSON.stringify(parsed.engagementPrediction || {});
      recommendations = JSON.stringify(parsed.improvements || []);

      // Create professional readable analysis
      analysisDetails = `# Performance Prediction Report

> **Performance Score:** ${predictedScore}/100 | **Virality Potential:** ${viralityScore}/100

---

## Engagement Predictions

| Metric | Estimate |
|--------|----------|
| **Likes** | ${parsed.engagementPrediction?.estimatedLikes || 'N/A'} |
| **Shares** | ${parsed.engagementPrediction?.estimatedShares || 'N/A'} |
| **Comments** | ${parsed.engagementPrediction?.estimatedComments || 'N/A'} |
| **Reach** | ${parsed.engagementPrediction?.estimatedReach || 'N/A'} |

---

## Strengths

${(parsed.strengthAnalysis || []).map((s, i) => `### ${i + 1}. ${s.element} (Score: ${s.score}/100)

${s.impact}
`).join('\n')}

---

## Areas for Improvement

${(parsed.weaknessAnalysis || []).map((w, i) => `### ${i + 1}. ${w.element}

- **Impact:** ${w.impact}
- **Suggestion:** ${w.suggestion}
`).join('\n')}

---

## Audience Appeal

- **Primary Audience:** ${parsed.audienceAppeal?.primaryAudience || 'General'}
- **Secondary Audience:** ${parsed.audienceAppeal?.secondaryAudience || 'None specified'}
- **Emotional Triggers:** ${(parsed.audienceAppeal?.emotionalTriggers || []).map(t => `\`${t}\``).join(', ')}

---

## Optimal Posting Times

- **Best Days:** ${(parsed.timingRecommendations?.bestDays || []).join(', ')}
- **Best Times:** ${(parsed.timingRecommendations?.bestTimes || []).join(', ')}
- **Seasonality:** ${parsed.timingRecommendations?.seasonality || 'None'}

---

## Competitive Analysis

${parsed.competitiveAnalysis || 'This content is competitive with similar posts in your niche.'}

---

## Priority Improvements

${(parsed.improvements || []).map((imp, i) => `${i + 1}. **${imp.suggestion}** — \`${(imp.priority || 'medium').toUpperCase()}\`
   - Expected Impact: ${imp.expectedImpact || 'Moderate improvement'}
`).join('\n')}

---

## Suggested Hashtags

${(parsed.hashtagSuggestions || []).map(h => `\`#${h.replace(/^#/, '')}\``).join('  ')}

## Alternative Headlines

${(parsed.headlineAlternatives || []).map((h, i) => `${i + 1}. ${h}`).join('\n')}

---

*Performance analysis for: "${item.title}" | Platform: ${item.platform || 'General'} | Type: ${item.contentType}*`;
    } catch (e) {
      // If JSON fails, format raw text nicely
      analysisDetails = `# Performance Prediction Report\n\n> **Content:** ${item.title} | **Platform:** ${item.platform || 'General'}\n\n---\n\n${result}\n\n---\n*Analysis completed*`;
    }

    // Extract structured fields
    let structuredFields = {};
    try {
      const p = JSON.parse(jsonStr);
      structuredFields = {
        strengthAnalysis: p.strengthAnalysis ? JSON.stringify(p.strengthAnalysis) : null,
        weaknessAnalysis: p.weaknessAnalysis ? JSON.stringify(p.weaknessAnalysis) : null,
        audienceAppeal: p.audienceAppeal ? JSON.stringify(p.audienceAppeal) : null,
        timingRecommendations: p.timingRecommendations ? JSON.stringify(p.timingRecommendations) : null,
        competitiveAnalysis: p.competitiveAnalysis || null,
        hashtagSuggestions: p.hashtagSuggestions ? JSON.stringify(p.hashtagSuggestions) : null,
        headlineAlternatives: p.headlineAlternatives ? JSON.stringify(p.headlineAlternatives) : null,
      };
    } catch (e) {
      // structured fields stay empty if not valid JSON
    }

    const updated = await req.prisma.performancePrediction.update({
      where: { id: item.id },
      data: {
        predictedScore,
        viralityScore,
        engagementPrediction,
        recommendations,
        analysisDetails,
        status: 'completed',
        ...structuredFields,
      }
    });
    res.json(updated);
  } catch (error) {
    console.error('Error generating prediction:', error);
    await req.prisma.performancePrediction.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'failed' }
    });
    res.status(500).json({ error: 'Failed to generate prediction' });
  }
});

// Update performance prediction
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, content, contentType, platform, status } = req.body;
    const updated = await req.prisma.performancePrediction.updateMany({
      where: { id: parseInt(req.params.id), userId: req.userId },
      data: { title, content, contentType, platform, status }
    });
    if (updated.count === 0) return res.status(404).json({ error: 'Prediction not found' });
    const item = await req.prisma.performancePrediction.findFirst({ where: { id: parseInt(req.params.id) } });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update prediction' });
  }
});

// Bulk delete predictions
router.post('/bulk-delete', auth, async (req, res) => {
  try {
    const { ids } = req.body;
    const result = await req.prisma.performancePrediction.deleteMany({
      where: { id: { in: ids }, userId: req.userId }
    });
    res.json({ message: `${result.count} predictions deleted` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk delete predictions' });
  }
});

// Bulk update predictions
router.post('/bulk-update', auth, async (req, res) => {
  try {
    const { ids, data } = req.body;
    const result = await req.prisma.performancePrediction.updateMany({
      where: { id: { in: ids }, userId: req.userId },
      data
    });
    res.json({ message: `${result.count} predictions updated` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk update predictions' });
  }
});

// Delete prediction
router.delete('/:id', auth, async (req, res) => {
  try {
    await req.prisma.performancePrediction.deleteMany({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    res.json({ message: 'Prediction deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete prediction' });
  }
});

module.exports = router;
