require('dotenv').config({ path: '../.env' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Starting database seed...');

  // Create demo user
  const hashedPassword = await bcrypt.hash(process.env.DEMO_PASSWORD || 'Demo123!', 10);
  const user = await prisma.user.upsert({
    where: { email: process.env.DEMO_EMAIL || 'demo@aicontentstudio.com' },
    update: {},
    create: {
      email: process.env.DEMO_EMAIL || 'demo@aicontentstudio.com',
      password: hashedPassword,
      name: 'Demo User'
    }
  });
  console.log('✅ Demo user created');

  // Allow force re-seed with --force flag
  if (process.argv.includes('--force')) {
    console.log('⚠️  Force flag detected - clearing existing data...');
    await prisma.contentCalendar.deleteMany({});
    await prisma.repurposedContent.deleteMany({});
    await prisma.plagiarismCheck.deleteMany({});
    await prisma.imageSuggestion.deleteMany({});
    await prisma.performancePrediction.deleteMany({});
    await prisma.blogOutline.deleteMany({});
    await prisma.newsletter.deleteMany({});
    await prisma.pressRelease.deleteMany({});
    // Original 15 models
    await prisma.video.deleteMany({});
    await prisma.audio.deleteMany({});
    await prisma.textContent.deleteMany({});
    await prisma.image.deleteMany({});
    await prisma.translation.deleteMany({});
    await prisma.summary.deleteMany({});
    await prisma.sEOContent.deleteMany({});
    await prisma.socialPost.deleteMany({});
    await prisma.email.deleteMany({});
    await prisma.blogPost.deleteMany({});
    await prisma.marketingCopy.deleteMany({});
    await prisma.script.deleteMany({});
    await prisma.podcast.deleteMany({});
    await prisma.voiceover.deleteMany({});
    await prisma.musicTrack.deleteMany({});
    console.log('✅ Existing data cleared');
  }

  // Check if data already exists - skip seeding if so
  const existingCalendar = await prisma.contentCalendar.count();
  const existingVideos = await prisma.video.count();
  if (existingCalendar > 0 && existingVideos > 0) {
    console.log('📋 Database already has data - skipping seed to preserve your generated content');
    console.log('   (To force re-seed, run: cd backend && node src/seed.js --force)');
    console.log('🎉 Database ready!');
    return;
  }

  // =============================================
  // ORIGINAL 15 FEATURES - Seed Data (15 items each)
  // =============================================

  // --- Video ---
  const existingVideoCount = await prisma.video.count();
  if (existingVideoCount === 0) {
    const videoItems = [
      { title: 'Product Launch Teaser', prompt: 'Create a 60-second teaser video for a new SaaS product launch', style: 'cinematic', resolution: '1080p', status: 'completed' },
      { title: 'Company Culture Video', prompt: 'Behind the scenes look at our startup culture and team', style: 'casual', resolution: '1080p', status: 'completed' },
      { title: 'Tutorial: Getting Started', prompt: 'Step-by-step tutorial on how to use our platform', style: 'educational', resolution: '1080p', status: 'pending' },
      { title: 'Customer Testimonial', prompt: 'Interview style testimonial from a satisfied enterprise customer', style: 'professional', resolution: '4K', status: 'completed' },
      { title: 'Social Media Ad', prompt: 'Eye-catching 15-second ad for Instagram and TikTok', style: 'animated', resolution: '1080p', status: 'pending' },
      { title: 'Explainer Animation', prompt: 'Animated explainer of how AI content generation works', style: 'animated', resolution: '1080p', status: 'completed' },
      { title: 'Quarterly Recap', prompt: 'Highlight reel of Q1 achievements and milestones', style: 'professional', resolution: '1080p', status: 'completed' },
      { title: 'Event Highlights', prompt: 'Recap video of our annual tech conference', style: 'cinematic', resolution: '4K', status: 'pending' },
      { title: 'Feature Demo', prompt: 'Demonstration of the new AI writing assistant feature', style: 'educational', resolution: '1080p', status: 'completed' },
      { title: 'Brand Story', prompt: 'Emotional brand story about our founding journey', style: 'cinematic', resolution: '4K', status: 'completed' },
      { title: 'How-To Guide', prompt: 'Video guide on content marketing best practices', style: 'educational', resolution: '1080p', status: 'pending' },
      { title: 'Investor Update', prompt: 'Professional update video for investors and stakeholders', style: 'professional', resolution: '1080p', status: 'completed' },
      { title: 'Holiday Greeting', prompt: 'Warm holiday greeting video for customers and partners', style: 'casual', resolution: '1080p', status: 'completed' },
      { title: 'Webinar Recording', prompt: 'Full webinar on scaling content production with AI', style: 'professional', resolution: '1080p', status: 'pending' },
      { title: 'App Preview', prompt: 'App store preview video showcasing key features', style: 'animated', resolution: '1080p', status: 'completed' }
    ];
    for (const item of videoItems) {
      await prisma.video.create({ data: { ...item, userId: user.id } });
    }
    console.log('✅ Videos seeded (15 items)');
  }

  // --- Audio ---
  const existingAudioCount = await prisma.audio.count();
  if (existingAudioCount === 0) {
    const audioItems = [
      { title: 'Podcast Intro Jingle', prompt: 'Upbeat intro jingle for a tech podcast', voice: 'professional', language: 'en', status: 'completed' },
      { title: 'Meditation Narration', prompt: 'Calm guided meditation for stress relief', voice: 'calm', language: 'en', status: 'completed' },
      { title: 'Product Announcement', prompt: 'Exciting product launch announcement voiceover', voice: 'professional', language: 'en', status: 'pending' },
      { title: 'Spanish Tutorial', prompt: 'Beginner Spanish learning audio lesson', voice: 'friendly', language: 'es', status: 'completed' },
      { title: 'News Briefing', prompt: 'Daily tech news briefing in broadcast style', voice: 'professional', language: 'en', status: 'completed' },
      { title: 'Audiobook Chapter', prompt: 'Chapter narration for a business book', voice: 'neutral', language: 'en', status: 'pending' },
      { title: 'Radio Ad', prompt: '30-second radio advertisement for a fitness app', voice: 'friendly', language: 'en', status: 'completed' },
      { title: 'French Narration', prompt: 'Documentary-style narration about Paris history', voice: 'professional', language: 'fr', status: 'completed' },
      { title: 'Customer Support IVR', prompt: 'Professional IVR phone menu voice prompts', voice: 'professional', language: 'en', status: 'pending' },
      { title: 'E-Learning Module', prompt: 'Educational audio for online course on data science', voice: 'neutral', language: 'en', status: 'completed' },
      { title: 'Storytelling Audio', prompt: 'Children story narration with engaging tone', voice: 'friendly', language: 'en', status: 'completed' },
      { title: 'Motivational Speech', prompt: 'Inspiring motivational speech for team building', voice: 'professional', language: 'en', status: 'pending' },
      { title: 'German Podcast', prompt: 'Tech discussion podcast episode in German', voice: 'neutral', language: 'de', status: 'completed' },
      { title: 'Relaxation Sounds', prompt: 'Nature sounds with soft narration for sleep', voice: 'calm', language: 'en', status: 'completed' },
      { title: 'Sales Pitch', prompt: 'Persuasive sales pitch audio for cold outreach', voice: 'professional', language: 'en', status: 'pending' }
    ];
    for (const item of audioItems) {
      await prisma.audio.create({ data: { ...item, userId: user.id } });
    }
    console.log('✅ Audio seeded (15 items)');
  }

  // --- TextContent ---
  const existingTextCount = await prisma.textContent.count();
  if (existingTextCount === 0) {
    const textItems = [
      { title: 'Privacy Policy', prompt: 'Comprehensive privacy policy for a SaaS platform', type: 'legal', tone: 'formal', status: 'completed' },
      { title: 'About Us Page', prompt: 'Engaging about us page for an AI startup', type: 'web', tone: 'friendly', status: 'completed' },
      { title: 'Product Description', prompt: 'Compelling product description for an AI writing tool', type: 'product', tone: 'persuasive', status: 'pending' },
      { title: 'FAQ Section', prompt: 'Common questions and answers about our service', type: 'web', tone: 'professional', status: 'completed' },
      { title: 'Terms of Service', prompt: 'Legal terms of service for a web application', type: 'legal', tone: 'formal', status: 'completed' },
      { title: 'Landing Page Copy', prompt: 'High-converting landing page for lead generation', type: 'marketing', tone: 'persuasive', status: 'pending' },
      { title: 'Whitepaper Draft', prompt: 'Technical whitepaper on AI in content marketing', type: 'general', tone: 'professional', status: 'completed' },
      { title: 'Press Kit', prompt: 'Company press kit with key facts and messaging', type: 'marketing', tone: 'professional', status: 'completed' },
      { title: 'Job Description', prompt: 'Senior full-stack developer job posting', type: 'general', tone: 'professional', status: 'pending' },
      { title: 'Case Study', prompt: 'Customer success case study showing ROI metrics', type: 'marketing', tone: 'professional', status: 'completed' },
      { title: 'Help Center Article', prompt: 'How to integrate our API with third-party tools', type: 'web', tone: 'friendly', status: 'completed' },
      { title: 'Mission Statement', prompt: 'Inspiring company mission and vision statement', type: 'general', tone: 'professional', status: 'pending' },
      { title: 'Feature Comparison', prompt: 'Comparison table content for pricing page', type: 'product', tone: 'professional', status: 'completed' },
      { title: 'Onboarding Guide', prompt: 'New user onboarding welcome guide', type: 'web', tone: 'friendly', status: 'completed' },
      { title: 'Release Notes', prompt: 'Release notes for version 2.5 with new features', type: 'general', tone: 'professional', status: 'pending' }
    ];
    for (const item of textItems) {
      await prisma.textContent.create({ data: { ...item, userId: user.id } });
    }
    console.log('✅ Text Content seeded (15 items)');
  }

  // --- Image ---
  const existingImageCount = await prisma.image.count();
  if (existingImageCount === 0) {
    const imageItems = [
      { title: 'Hero Banner', prompt: 'Modern gradient hero banner for a tech company website', style: 'minimal', resolution: '1920x1080', status: 'completed' },
      { title: 'Team Photo', prompt: 'Professional team photo illustration with diverse characters', style: 'artistic', resolution: '1024x1024', status: 'completed' },
      { title: 'Social Media Banner', prompt: 'Eye-catching Instagram banner for a summer sale', style: 'abstract', resolution: '1024x1024', status: 'pending' },
      { title: 'Product Mockup', prompt: 'Sleek laptop showing our SaaS dashboard on screen', style: 'realistic', resolution: '1920x1080', status: 'completed' },
      { title: 'Blog Illustration', prompt: 'Illustration about artificial intelligence and creativity', style: 'cartoon', resolution: '1024x1024', status: 'completed' },
      { title: 'Logo Concept', prompt: 'Modern minimalist logo for an AI content platform', style: 'minimal', resolution: '512x512', status: 'pending' },
      { title: 'Infographic Background', prompt: 'Clean background for a content marketing infographic', style: 'minimal', resolution: '1920x1080', status: 'completed' },
      { title: 'Email Header', prompt: 'Professional email header image for weekly newsletter', style: 'artistic', resolution: '1920x1080', status: 'completed' },
      { title: 'App Icon', prompt: 'Colorful app icon for a content creation mobile app', style: 'cartoon', resolution: '512x512', status: 'pending' },
      { title: 'Presentation Slide', prompt: 'Clean slide background for an investor pitch deck', style: 'minimal', resolution: '1920x1080', status: 'completed' },
      { title: 'Event Poster', prompt: 'Vibrant poster for a tech conference event', style: 'abstract', resolution: '1024x1024', status: 'completed' },
      { title: 'YouTube Thumbnail', prompt: 'Bold YouTube thumbnail for a tutorial video', style: 'cartoon', resolution: '1920x1080', status: 'pending' },
      { title: 'OG Image', prompt: 'Open Graph image for social media sharing', style: 'minimal', resolution: '1920x1080', status: 'completed' },
      { title: 'Avatar Set', prompt: 'Set of user avatar illustrations for profiles', style: 'cartoon', resolution: '512x512', status: 'completed' },
      { title: 'Feature Screenshot', prompt: 'Polished screenshot of the analytics dashboard', style: 'realistic', resolution: '1920x1080', status: 'pending' }
    ];
    for (const item of imageItems) {
      await prisma.image.create({ data: { ...item, userId: user.id } });
    }
    console.log('✅ Images seeded (15 items)');
  }

  // --- Translation ---
  const existingTranslationCount = await prisma.translation.count();
  if (existingTranslationCount === 0) {
    const translationItems = [
      { title: 'Website Homepage - Spanish', originalText: 'Welcome to our AI-powered content creation platform. Create amazing content in minutes.', sourceLang: 'en', targetLang: 'es', status: 'completed' },
      { title: 'Marketing Email - French', originalText: 'Discover our new features that will transform your workflow. Get started today!', sourceLang: 'en', targetLang: 'fr', status: 'completed' },
      { title: 'Product Guide - German', originalText: 'This guide will walk you through the key features of our platform step by step.', sourceLang: 'en', targetLang: 'de', status: 'pending' },
      { title: 'App Store Listing - Japanese', originalText: 'The ultimate AI tool for creating professional content. Download now and start creating!', sourceLang: 'en', targetLang: 'ja', status: 'completed' },
      { title: 'Legal Terms - Portuguese', originalText: 'By using our service, you agree to these terms and conditions outlined below.', sourceLang: 'en', targetLang: 'pt', status: 'completed' },
      { title: 'Customer Support - Korean', originalText: 'How can we help you today? Our team is available 24/7 for assistance.', sourceLang: 'en', targetLang: 'ko', status: 'pending' },
      { title: 'Social Post - Italian', originalText: 'Check out our latest update! New AI features that save you hours every day.', sourceLang: 'en', targetLang: 'it', status: 'completed' },
      { title: 'Press Release - Chinese', originalText: 'We are excited to announce our expansion into the Asian market this quarter.', sourceLang: 'en', targetLang: 'zh', status: 'completed' },
      { title: 'Blog Article - Spanish', originalText: 'Content marketing is evolving rapidly with AI. Here are the top trends for this year.', sourceLang: 'en', targetLang: 'es', status: 'pending' },
      { title: 'Onboarding Flow - French', originalText: 'Welcome aboard! Let us show you around. First, create your workspace.', sourceLang: 'en', targetLang: 'fr', status: 'completed' },
      { title: 'Error Messages - German', originalText: 'Something went wrong. Please try again or contact support for assistance.', sourceLang: 'en', targetLang: 'de', status: 'completed' },
      { title: 'Newsletter - Arabic', originalText: 'This week in tech: AI breakthroughs, industry news, and tips from experts.', sourceLang: 'en', targetLang: 'ar', status: 'pending' },
      { title: 'Video Subtitles - Hindi', originalText: 'In this tutorial, we will learn how to create engaging content using AI tools.', sourceLang: 'en', targetLang: 'hi', status: 'completed' },
      { title: 'FAQ Page - Russian', originalText: 'What is AI Content Studio? It is a platform that helps you create content using AI.', sourceLang: 'en', targetLang: 'ru', status: 'completed' },
      { title: 'Ad Copy - Japanese', originalText: 'Boost your productivity by 10x. Try our AI content creator free for 14 days!', sourceLang: 'en', targetLang: 'ja', status: 'pending' }
    ];
    for (const item of translationItems) {
      await prisma.translation.create({ data: { ...item, userId: user.id } });
    }
    console.log('✅ Translations seeded (15 items)');
  }

  // --- Summary ---
  const existingSummaryCount = await prisma.summary.count();
  if (existingSummaryCount === 0) {
    const summaryItems = [
      { title: 'Q1 Earnings Report Summary', originalText: 'The company reported strong Q1 results with revenue up 35% year-over-year to $125M. Operating margins improved to 22% from 18% in the prior year. Customer count grew to 15,000 enterprise accounts. The company raised full-year guidance citing strong demand for AI products.', length: 'short', status: 'completed' },
      { title: 'Research Paper Abstract', originalText: 'This paper explores the applications of large language models in automated content generation. We analyze 500 outputs across multiple domains and evaluate quality using human raters and automated metrics. Results show that AI-generated content achieves 85% parity with human-written content in readability and engagement metrics.', length: 'medium', status: 'completed' },
      { title: 'Meeting Notes Summary', originalText: 'The team discussed the roadmap for Q2. Key decisions: 1) Launch the new editor by March 15. 2) Hire two more engineers. 3) Integrate with Slack and Notion. 4) Redesign the onboarding flow. Budget approved for $200K for new initiatives. Next meeting scheduled for next Monday.', length: 'short', status: 'pending' },
      { title: 'Legal Contract Overview', originalText: 'This Master Service Agreement outlines the terms between Company A and Company B for a 3-year engagement. Services include software development, maintenance, and support. Total contract value is $1.5M with quarterly payments. SLA guarantees 99.9% uptime. Termination requires 90 days notice.', length: 'short', status: 'completed' },
      { title: 'Industry Report Digest', originalText: 'The global AI market is projected to reach $407B by 2027, growing at a CAGR of 36.2%. Key growth drivers include enterprise adoption, generative AI tools, and automation. North America leads with 40% market share, followed by Asia Pacific. Healthcare, finance, and marketing are the fastest-growing sectors.', length: 'medium', status: 'completed' },
      { title: 'Book Summary: Lean Startup', originalText: 'The Lean Startup by Eric Ries proposes a methodology for developing businesses and products. The core idea is build-measure-learn: create a minimum viable product, test it with real customers, gather feedback, and iterate. Key concepts include validated learning, innovation accounting, and the pivot-or-persevere decision.', length: 'long', status: 'pending' },
      { title: 'Competitor Analysis Brief', originalText: 'Competitor X launched three new features this quarter: AI writing assistant, team collaboration tools, and analytics dashboard. Their pricing increased 15%. They reported 50K new users and expanded to 5 new markets. Strengths include brand recognition. Weaknesses include slow customer support and limited integrations.', length: 'short', status: 'completed' },
      { title: 'Webinar Transcript Summary', originalText: 'The webinar covered best practices for content marketing in 2024. Speaker highlighted the importance of video content, AI tools, and data-driven strategies. Q&A session covered topics like ROI measurement, team structure, and tool recommendations. Attendee engagement was high with 500+ participants.', length: 'medium', status: 'completed' },
      { title: 'Product Review Compilation', originalText: 'Users praised the intuitive interface and AI quality. Common positive themes: ease of use (mentioned 120 times), content quality (98 times), speed (85 times). Negative themes: pricing concerns (45 times), occasional inaccuracies (30 times), limited export options (22 times). Overall rating: 4.5/5 stars from 500 reviews.', length: 'short', status: 'pending' },
      { title: 'Technical Documentation', originalText: 'The API provides RESTful endpoints for content generation. Authentication uses JWT tokens. Rate limits are 100 requests per minute for free tier and 1000 for paid. Supported output formats include JSON, Markdown, and HTML. Webhooks are available for async generation. SDKs available for Python, JavaScript, and Ruby.', length: 'medium', status: 'completed' },
      { title: 'News Article Digest', originalText: 'Tech giants are investing heavily in AI infrastructure. Google announced a $10B AI research center. Microsoft expanded Azure AI services. Amazon launched new machine learning tools for developers. The competition for AI talent intensifies with average salaries rising 25% year-over-year.', length: 'short', status: 'completed' },
      { title: 'Customer Feedback Synthesis', originalText: 'Survey results from 1,000 customers show 92% satisfaction rate. Top feature requests: mobile app (340 votes), dark mode (280 votes), and API improvements (220 votes). Churn reasons include pricing (35%), feature gaps (28%), and switching to competitors (20%). NPS score improved from 45 to 62.', length: 'medium', status: 'pending' },
      { title: 'Policy Document Summary', originalText: 'The new data privacy policy implements GDPR and CCPA compliance. Key changes include explicit consent requirements, data portability rights, 30-day deletion timeline, and mandatory breach notifications. All employees must complete privacy training by month end. Third-party audits will be conducted quarterly.', length: 'short', status: 'completed' },
      { title: 'Strategy Document Brief', originalText: 'The 2024 growth strategy focuses on three pillars: product innovation, market expansion, and customer retention. Target: 100% revenue growth. Initiatives include AI model improvements, launching in Europe and Asia, and a new enterprise tier. Budget allocation: 40% R&D, 30% sales, 20% marketing, 10% operations.', length: 'long', status: 'completed' },
      { title: 'Interview Transcript', originalText: 'CEO discussed company vision for the next 5 years. Key themes: AI-first approach, sustainability, and democratizing content creation. Plans to double headcount and open offices in London and Singapore. Revenue target of $500M by 2027. Emphasized culture of innovation and customer obsession.', length: 'medium', status: 'pending' }
    ];
    for (const item of summaryItems) {
      await prisma.summary.create({ data: { ...item, userId: user.id } });
    }
    console.log('✅ Summaries seeded (15 items)');
  }

  // --- SEOContent ---
  const existingSEOCount = await prisma.sEOContent.count();
  if (existingSEOCount === 0) {
    const seoItems = [
      { title: 'AI Content Generation Guide', keyword: 'AI content generation', status: 'completed' },
      { title: 'Best Marketing Automation Tools', keyword: 'marketing automation tools', status: 'completed' },
      { title: 'How to Write Blog Posts Fast', keyword: 'write blog posts fast', status: 'pending' },
      { title: 'Content Strategy Template', keyword: 'content strategy template', status: 'completed' },
      { title: 'SEO Writing Tips 2024', keyword: 'SEO writing tips', status: 'completed' },
      { title: 'Social Media Marketing Guide', keyword: 'social media marketing guide', status: 'pending' },
      { title: 'Email Marketing Best Practices', keyword: 'email marketing best practices', status: 'completed' },
      { title: 'Video Marketing Strategy', keyword: 'video marketing strategy', status: 'completed' },
      { title: 'Podcast Growth Hacks', keyword: 'podcast growth hacks', status: 'pending' },
      { title: 'Landing Page Optimization', keyword: 'landing page optimization', status: 'completed' },
      { title: 'Conversion Rate Tips', keyword: 'conversion rate optimization tips', status: 'completed' },
      { title: 'B2B Content Marketing', keyword: 'B2B content marketing', status: 'pending' },
      { title: 'Copywriting Formulas', keyword: 'copywriting formulas', status: 'completed' },
      { title: 'Local SEO Guide', keyword: 'local SEO for small business', status: 'completed' },
      { title: 'Link Building Strategies', keyword: 'link building strategies 2024', status: 'pending' }
    ];
    for (const item of seoItems) {
      await prisma.sEOContent.create({ data: { ...item, userId: user.id } });
    }
    console.log('✅ SEO Content seeded (15 items)');
  }

  // --- SocialPost ---
  const existingSocialCount = await prisma.socialPost.count();
  if (existingSocialCount === 0) {
    const socialItems = [
      { title: 'Product Launch Announcement', platform: 'twitter', prompt: 'Announce our new AI content generator with excitement', status: 'completed' },
      { title: 'Behind the Scenes', platform: 'instagram', prompt: 'Show our team working on the latest features', status: 'completed' },
      { title: 'Industry Insights', platform: 'linkedin', prompt: 'Share insights about AI trends in content marketing', status: 'pending' },
      { title: 'Customer Spotlight', platform: 'facebook', prompt: 'Feature a customer success story with metrics', status: 'completed' },
      { title: 'Quick Tips Thread', platform: 'twitter', prompt: 'Thread of 10 productivity tips for content creators', status: 'completed' },
      { title: 'Team Celebration', platform: 'instagram', prompt: 'Celebrate reaching 10,000 users milestone', status: 'pending' },
      { title: 'Thought Leadership', platform: 'linkedin', prompt: 'Deep dive into the future of AI-powered marketing', status: 'completed' },
      { title: 'Poll: Favorite Feature', platform: 'twitter', prompt: 'Engage audience with a poll about their favorite features', status: 'completed' },
      { title: 'Tutorial Reel', platform: 'tiktok', prompt: '60-second tutorial on using AI to write blog posts', status: 'pending' },
      { title: 'Motivational Monday', platform: 'instagram', prompt: 'Inspirational quote about creativity and technology', status: 'completed' },
      { title: 'New Feature Alert', platform: 'facebook', prompt: 'Announce the new analytics dashboard feature', status: 'completed' },
      { title: 'AMA Announcement', platform: 'linkedin', prompt: 'Announce upcoming Ask Me Anything session with CEO', status: 'pending' },
      { title: 'User Generated Content', platform: 'instagram', prompt: 'Showcase amazing content created by our users', status: 'completed' },
      { title: 'Trending Topic Take', platform: 'twitter', prompt: 'Our take on the latest AI developments in the news', status: 'completed' },
      { title: 'Weekend Challenge', platform: 'tiktok', prompt: 'Fun weekend content creation challenge for followers', status: 'pending' }
    ];
    for (const item of socialItems) {
      await prisma.socialPost.create({ data: { ...item, userId: user.id } });
    }
    console.log('✅ Social Posts seeded (15 items)');
  }

  // --- Email ---
  const existingEmailCount = await prisma.email.count();
  if (existingEmailCount === 0) {
    const emailItems = [
      { title: 'Welcome Email', type: 'welcome', prompt: 'Warm welcome email for new users with getting started tips', status: 'completed' },
      { title: 'Weekly Newsletter', type: 'newsletter', prompt: 'Weekly roundup of AI content creation tips and news', status: 'completed' },
      { title: 'Product Update', type: 'announcement', prompt: 'Announce three new features launched this month', status: 'pending' },
      { title: 'Re-engagement Campaign', type: 'marketing', prompt: 'Win back inactive users with a special offer', status: 'completed' },
      { title: 'Onboarding Day 3', type: 'followup', prompt: 'Third day onboarding email with advanced feature tips', status: 'completed' },
      { title: 'Black Friday Promo', type: 'marketing', prompt: '50% off Black Friday promotion for annual plans', status: 'pending' },
      { title: 'Survey Request', type: 'followup', prompt: 'Request customer feedback through NPS survey', status: 'completed' },
      { title: 'Feature Spotlight', type: 'newsletter', prompt: 'Deep dive into the AI writing assistant feature', status: 'completed' },
      { title: 'Referral Program', type: 'marketing', prompt: 'Invite friends referral program announcement', status: 'pending' },
      { title: 'Year in Review', type: 'newsletter', prompt: 'Annual review of user achievements and platform stats', status: 'completed' },
      { title: 'Trial Expiring', type: 'followup', prompt: 'Reminder that free trial expires in 3 days', status: 'completed' },
      { title: 'Webinar Invite', type: 'announcement', prompt: 'Invitation to exclusive content marketing masterclass', status: 'pending' },
      { title: 'Case Study Share', type: 'marketing', prompt: 'Share a customer success story with compelling results', status: 'completed' },
      { title: 'Tips & Tricks', type: 'newsletter', prompt: 'Monthly tips and tricks for better content creation', status: 'completed' },
      { title: 'Account Upgrade', type: 'marketing', prompt: 'Encourage free users to upgrade to premium plan', status: 'pending' }
    ];
    for (const item of emailItems) {
      await prisma.email.create({ data: { ...item, userId: user.id } });
    }
    console.log('✅ Emails seeded (15 items)');
  }

  // --- BlogPost ---
  const existingBlogCount = await prisma.blogPost.count();
  if (existingBlogCount === 0) {
    const blogItems = [
      { title: 'The Future of AI Content Creation', topic: 'How AI is revolutionizing the way we create content', keywords: 'AI, content creation, future', status: 'completed' },
      { title: '10 SEO Tips for 2024', topic: 'Actionable SEO strategies that work in the current landscape', keywords: 'SEO, tips, ranking, Google', status: 'completed' },
      { title: 'Content Marketing ROI Guide', topic: 'How to measure and improve your content marketing ROI', keywords: 'content marketing, ROI, metrics', status: 'pending' },
      { title: 'Building a Content Calendar', topic: 'Step-by-step guide to creating an effective content calendar', keywords: 'content calendar, planning, strategy', status: 'completed' },
      { title: 'Email Marketing Mastery', topic: 'Advanced email marketing techniques for higher conversion', keywords: 'email marketing, conversion, campaigns', status: 'completed' },
      { title: 'Social Media Trends', topic: 'Top social media trends shaping digital marketing', keywords: 'social media, trends, marketing', status: 'pending' },
      { title: 'Copywriting Secrets', topic: 'Professional copywriting techniques that drive sales', keywords: 'copywriting, sales, persuasion', status: 'completed' },
      { title: 'Video Marketing 101', topic: 'Beginners guide to video content marketing', keywords: 'video marketing, YouTube, content', status: 'completed' },
      { title: 'Podcast Launch Guide', topic: 'Everything you need to launch a successful podcast', keywords: 'podcast, launch, audience', status: 'pending' },
      { title: 'AI Tools Comparison', topic: 'Comparing the top 10 AI content creation tools', keywords: 'AI tools, comparison, review', status: 'completed' },
      { title: 'Remote Team Productivity', topic: 'Tips for maintaining productivity in remote content teams', keywords: 'remote work, productivity, teams', status: 'completed' },
      { title: 'Brand Voice Guide', topic: 'How to develop and maintain a consistent brand voice', keywords: 'brand voice, consistency, messaging', status: 'pending' },
      { title: 'Analytics for Content', topic: 'Understanding analytics to improve content performance', keywords: 'analytics, metrics, performance', status: 'completed' },
      { title: 'Guest Posting Strategy', topic: 'How to use guest posts for authority and traffic', keywords: 'guest posting, backlinks, authority', status: 'completed' },
      { title: 'Content Repurposing', topic: 'Maximize content value by repurposing across platforms', keywords: 'repurposing, content, efficiency', status: 'pending' }
    ];
    for (const item of blogItems) {
      await prisma.blogPost.create({ data: { ...item, userId: user.id } });
    }
    console.log('✅ Blog Posts seeded (15 items)');
  }

  // --- MarketingCopy ---
  const existingMarketingCount = await prisma.marketingCopy.count();
  if (existingMarketingCount === 0) {
    const marketingItems = [
      { title: 'Homepage Hero Copy', product: 'AI Content Studio', targetAud: 'Content marketers', status: 'completed' },
      { title: 'Google Ads Copy', product: 'AI Writing Assistant', targetAud: 'Small business owners', status: 'completed' },
      { title: 'Facebook Ad Campaign', product: 'Content Calendar Tool', targetAud: 'Social media managers', status: 'pending' },
      { title: 'Product Hunt Launch', product: 'AI Content Studio v2.0', targetAud: 'Early adopters and developers', status: 'completed' },
      { title: 'Sales Page Copy', product: 'Enterprise AI Suite', targetAud: 'Enterprise marketing teams', status: 'completed' },
      { title: 'LinkedIn Ad Copy', product: 'B2B Content Generator', targetAud: 'Marketing directors', status: 'pending' },
      { title: 'App Store Description', product: 'AI Content Mobile App', targetAud: 'Mobile content creators', status: 'completed' },
      { title: 'Pricing Page Copy', product: 'All Plans', targetAud: 'Potential customers', status: 'completed' },
      { title: 'Retargeting Ad', product: 'Premium Plan', targetAud: 'Trial users who did not convert', status: 'pending' },
      { title: 'Partnership Pitch', product: 'API Integration', targetAud: 'Technology partners', status: 'completed' },
      { title: 'Trade Show Banner', product: 'Full Platform', targetAud: 'Conference attendees', status: 'completed' },
      { title: 'Affiliate Program', product: 'Referral System', targetAud: 'Bloggers and influencers', status: 'pending' },
      { title: 'Comparison Landing', product: 'AI Content Studio vs Competitors', targetAud: 'Decision makers', status: 'completed' },
      { title: 'Testimonial Request', product: 'Customer Review', targetAud: 'Active enterprise users', status: 'completed' },
      { title: 'Holiday Campaign', product: 'Annual Plan Discount', targetAud: 'All segments', status: 'pending' }
    ];
    for (const item of marketingItems) {
      await prisma.marketingCopy.create({ data: { ...item, userId: user.id } });
    }
    console.log('✅ Marketing Copy seeded (15 items)');
  }

  // --- Script ---
  const existingScriptCount = await prisma.script.count();
  if (existingScriptCount === 0) {
    const scriptItems = [
      { title: 'Product Demo Script', type: 'video', topic: 'Walk through the key features of our AI platform', duration: 5, status: 'completed' },
      { title: 'Podcast Interview Questions', type: 'podcast', topic: 'Interview questions for a marketing expert guest', duration: 30, status: 'completed' },
      { title: 'Sales Presentation', type: 'presentation', topic: 'Enterprise sales pitch with ROI calculator', duration: 15, status: 'pending' },
      { title: 'YouTube Tutorial', type: 'video', topic: 'How to use AI to create blog posts in 5 minutes', duration: 10, status: 'completed' },
      { title: 'Webinar Script', type: 'presentation', topic: 'Content marketing masterclass for beginners', duration: 60, status: 'completed' },
      { title: 'TikTok Series', type: 'video', topic: 'Quick AI tips series - 5 episodes of 60 seconds each', duration: 1, status: 'pending' },
      { title: 'Radio Advertisement', type: 'audio', topic: '30-second radio spot for brand awareness', duration: 1, status: 'completed' },
      { title: 'Investor Pitch', type: 'presentation', topic: 'Series A pitch deck presentation script', duration: 20, status: 'completed' },
      { title: 'Training Video', type: 'video', topic: 'Employee onboarding training for the content team', duration: 25, status: 'pending' },
      { title: 'Customer Story', type: 'video', topic: 'Documentary-style customer success video', duration: 8, status: 'completed' },
      { title: 'Podcast Monologue', type: 'podcast', topic: 'Solo episode about the state of AI in marketing', duration: 20, status: 'completed' },
      { title: 'Explainer Video', type: 'video', topic: 'How our AI content engine works under the hood', duration: 3, status: 'pending' },
      { title: 'Conference Talk', type: 'presentation', topic: 'Keynote on democratizing content creation with AI', duration: 45, status: 'completed' },
      { title: 'Brand Video', type: 'video', topic: 'Emotional brand story about empowering creators', duration: 2, status: 'completed' },
      { title: 'Podcast Outro', type: 'podcast', topic: 'Weekly podcast outro with call-to-action', duration: 1, status: 'pending' }
    ];
    for (const item of scriptItems) {
      await prisma.script.create({ data: { ...item, userId: user.id } });
    }
    console.log('✅ Scripts seeded (15 items)');
  }

  // --- Podcast ---
  const existingPodcastCount = await prisma.podcast.count();
  if (existingPodcastCount === 0) {
    const podcastItems = [
      { title: 'AI in Marketing - Episode 1', topic: 'Introduction to AI-powered marketing tools', description: 'Premiere episode exploring how AI is changing marketing', status: 'completed' },
      { title: 'Content Creation Secrets', topic: 'Professional content creators share their secrets', description: 'Interview with top content creators about their workflows', status: 'completed' },
      { title: 'Startup Growth Stories', topic: 'How startups scale their content marketing', description: 'Case studies from successful startups', status: 'pending' },
      { title: 'SEO Deep Dive', topic: 'Advanced SEO strategies for content marketers', description: 'Technical SEO tips that actually move the needle', status: 'completed' },
      { title: 'Social Media Mastery', topic: 'Building a brand on social media platforms', description: 'Strategies for growing your social presence organically', status: 'completed' },
      { title: 'Email Marketing Trends', topic: 'What works in email marketing right now', description: 'Current trends and future predictions for email', status: 'pending' },
      { title: 'Video Content Strategy', topic: 'Creating a video content strategy from scratch', description: 'How to plan and execute video marketing effectively', status: 'completed' },
      { title: 'The Creator Economy', topic: 'How individual creators are building businesses', description: 'Exploring the rise of the creator economy', status: 'completed' },
      { title: 'B2B Content Playbook', topic: 'Content marketing strategies for B2B companies', description: 'What works differently in B2B content', status: 'pending' },
      { title: 'Analytics & Metrics', topic: 'Understanding content marketing analytics', description: 'Which metrics matter and how to track them', status: 'completed' },
      { title: 'Writing Better Headlines', topic: 'The science behind headlines that get clicks', description: 'Data-driven approach to writing compelling headlines', status: 'completed' },
      { title: 'Remote Work & Content', topic: 'Managing content teams remotely', description: 'Tools and strategies for distributed content teams', status: 'pending' },
      { title: 'AI Ethics in Content', topic: 'Ethical considerations when using AI for content', description: 'Navigating the ethical landscape of AI-generated content', status: 'completed' },
      { title: 'Monetizing Content', topic: 'How to turn content into revenue', description: 'Revenue models and monetization strategies for creators', status: 'completed' },
      { title: 'Future of Blogging', topic: 'Is blogging still relevant in 2024?', description: 'Examining the evolving role of blogs in content strategy', status: 'pending' }
    ];
    for (const item of podcastItems) {
      await prisma.podcast.create({ data: { ...item, userId: user.id } });
    }
    console.log('✅ Podcasts seeded (15 items)');
  }

  // --- Voiceover ---
  const existingVoiceoverCount = await prisma.voiceover.count();
  if (existingVoiceoverCount === 0) {
    const voiceoverItems = [
      { title: 'Product Demo Narration', text: 'Welcome to AI Content Studio, the all-in-one platform for creating professional content with AI.', voice: 'professional', language: 'en', status: 'completed' },
      { title: 'Explainer Video VO', text: 'In just three simple steps, you can transform your ideas into polished, publish-ready content.', voice: 'friendly', language: 'en', status: 'completed' },
      { title: 'Meditation Guide', text: 'Close your eyes and take a deep breath. Feel the tension leaving your body as you relax.', voice: 'calm', language: 'en', status: 'pending' },
      { title: 'Commercial Narration', text: 'Introducing the future of content creation. Faster. Smarter. More creative than ever before.', voice: 'dramatic', language: 'en', status: 'completed' },
      { title: 'Training Video VO', text: 'In this module, you will learn how to set up your first project and generate content using AI.', voice: 'professional', language: 'en', status: 'completed' },
      { title: 'Spanish Welcome', text: 'Bienvenido a nuestra plataforma. Estamos encantados de tenerte aquí.', voice: 'friendly', language: 'es', status: 'pending' },
      { title: 'App Tour Guide', text: 'Let me show you around. This is your dashboard where you can manage all your content projects.', voice: 'friendly', language: 'en', status: 'completed' },
      { title: 'Podcast Intro', text: 'You are listening to Content Mastery, the podcast where we explore the art and science of content creation.', voice: 'professional', language: 'en', status: 'completed' },
      { title: 'French Documentary', text: 'L\'intelligence artificielle transforme notre façon de créer du contenu.', voice: 'professional', language: 'fr', status: 'pending' },
      { title: 'IVR Phone Menu', text: 'Thank you for calling AI Content Studio. Press 1 for sales, 2 for support, or 3 for billing.', voice: 'neutral', language: 'en', status: 'completed' },
      { title: 'Motivational VO', text: 'Every great piece of content starts with a single idea. Let AI help you bring that idea to life.', voice: 'dramatic', language: 'en', status: 'completed' },
      { title: 'German Tutorial', text: 'Willkommen zu unserem Tutorial. Heute lernen Sie, wie Sie KI für die Inhaltserstellung nutzen.', voice: 'professional', language: 'de', status: 'pending' },
      { title: 'Audiobook Opening', text: 'Chapter One: The Rise of AI. It was a time of unprecedented change in the world of technology.', voice: 'neutral', language: 'en', status: 'completed' },
      { title: 'Event Announcement', text: 'Join us for the biggest content marketing event of the year. Register now for early bird pricing.', voice: 'friendly', language: 'en', status: 'completed' },
      { title: 'Brand Manifesto', text: 'We believe that everyone deserves access to professional-quality content. That is why we built AI Content Studio.', voice: 'dramatic', language: 'en', status: 'pending' }
    ];
    for (const item of voiceoverItems) {
      await prisma.voiceover.create({ data: { ...item, userId: user.id } });
    }
    console.log('✅ Voiceovers seeded (15 items)');
  }

  // --- MusicTrack ---
  const existingMusicCount = await prisma.musicTrack.count();
  if (existingMusicCount === 0) {
    const musicItems = [
      { title: 'Corporate Background', genre: 'corporate', mood: 'uplifting', prompt: 'Upbeat corporate background music for presentations', status: 'completed' },
      { title: 'Ambient Chill', genre: 'ambient', mood: 'calm', prompt: 'Relaxing ambient track for meditation and focus', status: 'completed' },
      { title: 'Cinematic Trailer', genre: 'cinematic', mood: 'dramatic', prompt: 'Epic cinematic music for movie trailer or promo video', status: 'pending' },
      { title: 'Pop Jingle', genre: 'pop', mood: 'happy', prompt: 'Catchy pop jingle for a brand commercial', status: 'completed' },
      { title: 'Electronic Beat', genre: 'electronic', mood: 'energetic', prompt: 'High-energy electronic beat for workout content', status: 'completed' },
      { title: 'Jazz Background', genre: 'jazz', mood: 'calm', prompt: 'Smooth jazz for restaurant or lounge ambiance', status: 'pending' },
      { title: 'Rock Intro', genre: 'rock', mood: 'energetic', prompt: 'Powerful rock intro for a gaming channel', status: 'completed' },
      { title: 'Classical Piano', genre: 'classical', mood: 'peaceful', prompt: 'Gentle classical piano piece for emotional content', status: 'completed' },
      { title: 'Lo-Fi Study', genre: 'electronic', mood: 'calm', prompt: 'Lo-fi hip hop beats for studying and working', status: 'pending' },
      { title: 'Podcast Bed', genre: 'ambient', mood: 'calm', prompt: 'Subtle background music for podcast conversations', status: 'completed' },
      { title: 'Celebration Track', genre: 'pop', mood: 'happy', prompt: 'Festive celebration music for milestone announcements', status: 'completed' },
      { title: 'Suspense Theme', genre: 'cinematic', mood: 'dramatic', prompt: 'Tense suspense music for mystery or thriller content', status: 'pending' },
      { title: 'Acoustic Folk', genre: 'rock', mood: 'peaceful', prompt: 'Warm acoustic folk guitar for storytelling content', status: 'completed' },
      { title: 'Tech Innovation', genre: 'electronic', mood: 'uplifting', prompt: 'Futuristic electronic music for tech product videos', status: 'completed' },
      { title: 'Outro Music', genre: 'corporate', mood: 'calm', prompt: 'Gentle fade-out outro music for video endings', status: 'pending' }
    ];
    for (const item of musicItems) {
      await prisma.musicTrack.create({ data: { ...item, userId: user.id } });
    }
    console.log('✅ Music Tracks seeded (15 items)');
  }

  // =============================================
  // NEW AI CONTENT STUDIO FEATURES (8 models)
  // =============================================

  // Check if new features already seeded
  const existingCalendarItems = await prisma.contentCalendar.count();
  if (existingCalendarItems === 0) {
    // Seed Content Calendar (15 items)
    const calendarItems = [
      { title: 'Q1 Product Launch Blog', contentType: 'blog', scheduledDate: new Date('2024-03-15'), platform: 'website', topic: 'New product features and benefits', status: 'scheduled' },
      { title: 'Weekly Newsletter #12', contentType: 'email', scheduledDate: new Date('2024-03-18'), platform: 'email', topic: 'Industry trends and company updates', status: 'draft' },
      { title: 'Instagram Product Teaser', contentType: 'social', scheduledDate: new Date('2024-03-20'), platform: 'instagram', topic: 'Behind the scenes product development', status: 'pending' },
      { title: 'LinkedIn Thought Leadership', contentType: 'social', scheduledDate: new Date('2024-03-22'), platform: 'linkedin', topic: 'Future of AI in marketing', status: 'scheduled' },
      { title: 'YouTube Tutorial Video', contentType: 'video', scheduledDate: new Date('2024-03-25'), platform: 'youtube', topic: 'How to use our new features', status: 'pending' },
      { title: 'Twitter Thread - Tips', contentType: 'social', scheduledDate: new Date('2024-03-26'), platform: 'twitter', topic: '10 productivity tips for remote workers', status: 'draft' },
      { title: 'Case Study Publication', contentType: 'blog', scheduledDate: new Date('2024-03-28'), platform: 'website', topic: 'Customer success story with ROI metrics', status: 'scheduled' },
      { title: 'Podcast Episode Recording', contentType: 'podcast', scheduledDate: new Date('2024-04-01'), platform: 'spotify', topic: 'Interview with industry expert', status: 'pending' },
      { title: 'TikTok Behind the Scenes', contentType: 'social', scheduledDate: new Date('2024-04-03'), platform: 'tiktok', topic: 'Day in the life at our startup', status: 'draft' },
      { title: 'Email Drip Campaign Start', contentType: 'email', scheduledDate: new Date('2024-04-05'), platform: 'email', topic: 'Onboarding sequence for new users', status: 'scheduled' },
      { title: 'Webinar Announcement', contentType: 'email', scheduledDate: new Date('2024-04-08'), platform: 'email', topic: 'Upcoming webinar on best practices', status: 'pending' },
      { title: 'Facebook Community Post', contentType: 'social', scheduledDate: new Date('2024-04-10'), platform: 'facebook', topic: 'User poll and engagement post', status: 'draft' },
      { title: 'SEO Blog Article', contentType: 'blog', scheduledDate: new Date('2024-04-12'), platform: 'website', topic: 'Complete guide to content marketing', status: 'scheduled' },
      { title: 'Press Release Draft', contentType: 'press', scheduledDate: new Date('2024-04-15'), platform: 'media', topic: 'Partnership announcement', status: 'pending' },
      { title: 'Instagram Carousel', contentType: 'social', scheduledDate: new Date('2024-04-17'), platform: 'instagram', topic: '5 ways to improve your workflow', status: 'draft' }
    ];
    for (const item of calendarItems) {
      await prisma.contentCalendar.create({ data: { ...item, userId: user.id } });
    }
    console.log('✅ Content Calendar seeded (15 items)');
  }

  const existingRepurposed = await prisma.repurposedContent.count();
  if (existingRepurposed === 0) {
    const repurposedItems = [
      { title: 'Blog to Twitter Thread', originalContent: 'Our comprehensive guide to content marketing covers everything from strategy to execution...', originalType: 'blog', targetType: 'thread', targetPlatform: 'twitter', status: 'completed', repurposedContent: 'Thread: Content Marketing 101\n\n1/ Strategy is everything...' },
      { title: 'Podcast to Blog Summary', originalContent: 'In this episode, we discussed the future of AI with John Smith...', originalType: 'podcast', targetType: 'blog', targetPlatform: 'website', status: 'completed' },
      { title: 'Video Script to LinkedIn', originalContent: 'Welcome to our tutorial on productivity hacks...', originalType: 'video', targetType: 'post', targetPlatform: 'linkedin', status: 'pending' },
      { title: 'Case Study to Infographic', originalContent: 'Company X increased their revenue by 150% using our platform...', originalType: 'blog', targetType: 'infographic', targetPlatform: 'general', status: 'completed' },
      { title: 'Webinar to Email Series', originalContent: 'Thank you for joining our webinar on digital transformation...', originalType: 'video', targetType: 'email', targetPlatform: 'email', status: 'pending' },
      { title: 'Blog to Instagram Carousel', originalContent: '10 Tips for Better Remote Work: 1. Set up a dedicated workspace...', originalType: 'blog', targetType: 'carousel', targetPlatform: 'instagram', status: 'completed' },
      { title: 'Newsletter to Social Posts', originalContent: 'This week we launched our new feature, hosted a webinar...', originalType: 'email', targetType: 'social', targetPlatform: 'multiple', status: 'pending' },
      { title: 'Research Report to Blog', originalContent: 'Our analysis of 10,000 marketing campaigns revealed...', originalType: 'report', targetType: 'blog', targetPlatform: 'website', status: 'completed' },
      { title: 'Interview to Quote Graphics', originalContent: 'The most important thing in business is authenticity...', originalType: 'podcast', targetType: 'graphics', targetPlatform: 'instagram', status: 'pending' },
      { title: 'Tutorial to Quick Tips', originalContent: 'In this 30-minute tutorial, we cover advanced features...', originalType: 'video', targetType: 'tips', targetPlatform: 'tiktok', status: 'completed' },
      { title: 'White Paper to Blog Series', originalContent: 'The State of AI in 2024: A comprehensive analysis...', originalType: 'whitepaper', targetType: 'blog', targetPlatform: 'website', status: 'pending' },
      { title: 'Customer Story to Video', originalContent: 'Jane from Company Y shares her experience...', originalType: 'blog', targetType: 'video', targetPlatform: 'youtube', status: 'completed' },
      { title: 'FAQ to Social Content', originalContent: 'Q: How do I get started? A: Simply sign up...', originalType: 'faq', targetType: 'social', targetPlatform: 'multiple', status: 'pending' },
      { title: 'Press Release to Social', originalContent: 'FOR IMMEDIATE RELEASE: Company announces...', originalType: 'press', targetType: 'social', targetPlatform: 'linkedin', status: 'completed' },
      { title: 'Slide Deck to Blog', originalContent: 'Slide 1: Introduction to Growth Hacking...', originalType: 'presentation', targetType: 'blog', targetPlatform: 'website', status: 'pending' }
    ];
    for (const item of repurposedItems) {
      await prisma.repurposedContent.create({ data: { ...item, userId: user.id } });
    }
    console.log('✅ Repurposed Content seeded (15 items)');
  }

  const existingPlagiarism = await prisma.plagiarismCheck.count();
  if (existingPlagiarism === 0) {
    const plagiarismItems = [
      { title: 'Blog Post Draft Check', content: 'Artificial intelligence is transforming how businesses operate. From automation to insights, AI provides unprecedented opportunities for growth and efficiency.', originalityScore: 92, plagiarismScore: 8, status: 'completed' },
      { title: 'Product Description Review', content: 'Our revolutionary software helps teams collaborate seamlessly. With real-time updates and intuitive design, productivity soars.', originalityScore: 88, plagiarismScore: 12, status: 'completed' },
      { title: 'Marketing Copy Analysis', content: 'Transform your workflow today. Join thousands of satisfied customers who have already made the switch.', originalityScore: 75, plagiarismScore: 25, status: 'completed' },
      { title: 'Academic Paper Intro', content: 'The study of machine learning has evolved significantly over the past decade, with neural networks becoming increasingly sophisticated.', originalityScore: 95, plagiarismScore: 5, status: 'completed' },
      { title: 'Website Homepage Copy', content: 'Welcome to the future of productivity. We help teams work smarter, not harder.', originalityScore: 70, plagiarismScore: 30, status: 'completed' },
      { title: 'Social Media Caption', content: 'Monday motivation: Success is not final, failure is not fatal. Keep pushing forward!', originalityScore: 45, plagiarismScore: 55, status: 'completed' },
      { title: 'Email Newsletter Content', content: 'This week in tech: AI advances, cybersecurity updates, and the latest in cloud computing.', originalityScore: 82, plagiarismScore: 18, status: 'completed' },
      { title: 'Press Release Draft', content: 'Company X announces groundbreaking partnership to expand global reach and enhance service offerings.', originalityScore: 90, plagiarismScore: 10, status: 'pending' },
      { title: 'Case Study Writing', content: 'Client achieved 200% ROI within six months of implementation. Here is how they did it.', originalityScore: 87, plagiarismScore: 13, status: 'completed' },
      { title: 'Video Script Check', content: 'Hey everyone, welcome back to our channel. Today we are going to explore the top 10 productivity apps.', originalityScore: 78, plagiarismScore: 22, status: 'completed' },
      { title: 'LinkedIn Article', content: 'Leadership in the digital age requires adaptability, empathy, and a commitment to continuous learning.', originalityScore: 85, plagiarismScore: 15, status: 'pending' },
      { title: 'Technical Documentation', content: 'The API endpoint accepts POST requests with JSON payload containing user credentials.', originalityScore: 65, plagiarismScore: 35, status: 'completed' },
      { title: 'Ebook Chapter Draft', content: 'Chapter 3: Building Your Personal Brand. In today competitive market, standing out is essential.', originalityScore: 91, plagiarismScore: 9, status: 'completed' },
      { title: 'Grant Proposal Intro', content: 'This proposal outlines our innovative approach to solving urban transportation challenges.', originalityScore: 94, plagiarismScore: 6, status: 'pending' },
      { title: 'Guest Blog Submission', content: 'Five strategies for sustainable business growth in uncertain economic times.', originalityScore: 80, plagiarismScore: 20, status: 'completed' }
    ];
    for (const item of plagiarismItems) {
      await prisma.plagiarismCheck.create({ data: { ...item, userId: user.id } });
    }
    console.log('✅ Plagiarism Checks seeded (15 items)');
  }

  const existingImageSuggestions = await prisma.imageSuggestion.count();
  if (existingImageSuggestions === 0) {
    const imageSuggestionItems = [
      { title: 'Tech Blog Hero Image', content: 'Our latest blog post about AI trends in 2024 discusses machine learning, automation, and the future of work.', contentType: 'blog', status: 'completed' },
      { title: 'Social Media Campaign', content: 'Summer sale announcement: Get 30% off all products this weekend only!', contentType: 'social', status: 'completed' },
      { title: 'Email Newsletter Header', content: 'Weekly digest covering industry news, product updates, and upcoming events.', contentType: 'email', status: 'pending' },
      { title: 'Landing Page Visuals', content: 'Convert more visitors with our proven marketing automation platform.', contentType: 'landing', status: 'completed' },
      { title: 'Product Launch Post', content: 'Introducing our newest feature: AI-powered content suggestions that save you hours.', contentType: 'social', status: 'completed' },
      { title: 'Case Study Graphics', content: 'How Company X increased conversion rates by 150% in just 3 months.', contentType: 'blog', status: 'pending' },
      { title: 'Tutorial Thumbnails', content: 'Step-by-step guide to setting up your first marketing campaign.', contentType: 'video', status: 'completed' },
      { title: 'Infographic Content', content: 'The complete guide to content marketing: strategy, creation, distribution, and measurement.', contentType: 'infographic', status: 'completed' },
      { title: 'Event Promotion', content: 'Join us for our annual conference featuring industry leaders and networking opportunities.', contentType: 'social', status: 'pending' },
      { title: 'Team Introduction', content: 'Meet the people behind our success: passionate experts dedicated to your growth.', contentType: 'blog', status: 'completed' },
      { title: 'Feature Highlight', content: 'Our analytics dashboard provides real-time insights into your marketing performance.', contentType: 'social', status: 'completed' },
      { title: 'Holiday Campaign', content: 'Celebrate the season with exclusive deals and heartfelt gratitude to our customers.', contentType: 'email', status: 'pending' },
      { title: 'Testimonial Post', content: 'Our customers love us: Real stories from real users about their success.', contentType: 'social', status: 'completed' },
      { title: 'How-To Guide Images', content: 'Learn how to create engaging social media content that drives results.', contentType: 'blog', status: 'completed' },
      { title: 'Podcast Cover Art', content: 'Weekly discussions on marketing, technology, and business growth strategies.', contentType: 'podcast', status: 'pending' }
    ];
    for (const item of imageSuggestionItems) {
      await prisma.imageSuggestion.create({ data: { ...item, userId: user.id } });
    }
    console.log('✅ Image Suggestions seeded (15 items)');
  }

  const existingPerformance = await prisma.performancePrediction.count();
  if (existingPerformance === 0) {
    const performanceItems = [
      { title: 'Product Launch Tweet', content: 'Exciting news! Our new AI feature is here. Transform your workflow today. #AI #ProductLaunch', contentType: 'social', platform: 'twitter', predictedScore: 78, viralityScore: 65, status: 'completed' },
      { title: 'LinkedIn Article', content: 'The future of remote work: 5 trends that will shape how we collaborate in 2024 and beyond.', contentType: 'blog', platform: 'linkedin', predictedScore: 85, viralityScore: 45, status: 'completed' },
      { title: 'Instagram Reel Concept', content: 'Quick tips for productivity: The 5-minute morning routine that changed everything.', contentType: 'video', platform: 'instagram', predictedScore: 72, viralityScore: 80, status: 'completed' },
      { title: 'Email Subject Line Test', content: 'You wont believe what we just launched...', contentType: 'email', platform: 'email', predictedScore: 65, viralityScore: 30, status: 'completed' },
      { title: 'Blog Post SEO Check', content: 'Complete guide to content marketing: Strategy, creation, and measurement for 2024.', contentType: 'blog', platform: 'website', predictedScore: 88, viralityScore: 35, status: 'pending' },
      { title: 'YouTube Video Title', content: 'I tried AI tools for 30 days - Here is what happened to my productivity.', contentType: 'video', platform: 'youtube', predictedScore: 82, viralityScore: 75, status: 'completed' },
      { title: 'Facebook Ad Copy', content: 'Tired of manual tasks? Automate your workflow and save 10 hours every week.', contentType: 'ad', platform: 'facebook', predictedScore: 70, viralityScore: 40, status: 'completed' },
      { title: 'TikTok Hook Analysis', content: 'Stop scrolling - this productivity hack will change your life in 30 seconds.', contentType: 'video', platform: 'tiktok', predictedScore: 75, viralityScore: 85, status: 'completed' },
      { title: 'Newsletter Open Rate', content: 'This Week: AI Updates, New Features, and a Special Announcement', contentType: 'email', platform: 'email', predictedScore: 68, viralityScore: 25, status: 'pending' },
      { title: 'Pinterest Pin Description', content: 'Home office setup ideas that boost productivity and creativity. Save for later!', contentType: 'social', platform: 'pinterest', predictedScore: 77, viralityScore: 55, status: 'completed' },
      { title: 'Press Release Impact', content: 'Tech Startup Raises $10M to Revolutionize Content Creation with AI', contentType: 'press', platform: 'media', predictedScore: 80, viralityScore: 50, status: 'completed' },
      { title: 'Podcast Episode Title', content: 'How This Founder Built a $1M Business in 12 Months (Exclusive Interview)', contentType: 'podcast', platform: 'spotify', predictedScore: 83, viralityScore: 60, status: 'pending' },
      { title: 'Reddit Post Potential', content: 'I built an AI tool that writes content in seconds - AMA about the journey', contentType: 'social', platform: 'reddit', predictedScore: 72, viralityScore: 70, status: 'completed' },
      { title: 'Webinar Registration', content: 'Free Masterclass: Scale Your Content Production 10x with AI', contentType: 'email', platform: 'email', predictedScore: 76, viralityScore: 35, status: 'completed' },
      { title: 'Twitter Thread Ideas', content: 'I analyzed 1000 viral tweets. Here are the 10 patterns I found...', contentType: 'social', platform: 'twitter', predictedScore: 88, viralityScore: 90, status: 'completed' }
    ];
    for (const item of performanceItems) {
      await prisma.performancePrediction.create({ data: { ...item, userId: user.id } });
    }
    console.log('✅ Performance Predictions seeded (15 items)');
  }

  const existingOutlines = await prisma.blogOutline.count();
  if (existingOutlines === 0) {
    const blogOutlineItems = [
      { title: 'Ultimate Guide to AI Marketing', topic: 'AI in marketing automation', targetAudience: 'Marketing managers', keywords: 'AI marketing, automation, martech', estimatedLength: 2500, seoScore: 88, status: 'completed' },
      { title: 'Remote Work Best Practices', topic: 'Effective remote team management', targetAudience: 'Team leaders', keywords: 'remote work, productivity, team management', estimatedLength: 1800, seoScore: 82, status: 'completed' },
      { title: 'Content Strategy Framework', topic: 'Building a content marketing strategy', targetAudience: 'Content marketers', keywords: 'content strategy, marketing plan', estimatedLength: 3000, seoScore: 90, status: 'completed' },
      { title: 'SEO Fundamentals 2024', topic: 'Search engine optimization basics', targetAudience: 'Beginners', keywords: 'SEO, Google ranking, keywords', estimatedLength: 2200, seoScore: 85, status: 'pending' },
      { title: 'Social Media ROI Guide', topic: 'Measuring social media success', targetAudience: 'Social media managers', keywords: 'social media, ROI, analytics', estimatedLength: 1500, seoScore: 78, status: 'completed' },
      { title: 'Email Marketing Mastery', topic: 'Email campaign optimization', targetAudience: 'Email marketers', keywords: 'email marketing, conversion, campaigns', estimatedLength: 2000, seoScore: 84, status: 'completed' },
      { title: 'Startup Funding Guide', topic: 'Raising seed funding', targetAudience: 'Founders', keywords: 'startup funding, VC, seed round', estimatedLength: 2800, seoScore: 86, status: 'pending' },
      { title: 'Product Launch Playbook', topic: 'Launching a new product', targetAudience: 'Product managers', keywords: 'product launch, go-to-market', estimatedLength: 2400, seoScore: 81, status: 'completed' },
      { title: 'Customer Retention Strategies', topic: 'Keeping customers engaged', targetAudience: 'Customer success teams', keywords: 'retention, churn, loyalty', estimatedLength: 1700, seoScore: 79, status: 'completed' },
      { title: 'Data Analytics for Marketers', topic: 'Using data in marketing decisions', targetAudience: 'Marketing analysts', keywords: 'data analytics, marketing metrics', estimatedLength: 2100, seoScore: 83, status: 'pending' },
      { title: 'Brand Building 101', topic: 'Creating a strong brand identity', targetAudience: 'Brand managers', keywords: 'branding, identity, positioning', estimatedLength: 1900, seoScore: 80, status: 'completed' },
      { title: 'Video Marketing Strategy', topic: 'Creating video content that converts', targetAudience: 'Video creators', keywords: 'video marketing, YouTube, content', estimatedLength: 2300, seoScore: 87, status: 'completed' },
      { title: 'Influencer Marketing Guide', topic: 'Working with influencers effectively', targetAudience: 'Marketing teams', keywords: 'influencer marketing, partnerships', estimatedLength: 1600, seoScore: 76, status: 'pending' },
      { title: 'E-commerce Optimization', topic: 'Improving online store conversions', targetAudience: 'E-commerce owners', keywords: 'e-commerce, conversion, sales', estimatedLength: 2600, seoScore: 89, status: 'completed' },
      { title: 'Podcast Growth Tactics', topic: 'Growing a podcast audience', targetAudience: 'Podcasters', keywords: 'podcast, growth, audience', estimatedLength: 1400, seoScore: 75, status: 'completed' }
    ];
    for (const item of blogOutlineItems) {
      await prisma.blogOutline.create({ data: { ...item, userId: user.id } });
    }
    console.log('✅ Blog Outlines seeded (15 items)');
  }

  const existingNewsletters = await prisma.newsletter.count();
  if (existingNewsletters === 0) {
    const newsletterItems = [
      { title: 'Weekly Tech Digest', topic: 'Technology news and trends', audience: 'Tech enthusiasts', frequency: 'weekly', status: 'completed', subject: 'This Week in Tech: AI, Cloud, and More' },
      { title: 'Marketing Monday', topic: 'Marketing tips and strategies', audience: 'Marketers', frequency: 'weekly', status: 'completed', subject: 'Marketing Monday: 5 Tips to Boost Engagement' },
      { title: 'Startup Insider', topic: 'Startup ecosystem updates', audience: 'Founders and investors', frequency: 'weekly', status: 'completed', subject: 'Startup Insider: Funding News & Founder Stories' },
      { title: 'Product Updates', topic: 'New features and improvements', audience: 'Customers', frequency: 'monthly', status: 'pending', subject: 'What is New: March Product Updates' },
      { title: 'Industry Insights', topic: 'Market analysis and trends', audience: 'Business leaders', frequency: 'monthly', status: 'completed', subject: 'Industry Insights: Q1 Market Analysis' },
      { title: 'Creator Corner', topic: 'Content creation tips', audience: 'Content creators', frequency: 'weekly', status: 'completed', subject: 'Creator Corner: Grow Your Audience This Week' },
      { title: 'Design Digest', topic: 'Design trends and resources', audience: 'Designers', frequency: 'biweekly', status: 'pending', subject: 'Design Digest: Trends, Tools, and Inspiration' },
      { title: 'Dev Weekly', topic: 'Developer news and tutorials', audience: 'Developers', frequency: 'weekly', status: 'completed', subject: 'Dev Weekly: New Frameworks and Best Practices' },
      { title: 'Sales Accelerator', topic: 'Sales tips and techniques', audience: 'Sales teams', frequency: 'weekly', status: 'completed', subject: 'Sales Accelerator: Close More Deals This Week' },
      { title: 'HR Horizons', topic: 'HR and workplace trends', audience: 'HR professionals', frequency: 'monthly', status: 'pending', subject: 'HR Horizons: The Future of Work' },
      { title: 'Finance Focus', topic: 'Financial news and advice', audience: 'Finance professionals', frequency: 'weekly', status: 'completed', subject: 'Finance Focus: Markets, Trends, and Analysis' },
      { title: 'Health & Wellness', topic: 'Health tips for professionals', audience: 'Working professionals', frequency: 'weekly', status: 'completed', subject: 'Wellness Wednesday: Balance Work and Life' },
      { title: 'Ecommerce Edge', topic: 'E-commerce strategies', audience: 'Online retailers', frequency: 'biweekly', status: 'pending', subject: 'Ecommerce Edge: Boost Your Online Sales' },
      { title: 'Leadership Lens', topic: 'Leadership and management', audience: 'Managers and executives', frequency: 'monthly', status: 'completed', subject: 'Leadership Lens: Inspire Your Team This Month' },
      { title: 'Customer Success', topic: 'Customer success stories', audience: 'All subscribers', frequency: 'monthly', status: 'completed', subject: 'Success Stories: How Our Customers Win' }
    ];
    for (const item of newsletterItems) {
      await prisma.newsletter.create({ data: { ...item, userId: user.id } });
    }
    console.log('✅ Newsletters seeded (15 items)');
  }

  const existingPressReleases = await prisma.pressRelease.count();
  if (existingPressReleases === 0) {
    const pressReleaseItems = [
      { title: 'Series A Funding Announcement', companyName: 'TechCorp Inc', announcement: 'Raised $15M in Series A funding', targetMedia: 'tech', status: 'completed', headline: 'TechCorp Raises $15M to Accelerate AI Development' },
      { title: 'New Product Launch', companyName: 'InnovateTech', announcement: 'Launching revolutionary AI assistant', targetMedia: 'tech', status: 'completed', headline: 'InnovateTech Unveils AI Assistant That Transforms Productivity' },
      { title: 'Strategic Partnership', companyName: 'GlobalSoft', announcement: 'Partnership with Microsoft', targetMedia: 'business', status: 'pending', headline: 'GlobalSoft Partners with Microsoft to Expand Cloud Services' },
      { title: 'Award Recognition', companyName: 'StartupXYZ', announcement: 'Won Best Startup 2024 award', targetMedia: 'industry', status: 'completed', headline: 'StartupXYZ Named Best Startup of 2024' },
      { title: 'Executive Appointment', companyName: 'Enterprise Solutions', announcement: 'New CEO appointment', targetMedia: 'business', status: 'completed', headline: 'Enterprise Solutions Appoints Industry Veteran as New CEO' },
      { title: 'Market Expansion', companyName: 'GrowthCo', announcement: 'Expanding to European markets', targetMedia: 'business', status: 'pending', headline: 'GrowthCo Announces European Expansion Plans' },
      { title: 'Research Findings', companyName: 'DataInsights', announcement: 'Released industry benchmark report', targetMedia: 'industry', status: 'completed', headline: 'DataInsights Reveals Surprising Industry Trends in New Report' },
      { title: 'Acquisition News', companyName: 'MegaCorp', announcement: 'Acquired competitor for $50M', targetMedia: 'business', status: 'completed', headline: 'MegaCorp Acquires Competitor in $50M Deal' },
      { title: 'Sustainability Initiative', companyName: 'GreenTech', announcement: 'Carbon neutral commitment', targetMedia: 'general', status: 'pending', headline: 'GreenTech Commits to Carbon Neutrality by 2025' },
      { title: 'Customer Milestone', companyName: 'SaaS Platform', announcement: 'Reached 1 million users', targetMedia: 'tech', status: 'completed', headline: 'SaaS Platform Celebrates 1 Million User Milestone' },
      { title: 'Innovation Award', companyName: 'R&D Labs', announcement: 'Received patent for breakthrough technology', targetMedia: 'tech', status: 'completed', headline: 'R&D Labs Patents Revolutionary AI Technology' },
      { title: 'Conference Announcement', companyName: 'EventTech', announcement: 'Hosting annual industry conference', targetMedia: 'industry', status: 'pending', headline: 'EventTech Announces Biggest Industry Conference Yet' },
      { title: 'Charity Initiative', companyName: 'CareFirst', announcement: 'Donating $1M to education', targetMedia: 'general', status: 'completed', headline: 'CareFirst Pledges $1M to Support Education' },
      { title: 'Product Update', companyName: 'AppMakers', announcement: 'Major platform upgrade release', targetMedia: 'tech', status: 'completed', headline: 'AppMakers Releases Game-Changing Platform Update' },
      { title: 'Industry Report', companyName: 'MarketWatch', announcement: 'Published state of industry report', targetMedia: 'industry', status: 'pending', headline: 'MarketWatch Reveals State of Industry in Comprehensive Report' }
    ];
    for (const item of pressReleaseItems) {
      await prisma.pressRelease.create({ data: { ...item, userId: user.id } });
    }
    console.log('✅ Press Releases seeded (15 items)');
  }

  console.log('🎉 Database seeding completed successfully!');
}

seed()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
