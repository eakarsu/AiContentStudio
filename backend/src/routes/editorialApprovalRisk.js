const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    summary: { drafts_reviewed: 42, approval_risk: 9, brand_voice_flags: 6, legal_flags: 3 },
    drafts: [
      { draft: 'Q3 product launch blog', channel: 'blog', risk: 'high', reason: 'unsupported performance claim', action: 'legal review' },
      { draft: 'Partner newsletter', channel: 'email', risk: 'medium', reason: 'off-brand tone', action: 'brand voice rewrite' },
      { draft: 'Short-form video script', channel: 'social', risk: 'low', reason: 'missing CTA', action: 'editor cleanup' },
    ],
  });
});

router.post('/score', (req, res) => {
  const { claims = 0, brandDeviation = 0 } = req.body || {};
  const score = Math.min(100, claims * 18 + brandDeviation * 10);
  res.json({ score, risk: score > 60 ? 'high' : score > 30 ? 'medium' : 'low' });
});

module.exports = router;
