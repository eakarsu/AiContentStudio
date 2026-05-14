const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateText } = require('../services/openrouter');

// Helper: fetch the raw text from a content item by type + id
async function fetchContentText(prisma, contentType, contentId, userId) {
  const modelMap = {
    video: 'video',
    blog: 'blogPost',
    blogPost: 'blogPost',
    email: 'email',
    social: 'socialPost',
    socialPost: 'socialPost',
    text: 'textContent',
    textContent: 'textContent',
    script: 'script',
    podcast: 'podcast',
    newsletter: 'newsletter',
    pressRelease: 'pressRelease',
    marketing: 'marketingCopy',
    marketingCopy: 'marketingCopy',
    seo: 'sEOContent',
    sEOContent: 'sEOContent',
    summary: 'summary',
    translation: 'translation',
    voiceover: 'voiceover',
  };

  const modelName = modelMap[contentType];
  if (!modelName) throw new Error(`Unknown contentType: ${contentType}`);

  const item = await prisma[modelName].findFirst({ where: { id: parseInt(contentId), userId } });
  if (!item) throw new Error(`Content item ${contentId} not found`);

  const text =
    item.content ||
    item.repurposedContent ||
    item.body ||
    item.script ||
    item.originalText ||
    item.translatedText ||
    item.text ||
    item.prompt ||
    item.topic ||
    '';

  return { item, text };
}

// POST /api/brand-voice/analyze
// Takes {sampleTexts: []} — 3-5 writing samples, returns/stores BrandVoice profile
router.post('/analyze', auth, async (req, res) => {
  try {
    const { sampleTexts } = req.body;

    if (!Array.isArray(sampleTexts) || sampleTexts.length < 1) {
      return res.status(400).json({ error: 'sampleTexts must be an array with at least 1 text sample' });
    }
    if (sampleTexts.length > 10) {
      return res.status(400).json({ error: 'Provide at most 10 text samples' });
    }

    // Check total character count to avoid token overflow
    const totalChars = sampleTexts.reduce((sum, t) => sum + (t || '').length, 0);
    if (totalChars > 20000) {
      return res.status(400).json({ error: 'Total sample text is too large (max ~20 000 characters)' });
    }

    const samplesBlock = sampleTexts
      .map((s, i) => `--- Sample ${i + 1} ---\n${s}`)
      .join('\n\n');

    const prompt = `Analyze the following writing samples and extract the author's unique brand voice characteristics.

${samplesBlock}

Respond ONLY with valid JSON in this exact structure:
{
  "tone": "one of: formal, semi-formal, casual, conversational, authoritative, inspirational, humorous, empathetic",
  "sentenceLength": "one of: short (avg <10 words), medium (avg 10-20 words), long (avg >20 words), varied",
  "vocabularyLevel": "one of: simple, moderate, advanced, technical",
  "commonPhrases": ["phrase1", "phrase2", "phrase3", "phrase4", "phrase5"],
  "styleTraits": {
    "usesRhetoricalQuestions": true,
    "usesListsFrequently": false,
    "usesStorytellingApproach": true,
    "usesDataAndStats": false,
    "usesHumor": false,
    "usesEmphasis": true,
    "paragraphLength": "short|medium|long",
    "transitionStyle": "smooth|abrupt|numbered",
    "callToActionFrequency": "never|occasional|frequent",
    "personalPronouns": "I/we/you dominant",
    "activeVsPassive": "active|passive|mixed",
    "punctuationStyle": "minimal|standard|expressive",
    "overallEnergyLevel": "calm|moderate|high"
  },
  "writingPatterns": ["Specific pattern 1 observed in the samples", "Pattern 2", "Pattern 3"],
  "avoidanceTraits": ["Things this author never does or rarely does"],
  "summary": "2-3 sentence overall description of this author's brand voice"
}`;

    const rawResult = await generateText(prompt, {
      systemPrompt: 'You are an expert writing style analyst. Extract precise brand voice characteristics from writing samples. Always return valid JSON only — no markdown fences, no extra text.',
      maxTokens: 2000,
      temperature: 0.3
    });

    let styleData;
    try {
      let jsonStr = rawResult.trim();
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonStr = jsonMatch[1].trim();
      styleData = JSON.parse(jsonStr);
    } catch (e) {
      return res.status(500).json({ error: 'AI returned invalid JSON; please try again', raw: rawResult });
    }

    // Upsert: one BrandVoice per user
    const brandVoice = await req.prisma.brandVoice.upsert({
      where: { userId: req.userId },
      create: {
        userId: req.userId,
        tone: styleData.tone || null,
        sentenceLength: styleData.sentenceLength || null,
        vocabularyLevel: styleData.vocabularyLevel || null,
        commonPhrases: styleData.commonPhrases || [],
        styleTraits: styleData,
        sampleTexts: sampleTexts
      },
      update: {
        tone: styleData.tone || null,
        sentenceLength: styleData.sentenceLength || null,
        vocabularyLevel: styleData.vocabularyLevel || null,
        commonPhrases: styleData.commonPhrases || [],
        styleTraits: styleData,
        sampleTexts: sampleTexts
      }
    });

    res.json({
      message: 'Brand voice profile created/updated',
      brandVoice,
      analysis: styleData
    });
  } catch (error) {
    console.error('Brand voice analyze error:', error);
    res.status(500).json({ error: 'Failed to analyze brand voice: ' + error.message });
  }
});

// GET /api/brand-voice — get current user's brand voice profile
router.get('/', auth, async (req, res) => {
  try {
    const brandVoice = await req.prisma.brandVoice.findUnique({
      where: { userId: req.userId }
    });
    if (!brandVoice) return res.status(404).json({ error: 'No brand voice profile found. Use POST /analyze first.' });
    res.json(brandVoice);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch brand voice profile' });
  }
});

// POST /api/brand-voice/apply
// Accepts either:
//   { content: "raw text", contentType: "blog" }        — rewrite raw text inline
//   { contentId: 42, contentType: "blog" }              — look up a DB record and rewrite its text
// Returns the rewritten text (does NOT overwrite the DB record; caller decides what to do with it)
router.post('/apply', auth, async (req, res) => {
  try {
    const { content: rawContent, contentId, contentType } = req.body;

    if (!contentType) {
      return res.status(400).json({ error: 'contentType is required' });
    }
    if (!rawContent && !contentId) {
      return res.status(400).json({ error: 'Provide either content (raw text) or contentId (DB record id)' });
    }

    // Fetch user's brand voice profile
    const brandVoice = await req.prisma.brandVoice.findUnique({
      where: { userId: req.userId }
    });
    if (!brandVoice) {
      return res.status(404).json({ error: 'No brand voice profile found. Run POST /api/brand-voice/analyze first.' });
    }

    // Resolve the text to rewrite
    let text;
    let sourceItem = null;
    if (rawContent) {
      text = rawContent;
    } else {
      const { item, text: fetchedText } = await fetchContentText(req.prisma, contentType, contentId, req.userId);
      sourceItem = item;
      text = fetchedText;
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'No text found to rewrite' });
    }

    const traits = brandVoice.styleTraits || {};
    const phrases = Array.isArray(brandVoice.commonPhrases) ? brandVoice.commonPhrases.join(', ') : '';

    const prompt = `Rewrite the following content to precisely match this brand voice profile:

BRAND VOICE PROFILE:
- Tone: ${brandVoice.tone || 'professional'}
- Sentence Length: ${brandVoice.sentenceLength || 'medium'}
- Vocabulary Level: ${brandVoice.vocabularyLevel || 'moderate'}
- Common Phrases to incorporate naturally: ${phrases || 'none specified'}
- Writing Style: ${traits.summary || JSON.stringify(traits)}

ORIGINAL CONTENT:
"""
${text.slice(0, 8000)}
"""

Rules:
1. Preserve ALL factual information, data points, and core message
2. Apply the brand voice characteristics consistently throughout
3. Match the sentence length pattern specified
4. Naturally incorporate characteristic phrases where appropriate
5. Maintain the same content structure (headings, lists, etc.) unless the style requires changes
6. Do NOT add a preamble — return only the rewritten content

Return ONLY the rewritten content text.`;

    const rewritten = await generateText(prompt, {
      systemPrompt: `You are an expert editor who rewrites content to match a specific author's brand voice. Tone: ${brandVoice.tone}. Vocabulary: ${brandVoice.vocabularyLevel}. Preserve all facts, apply the voice precisely.`,
      maxTokens: 4000,
      temperature: 0.6
    });

    res.json({
      message: 'Content rewritten in your brand voice',
      ...(contentId && { originalContentId: parseInt(contentId) }),
      contentType,
      rewrittenContent: rewritten.trim(),
      brandVoiceSummary: {
        tone: brandVoice.tone,
        sentenceLength: brandVoice.sentenceLength,
        vocabularyLevel: brandVoice.vocabularyLevel
      }
    });
  } catch (error) {
    console.error('Brand voice apply error:', error);
    res.status(500).json({ error: 'Failed to apply brand voice: ' + error.message });
  }
});

module.exports = router;
