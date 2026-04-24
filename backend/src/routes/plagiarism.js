const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { checkPlagiarism } = require('../services/openrouter');

// Get all plagiarism checks
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
      req.prisma.plagiarismCheck.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limitNum
      }),
      req.prisma.plagiarismCheck.count({ where })
    ]);

    res.json({ items, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    console.error('Error fetching plagiarism checks:', error);
    res.status(500).json({ error: 'Failed to fetch plagiarism checks' });
  }
});

// Export CSV
router.get('/export/csv', auth, async (req, res) => {
  try {
    const { generateCSV } = require('../utils/export');
    const items = await req.prisma.plagiarismCheck.findMany({
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
    res.setHeader('Content-Disposition', `attachment; filename="plagiarism-export.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// Export PDF
router.get('/export/pdf', auth, async (req, res) => {
  try {
    const { generatePDF } = require('../utils/export');
    const items = await req.prisma.plagiarismCheck.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    const fields = [
      { label: 'ID', value: 'id' },
      { label: 'Title', value: 'title' },
      { label: 'Status', value: 'status' },
      { label: 'Created', value: 'createdAt' },
    ];
    const pdf = await generatePDF(items, 'Plagiarism Check Export', fields);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="plagiarism-export.pdf"`);
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export PDF' });
  }
});

// Get single check
router.get('/:id', auth, async (req, res) => {
  try {
    const item = await req.prisma.plagiarismCheck.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!item) return res.status(404).json({ error: 'Check not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch check' });
  }
});

// Create plagiarism check
router.post('/', auth, async (req, res) => {
  try {
    const { title, content } = req.body;
    const item = await req.prisma.plagiarismCheck.create({
      data: {
        title,
        content,
        userId: req.userId,
        status: 'pending'
      }
    });
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating plagiarism check:', error);
    res.status(500).json({ error: 'Failed to create plagiarism check' });
  }
});

// Run plagiarism check
router.post('/:id/generate', auth, async (req, res) => {
  try {
    const item = await req.prisma.plagiarismCheck.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!item) return res.status(404).json({ error: 'Check not found' });

    await req.prisma.plagiarismCheck.update({
      where: { id: item.id },
      data: { status: 'processing' }
    });

    const result = await checkPlagiarism(item.content);

    // Extract JSON from response (handles ```json ... ``` wrapping)
    let jsonStr = result.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();

    // Parse the result
    let originalityScore = 85;
    let plagiarismScore = 15;
    let flaggedSections = '';
    let suggestions = '';
    let analysisReport = result;

    try {
      const parsed = JSON.parse(jsonStr);
      originalityScore = parsed.originalityScore || 85;
      plagiarismScore = parsed.plagiarismScore || 15;
      flaggedSections = JSON.stringify(parsed.flaggedSections || []);
      suggestions = JSON.stringify(parsed.improvements || []);

      // Create a professional readable report
      analysisReport = `# Originality Analysis Report

> **Originality Score:** ${originalityScore}% | **Plagiarism Risk:** ${plagiarismScore}%

---

## Overall Assessment

${parsed.analysis?.overallAssessment || 'Content appears to be original.'}

---

## Unique Elements

${(parsed.analysis?.uniqueElements || []).map((e, i) => `${i + 1}. ${e}`).join('\n')}

## Common Phrases Detected

${(parsed.analysis?.commonPhrases || []).length > 0 ? (parsed.analysis.commonPhrases).map(p => `- \`${p}\``).join('\n') : '- No common phrases detected'}

## Potential Concerns

${(parsed.analysis?.potentialConcerns || []).length > 0 ? (parsed.analysis.potentialConcerns).map(c => `- ${c}`).join('\n') : '- No significant concerns found'}

---

## Flagged Sections

${(parsed.flaggedSections || []).length > 0 ? (parsed.flaggedSections).map((s, i) => `### Section ${i + 1}

> "${s.text}"

- **Concern:** ${s.concern}
- **Suggestion:** ${s.suggestion}
`).join('\n') : '*No sections flagged - content appears original.*'}

---

## Recommendations for Improvement

${(parsed.improvements || []).map((imp, i) => `${i + 1}. ${imp}`).join('\n')}

---

## Style Analysis

| Aspect | Assessment |
|--------|-----------|
| **Readability** | ${parsed.styleAnalysis?.readability || 'Good'} |
| **Voice Consistency** | ${parsed.styleAnalysis?.voiceConsistency || 'Consistent'} |
| **Tone** | ${parsed.styleAnalysis?.toneAppropriate || 'Appropriate'} |

---

*Analysis completed for: "${item.title}"*`;
    } catch (e) {
      // If JSON fails, format raw text nicely
      analysisReport = `# Originality Analysis Report\n\n> **Content:** ${item.title}\n\n---\n\n${result}\n\n---\n*Analysis completed*`;
    }

    // Extract structured fields from parsed result
    let structuredFields = {};
    try {
      const p = JSON.parse(jsonStr);
      structuredFields = {
        overallAssessment: p.analysis?.overallAssessment || null,
        uniqueElements: p.analysis?.uniqueElements ? JSON.stringify(p.analysis.uniqueElements) : null,
        commonPhrases: p.analysis?.commonPhrases ? JSON.stringify(p.analysis.commonPhrases) : null,
        potentialConcerns: p.analysis?.potentialConcerns ? JSON.stringify(p.analysis.potentialConcerns) : null,
        readability: p.styleAnalysis?.readability || null,
        voiceConsistency: p.styleAnalysis?.voiceConsistency || null,
        toneAppropriate: p.styleAnalysis?.toneAppropriate || null,
      };
    } catch (e) {
      // structured fields stay empty if not valid JSON
    }

    const updated = await req.prisma.plagiarismCheck.update({
      where: { id: item.id },
      data: {
        originalityScore,
        plagiarismScore,
        analysisReport,
        flaggedSections,
        suggestions,
        status: 'completed',
        ...structuredFields,
      }
    });
    res.json(updated);
  } catch (error) {
    console.error('Error running plagiarism check:', error);
    await req.prisma.plagiarismCheck.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'failed' }
    });
    res.status(500).json({ error: 'Failed to run plagiarism check' });
  }
});

// Update plagiarism check
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, content, status } = req.body;
    const updated = await req.prisma.plagiarismCheck.updateMany({
      where: { id: parseInt(req.params.id), userId: req.userId },
      data: { title, content, status }
    });
    if (updated.count === 0) return res.status(404).json({ error: 'Check not found' });
    const item = await req.prisma.plagiarismCheck.findFirst({ where: { id: parseInt(req.params.id) } });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update plagiarism check' });
  }
});

// Bulk delete plagiarism checks
router.post('/bulk-delete', auth, async (req, res) => {
  try {
    const { ids } = req.body;
    const result = await req.prisma.plagiarismCheck.deleteMany({
      where: { id: { in: ids }, userId: req.userId }
    });
    res.json({ message: `${result.count} checks deleted` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk delete plagiarism checks' });
  }
});

// Bulk update plagiarism checks
router.post('/bulk-update', auth, async (req, res) => {
  try {
    const { ids, data } = req.body;
    const result = await req.prisma.plagiarismCheck.updateMany({
      where: { id: { in: ids }, userId: req.userId },
      data
    });
    res.json({ message: `${result.count} checks updated` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk update plagiarism checks' });
  }
});

// Delete check
router.delete('/:id', auth, async (req, res) => {
  try {
    await req.prisma.plagiarismCheck.deleteMany({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    res.json({ message: 'Check deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete check' });
  }
});

module.exports = router;
