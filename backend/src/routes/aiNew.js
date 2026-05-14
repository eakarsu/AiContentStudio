const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateText } = require('../services/openrouter');

const MODEL = 'anthropic/claude-3-5-sonnet-20241022';

// POST /api/ai/content-cluster
// {topic, num_pieces} → pillar page + supporting articles + social posts plan
router.post('/content-cluster', auth, async (req, res) => {
  try {
    const { topic, num_pieces = 5 } = req.body;
    if (!topic) return res.status(400).json({ error: 'topic is required' });

    const numPieces = Math.min(Math.max(parseInt(num_pieces) || 5, 2), 20);

    const prompt = `Create a comprehensive content cluster plan for the topic: "${topic}"

Generate a plan with ${numPieces} total content pieces including:
1. One pillar page (comprehensive guide)
2. ${numPieces - 1} supporting articles targeting specific subtopics
3. A social posts plan for each piece

Respond with this exact JSON structure:
{
  "topic": "${topic}",
  "clusterOverview": "Brief description of the content cluster strategy",
  "pillarPage": {
    "title": "Pillar page title",
    "targetKeyword": "Primary keyword",
    "outline": ["Section 1", "Section 2", "Section 3", "Section 4", "Section 5"],
    "wordCount": 3000,
    "metaDescription": "SEO meta description",
    "internalLinkOpportunities": ["Link opportunity 1", "Link opportunity 2"]
  },
  "supportingArticles": [
    {
      "title": "Article title",
      "targetKeyword": "Keyword",
      "angle": "Unique angle or perspective",
      "outline": ["Section 1", "Section 2", "Section 3"],
      "wordCount": 1200,
      "linksToPillar": true
    }
  ],
  "socialPostsPlan": [
    {
      "contentTitle": "Which piece this is for",
      "platforms": {
        "twitter": "Tweet text (280 chars max)",
        "linkedin": "LinkedIn post (150 words)",
        "instagram": "Instagram caption with hashtags"
      }
    }
  ],
  "publishingSchedule": "Recommended publishing order and cadence",
  "seoStrategy": "Internal linking and SEO strategy for the cluster"
}`;

    const result = await generateText(prompt, {
      model: MODEL,
      maxTokens: 4000,
      temperature: 0.7,
      systemPrompt: 'You are a content strategy expert specializing in SEO content clusters. Always respond with valid JSON only.'
    });

    let parsed;
    try {
      let jsonStr = result.trim();
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonStr = jsonMatch[1].trim();
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      return res.json({ raw: result, topic, num_pieces: numPieces });
    }

    res.json(parsed);
  } catch (error) {
    console.error('Content cluster error:', error);
    res.status(500).json({ error: 'Failed to generate content cluster' });
  }
});

// POST /api/ai/repurpose-video
// {video_transcript} → blog post, LinkedIn article, tweet thread, email newsletter
router.post('/repurpose-video', auth, async (req, res) => {
  try {
    const { video_transcript, video_title } = req.body;
    if (!video_transcript) return res.status(400).json({ error: 'video_transcript is required' });

    const prompt = `Repurpose this video transcript into 4 different content formats.

Video Title: ${video_title || 'Untitled Video'}
Transcript:
${video_transcript.slice(0, 6000)}

Generate all 4 formats and respond with this exact JSON structure:
{
  "videoTitle": "${video_title || 'Untitled Video'}",
  "blogPost": {
    "title": "SEO-optimized blog post title",
    "metaDescription": "150-character meta description",
    "content": "Full blog post in markdown format (600-900 words)",
    "tags": ["tag1", "tag2", "tag3"]
  },
  "linkedinArticle": {
    "title": "LinkedIn article headline",
    "hook": "First 2 sentences to grab attention",
    "content": "Full LinkedIn article (400-600 words, professional tone)",
    "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
  },
  "tweetThread": {
    "tweets": [
      "Tweet 1 (hook, max 280 chars) 1/N",
      "Tweet 2 (key point, max 280 chars) 2/N",
      "Tweet 3 (key point, max 280 chars) 3/N",
      "Tweet 4 (key point, max 280 chars) 4/N",
      "Tweet 5 (CTA, max 280 chars) 5/N"
    ]
  },
  "emailNewsletter": {
    "subject": "Email subject line",
    "preheader": "Preheader text (90 chars)",
    "body": "Full email newsletter in markdown (300-500 words)",
    "cta": "Call to action button text",
    "ctaLink": "[link placeholder]"
  },
  "keyTakeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3"],
  "seoKeywords": ["keyword1", "keyword2", "keyword3"]
}`;

    const result = await generateText(prompt, {
      model: MODEL,
      maxTokens: 4000,
      temperature: 0.7,
      systemPrompt: 'You are a content repurposing expert. Transform video content into multiple high-quality written formats. Always respond with valid JSON only.'
    });

    let parsed;
    try {
      let jsonStr = result.trim();
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonStr = jsonMatch[1].trim();
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      return res.json({ raw: result });
    }

    res.json(parsed);
  } catch (error) {
    console.error('Repurpose video error:', error);
    res.status(500).json({ error: 'Failed to repurpose video transcript' });
  }
});

// POST /api/ai/brand-story
// {company_info, target_audience, key_values[]} → brand narrative in 5 formats
router.post('/brand-story', auth, async (req, res) => {
  try {
    const { company_info, target_audience, key_values = [] } = req.body;
    if (!company_info) return res.status(400).json({ error: 'company_info is required' });

    const prompt = `Create a compelling brand story and narrative for a company in 5 different formats.

Company Info: ${company_info}
Target Audience: ${target_audience || 'General consumers'}
Key Values: ${Array.isArray(key_values) ? key_values.join(', ') : key_values}

Generate all 5 brand narrative formats and respond with this exact JSON structure:
{
  "brandEssence": "One-sentence distillation of the brand",
  "formats": {
    "elevatorPitch": {
      "name": "30-Second Elevator Pitch",
      "content": "Compelling 75-word brand story for networking events",
      "useCase": "In-person networking, quick introductions"
    },
    "websiteAbout": {
      "name": "Website About Us",
      "headline": "Engaging headline",
      "content": "Full About Us page copy (250-350 words)",
      "useCase": "Website About page, press kit"
    },
    "socialBio": {
      "name": "Social Media Bio",
      "twitter": "Twitter/X bio (160 chars max)",
      "instagram": "Instagram bio (150 chars max)",
      "linkedin": "LinkedIn company description (200 words)",
      "useCase": "Social media profiles"
    },
    "investorNarrative": {
      "name": "Investor/Stakeholder Narrative",
      "content": "Professional narrative emphasizing market opportunity and mission (400-500 words)",
      "useCase": "Pitch decks, investor meetings, annual reports"
    },
    "customerStory": {
      "name": "Customer-Facing Brand Story",
      "content": "Emotional, benefit-focused story from customer perspective (300-400 words)",
      "useCase": "Marketing materials, landing pages, brochures"
    }
  },
  "brandVoiceGuide": {
    "tone": "Description of brand voice and tone",
    "wordsToUse": ["word1", "word2", "word3"],
    "wordsToAvoid": ["word1", "word2", "word3"],
    "personalityTraits": ["trait1", "trait2", "trait3"]
  },
  "taglines": ["Tagline option 1", "Tagline option 2", "Tagline option 3"]
}`;

    const result = await generateText(prompt, {
      model: MODEL,
      maxTokens: 4000,
      temperature: 0.8,
      systemPrompt: 'You are a brand strategist and storytelling expert. Create authentic, compelling brand narratives that resonate with target audiences. Always respond with valid JSON only.'
    });

    let parsed;
    try {
      let jsonStr = result.trim();
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonStr = jsonMatch[1].trim();
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      return res.json({ raw: result });
    }

    res.json(parsed);
  } catch (error) {
    console.error('Brand story error:', error);
    res.status(500).json({ error: 'Failed to generate brand story' });
  }
});

// ============================================================================
// Apply pass 4 (mechanical) — canonical /api/ai/* counterparts
// Each route 503s when OPENROUTER_API_KEY is missing.
// ============================================================================

function ensureApiKeyOr503(res) {
  const k = process.env.OPENROUTER_API_KEY;
  if (!k || k === 'your-openrouter-api-key-here') {
    res.status(503).json({ error: 'OPENROUTER_API_KEY not configured' });
    return false;
  }
  return true;
}

function tryParseJson(raw) {
  if (!raw) return null;
  let s = String(raw).trim();
  const m = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (m) s = m[1].trim();
  try { return JSON.parse(s); } catch (_) {}
  const obj = s.match(/\{[\s\S]*\}/);
  if (obj) { try { return JSON.parse(obj[0]); } catch (_) {} }
  return null;
}

// POST /api/ai/suggest-seo-keywords
router.post('/suggest-seo-keywords', auth, async (req, res) => {
  if (!ensureApiKeyOr503(res)) return;
  try {
    const { topic, audience, count = 15 } = req.body || {};
    if (!topic) return res.status(400).json({ error: 'topic is required' });
    const n = Math.min(Math.max(parseInt(count) || 15, 5), 50);
    const prompt = `Suggest ${n} SEO keywords for the topic: "${topic}"
Target audience: ${audience || 'general'}

Respond with JSON only:
{
  "topic": "${topic}",
  "primaryKeyword": "best primary keyword",
  "keywords": [
    {"keyword": "kw", "intent": "informational|commercial|transactional|navigational", "estimatedDifficulty": "low|medium|high", "estimatedVolume": "low|medium|high"}
  ],
  "longTailVariants": ["variant 1", "variant 2"],
  "questionsToAnswer": ["question 1", "question 2"],
  "summary": "Strategy summary"
}`;
    const result = await generateText(prompt, {
      model: MODEL, maxTokens: 2500, temperature: 0.5,
      systemPrompt: 'You are an SEO keyword strategist. Always respond with valid JSON only.'
    });
    const parsed = tryParseJson(result);
    if (!parsed) return res.json({ raw: result, topic });
    res.json(parsed);
  } catch (error) {
    console.error('Suggest SEO keywords error:', error);
    res.status(500).json({ error: 'Failed to suggest SEO keywords' });
  }
});

// POST /api/ai/optimize-for-engagement
router.post('/optimize-for-engagement', auth, async (req, res) => {
  if (!ensureApiKeyOr503(res)) return;
  try {
    const { content, platform = 'general', goal = 'engagement' } = req.body || {};
    if (!content) return res.status(400).json({ error: 'content is required' });
    const prompt = `Optimize the following content for maximum ${goal} on ${platform}.

CONTENT:
${String(content).slice(0, 6000)}

Respond with JSON only:
{
  "platform": "${platform}",
  "goal": "${goal}",
  "scoreBefore": 0,
  "scoreAfter": 0,
  "optimizedContent": "rewrite of the content optimized for engagement",
  "improvements": [{"category": "hook|cta|structure|tone|length|hashtags", "change": "what was changed", "reason": "why"}],
  "headlineVariants": ["v1", "v2", "v3"],
  "ctaSuggestions": ["cta1", "cta2"],
  "hashtagSuggestions": ["#tag1", "#tag2"],
  "expectedLift": "qualitative estimate of engagement lift"
}`;
    const result = await generateText(prompt, {
      model: MODEL, maxTokens: 3500, temperature: 0.6,
      systemPrompt: 'You are an engagement-optimization expert. Always respond with valid JSON only.'
    });
    const parsed = tryParseJson(result);
    if (!parsed) return res.json({ raw: result });
    res.json(parsed);
  } catch (error) {
    console.error('Optimize engagement error:', error);
    res.status(500).json({ error: 'Failed to optimize for engagement' });
  }
});

// POST /api/ai/generate-social-variants
router.post('/generate-social-variants', auth, async (req, res) => {
  if (!ensureApiKeyOr503(res)) return;
  try {
    const { content, platforms } = req.body || {};
    if (!content) return res.status(400).json({ error: 'content is required' });
    const list = Array.isArray(platforms) && platforms.length > 0
      ? platforms
      : ['twitter', 'linkedin', 'instagram', 'facebook', 'tiktok'];
    const prompt = `Generate platform-specific social variants of this content.

CONTENT:
${String(content).slice(0, 6000)}

Generate one variant per platform: ${list.join(', ')}.

Respond with JSON only:
{
  "variants": [
    {"platform": "twitter", "post": "text", "hashtags": ["#a"], "characterCount": 0, "notes": "tone notes"}
  ],
  "bestPerformingVariant": "platform name",
  "rationale": "why that variant should win"
}`;
    const result = await generateText(prompt, {
      model: MODEL, maxTokens: 3000, temperature: 0.7,
      systemPrompt: 'You are a social media manager who tailors content to each platform. Always respond with valid JSON only.'
    });
    const parsed = tryParseJson(result);
    if (!parsed) return res.json({ raw: result });
    res.json(parsed);
  } catch (error) {
    console.error('Social variants error:', error);
    res.status(500).json({ error: 'Failed to generate social variants' });
  }
});

// POST /api/ai/predict-performance
router.post('/predict-performance', auth, async (req, res) => {
  if (!ensureApiKeyOr503(res)) return;
  try {
    const { content, contentType = 'blog', platform = 'general' } = req.body || {};
    if (!content) return res.status(400).json({ error: 'content is required' });
    const prompt = `Predict the performance of this ${contentType} content on ${platform}.

CONTENT:
${String(content).slice(0, 6000)}

Respond with JSON only:
{
  "overallScore": 0,
  "viralityScore": 0,
  "engagementPrediction": {"likes": "range", "shares": "range", "comments": "range", "reach": "range"},
  "strengths": [{"element": "what is strong", "impact": "why it helps"}],
  "weaknesses": [{"element": "what to fix", "impact": "why it hurts", "suggestion": "how to fix"}],
  "audienceFit": "who this resonates with",
  "improvements": [{"priority": "high|medium|low", "suggestion": "concrete change"}]
}`;
    const result = await generateText(prompt, {
      model: MODEL, maxTokens: 3500, temperature: 0.5,
      systemPrompt: 'You are a content performance analyst. Always respond with valid JSON only.'
    });
    const parsed = tryParseJson(result);
    if (!parsed) return res.json({ raw: result });
    res.json(parsed);
  } catch (error) {
    console.error('Predict performance error:', error);
    res.status(500).json({ error: 'Failed to predict performance' });
  }
});

// POST /api/ai/detect-plagiarism
router.post('/detect-plagiarism', auth, async (req, res) => {
  if (!ensureApiKeyOr503(res)) return;
  try {
    const { content } = req.body || {};
    if (!content) return res.status(400).json({ error: 'content is required' });
    const prompt = `Analyze the following content for originality concerns.

CONTENT:
${String(content).slice(0, 8000)}

Respond with JSON only:
{
  "originalityScore": 0,
  "plagiarismScore": 0,
  "overallAssessment": "narrative",
  "flaggedSections": [{"text": "snippet", "concern": "why", "suggestion": "how to rephrase"}],
  "commonPhrases": ["phrase1"],
  "uniqueElements": ["element1"],
  "improvements": ["suggestion1"]
}`;
    const result = await generateText(prompt, {
      model: MODEL, maxTokens: 3500, temperature: 0.3,
      systemPrompt: 'You are an originality analyst. Always respond with valid JSON only.'
    });
    const parsed = tryParseJson(result);
    if (!parsed) return res.json({ raw: result });
    res.json(parsed);
  } catch (error) {
    console.error('Detect plagiarism error:', error);
    res.status(500).json({ error: 'Failed to detect plagiarism' });
  }
});

module.exports = router;
