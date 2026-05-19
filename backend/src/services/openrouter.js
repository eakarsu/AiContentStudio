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
    model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
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

Structure the blog post with this professional format:

# [Compelling Blog Title]

> **TL;DR:** [One-sentence summary of the post]

## Introduction
[Attention-grabbing opening paragraph with a hook]

## [Main Section 1 Title]
[Content with practical tips or insights]

## [Main Section 2 Title]
[Content with examples or data points]

## [Main Section 3 Title]
[Content with actionable advice]

## Key Takeaways
- [Takeaway 1]
- [Takeaway 2]
- [Takeaway 3]

## Conclusion
[Compelling conclusion with call-to-action]

---
*Target length: 800-1200 words. Use bold for key terms, bullet points for lists, and blockquotes for important callouts.*`;

  return generateText(prompt, {
    systemPrompt: 'You are an expert content writer who creates engaging, SEO-friendly blog posts with professional markdown formatting. Use headers, bold text, bullet points, numbered lists, and blockquotes to create visually appealing content.',
    maxTokens: 3000
  });
}

// Generate marketing copy
async function generateMarketingCopy(product, targetAudience = '') {
  const prompt = `Create compelling marketing copy for: "${product}"
${targetAudience ? `Target audience: ${targetAudience}` : ''}

Structure the output professionally:

# [Powerful Headline]

## [Subheadline that expands on the promise]

---

### The Problem
[Describe the pain point your audience faces]

### The Solution
[How this product/service solves the problem]

### Key Benefits
- **[Benefit 1]:** [Brief explanation]
- **[Benefit 2]:** [Brief explanation]
- **[Benefit 3]:** [Brief explanation]

### Social Proof
> [Testimonial or trust-building statement]

### Call to Action
**[Strong CTA statement]**

[Supporting urgency or scarcity element]

---

### Additional Copy Variants
1. **Short Version (Social/Ad):** [2-3 sentence version]
2. **Email Subject Line:** [Compelling subject line]
3. **Tagline:** [Memorable one-liner]`;

  return generateText(prompt, {
    systemPrompt: 'You are a world-class copywriter who creates persuasive marketing content that converts. Format output with professional markdown structure.',
    maxTokens: 2500
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

Structure the output professionally:

## Post Content

[The actual post content ready to copy-paste]

---

## Hashtags
[Relevant hashtags grouped together]

## Posting Tips
- **Best Time to Post:** [Suggested time]
- **Engagement Strategy:** [How to boost engagement]
- **Content Type:** [Carousel/Single/Story/Reel suggestion]

## Alternative Versions
1. **Shorter Version:** [Condensed version]
2. **Question Hook:** [Version that opens with a question]`;

  return generateText(fullPrompt, {
    systemPrompt: `You are a social media expert who creates viral content for ${platform}. Format output with clean markdown sections.`
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

Structure the email professionally:

## Subject Line
[Compelling subject line under 50 characters]

## Preview Text
[Preview text that appears in inbox - 90 characters max]

---

## Email Body

**[Opening greeting]**

[Opening paragraph - hook the reader]

[Main content paragraph - deliver the value]

[Supporting paragraph - add credibility or details]

### Call to Action
**[Primary CTA button text]**

[Closing paragraph]

[Sign-off]

---

## Email Performance Tips
- **Send Time:** [Optimal send time for this type]
- **A/B Test:** [What to test]
- **Segment:** [Best audience segment]

## Alternative Subject Lines
1. [Alternative 1]
2. [Alternative 2]
3. [Alternative 3]`;

  return generateText(fullPrompt, {
    systemPrompt: 'You are an email marketing expert who creates high-converting email content with professional markdown formatting.'
  });
}

// Generate script (video/podcast)
async function generateScript(type, topic, duration = 5) {
  const prompt = `Write a ${type} script about: "${topic}"

Target duration: ${duration} minutes

Structure the script professionally:

# ${type.toUpperCase()} SCRIPT: [Title]

> **Duration:** ${duration} minutes | **Type:** ${type} | **Tone:** [Professional/Casual/Educational]

---

## COLD OPEN (0:00 - 0:30)
**[DIRECTION]** [Visual/audio direction]

**HOST:** [Opening hook - grab attention immediately]

---

## INTRO (0:30 - 1:00)
**[DIRECTION]** [Transition direction]

**HOST:** [Introduction to the topic, set expectations]

---

## SEGMENT 1: [Title] (1:00 - X:XX)
**[DIRECTION]** [Scene/mood direction]

**HOST:** [Main content]

> **KEY POINT:** [Important takeaway from this segment]

---

## SEGMENT 2: [Title] (X:XX - X:XX)
**[DIRECTION]** [Direction notes]

**HOST:** [Content with examples or stories]

---

## SEGMENT 3: [Title] (X:XX - X:XX)
**HOST:** [Content with practical tips]

---

## CLOSING (X:XX - ${duration}:00)
**HOST:** [Recap key points, call-to-action]

---

## PRODUCTION NOTES
- **Music:** [Suggested music/mood]
- **Graphics:** [Suggested on-screen graphics]
- **B-Roll:** [Suggested supplementary footage]`;

  return generateText(prompt, {
    systemPrompt: `You are a professional ${type} scriptwriter who creates engaging, well-paced content with clear formatting, timing markers, and production directions.`,
    maxTokens: 4000
  });
}

// Generate SEO content
async function generateSEOContent(keyword) {
  const prompt = `Create SEO-optimized content for the keyword: "${keyword}"

Structure the output professionally:

# [SEO-Optimized Title - 60 chars max]

> **Meta Description:** [Compelling meta description - 160 chars max]
>
> **Primary Keyword:** ${keyword}
> **Secondary Keywords:** [3-5 related keywords]

---

## [H2 Section 1 - Include keyword naturally]
[Content optimized for the keyword - 150-200 words]

## [H2 Section 2]
[Content with related subtopics - 150-200 words]

## [H2 Section 3]
[Content with practical value - 150-200 words]

## [H2 Section 4]
[Content with examples or case studies - 150-200 words]

## [H2 Section 5]
[Content wrapping up the topic - 100-150 words]

---

## Frequently Asked Questions

### [Question 1 with keyword]?
[Concise, valuable answer]

### [Question 2]?
[Concise, valuable answer]

### [Question 3]?
[Concise, valuable answer]

---

## SEO Checklist
- **Keyword Density:** [Percentage]
- **Word Count:** [Total words]
- **Internal Links Suggested:** [2-3 related page ideas]
- **External Links Suggested:** [2-3 authoritative sources]
- **Image Alt Text:** [Suggested alt text for featured image]`;

  return generateText(prompt, {
    systemPrompt: 'You are an SEO expert who creates content that ranks well and provides genuine value. Use professional markdown formatting with clear structure.',
    maxTokens: 3000
  });
}

// Translate text
async function translateText(text, sourceLang, targetLang) {
  const prompt = `Translate the following text from ${sourceLang} to ${targetLang}:

"${text}"

Structure the output professionally:

## Translation (${sourceLang} → ${targetLang})

[The translated text, maintaining original tone and meaning]

---

## Translation Notes
- **Tone Preserved:** [Yes/Adjusted - brief explanation]
- **Cultural Adaptations:** [Any cultural adjustments made]
- **Confidence Level:** [High/Medium - and why]

## Alternative Phrasings
- [Alternative for a key phrase, if applicable]`;

  return generateText(prompt, {
    systemPrompt: 'You are a professional translator who provides accurate, natural-sounding translations with helpful context notes.',
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

Structure the summary professionally:

## Summary

[The main summary in ${lengths[length] || lengths.medium}]

## Key Points
- [Key point 1]
- [Key point 2]
- [Key point 3]

## Main Theme
> [One-sentence description of the central theme]

## Action Items
- [Any actionable takeaway 1]
- [Any actionable takeaway 2]`;

  return generateText(prompt, {
    systemPrompt: 'You are an expert at distilling complex information into clear, structured summaries with professional markdown formatting.',
    temperature: 0.3
  });
}

// Generate video description/concept
async function generateVideoContent(prompt, style = 'professional') {
  const fullPrompt = `Create a video concept and script outline for: "${prompt}"

Style: ${style}

Structure the output professionally:

# [Attention-Grabbing Video Title]

> **Style:** ${style} | **Estimated Duration:** [X:XX] | **Format:** [Vertical/Horizontal/Square]

## Video Description
[YouTube/platform-optimized description with keywords - 200 words]

---

## Scene Breakdown

### Scene 1: Opening (0:00 - 0:XX)
- **Visual:** [What the viewer sees]
- **Audio:** [Voiceover/narration text]
- **Music:** [Mood/genre]
- **Text Overlay:** [Any on-screen text]

### Scene 2: [Title] (0:XX - X:XX)
- **Visual:** [Description]
- **Audio:** [Narration]
- **Transition:** [Cut/fade/zoom]

### Scene 3: [Title] (X:XX - X:XX)
- **Visual:** [Description]
- **Audio:** [Narration]

### Scene 4: Closing (X:XX - X:XX)
- **Visual:** [End screen layout]
- **Audio:** [Call-to-action narration]
- **CTA:** [Subscribe/visit/follow prompt]

---

## Production Notes
- **Thumbnail Idea:** [Description of eye-catching thumbnail]
- **Tags:** [Comma-separated video tags]
- **Music Mood:** [Genre and tempo]
- **Target Audience:** [Who this video is for]`;

  return generateText(fullPrompt, {
    systemPrompt: 'You are a creative video producer who creates compelling video concepts and scripts with professional formatting.',
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

Structure the script professionally:

# ${type.toUpperCase()} SCRIPT

> **Type:** ${type} | **Estimated Duration:** [X:XX] | **Tone:** [Warm/Professional/Energetic]

---

## Opening
**[TONE: Warm and inviting]**

[Opening lines] [PAUSE]

---

## Main Content

### Section 1: [Topic]
**[TONE: Informative]**

[Content] [PAUSE]

> **EMPHASIS:** [Key phrase to stress]

### Section 2: [Topic]
**[TONE: Engaging]**

[Content] [PAUSE]

### Section 3: [Topic]
[Content] [PAUSE]

---

## Closing
**[TONE: Inspiring/Motivational]**

[Closing remarks and call-to-action] [PAUSE]

---

## Production Notes
- **Voice Style:** [Description of ideal delivery]
- **Background Music:** [Suggested mood]
- **Sound Effects:** [Any suggested SFX]
- **Total Word Count:** [Approximate words]`;

  return generateText(fullPrompt, {
    systemPrompt: 'You are an audio content expert who creates well-structured scripts with clear direction markers, pacing notes, and professional formatting.',
    maxTokens: 2500
  });
}

// Generate image prompt (for use with image generation APIs)
async function generateImagePrompt(description, style = 'realistic') {
  const prompt = `Create a detailed image generation prompt for: "${description}"

Style: ${style}

Structure the output professionally:

# Image Generation Brief

> **Subject:** ${description} | **Style:** ${style}

---

## Primary Prompt
> [Complete, detailed prompt optimized for DALL-E/Midjourney - include subject, composition, lighting, color palette, mood, and technical specs in one flowing description]

---

## Prompt Breakdown

### Subject & Composition
- **Main Subject:** [Detailed description]
- **Composition:** [Rule of thirds, centered, etc.]
- **Camera Angle:** [Eye level, bird's eye, etc.]

### Lighting & Atmosphere
- **Lighting:** [Natural, studio, dramatic, etc.]
- **Mood:** [Warm, mysterious, energetic, etc.]
- **Time of Day:** [If applicable]

### Color & Style
- **Color Palette:** [Primary colors and tones]
- **Art Style:** [Photorealistic, illustration, etc.]
- **Depth of Field:** [Shallow, deep, etc.]

## Style Variations
1. **Minimalist Version:** [Simplified prompt]
2. **Dramatic Version:** [More intense prompt]
3. **Artistic Version:** [Creative/abstract prompt]

## Negative Prompt
> [What to avoid in the generation]`;

  return generateText(prompt, {
    systemPrompt: 'You are an expert at crafting detailed, effective prompts for AI image generation with professional formatting.',
    temperature: 0.8
  });
}

// Generate music description (for music generation)
async function generateMusicDescription(genre, mood, purpose = 'background') {
  const prompt = `Create a detailed music description for:
Genre: ${genre}
Mood: ${mood}
Purpose: ${purpose}

Structure the output professionally:

# Music Composition Brief

> **Genre:** ${genre} | **Mood:** ${mood} | **Purpose:** ${purpose}

---

## Technical Specifications
- **Tempo:** [BPM range]
- **Key Signature:** [Key]
- **Time Signature:** [4/4, 3/4, etc.]
- **Duration:** [Suggested length]

## Instrumentation
- **Lead:** [Primary instrument(s)]
- **Rhythm:** [Drums/percussion details]
- **Harmony:** [Chords/pads/keys]
- **Bass:** [Bass instrument and style]
- **Extras:** [Additional elements]

## Structure
1. **Intro** (0:00 - 0:XX) - [Description]
2. **Verse/Build** (0:XX - X:XX) - [Description]
3. **Chorus/Peak** (X:XX - X:XX) - [Description]
4. **Bridge/Break** (X:XX - X:XX) - [Description]
5. **Outro** (X:XX - X:XX) - [Description]

## Dynamic Progression
> [Description of how energy/intensity changes throughout]

## Reference Artists/Tracks
- [Reference 1] - [Why it's similar]
- [Reference 2] - [Why it's similar]

## AI Generation Prompt
> [Single detailed prompt optimized for AI music generation]`;

  return generateText(prompt, {
    systemPrompt: 'You are a music producer who creates detailed, professionally structured composition briefs for AI music generation.',
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

// =====================================================
// NEW AI CONTENT STUDIO FEATURES
// =====================================================

// Generate Content Calendar Suggestions
async function generateContentCalendarSuggestions(topic, contentType, platform, scheduledDate) {
  const prompt = `Create a comprehensive content plan for:
Topic: "${topic}"
Content Type: ${contentType}
Platform: ${platform || 'general'}
Scheduled Date: ${scheduledDate}

Provide a detailed JSON response with:
{
  "title": "Suggested title for the content",
  "contentBrief": "Detailed content brief (200-300 words)",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
  "suggestedHashtags": ["hashtag1", "hashtag2"],
  "bestTimeToPost": "Optimal posting time based on platform",
  "contentHooks": ["Hook idea 1", "Hook idea 2"],
  "callToAction": "Suggested CTA",
  "relatedTopics": ["Related topic 1", "Related topic 2"],
  "visualSuggestions": "Ideas for accompanying visuals",
  "toneGuidance": "Recommended tone and style"
}`;

  return generateText(prompt, {
    systemPrompt: 'You are a content strategist who creates detailed, actionable content calendars. Always respond with valid JSON.',
    maxTokens: 2000,
    temperature: 0.7
  });
}

// Repurpose Content
async function repurposeContent(originalContent, originalType, targetType, targetPlatform) {
  const prompt = `Repurpose the following ${originalType} content into ${targetType} format for ${targetPlatform || 'general use'}:

ORIGINAL CONTENT:
"${originalContent}"

Structure the output professionally:

# Repurposed Content: ${originalType} → ${targetType}

> **Original Format:** ${originalType} | **Target Format:** ${targetType} | **Platform:** ${targetPlatform || 'General'}

---

## Repurposed Content

[Complete, ready-to-use ${targetType} content with all necessary formatting, hashtags, and CTAs]

---

## Adaptation Summary

### Key Changes Made
- **[Change 1]:** [Why this adaptation improves the content]
- **[Change 2]:** [Why this adaptation improves the content]
- **[Change 3]:** [Why this adaptation improves the content]

### What Was Preserved
- [Core message/value that was maintained]
- [Key information retained]

### Platform Optimization
- **Format:** [How the format was optimized for ${targetPlatform || 'the target platform'}]
- **Tone:** [How the tone was adjusted]
- **Length:** [How the length was adapted]

## Additional Suggestions
1. [Suggestion for maximizing impact]
2. [Suggestion for cross-promotion]
3. [Suggestion for audience engagement]`;

  return generateText(prompt, {
    systemPrompt: 'You are a content repurposing expert who transforms content across formats with professional markdown formatting.',
    maxTokens: 3000,
    temperature: 0.6
  });
}

// Check Plagiarism (AI-based originality analysis)
async function checkPlagiarism(content) {
  const prompt = `Analyze the following content for originality and potential plagiarism concerns:

CONTENT TO ANALYZE:
"${content}"

Provide a comprehensive analysis in JSON format:
{
  "originalityScore": 85,
  "plagiarismScore": 15,
  "analysis": {
    "overallAssessment": "Detailed assessment of originality",
    "commonPhrases": ["List of common/generic phrases that might appear elsewhere"],
    "uniqueElements": ["Unique aspects of the content"],
    "potentialConcerns": ["Specific sections that might need rephrasing"]
  },
  "flaggedSections": [
    {
      "text": "The flagged text section",
      "concern": "Why this might be problematic",
      "suggestion": "How to make it more original"
    }
  ],
  "improvements": [
    "Suggestion 1 for improving originality",
    "Suggestion 2 for making content more unique"
  ],
  "styleAnalysis": {
    "readability": "Assessment of readability",
    "voiceConsistency": "Is the voice consistent throughout",
    "toneAppropriate": "Is the tone appropriate for the content type"
  }
}

Be thorough but fair - not all common phrases indicate plagiarism.`;

  return generateText(prompt, {
    systemPrompt: 'You are an expert content analyst who evaluates originality and provides constructive feedback. Always respond with valid JSON. Be thorough and detailed in every field - provide multiple items in arrays and write detailed explanations.',
    maxTokens: 4000,
    temperature: 0.3
  });
}

// Suggest Images for Content
async function suggestImagesForContent(content, contentType) {
  const prompt = `Analyze the following ${contentType} content and suggest appropriate images:

CONTENT:
"${content}"

Provide comprehensive image suggestions in JSON format:
{
  "imageSuggestions": [
    {
      "position": "hero/header/inline/footer",
      "description": "What the image should show",
      "purpose": "Why this image works here",
      "style": "photography/illustration/infographic/icon",
      "mood": "The emotional tone of the image"
    }
  ],
  "aiImagePrompts": [
    {
      "prompt": "Detailed DALL-E/Midjourney prompt for generating this image",
      "style": "Style specifications",
      "aspectRatio": "16:9/1:1/4:3/etc"
    }
  ],
  "stockPhotoKeywords": [
    {
      "keywords": ["keyword1", "keyword2", "keyword3"],
      "filters": "Suggested filters (orientation, color, style)"
    }
  ],
  "colorPalette": ["#color1", "#color2", "#color3"],
  "brandingNotes": "Suggestions for maintaining brand consistency",
  "accessibilityNotes": "Alt text suggestions and accessibility considerations"
}`;

  return generateText(prompt, {
    systemPrompt: 'You are a visual content strategist who understands how images enhance written content. Always respond with valid JSON. Provide at least 3-4 image suggestions, 2-3 AI prompts, and 2-3 stock photo keyword sets. Be detailed and thorough.',
    maxTokens: 4000,
    temperature: 0.7
  });
}

// Predict Content Performance
async function predictContentPerformance(content, contentType, platform) {
  const prompt = `Analyze and predict the performance of this ${contentType} content for ${platform || 'general audiences'}:

CONTENT:
"${content}"

Provide a comprehensive performance prediction in JSON format:
{
  "overallScore": 78,
  "viralityScore": 65,
  "engagementPrediction": {
    "estimatedLikes": "range estimate",
    "estimatedShares": "range estimate",
    "estimatedComments": "range estimate",
    "estimatedReach": "range estimate"
  },
  "strengthAnalysis": [
    {
      "element": "What's strong",
      "impact": "How it helps performance",
      "score": 85
    }
  ],
  "weaknessAnalysis": [
    {
      "element": "What could improve",
      "impact": "How it hurts performance",
      "suggestion": "How to fix it"
    }
  ],
  "audienceAppeal": {
    "primaryAudience": "Who will resonate most",
    "secondaryAudience": "Secondary target",
    "emotionalTriggers": ["Emotions this content evokes"]
  },
  "timingRecommendations": {
    "bestDays": ["Monday", "Wednesday"],
    "bestTimes": ["9am-11am", "7pm-9pm"],
    "seasonality": "Any seasonal considerations"
  },
  "competitiveAnalysis": "How this compares to typical performing content",
  "improvements": [
    {
      "priority": "high/medium/low",
      "suggestion": "Specific improvement",
      "expectedImpact": "How much it could improve performance"
    }
  ],
  "hashtagSuggestions": ["optimal", "hashtags", "for", "reach"],
  "headlineAlternatives": ["Alternative headline 1", "Alternative headline 2"]
}`;

  return generateText(prompt, {
    systemPrompt: 'You are a content analytics expert who predicts performance based on engagement patterns and content quality. Always respond with valid JSON. Be very detailed - include at least 3 strengths, 3 weaknesses, and 3 improvements. Write thorough explanations for each field.',
    maxTokens: 4500,
    temperature: 0.5
  });
}

// Generate Blog Outline
async function generateBlogOutline(topic, targetAudience, keywords) {
  const prompt = `Create a comprehensive blog outline for:
Topic: "${topic}"
Target Audience: ${targetAudience || 'general audience'}
Keywords: ${keywords || 'none specified'}

Provide a detailed outline in JSON format:
{
  "title": "SEO-optimized blog title",
  "subtitle": "Engaging subtitle",
  "metaDescription": "SEO meta description (155 characters max)",
  "estimatedReadTime": "X minutes",
  "estimatedWordCount": 1500,
  "targetKeywords": ["primary keyword", "secondary keywords"],
  "outline": [
    {
      "section": "Introduction",
      "heading": "H2 heading text",
      "keyPoints": ["Point 1", "Point 2"],
      "suggestedContent": "Brief description of what to cover",
      "wordCount": 150
    },
    {
      "section": "Main Section 1",
      "heading": "H2 heading",
      "subheadings": [
        {
          "heading": "H3 heading",
          "keyPoints": ["Point 1", "Point 2"]
        }
      ],
      "wordCount": 300
    }
  ],
  "seoScore": 85,
  "seoSuggestions": [
    "Include target keyword in first 100 words",
    "Add internal links to related content"
  ],
  "contentHooks": [
    "Hook idea for introduction",
    "Engaging question to ask readers"
  ],
  "callToAction": "Suggested CTA for the conclusion",
  "relatedTopics": ["Related blog idea 1", "Related blog idea 2"],
  "visualSuggestions": [
    "Infographic showing key statistics",
    "Screenshot demonstrating the process"
  ]
}`;

  return generateText(prompt, {
    systemPrompt: 'You are an expert content strategist who creates detailed, SEO-optimized blog outlines. Always respond with valid JSON. Include at least 5-6 sections in the outline with detailed key points for each.',
    maxTokens: 4000,
    temperature: 0.6
  });
}

// Generate Newsletter
async function generateNewsletter(topic, audience, frequency) {
  const prompt = `Create a complete newsletter for:
Topic: "${topic}"
Target Audience: ${audience || 'subscribers'}
Frequency: ${frequency || 'weekly'}

Provide the complete newsletter in JSON format:
{
  "subject": "Compelling email subject line (50 chars max)",
  "preheader": "Preview text that appears after subject (100 chars max)",
  "sections": [
    {
      "type": "header",
      "content": "Newsletter header/greeting"
    },
    {
      "type": "featured",
      "title": "Featured story title",
      "content": "Featured content (150-200 words)",
      "cta": "Call to action"
    },
    {
      "type": "quickBites",
      "items": [
        {
          "title": "Quick item title",
          "summary": "Brief summary",
          "link": "Link text"
        }
      ]
    },
    {
      "type": "tips",
      "title": "Section title",
      "tips": ["Tip 1", "Tip 2", "Tip 3"]
    },
    {
      "type": "cta",
      "content": "Main call to action section"
    },
    {
      "type": "footer",
      "content": "Closing and sign-off"
    }
  ],
  "fullContent": "Complete formatted newsletter content ready to send",
  "alternativeSubjectLines": ["Alternative 1", "Alternative 2"],
  "sendTimeSuggestion": "Optimal send time",
  "segmentationSuggestion": "Audience segment this would work best for"
}`;

  return generateText(prompt, {
    systemPrompt: 'You are an email marketing expert who creates engaging, high-converting newsletters. Always respond with valid JSON.',
    maxTokens: 3500,
    temperature: 0.7
  });
}

// Generate Press Release
async function generatePressRelease(companyName, announcement, targetMedia) {
  const prompt = `Create a professional press release for:
Company: "${companyName}"
Announcement: "${announcement}"
Target Media: ${targetMedia || 'general business press'}

Provide the complete press release in JSON format:
{
  "headline": "Attention-grabbing headline",
  "subheadline": "Supporting subheadline",
  "dateline": "CITY, State -- Date --",
  "leadParagraph": "The most important information in first paragraph (who, what, when, where, why)",
  "bodyParagraphs": [
    "Second paragraph expanding on the news",
    "Third paragraph with additional details",
    "Fourth paragraph with quotes and context"
  ],
  "quotes": [
    {
      "speaker": "Name, Title at Company",
      "quote": "The quoted statement"
    }
  ],
  "boilerplate": "About [Company Name] - standard company description",
  "contactInfo": {
    "type": "Media Contact",
    "name": "Suggested contact name placeholder",
    "email": "email placeholder",
    "phone": "phone placeholder"
  },
  "fullRelease": "Complete formatted press release ready to distribute",
  "mediaAngle": "The story angle that makes this newsworthy",
  "targetPublications": ["Suggested publication 1", "Suggested publication 2"],
  "followUpTips": ["Tip for follow-up 1", "Tip for follow-up 2"],
  "socialMediaTeaser": "Short teaser for social media announcement"
}`;

  return generateText(prompt, {
    systemPrompt: 'You are a PR expert who writes compelling, newsworthy press releases that get media coverage. Always respond with valid JSON.',
    maxTokens: 3000,
    temperature: 0.6
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
  rewriteContent,
  // New AI Content Studio functions
  generateContentCalendarSuggestions,
  repurposeContent,
  checkPlagiarism,
  suggestImagesForContent,
  predictContentPerformance,
  generateBlogOutline,
  generateNewsletter,
  generatePressRelease
};
