/**
 * Custom Views — Studio Views
 *
 * Four endpoints powering frontend custom view widgets.
 *   GET  /api/custom-views/content-calendar      → month grid of scheduled posts per platform
 *   GET  /api/custom-views/engagement-metrics    → multi-line engagement over time
 *   POST /api/custom-views/content-brief         → PDF outline + keywords + CTAs
 *   GET  /api/custom-views/seo-keywords          → mock keyword research (volume, difficulty, related)
 *
 * Data is synthesized — no external dependencies.
 */
const express = require('express');
const PDFDocument = require('pdfkit');

const router = express.Router();

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
function seededRandom(seed) {
  let s = 0;
  for (let i = 0; i < seed.length; i += 1) s = (s * 31 + seed.charCodeAt(i)) | 0;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return (s & 0xffff) / 0xffff;
  };
}

const PLATFORMS = ['Instagram', 'LinkedIn', 'Twitter', 'TikTok', 'YouTube', 'Blog'];
const STATUSES = ['scheduled', 'published', 'draft', 'failed'];
const STATUS_COLORS = {
  scheduled: '#3b82f6',
  published: '#10b981',
  draft: '#f59e0b',
  failed: '#ef4444',
};

// -----------------------------------------------------------------------------
// VIZ 1 — Content Calendar
// -----------------------------------------------------------------------------
router.get('/content-calendar', (req, res) => {
  const now = new Date();
  const year = parseInt(req.query.year, 10) || now.getFullYear();
  const month = parseInt(req.query.month, 10) || now.getMonth(); // 0-indexed
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = firstOfMonth.toLocaleString('en-US', { month: 'long' });

  const rand = seededRandom(`cal-${year}-${month}`);
  const days = [];
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const postCount = Math.floor(rand() * 4); // 0-3 posts per day
    const posts = [];
    for (let i = 0; i < postCount; i += 1) {
      const platform = PLATFORMS[Math.floor(rand() * PLATFORMS.length)];
      const status = STATUSES[Math.floor(rand() * STATUSES.length)];
      posts.push({
        id: `p-${year}-${month}-${day}-${i}`,
        platform,
        status,
        color: STATUS_COLORS[status],
        title: `${platform} post #${i + 1}`,
        time: `${String(8 + i * 3).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`,
      });
    }
    days.push({
      day,
      date: date.toISOString().slice(0, 10),
      weekday: date.getDay(),
      posts,
    });
  }

  res.json({
    year,
    month,
    monthName,
    daysInMonth,
    firstWeekday: firstOfMonth.getDay(),
    statusLegend: STATUS_COLORS,
    days,
  });
});

// -----------------------------------------------------------------------------
// VIZ 2 — Engagement Chart
// -----------------------------------------------------------------------------
router.get('/engagement-metrics', (req, res) => {
  const days = parseInt(req.query.days, 10) || 30;
  const rand = seededRandom(`eng-${days}`);
  const data = [];
  const today = new Date();
  let likes = 200 + Math.floor(rand() * 100);
  let shares = 50 + Math.floor(rand() * 30);
  let comments = 30 + Math.floor(rand() * 20);
  let views = 1500 + Math.floor(rand() * 500);
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    likes = Math.max(50, likes + Math.floor((rand() - 0.45) * 60));
    shares = Math.max(10, shares + Math.floor((rand() - 0.45) * 25));
    comments = Math.max(5, comments + Math.floor((rand() - 0.45) * 20));
    views = Math.max(500, views + Math.floor((rand() - 0.45) * 400));
    data.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      likes,
      shares,
      comments,
      views,
    });
  }
  res.json({
    days,
    series: [
      { key: 'likes', label: 'Likes', color: '#6366f1' },
      { key: 'shares', label: 'Shares', color: '#10b981' },
      { key: 'comments', label: 'Comments', color: '#f59e0b' },
      { key: 'views', label: 'Views', color: '#ef4444' },
    ],
    data,
  });
});

// -----------------------------------------------------------------------------
// NON-VIZ 1 — Content Brief PDF
// -----------------------------------------------------------------------------
router.post('/content-brief', express.json(), (req, res) => {
  const {
    topic = 'Untitled Content Brief',
    audience = 'General audience',
    tone = 'Informative',
    length = 'Medium (1000-1500 words)',
  } = req.body || {};

  const rand = seededRandom(`${topic}-${audience}-${tone}`);
  const keywordRoots = [
    topic.toLowerCase(),
    `${topic} guide`,
    `${topic} tips`,
    `best ${topic}`,
    `${topic} for beginners`,
    `${topic} 2026`,
    `${topic} strategies`,
    `how to ${topic}`,
  ];
  const keywords = keywordRoots.slice(0, 6).map((k) => ({
    keyword: k,
    volume: 500 + Math.floor(rand() * 8000),
    difficulty: Math.floor(rand() * 100),
  }));

  const outline = [
    { heading: 'Introduction', notes: `Hook the ${audience} and set context for ${topic}.` },
    { heading: `Why ${topic} matters in 2026`, notes: 'Recent trends, stats, and stakes.' },
    { heading: `Core principles of ${topic}`, notes: '3-5 foundational ideas explained simply.' },
    { heading: `Step-by-step: applying ${topic}`, notes: 'Actionable walkthrough with examples.' },
    { heading: 'Common mistakes to avoid', notes: 'Pitfalls observed from real-world cases.' },
    { heading: 'Tools & resources', notes: 'Curated stack the reader can adopt today.' },
    { heading: 'Conclusion & next steps', notes: 'Recap value, invite the CTA action.' },
  ];

  const ctas = [
    `Subscribe to our newsletter for more on ${topic}.`,
    `Download our free ${topic} checklist.`,
    `Book a 1:1 consult to discuss ${topic} for your team.`,
    `Try our AI Content Studio free for 14 days.`,
  ];

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="content-brief-${Date.now()}.pdf"`
  );
  doc.pipe(res);

  doc.fontSize(22).fillColor('#4f46e5').text('Content Brief', { align: 'left' });
  doc.moveDown(0.3);
  doc.fontSize(16).fillColor('#111827').text(topic);
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('#6b7280').text(`Generated ${new Date().toLocaleString()}`);
  doc.moveDown(1);

  const meta = [
    ['Topic', topic],
    ['Audience', audience],
    ['Tone', tone],
    ['Length', length],
  ];
  doc.fontSize(11).fillColor('#111827');
  meta.forEach(([k, v]) => {
    doc.font('Helvetica-Bold').text(`${k}: `, { continued: true });
    doc.font('Helvetica').text(v);
  });
  doc.moveDown(0.8);

  doc.font('Helvetica-Bold').fontSize(14).fillColor('#4f46e5').text('Outline');
  doc.moveDown(0.3);
  doc.fontSize(11).fillColor('#111827');
  outline.forEach((section, idx) => {
    doc.font('Helvetica-Bold').text(`${idx + 1}. ${section.heading}`);
    doc.font('Helvetica').fillColor('#374151').text(`   ${section.notes}`);
    doc.fillColor('#111827');
    doc.moveDown(0.2);
  });
  doc.moveDown(0.6);

  doc.font('Helvetica-Bold').fontSize(14).fillColor('#4f46e5').text('Target Keywords');
  doc.moveDown(0.3);
  doc.fontSize(11).fillColor('#111827');
  keywords.forEach((kw) => {
    doc
      .font('Helvetica')
      .text(`  - ${kw.keyword}  (vol: ${kw.volume}, difficulty: ${kw.difficulty})`);
  });
  doc.moveDown(0.6);

  doc.font('Helvetica-Bold').fontSize(14).fillColor('#4f46e5').text('Calls to Action');
  doc.moveDown(0.3);
  doc.fontSize(11).fillColor('#111827');
  ctas.forEach((cta) => {
    doc.font('Helvetica').text(`  - ${cta}`);
  });

  doc.end();
});

// -----------------------------------------------------------------------------
// NON-VIZ 2 — SEO Keyword Research
// -----------------------------------------------------------------------------
router.get('/seo-keywords', (req, res) => {
  const seed = (req.query.seed || 'content marketing').toString().trim().toLowerCase();
  const rand = seededRandom(`seo-${seed}`);
  const modifiers = [
    '', ' guide', ' tips', ' strategy', ' tools', ' examples',
    ' for beginners', ' best practices', ' 2026', ' checklist',
    ' template', ' framework',
  ];
  const keywords = modifiers.map((m, idx) => {
    const keyword = `${seed}${m}`.trim();
    const volume = 100 + Math.floor(rand() * 12000);
    const difficulty = Math.floor(rand() * 100);
    const cpc = +(rand() * 8).toFixed(2);
    const trend = Math.floor((rand() - 0.5) * 40);
    return {
      id: idx + 1,
      keyword,
      volume,
      difficulty,
      cpc,
      trend,
      intent: ['informational', 'commercial', 'transactional', 'navigational'][idx % 4],
    };
  });
  res.json({
    seed,
    count: keywords.length,
    keywords,
  });
});

module.exports = router;
