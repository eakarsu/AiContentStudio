const OpenAI = require('openai');

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:3000',
    'X-Title': 'AI Content Studio'
  }
});

// Generate text content using OpenRouter
async function generateText(prompt, options = {}) {
  const {
    model = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
    maxTokens = 2000,
    temperature = 0.7,
    systemPrompt = 'You are a helpful AI assistant that creates high-quality content.'
  } = options;

  try {
    const response = await openai.chat.completions.create({
      model,
      max_tokens: maxTokens,
      temperature,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ]
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('OpenRouter API Error:', error);
    throw new Error('Failed to generate content: ' + error.message);
  }
}

// Generate blog post
async function generateBlogPost(topic, keywords = '') {
  const prompt = `Write a comprehensive, engaging blog post about "${topic}".
${keywords ? `Include these keywords naturally: ${keywords}` : ''}

The blog post should:
- Have an attention-grabbing introduction
- Be well-structured with clear headings
- Include practical tips or insights
- Have a compelling conclusion
- Be approximately 800-1200 words

Format the output with proper markdown headings.`;

  return generateText(prompt, {
    systemPrompt: 'You are an expert content writer who creates engaging, SEO-friendly blog posts.',
    maxTokens: 3000
  });
}

// Generate marketing copy
async function generateMarketingCopy(product, targetAudience = '') {
  const prompt = `Create compelling marketing copy for: "${product}"
${targetAudience ? `Target audience: ${targetAudience}` : ''}

Include:
1. A powerful headline
2. Engaging body copy that highlights benefits
3. A strong call-to-action

Make it persuasive, benefit-focused, and emotionally compelling.`;

  return generateText(prompt, {
    systemPrompt: 'You are a world-class copywriter who creates persuasive marketing content that converts.'
  });
}

// Generate social media post
async function generateSocialPost(platform, prompt) {
  const platformGuides = {
    twitter: 'Keep it under 280 characters. Use hashtags sparingly. Be punchy and engaging.',
    instagram: 'Write an engaging caption. Include relevant emojis. Suggest 5-10 relevant hashtags.',
    linkedin: 'Professional tone. Focus on value and insights. Include a call-to-action.',
    facebook: 'Conversational tone. Can be longer. Encourage engagement.',
    tiktok: 'Trendy, casual tone. Include popular hashtags. Keep it fun and relatable.'
  };

  const fullPrompt = `Create a ${platform} post about: "${prompt}"

Platform guidelines: ${platformGuides[platform.toLowerCase()] || platformGuides.instagram}

Return the post content and hashtags separately.`;

  return generateText(fullPrompt, {
    systemPrompt: `You are a social media expert who creates viral content for ${platform}.`
  });
}

// Generate email content
async function generateEmail(type, prompt) {
  const emailTypes = {
    marketing: 'Create a compelling marketing email that drives conversions.',
    newsletter: 'Write an engaging newsletter that provides value to subscribers.',
    welcome: 'Create a warm, welcoming email for new subscribers/customers.',
    followup: 'Write a professional follow-up email.',
    announcement: 'Create an exciting announcement email.'
  };

  const fullPrompt = `${emailTypes[type] || emailTypes.marketing}

Topic/Purpose: "${prompt}"

Include:
- Subject line (compelling and under 50 characters)
- Email body with clear structure
- Call-to-action

Make it professional yet engaging.`;

  return generateText(fullPrompt, {
    systemPrompt: 'You are an email marketing expert who creates high-converting email content.'
  });
}

// Generate script (video/podcast)
async function generateScript(type, topic, duration = 5) {
  const prompt = `Write a ${type} script about: "${topic}"

Target duration: ${duration} minutes
Include:
- Opening hook
- Main content sections
- Transitions
- Closing/call-to-action

Format with clear speaker directions and timing notes.`;

  return generateText(prompt, {
    systemPrompt: `You are a professional ${type} scriptwriter who creates engaging, well-paced content.`,
    maxTokens: 4000
  });
}

// Generate SEO content
async function generateSEOContent(keyword) {
  const prompt = `Create SEO-optimized content for the keyword: "${keyword}"

Provide:
1. SEO-optimized title (60 characters max)
2. Meta description (160 characters max)
3. H1 heading
4. 5 related H2 headings
5. Main content (500-800 words) optimized for the keyword
6. FAQ section with 3-5 questions

Ensure keyword density is natural and content is valuable to readers.`;

  return generateText(prompt, {
    systemPrompt: 'You are an SEO expert who creates content that ranks well and provides genuine value.',
    maxTokens: 3000
  });
}

// Translate text
async function translateText(text, sourceLang, targetLang) {
  const prompt = `Translate the following text from ${sourceLang} to ${targetLang}:

"${text}"

Provide only the translation, maintaining the original tone and meaning.`;

  return generateText(prompt, {
    systemPrompt: 'You are a professional translator who provides accurate, natural-sounding translations.',
    temperature: 0.3
  });
}

// Summarize text
async function summarizeText(text, length = 'medium') {
  const lengths = {
    short: '2-3 sentences',
    medium: '1-2 paragraphs',
    long: '3-4 paragraphs'
  };

  const prompt = `Summarize the following text in ${lengths[length] || lengths.medium}:

"${text}"

Capture the main points and key insights.`;

  return generateText(prompt, {
    systemPrompt: 'You are an expert at distilling complex information into clear, concise summaries.',
    temperature: 0.3
  });
}

// Generate video description/concept
async function generateVideoContent(prompt, style = 'professional') {
  const fullPrompt = `Create a video concept and script outline for: "${prompt}"

Style: ${style}

Include:
1. Video title (attention-grabbing)
2. Video description (YouTube-optimized)
3. Scene-by-scene breakdown
4. Suggested visuals for each scene
5. Voiceover/narration text
6. Suggested music mood
7. Call-to-action at the end

Make it engaging and visually compelling.`;

  return generateText(fullPrompt, {
    systemPrompt: 'You are a creative video producer who creates compelling video concepts and scripts.',
    maxTokens: 3000
  });
}

// Generate audio content (podcast script, voiceover)
async function generateAudioContent(prompt, type = 'voiceover') {
  const types = {
    voiceover: 'Create a professional voiceover script',
    podcast: 'Create a podcast episode outline and script',
    narration: 'Create a narration script',
    audiobook: 'Create an audiobook-style reading'
  };

  const fullPrompt = `${types[type] || types.voiceover} for: "${prompt}"

Include:
- Natural pacing markers
- Emphasis notes
- Tone guidance
- Breathing pauses marked with [PAUSE]

Make it sound natural when spoken aloud.`;

  return generateText(fullPrompt, {
    systemPrompt: 'You are an audio content expert who creates scripts that sound natural and engaging when spoken.',
    maxTokens: 2500
  });
}

// Generate image prompt (for use with image generation APIs)
async function generateImagePrompt(description, style = 'realistic') {
  const prompt = `Create a detailed image generation prompt for: "${description}"

Style: ${style}

Create a detailed, specific prompt that would generate a high-quality image. Include:
- Subject details
- Composition
- Lighting
- Color palette
- Mood/atmosphere
- Technical specifications (camera angle, depth of field, etc.)

Format as a single, detailed prompt suitable for AI image generation.`;

  return generateText(prompt, {
    systemPrompt: 'You are an expert at crafting detailed, effective prompts for AI image generation.',
    temperature: 0.8
  });
}

// Generate music description (for music generation)
async function generateMusicDescription(genre, mood, purpose = 'background') {
  const prompt = `Create a detailed music description for:
Genre: ${genre}
Mood: ${mood}
Purpose: ${purpose}

Include:
- Tempo (BPM range)
- Key signature
- Instrumentation
- Structural elements
- Dynamic progression
- Reference style/artists

Make it detailed enough for a music AI to generate.`;

  return generateText(prompt, {
    systemPrompt: 'You are a music producer who can describe compositions in detail for AI music generation.',
    temperature: 0.7
  });
}

// Rewrite/improve content
async function rewriteContent(text, tone = 'professional') {
  const prompt = `Rewrite the following content with a ${tone} tone:

"${text}"

Improve:
- Clarity
- Engagement
- Flow
- Grammar and style

Maintain the original meaning while making it better.`;

  return generateText(prompt, {
    systemPrompt: 'You are an expert editor who improves content while maintaining its essence.',
    temperature: 0.5
  });
}

module.exports = {
  generateText,
  generateBlogPost,
  generateMarketingCopy,
  generateSocialPost,
  generateEmail,
  generateScript,
  generateSEOContent,
  translateText,
  summarizeText,
  generateVideoContent,
  generateAudioContent,
  generateImagePrompt,
  generateMusicDescription,
  rewriteContent
};
