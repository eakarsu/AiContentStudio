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

  // Seed Videos (15+ items)
  const videos = [
    { title: 'Product Launch Promo', prompt: 'Create an exciting product launch video for a new smartphone', style: 'modern', resolution: '4K', status: 'completed', thumbnail: 'https://picsum.photos/seed/v1/640/360', duration: 120 },
    { title: 'Brand Story Video', prompt: 'Tell our company story in a compelling documentary style', style: 'cinematic', resolution: '1080p', status: 'completed', thumbnail: 'https://picsum.photos/seed/v2/640/360', duration: 180 },
    { title: 'Tutorial: Getting Started', prompt: 'Create a beginner-friendly tutorial for our software', style: 'educational', resolution: '1080p', status: 'completed', thumbnail: 'https://picsum.photos/seed/v3/640/360', duration: 300 },
    { title: 'Customer Testimonial', prompt: 'Create a heartfelt customer testimonial video', style: 'authentic', resolution: '1080p', status: 'completed', thumbnail: 'https://picsum.photos/seed/v4/640/360', duration: 90 },
    { title: 'Social Media Ad', prompt: 'Create a catchy 15-second ad for Instagram', style: 'trendy', resolution: '1080p', status: 'completed', thumbnail: 'https://picsum.photos/seed/v5/640/360', duration: 15 },
    { title: 'Explainer Animation', prompt: 'Explain how blockchain works in simple terms', style: 'animated', resolution: '1080p', status: 'completed', thumbnail: 'https://picsum.photos/seed/v6/640/360', duration: 150 },
    { title: 'Event Highlight Reel', prompt: 'Create highlights from our annual conference', style: 'dynamic', resolution: '4K', status: 'completed', thumbnail: 'https://picsum.photos/seed/v7/640/360', duration: 240 },
    { title: 'Behind the Scenes', prompt: 'Show the making of our latest product', style: 'casual', resolution: '1080p', status: 'pending', thumbnail: 'https://picsum.photos/seed/v8/640/360', duration: 200 },
    { title: 'Training Module 1', prompt: 'Employee onboarding training video', style: 'professional', resolution: '1080p', status: 'completed', thumbnail: 'https://picsum.photos/seed/v9/640/360', duration: 600 },
    { title: 'YouTube Intro', prompt: 'Create a dynamic channel intro with logo animation', style: 'energetic', resolution: '1080p', status: 'completed', thumbnail: 'https://picsum.photos/seed/v10/640/360', duration: 10 },
    { title: 'Real Estate Tour', prompt: 'Virtual tour of luxury apartment complex', style: 'elegant', resolution: '4K', status: 'completed', thumbnail: 'https://picsum.photos/seed/v11/640/360', duration: 180 },
    { title: 'Recipe Video', prompt: 'Step-by-step cooking tutorial for pasta carbonara', style: 'foodie', resolution: '1080p', status: 'completed', thumbnail: 'https://picsum.photos/seed/v12/640/360', duration: 240 },
    { title: 'Fitness Workout', prompt: '20-minute HIIT workout video', style: 'energetic', resolution: '1080p', status: 'completed', thumbnail: 'https://picsum.photos/seed/v13/640/360', duration: 1200 },
    { title: 'Music Video Concept', prompt: 'Indie band music video with nature themes', style: 'artistic', resolution: '4K', status: 'pending', thumbnail: 'https://picsum.photos/seed/v14/640/360', duration: 240 },
    { title: 'Corporate Presentation', prompt: 'Annual report video presentation', style: 'corporate', resolution: '1080p', status: 'completed', thumbnail: 'https://picsum.photos/seed/v15/640/360', duration: 420 }
  ];

  for (const video of videos) {
    await prisma.video.create({ data: { ...video, userId: user.id } });
  }
  console.log('✅ Videos seeded (15 items)');

  // Seed Audio (15+ items)
  const audioFiles = [
    { title: 'Welcome Message', prompt: 'Friendly welcome message for app users', voice: 'female', language: 'en', status: 'completed', audioUrl: 'https://example.com/audio/1.mp3', duration: 30 },
    { title: 'Meditation Guide', prompt: '10-minute guided meditation for stress relief', voice: 'calm', language: 'en', status: 'completed', audioUrl: 'https://example.com/audio/2.mp3', duration: 600 },
    { title: 'Product Description', prompt: 'Audio description for visually impaired users', voice: 'neutral', language: 'en', status: 'completed', audioUrl: 'https://example.com/audio/3.mp3', duration: 120 },
    { title: 'Phone System IVR', prompt: 'Professional IVR menu for customer service', voice: 'professional', language: 'en', status: 'completed', audioUrl: 'https://example.com/audio/4.mp3', duration: 60 },
    { title: 'Audiobook Chapter 1', prompt: 'Narration for mystery novel first chapter', voice: 'dramatic', language: 'en', status: 'completed', audioUrl: 'https://example.com/audio/5.mp3', duration: 1800 },
    { title: 'Language Lesson', prompt: 'Spanish vocabulary lesson for beginners', voice: 'educational', language: 'es', status: 'completed', audioUrl: 'https://example.com/audio/6.mp3', duration: 900 },
    { title: 'Radio Ad', prompt: '30-second radio commercial for car dealership', voice: 'energetic', language: 'en', status: 'completed', audioUrl: 'https://example.com/audio/7.mp3', duration: 30 },
    { title: 'Documentary Narration', prompt: 'Nature documentary voiceover about ocean life', voice: 'authoritative', language: 'en', status: 'completed', audioUrl: 'https://example.com/audio/8.mp3', duration: 300 },
    { title: 'Kids Story', prompt: 'Bedtime story narration for children', voice: 'warm', language: 'en', status: 'completed', audioUrl: 'https://example.com/audio/9.mp3', duration: 420 },
    { title: 'News Bulletin', prompt: 'Breaking news announcement style', voice: 'news', language: 'en', status: 'completed', audioUrl: 'https://example.com/audio/10.mp3', duration: 45 },
    { title: 'Fitness Instructions', prompt: 'Workout audio instructions for gym', voice: 'motivational', language: 'en', status: 'completed', audioUrl: 'https://example.com/audio/11.mp3', duration: 180 },
    { title: 'GPS Navigation', prompt: 'Turn-by-turn navigation voice prompts', voice: 'clear', language: 'en', status: 'completed', audioUrl: 'https://example.com/audio/12.mp3', duration: 60 },
    { title: 'Museum Tour', prompt: 'Audio guide for art museum exhibition', voice: 'cultured', language: 'en', status: 'pending', audioUrl: 'https://example.com/audio/13.mp3', duration: 1200 },
    { title: 'Safety Announcement', prompt: 'Emergency evacuation instructions', voice: 'authoritative', language: 'en', status: 'completed', audioUrl: 'https://example.com/audio/14.mp3', duration: 90 },
    { title: 'Game Character Voice', prompt: 'Fantasy game wizard character lines', voice: 'dramatic', language: 'en', status: 'completed', audioUrl: 'https://example.com/audio/15.mp3', duration: 120 }
  ];

  for (const audio of audioFiles) {
    await prisma.audio.create({ data: { ...audio, userId: user.id } });
  }
  console.log('✅ Audio files seeded (15 items)');

  // Seed Text Content (15+ items)
  const textContents = [
    { title: 'Website Copy', prompt: 'Write compelling homepage copy for SaaS product', type: 'web', tone: 'professional', status: 'completed', content: 'Transform your workflow with our AI-powered solution...', wordCount: 250 },
    { title: 'Product Description', prompt: 'Write description for wireless headphones', type: 'product', tone: 'persuasive', status: 'completed', content: 'Experience audio like never before...', wordCount: 150 },
    { title: 'About Us Page', prompt: 'Write about us page for tech startup', type: 'web', tone: 'friendly', status: 'completed', content: 'Founded in 2020, we set out to revolutionize...', wordCount: 400 },
    { title: 'Press Release', prompt: 'Announce new product launch', type: 'press', tone: 'formal', status: 'completed', content: 'FOR IMMEDIATE RELEASE...', wordCount: 500 },
    { title: 'FAQ Content', prompt: 'Write FAQ section for e-commerce site', type: 'web', tone: 'helpful', status: 'completed', content: 'Q: How do I track my order?...', wordCount: 800 },
    { title: 'Terms of Service', prompt: 'Write ToS for mobile app', type: 'legal', tone: 'formal', status: 'completed', content: 'By using this application...', wordCount: 2000 },
    { title: 'Privacy Policy', prompt: 'Write GDPR-compliant privacy policy', type: 'legal', tone: 'formal', status: 'completed', content: 'We respect your privacy...', wordCount: 1500 },
    { title: 'Landing Page', prompt: 'Write high-converting landing page copy', type: 'marketing', tone: 'urgent', status: 'completed', content: 'Limited Time Offer...', wordCount: 600 },
    { title: 'Case Study', prompt: 'Write customer success case study', type: 'marketing', tone: 'professional', status: 'completed', content: 'Challenge: Our client faced...', wordCount: 1200 },
    { title: 'White Paper Intro', prompt: 'Write introduction for AI trends white paper', type: 'research', tone: 'authoritative', status: 'pending', content: 'Artificial Intelligence is transforming...', wordCount: 500 },
    { title: 'App Store Description', prompt: 'Write compelling app store listing', type: 'product', tone: 'exciting', status: 'completed', content: 'The #1 productivity app...', wordCount: 200 },
    { title: 'Newsletter Intro', prompt: 'Write engaging newsletter opening', type: 'email', tone: 'conversational', status: 'completed', content: 'Happy Friday! This week...', wordCount: 100 },
    { title: 'Event Description', prompt: 'Write description for tech conference', type: 'event', tone: 'exciting', status: 'completed', content: 'Join us for the biggest tech event...', wordCount: 300 },
    { title: 'Job Posting', prompt: 'Write job posting for senior developer', type: 'hr', tone: 'professional', status: 'completed', content: 'We are looking for a talented...', wordCount: 450 },
    { title: 'Bio/Profile', prompt: 'Write professional bio for LinkedIn', type: 'personal', tone: 'professional', status: 'completed', content: 'A results-driven professional...', wordCount: 150 }
  ];

  for (const text of textContents) {
    await prisma.textContent.create({ data: { ...text, userId: user.id } });
  }
  console.log('✅ Text content seeded (15 items)');

  // Seed Images (15+ items)
  const images = [
    { title: 'Hero Banner', prompt: 'Modern tech website hero image with abstract shapes', style: 'modern', resolution: '1920x1080', status: 'completed', imageUrl: 'https://picsum.photos/seed/i1/1920/1080' },
    { title: 'Product Mockup', prompt: 'Smartphone mockup on marble surface', style: 'minimal', resolution: '1024x1024', status: 'completed', imageUrl: 'https://picsum.photos/seed/i2/1024/1024' },
    { title: 'Team Photo Background', prompt: 'Abstract office background for team photos', style: 'corporate', resolution: '1920x1080', status: 'completed', imageUrl: 'https://picsum.photos/seed/i3/1920/1080' },
    { title: 'Social Media Post', prompt: 'Inspirational quote background with sunset', style: 'inspirational', resolution: '1080x1080', status: 'completed', imageUrl: 'https://picsum.photos/seed/i4/1080/1080' },
    { title: 'Blog Featured Image', prompt: 'AI and technology concept illustration', style: 'futuristic', resolution: '1200x630', status: 'completed', imageUrl: 'https://picsum.photos/seed/i5/1200/630' },
    { title: 'Icon Set', prompt: 'Modern flat icons for finance app', style: 'flat', resolution: '512x512', status: 'completed', imageUrl: 'https://picsum.photos/seed/i6/512/512' },
    { title: 'Email Header', prompt: 'Newsletter header with gradient and logo space', style: 'elegant', resolution: '600x200', status: 'completed', imageUrl: 'https://picsum.photos/seed/i7/600/200' },
    { title: 'App Splash Screen', prompt: 'Colorful splash screen for fitness app', style: 'vibrant', resolution: '1080x1920', status: 'completed', imageUrl: 'https://picsum.photos/seed/i8/1080/1920' },
    { title: 'Infographic Background', prompt: 'Clean white background for data visualization', style: 'minimal', resolution: '800x2000', status: 'completed', imageUrl: 'https://picsum.photos/seed/i9/800/2000' },
    { title: 'Logo Concept', prompt: 'Abstract geometric logo for tech company', style: 'geometric', resolution: '1024x1024', status: 'completed', imageUrl: 'https://picsum.photos/seed/i10/1024/1024' },
    { title: 'Presentation Slide', prompt: 'Professional slide background with blue theme', style: 'corporate', resolution: '1920x1080', status: 'completed', imageUrl: 'https://picsum.photos/seed/i11/1920/1080' },
    { title: 'Avatar Generator', prompt: 'Cartoon style avatar placeholder', style: 'cartoon', resolution: '256x256', status: 'completed', imageUrl: 'https://picsum.photos/seed/i12/256/256' },
    { title: 'Thumbnail Design', prompt: 'YouTube thumbnail with bold text space', style: 'bold', resolution: '1280x720', status: 'pending', imageUrl: 'https://picsum.photos/seed/i13/1280/720' },
    { title: 'Pattern Design', prompt: 'Seamless geometric pattern for backgrounds', style: 'pattern', resolution: '1024x1024', status: 'completed', imageUrl: 'https://picsum.photos/seed/i14/1024/1024' },
    { title: 'Product Photo', prompt: 'E-commerce product photo with white background', style: 'product', resolution: '1000x1000', status: 'completed', imageUrl: 'https://picsum.photos/seed/i15/1000/1000' }
  ];

  for (const image of images) {
    await prisma.image.create({ data: { ...image, userId: user.id } });
  }
  console.log('✅ Images seeded (15 items)');

  // Seed Translations (15+ items)
  const translations = [
    { title: 'Website Header - Spanish', originalText: 'Welcome to our platform', translatedText: 'Bienvenido a nuestra plataforma', sourceLang: 'en', targetLang: 'es', status: 'completed' },
    { title: 'Product Description - French', originalText: 'High-quality wireless earbuds', translatedText: 'Écouteurs sans fil de haute qualité', sourceLang: 'en', targetLang: 'fr', status: 'completed' },
    { title: 'Legal Disclaimer - German', originalText: 'Terms and conditions apply', translatedText: 'Es gelten die Allgemeinen Geschäftsbedingungen', sourceLang: 'en', targetLang: 'de', status: 'completed' },
    { title: 'Marketing Slogan - Japanese', originalText: 'Innovation meets simplicity', translatedText: 'イノベーションとシンプルさの融合', sourceLang: 'en', targetLang: 'ja', status: 'completed' },
    { title: 'User Manual - Chinese', originalText: 'Getting started guide', translatedText: '入门指南', sourceLang: 'en', targetLang: 'zh', status: 'completed' },
    { title: 'Error Message - Portuguese', originalText: 'Please try again later', translatedText: 'Por favor, tente novamente mais tarde', sourceLang: 'en', targetLang: 'pt', status: 'completed' },
    { title: 'Newsletter - Italian', originalText: 'This month in review', translatedText: 'Il mese in rassegna', sourceLang: 'en', targetLang: 'it', status: 'completed' },
    { title: 'Support FAQ - Korean', originalText: 'How can we help you?', translatedText: '어떻게 도와드릴까요?', sourceLang: 'en', targetLang: 'ko', status: 'completed' },
    { title: 'Social Post - Arabic', originalText: 'Join us today!', translatedText: 'انضم إلينا اليوم!', sourceLang: 'en', targetLang: 'ar', status: 'completed' },
    { title: 'App Store - Russian', originalText: 'Download now for free', translatedText: 'Скачайте бесплатно прямо сейчас', sourceLang: 'en', targetLang: 'ru', status: 'completed' },
    { title: 'Email Subject - Dutch', originalText: 'Your order has shipped', translatedText: 'Uw bestelling is verzonden', sourceLang: 'en', targetLang: 'nl', status: 'completed' },
    { title: 'Button Text - Hindi', originalText: 'Learn More', translatedText: 'और जानें', sourceLang: 'en', targetLang: 'hi', status: 'pending' },
    { title: 'Menu Items - Swedish', originalText: 'Settings and preferences', translatedText: 'Inställningar och preferenser', sourceLang: 'en', targetLang: 'sv', status: 'completed' },
    { title: 'Privacy Policy - Polish', originalText: 'We value your privacy', translatedText: 'Cenimy Twoją prywatność', sourceLang: 'en', targetLang: 'pl', status: 'completed' },
    { title: 'Greeting - Turkish', originalText: 'Welcome back!', translatedText: 'Tekrar hoş geldiniz!', sourceLang: 'en', targetLang: 'tr', status: 'completed' }
  ];

  for (const translation of translations) {
    await prisma.translation.create({ data: { ...translation, userId: user.id } });
  }
  console.log('✅ Translations seeded (15 items)');

  // Seed Summaries (15+ items)
  const summaries = [
    { title: 'Meeting Notes Summary', originalText: 'During today\'s meeting, we discussed Q4 targets, marketing initiatives, and product roadmap updates. Key decisions included budget allocation for digital ads and timeline for feature releases.', summary: 'Q4 meeting covered targets, marketing, and roadmap. Decided on ad budget and feature timeline.', length: 'short', status: 'completed' },
    { title: 'Research Paper Abstract', originalText: 'This comprehensive study examines the impact of artificial intelligence on healthcare outcomes across 50 hospitals over 3 years...', summary: 'Study of AI impact on healthcare across 50 hospitals (3 years) shows improved outcomes and cost savings.', length: 'short', status: 'completed' },
    { title: 'Legal Document Brief', originalText: 'The terms of this agreement stipulate that both parties shall maintain confidentiality of shared information...', summary: 'Confidentiality agreement requiring both parties to protect shared information with specific breach penalties.', length: 'medium', status: 'completed' },
    { title: 'Book Chapter Summary', originalText: 'Chapter 5 explores the emergence of digital currencies and their potential to disrupt traditional banking systems...', summary: 'Overview of digital currencies and their disruptive potential in banking, covering Bitcoin, CBDCs, and regulatory challenges.', length: 'medium', status: 'completed' },
    { title: 'News Article Digest', originalText: 'Global markets experienced significant volatility today as investors reacted to central bank announcements...', summary: 'Market volatility following central bank policy changes, with tech stocks leading losses.', length: 'short', status: 'completed' },
    { title: 'Technical Documentation', originalText: 'The API provides RESTful endpoints for user management, authentication, and data retrieval...', summary: 'REST API documentation covering auth, users, and data endpoints with JWT authentication.', length: 'medium', status: 'completed' },
    { title: 'Podcast Transcript', originalText: 'In this episode, we discuss the future of remote work with industry expert Sarah Johnson...', summary: 'Remote work trends discussion with expert insights on hybrid models and productivity tools.', length: 'medium', status: 'completed' },
    { title: 'Customer Reviews Analysis', originalText: 'Analysis of 500 customer reviews reveals patterns in satisfaction levels and common pain points...', summary: 'Customer review analysis shows high satisfaction with product quality, concerns about delivery speed.', length: 'short', status: 'completed' },
    { title: 'Competitor Report', originalText: 'Our main competitor has launched three new products this quarter, expanded into two new markets...', summary: 'Competitor launched 3 products, entered 2 markets, indicating aggressive growth strategy.', length: 'short', status: 'completed' },
    { title: 'Interview Highlights', originalText: 'CEO discusses company vision, recent acquisitions, and plans for international expansion...', summary: 'CEO interview covering vision, M&A activity, and global expansion plans for next fiscal year.', length: 'medium', status: 'completed' },
    { title: 'Scientific Study', originalText: 'This longitudinal study of 10,000 participants examined the correlation between sleep patterns and cognitive performance...', summary: 'Large-scale study confirms strong correlation between sleep quality and cognitive function across age groups.', length: 'medium', status: 'pending' },
    { title: 'Policy Document', originalText: 'The new environmental policy mandates 40% reduction in carbon emissions by 2030...', summary: 'Environmental policy requires 40% emission cuts by 2030 with industry-specific targets.', length: 'short', status: 'completed' },
    { title: 'User Feedback Report', originalText: 'Compiled feedback from 200 beta users highlights feature requests and usability concerns...', summary: 'Beta feedback emphasizes need for improved onboarding and requested dark mode feature.', length: 'short', status: 'completed' },
    { title: 'Webinar Recap', originalText: 'Expert panel discussed emerging trends in e-commerce, including AI personalization and voice shopping...', summary: 'E-commerce webinar covered AI personalization, voice commerce, and social shopping trends.', length: 'medium', status: 'completed' },
    { title: 'Project Retrospective', originalText: 'Post-project analysis reveals successes in timeline adherence but challenges in scope management...', summary: 'Project met deadlines but faced scope creep; recommends better change management processes.', length: 'medium', status: 'completed' }
  ];

  for (const summary of summaries) {
    await prisma.summary.create({ data: { ...summary, userId: user.id } });
  }
  console.log('✅ Summaries seeded (15 items)');

  // Seed SEO Content (15+ items)
  const seoContents = [
    { title: 'AI Content Tools Guide', keyword: 'AI content generation tools', content: '# Best AI Content Generation Tools in 2024...', metaTitle: 'Top AI Content Tools 2024 | Complete Guide', metaDesc: 'Discover the best AI content generation tools for marketing, blogging, and social media.', status: 'completed' },
    { title: 'Remote Work Tips', keyword: 'remote work productivity', content: '# How to Stay Productive Working from Home...', metaTitle: 'Remote Work Productivity Tips | Work from Home Guide', metaDesc: 'Boost your remote work productivity with these proven tips and strategies.', status: 'completed' },
    { title: 'SaaS Marketing Guide', keyword: 'SaaS marketing strategies', content: '# Effective SaaS Marketing Strategies...', metaTitle: 'SaaS Marketing Strategies That Work | 2024 Guide', metaDesc: 'Learn proven SaaS marketing strategies to grow your software business.', status: 'completed' },
    { title: 'SEO Basics Article', keyword: 'SEO for beginners', content: '# SEO Fundamentals for Beginners...', metaTitle: 'SEO Basics for Beginners | Complete Guide 2024', metaDesc: 'Master SEO basics with our comprehensive beginner guide. Learn keywords, links, and more.', status: 'completed' },
    { title: 'E-commerce Guide', keyword: 'start online store', content: '# How to Start Your Online Store...', metaTitle: 'Start an Online Store in 2024 | Step-by-Step Guide', metaDesc: 'Complete guide to starting your online store. Platform selection, products, and marketing.', status: 'completed' },
    { title: 'Email Marketing Tips', keyword: 'email marketing best practices', content: '# Email Marketing Best Practices...', metaTitle: 'Email Marketing Best Practices | Boost Open Rates', metaDesc: 'Improve your email marketing with these best practices for higher engagement.', status: 'completed' },
    { title: 'Social Media Strategy', keyword: 'social media marketing 2024', content: '# Social Media Marketing Trends 2024...', metaTitle: 'Social Media Marketing 2024 | Trends & Strategies', metaDesc: 'Stay ahead with 2024 social media marketing trends and proven strategies.', status: 'completed' },
    { title: 'Content Marketing ROI', keyword: 'content marketing ROI', content: '# Measuring Content Marketing ROI...', metaTitle: 'How to Measure Content Marketing ROI | Complete Guide', metaDesc: 'Learn how to track and measure your content marketing return on investment.', status: 'completed' },
    { title: 'Landing Page Guide', keyword: 'landing page optimization', content: '# Landing Page Optimization Tips...', metaTitle: 'Landing Page Optimization | Boost Conversions', metaDesc: 'Optimize your landing pages for higher conversions with these proven tips.', status: 'completed' },
    { title: 'PPC Advertising Guide', keyword: 'PPC advertising tips', content: '# PPC Advertising Best Practices...', metaTitle: 'PPC Advertising Tips | Maximize Your Ad Spend', metaDesc: 'Get more from your PPC campaigns with these expert advertising tips.', status: 'pending' },
    { title: 'Video Marketing', keyword: 'video marketing strategy', content: '# Video Marketing Strategy Guide...', metaTitle: 'Video Marketing Strategy 2024 | Complete Guide', metaDesc: 'Create an effective video marketing strategy with our comprehensive guide.', status: 'completed' },
    { title: 'Podcast Growth', keyword: 'grow podcast audience', content: '# How to Grow Your Podcast Audience...', metaTitle: 'Grow Your Podcast Audience | Proven Strategies', metaDesc: 'Effective strategies to grow your podcast audience and increase downloads.', status: 'completed' },
    { title: 'Influencer Marketing', keyword: 'influencer marketing guide', content: '# Influencer Marketing Complete Guide...', metaTitle: 'Influencer Marketing Guide | Find & Work with Influencers', metaDesc: 'Learn how to find and work with influencers for your marketing campaigns.', status: 'completed' },
    { title: 'Local SEO Tips', keyword: 'local SEO strategies', content: '# Local SEO Strategies for Small Business...', metaTitle: 'Local SEO Strategies | Rank Higher Locally', metaDesc: 'Boost your local search rankings with these proven local SEO strategies.', status: 'completed' },
    { title: 'Blog Traffic Guide', keyword: 'increase blog traffic', content: '# How to Increase Blog Traffic...', metaTitle: 'Increase Blog Traffic | Proven Methods 2024', metaDesc: 'Drive more traffic to your blog with these effective and proven methods.', status: 'completed' }
  ];

  for (const seo of seoContents) {
    await prisma.sEOContent.create({ data: { ...seo, userId: user.id } });
  }
  console.log('✅ SEO content seeded (15 items)');

  // Seed Social Posts (15+ items)
  const socialPosts = [
    { title: 'Product Launch Tweet', platform: 'twitter', prompt: 'Announce new product launch', content: 'Exciting news! Our new AI-powered tool is here. Transform your workflow today.', hashtags: '#AI #ProductLaunch #Innovation', status: 'completed' },
    { title: 'Instagram Story Promo', platform: 'instagram', prompt: 'Promote summer sale', content: 'Summer vibes + amazing deals = perfect combo. Shop now and save 30%!', hashtags: '#SummerSale #Shopping #Deals #Fashion', status: 'completed' },
    { title: 'LinkedIn Thought Leader', platform: 'linkedin', prompt: 'Share industry insight', content: 'The future of work is not about where we work, but how we collaborate. Here are 3 trends reshaping the workplace...', hashtags: '#FutureOfWork #Leadership #Business', status: 'completed' },
    { title: 'Facebook Event Promo', platform: 'facebook', prompt: 'Promote webinar event', content: 'Join us this Thursday for an exclusive webinar on digital marketing trends. Limited spots available!', hashtags: '#Webinar #DigitalMarketing #FreeEvent', status: 'completed' },
    { title: 'TikTok Trend', platform: 'tiktok', prompt: 'Jump on viral trend', content: 'POV: When your AI assistant understands you better than your friends', hashtags: '#AI #POV #Relatable #TechTok #Viral', status: 'completed' },
    { title: 'Twitter Thread', platform: 'twitter', prompt: 'Educational thread about SEO', content: 'Thread: 10 SEO mistakes killing your rankings. Let me share what I have learned after analyzing 100+ websites...', hashtags: '#SEO #DigitalMarketing #Thread', status: 'completed' },
    { title: 'Instagram Carousel', platform: 'instagram', prompt: 'Share productivity tips', content: '5 productivity hacks that changed my life. Swipe to transform your daily routine!', hashtags: '#Productivity #LifeHacks #GrowthMindset #Success', status: 'completed' },
    { title: 'LinkedIn Case Study', platform: 'linkedin', prompt: 'Share client success story', content: 'How we helped Company X increase revenue by 150% in 6 months. Here is the strategy...', hashtags: '#CaseStudy #Growth #BusinessSuccess', status: 'completed' },
    { title: 'Facebook Community Post', platform: 'facebook', prompt: 'Engage community with question', content: 'Question for our community: What is your biggest challenge with remote work? Drop your answers below!', hashtags: '#Community #RemoteWork #Discussion', status: 'completed' },
    { title: 'Twitter Poll', platform: 'twitter', prompt: 'Create engagement poll', content: 'Quick poll: What is your preferred content format? A) Blog posts B) Videos C) Podcasts D) Infographics', hashtags: '#Poll #ContentMarketing #Engagement', status: 'pending' },
    { title: 'Instagram Reel Idea', platform: 'instagram', prompt: 'Behind the scenes content', content: 'Behind the scenes of how we create content. The messy reality nobody shows you!', hashtags: '#BTS #ContentCreation #RealTalk #CreatorLife', status: 'completed' },
    { title: 'LinkedIn Article Promo', platform: 'linkedin', prompt: 'Promote new blog article', content: 'New article alert! "The Complete Guide to B2B Marketing in 2024" - Link in comments.', hashtags: '#B2BMarketing #MarketingStrategy #NewPost', status: 'completed' },
    { title: 'TikTok Tutorial', platform: 'tiktok', prompt: 'Quick how-to tutorial', content: 'How to edit photos like a pro in 30 seconds. Save this for later!', hashtags: '#PhotoEditing #Tutorial #LearnOnTikTok #HowTo', status: 'completed' },
    { title: 'Facebook Live Announcement', platform: 'facebook', prompt: 'Announce upcoming live session', content: 'Going LIVE tomorrow at 3PM EST! Q&A session about starting your business. Drop your questions below!', hashtags: '#FacebookLive #QandA #Entrepreneur', status: 'completed' },
    { title: 'Twitter Milestone', platform: 'twitter', prompt: 'Celebrate company milestone', content: 'We just hit 10,000 customers! Thank you for being part of our journey. This is just the beginning...', hashtags: '#Milestone #ThankYou #Growth', status: 'completed' }
  ];

  for (const post of socialPosts) {
    await prisma.socialPost.create({ data: { ...post, userId: user.id } });
  }
  console.log('✅ Social posts seeded (15 items)');

  // Seed Emails (15+ items)
  const emails = [
    { title: 'Welcome Email', type: 'welcome', prompt: 'Welcome new subscribers', subject: 'Welcome to the family!', body: 'Dear [Name],\n\nWelcome aboard! We are thrilled to have you...', status: 'completed' },
    { title: 'Product Launch Email', type: 'marketing', prompt: 'Announce new product', subject: 'Introducing Our Game-Changing New Product', body: 'Big news! We have been working on something special...', status: 'completed' },
    { title: 'Weekly Newsletter', type: 'newsletter', prompt: 'Weekly content digest', subject: 'This Week: Top Stories & Updates', body: 'Happy Friday! Here is what you might have missed this week...', status: 'completed' },
    { title: 'Flash Sale Alert', type: 'marketing', prompt: 'Promote 24-hour sale', subject: '24 Hours Only: 50% Off Everything!', body: 'The clock is ticking! Our biggest sale of the year is here...', status: 'completed' },
    { title: 'Follow-up Email', type: 'followup', prompt: 'Follow up with leads', subject: 'Quick follow-up on our conversation', body: 'Hi [Name],\n\nI wanted to circle back on our discussion...', status: 'completed' },
    { title: 'Abandoned Cart', type: 'marketing', prompt: 'Recover abandoned cart', subject: 'You forgot something...', body: 'Hey [Name],\n\nYour cart misses you! Complete your purchase...', status: 'completed' },
    { title: 'Event Invitation', type: 'announcement', prompt: 'Invite to annual conference', subject: 'You are Invited: Annual Tech Summit 2024', body: 'Join industry leaders for our biggest event yet...', status: 'completed' },
    { title: 'Customer Feedback Request', type: 'followup', prompt: 'Request product feedback', subject: 'We value your opinion', body: 'Hi [Name],\n\nYour feedback helps us improve...', status: 'completed' },
    { title: 'Re-engagement Email', type: 'marketing', prompt: 'Re-engage inactive users', subject: 'We miss you! Here is 20% off to welcome you back', body: 'It has been a while since we have seen you...', status: 'completed' },
    { title: 'Feature Update', type: 'announcement', prompt: 'Announce new features', subject: 'New Features You will Love', body: 'Exciting updates! Check out what is new...', status: 'pending' },
    { title: 'Holiday Greeting', type: 'newsletter', prompt: 'Holiday season greeting', subject: 'Happy Holidays from Our Team!', body: 'Wishing you joy and happiness this holiday season...', status: 'completed' },
    { title: 'Subscription Renewal', type: 'marketing', prompt: 'Remind about subscription renewal', subject: 'Your subscription is expiring soon', body: 'Hi [Name],\n\nYour subscription expires in 7 days...', status: 'completed' },
    { title: 'Thank You Email', type: 'followup', prompt: 'Thank customers for purchase', subject: 'Thank You for Your Order!', body: 'Your order is confirmed! Here is what is next...', status: 'completed' },
    { title: 'Referral Program', type: 'marketing', prompt: 'Promote referral program', subject: 'Give $20, Get $20 - Share the Love!', body: 'Love our product? Share it with friends and earn rewards...', status: 'completed' },
    { title: 'Survey Invitation', type: 'followup', prompt: 'Invite to customer survey', subject: 'Quick Survey - Win a $100 Gift Card!', body: 'Your opinion matters! Take our 2-minute survey...', status: 'completed' }
  ];

  for (const email of emails) {
    await prisma.email.create({ data: { ...email, userId: user.id } });
  }
  console.log('✅ Emails seeded (15 items)');

  // Seed Blog Posts (15+ items)
  const blogPosts = [
    { title: '10 AI Tools Every Marketer Needs', topic: 'AI marketing tools', keywords: 'AI, marketing, automation, tools', content: '# 10 AI Tools Every Marketer Needs in 2024\n\nArtificial intelligence is revolutionizing marketing...', excerpt: 'Discover the AI tools transforming digital marketing...', status: 'completed' },
    { title: 'Remote Work Best Practices', topic: 'Remote work productivity', keywords: 'remote work, productivity, WFH', content: '# Remote Work Best Practices for 2024\n\nAs remote work becomes the norm...', excerpt: 'Master remote work with these proven strategies...', status: 'completed' },
    { title: 'SEO Trends to Watch', topic: 'SEO trends 2024', keywords: 'SEO, Google, search, rankings', content: '# SEO Trends That Will Dominate 2024\n\nSearch engine optimization is evolving...', excerpt: 'Stay ahead with these emerging SEO trends...', status: 'completed' },
    { title: 'Building a Personal Brand', topic: 'Personal branding guide', keywords: 'personal brand, LinkedIn, career', content: '# How to Build a Powerful Personal Brand\n\nIn today\'s digital age...', excerpt: 'Create a personal brand that opens doors...', status: 'completed' },
    { title: 'Email Marketing Mastery', topic: 'Email marketing strategies', keywords: 'email, marketing, conversion', content: '# Email Marketing Mastery: A Complete Guide\n\nEmail marketing remains one of the highest ROI channels...', excerpt: 'Unlock the power of email marketing...', status: 'completed' },
    { title: 'Content Strategy Framework', topic: 'Content marketing strategy', keywords: 'content, strategy, marketing', content: '# Building a Winning Content Strategy\n\nContent is king, but strategy is the kingdom...', excerpt: 'Create content that converts with this framework...', status: 'completed' },
    { title: 'Social Media Algorithms', topic: 'Understanding social algorithms', keywords: 'social media, algorithm, engagement', content: '# Decoding Social Media Algorithms\n\nEver wonder why some posts go viral...', excerpt: 'Master social media algorithms for better reach...', status: 'completed' },
    { title: 'Startup Funding Guide', topic: 'Raising startup funding', keywords: 'startup, funding, VC, investment', content: '# The Complete Guide to Startup Funding\n\nSecuring funding is a crucial milestone...', excerpt: 'Navigate the funding landscape with confidence...', status: 'completed' },
    { title: 'UX Design Principles', topic: 'UX design fundamentals', keywords: 'UX, design, user experience', content: '# Essential UX Design Principles\n\nGreat user experience doesn\'t happen by accident...', excerpt: 'Design better products with these UX principles...', status: 'completed' },
    { title: 'Podcast Launch Guide', topic: 'Starting a podcast', keywords: 'podcast, audio, content creation', content: '# How to Launch a Successful Podcast\n\nPodcasting has exploded in popularity...', excerpt: 'Start your podcast journey with this complete guide...', status: 'pending' },
    { title: 'E-commerce Conversion Tips', topic: 'E-commerce optimization', keywords: 'ecommerce, conversion, sales', content: '# Boost Your E-commerce Conversions\n\nEvery visitor is a potential customer...', excerpt: 'Turn browsers into buyers with these tips...', status: 'completed' },
    { title: 'Leadership in Remote Teams', topic: 'Managing remote teams', keywords: 'leadership, remote, management', content: '# Leading Remote Teams Effectively\n\nRemote leadership requires a different approach...', excerpt: 'Lead distributed teams to success...', status: 'completed' },
    { title: 'Data Privacy Compliance', topic: 'GDPR and data privacy', keywords: 'GDPR, privacy, compliance, data', content: '# Data Privacy Compliance Guide\n\nData privacy is not just legal requirement...', excerpt: 'Stay compliant with data protection regulations...', status: 'completed' },
    { title: 'Video Marketing ROI', topic: 'Video marketing effectiveness', keywords: 'video, marketing, ROI, YouTube', content: '# Maximizing Video Marketing ROI\n\nVideo content continues to dominate...', excerpt: 'Get more from your video marketing efforts...', status: 'completed' },
    { title: 'Customer Retention Strategies', topic: 'Retaining customers', keywords: 'retention, loyalty, customers', content: '# Customer Retention Strategies That Work\n\nAcquiring customers is expensive...', excerpt: 'Keep customers coming back for more...', status: 'completed' }
  ];

  for (const blog of blogPosts) {
    await prisma.blogPost.create({ data: { ...blog, userId: user.id } });
  }
  console.log('✅ Blog posts seeded (15 items)');

  // Seed Marketing Copy (15+ items)
  const marketingCopies = [
    { title: 'SaaS Landing Page', product: 'Project management software', targetAud: 'Small business owners', content: 'Tired of juggling spreadsheets? Streamline your workflow...', headline: 'Manage Projects Like a Pro', callToAction: 'Start Free Trial', status: 'completed' },
    { title: 'Fitness App Promo', product: 'AI fitness coaching app', targetAud: 'Health-conscious millennials', content: 'Your personal trainer in your pocket...', headline: 'Transform Your Body with AI', callToAction: 'Download Free', status: 'completed' },
    { title: 'Online Course Sales', product: 'Digital marketing course', targetAud: 'Career changers', content: 'Learn the skills that pay the bills...', headline: 'Become a Digital Marketing Expert', callToAction: 'Enroll Now - 50% Off', status: 'completed' },
    { title: 'E-commerce Fashion', product: 'Sustainable clothing line', targetAud: 'Eco-conscious consumers', content: 'Look good while doing good for the planet...', headline: 'Fashion That Doesn\'t Cost the Earth', callToAction: 'Shop Sustainable', status: 'completed' },
    { title: 'B2B Software', product: 'Enterprise CRM solution', targetAud: 'Sales directors', content: 'Close more deals with intelligent insights...', headline: 'CRM That Actually Helps You Sell', callToAction: 'Request Demo', status: 'completed' },
    { title: 'Food Delivery Service', product: 'Healthy meal delivery', targetAud: 'Busy professionals', content: 'Chef-prepared meals delivered to your door...', headline: 'Healthy Eating Made Effortless', callToAction: 'Get 30% Off First Order', status: 'completed' },
    { title: 'Financial App', product: 'Investment tracking app', targetAud: 'Young investors', content: 'Take control of your financial future...', headline: 'Investing Made Simple', callToAction: 'Start Investing Today', status: 'completed' },
    { title: 'Travel Booking Platform', product: 'Travel deals aggregator', targetAud: 'Adventure seekers', content: 'Discover hidden gems and save big...', headline: 'Your Next Adventure Awaits', callToAction: 'Find Your Escape', status: 'completed' },
    { title: 'Productivity Tool', product: 'Note-taking app', targetAud: 'Students and researchers', content: 'Capture ideas at the speed of thought...', headline: 'Notes That Think With You', callToAction: 'Try Free Forever', status: 'completed' },
    { title: 'Home Security', product: 'Smart home security system', targetAud: 'Homeowners', content: 'Protect what matters most...', headline: 'Peace of Mind, 24/7', callToAction: 'Get Protected Now', status: 'pending' },
    { title: 'Pet Product', product: 'Premium dog food brand', targetAud: 'Dog owners', content: 'Give your best friend the best nutrition...', headline: 'Food Your Dog Will Actually Love', callToAction: 'Try Risk-Free', status: 'completed' },
    { title: 'Gaming Accessories', product: 'Pro gaming headset', targetAud: 'Gamers', content: 'Hear every footstep, gain every advantage...', headline: 'Level Up Your Gaming', callToAction: 'Shop Now', status: 'completed' },
    { title: 'Educational Platform', product: 'Kids learning app', targetAud: 'Parents', content: 'Make learning fun and engaging...', headline: 'Education That Kids Love', callToAction: 'Start Learning Free', status: 'completed' },
    { title: 'Consulting Services', product: 'Business consulting firm', targetAud: 'CEOs and executives', content: 'Transform challenges into opportunities...', headline: 'Strategic Growth Partners', callToAction: 'Schedule Consultation', status: 'completed' },
    { title: 'Skincare Brand', product: 'Natural skincare line', targetAud: 'Beauty enthusiasts', content: 'Nature\'s best for your skin...', headline: 'Glow Naturally', callToAction: 'Discover Your Routine', status: 'completed' }
  ];

  for (const copy of marketingCopies) {
    await prisma.marketingCopy.create({ data: { ...copy, userId: user.id } });
  }
  console.log('✅ Marketing copy seeded (15 items)');

  // Seed Scripts (15+ items)
  const scripts = [
    { title: 'Product Demo Video', type: 'video', topic: 'Software product demonstration', content: '[SCENE 1: Open on dashboard]\nNARRATOR: Welcome to the future of productivity...', duration: 5, status: 'completed' },
    { title: 'Company Overview', type: 'video', topic: 'Company introduction and values', content: '[SCENE 1: Aerial shot of office]\nNARRATOR: Every great company starts with a vision...', duration: 3, status: 'completed' },
    { title: 'Tutorial: Basic Features', type: 'video', topic: 'Getting started tutorial', content: '[SCENE 1: Screen recording]\nHOST: Hey everyone! Today I will show you how to get started...', duration: 10, status: 'completed' },
    { title: 'Customer Story', type: 'video', topic: 'Customer success testimonial', content: '[SCENE 1: Customer office]\nCUSTOMER: Before using this product, we were struggling...', duration: 4, status: 'completed' },
    { title: 'Podcast Intro Episode', type: 'podcast', topic: 'Podcast series introduction', content: '[INTRO MUSIC]\nHOST: Welcome to the very first episode of Tech Talks...', duration: 30, status: 'completed' },
    { title: 'Interview Script', type: 'podcast', topic: 'CEO interview episode', content: '[INTRO]\nHOST: Today we have a special guest...', duration: 45, status: 'completed' },
    { title: 'How-To Guide', type: 'video', topic: 'Step-by-step process explanation', content: '[SCENE 1: Title card]\nNARRATOR: In this video, you will learn exactly how to...', duration: 8, status: 'completed' },
    { title: 'Animated Explainer', type: 'video', topic: 'Complex concept explanation', content: '[SCENE 1: Animation - character appears]\nNARRATOR: Imagine a world where...', duration: 2, status: 'completed' },
    { title: 'Webinar Script', type: 'presentation', topic: 'Marketing strategies webinar', content: '[SLIDE 1: Welcome]\nHOST: Good afternoon everyone, thank you for joining us...', duration: 60, status: 'completed' },
    { title: 'Radio Ad', type: 'audio', topic: '30-second radio commercial', content: '[SFX: Upbeat music]\nANNCR: Are you tired of...', duration: 1, status: 'pending' },
    { title: 'Training Module', type: 'video', topic: 'Employee onboarding training', content: '[SCENE 1: Welcome screen]\nNARRATOR: Welcome to your first day at...', duration: 15, status: 'completed' },
    { title: 'Social Media Video', type: 'video', topic: 'TikTok/Reels style content', content: '[HOOK - 0:01]\nSPEAKER: Stop scrolling! You need to see this...', duration: 1, status: 'completed' },
    { title: 'Documentary Short', type: 'video', topic: 'Industry documentary', content: '[SCENE 1: Wide establishing shot]\nNARRATOR: In the heart of Silicon Valley...', duration: 20, status: 'completed' },
    { title: 'Sales Pitch Video', type: 'video', topic: 'B2B sales presentation', content: '[SCENE 1: Problem statement]\nNARRATOR: Every sales team faces the same challenge...', duration: 6, status: 'completed' },
    { title: 'Event Promo', type: 'video', topic: 'Conference promotional video', content: '[SCENE 1: Fast cuts of past events]\nNARRATOR: The biggest event of the year is back...', duration: 2, status: 'completed' }
  ];

  for (const script of scripts) {
    await prisma.script.create({ data: { ...script, userId: user.id } });
  }
  console.log('✅ Scripts seeded (15 items)');

  // Seed Podcasts (15+ items)
  const podcasts = [
    { title: 'Tech Trends Weekly', topic: 'Weekly technology news roundup', description: 'Your weekly dose of tech news', script: 'Welcome to Tech Trends Weekly...', audioUrl: 'https://example.com/podcasts/1.mp3', duration: 1800, status: 'completed' },
    { title: 'Startup Stories', topic: 'Founder interviews', description: 'Inspiring stories from founders', script: 'Today we sit down with...', audioUrl: 'https://example.com/podcasts/2.mp3', duration: 2700, status: 'completed' },
    { title: 'Marketing Masterclass', topic: 'Digital marketing tips', description: 'Learn marketing from experts', script: 'In this episode, we dive into...', audioUrl: 'https://example.com/podcasts/3.mp3', duration: 2400, status: 'completed' },
    { title: 'Leadership Lessons', topic: 'Management and leadership', description: 'Become a better leader', script: 'Leadership is not about titles...', audioUrl: 'https://example.com/podcasts/4.mp3', duration: 2100, status: 'completed' },
    { title: 'AI Explained', topic: 'Artificial intelligence basics', description: 'Making AI accessible', script: 'Artificial intelligence might sound scary...', audioUrl: 'https://example.com/podcasts/5.mp3', duration: 1500, status: 'completed' },
    { title: 'Career Growth', topic: 'Professional development', description: 'Advance your career', script: 'The most successful professionals...', audioUrl: 'https://example.com/podcasts/6.mp3', duration: 1800, status: 'completed' },
    { title: 'Industry Insights', topic: 'SaaS industry analysis', description: 'Deep dives into SaaS', script: 'The SaaS landscape is evolving...', audioUrl: 'https://example.com/podcasts/7.mp3', duration: 2400, status: 'completed' },
    { title: 'Product Management', topic: 'PM best practices', description: 'Tips for product managers', script: 'Building great products requires...', audioUrl: 'https://example.com/podcasts/8.mp3', duration: 2100, status: 'completed' },
    { title: 'Remote Work Life', topic: 'Working from anywhere', description: 'Thriving while remote', script: 'Remote work is here to stay...', audioUrl: 'https://example.com/podcasts/9.mp3', duration: 1800, status: 'completed' },
    { title: 'Funding Insights', topic: 'Venture capital trends', description: 'Understanding VC', script: 'Raising capital is a journey...', audioUrl: 'https://example.com/podcasts/10.mp3', duration: 2700, status: 'pending' },
    { title: 'Design Thinking', topic: 'UX and design philosophy', description: 'Design that delights', script: 'Good design is invisible...', audioUrl: 'https://example.com/podcasts/11.mp3', duration: 2100, status: 'completed' },
    { title: 'Sales Secrets', topic: 'B2B sales strategies', description: 'Close more deals', script: 'Every sale is a relationship...', audioUrl: 'https://example.com/podcasts/12.mp3', duration: 2400, status: 'completed' },
    { title: 'Content Creation', topic: 'Building an audience', description: 'Grow your following', script: 'Content is the new currency...', audioUrl: 'https://example.com/podcasts/13.mp3', duration: 1500, status: 'completed' },
    { title: 'Crypto Corner', topic: 'Cryptocurrency updates', description: 'Crypto market analysis', script: 'The crypto market never sleeps...', audioUrl: 'https://example.com/podcasts/14.mp3', duration: 1800, status: 'completed' },
    { title: 'Health Tech', topic: 'Healthcare innovation', description: 'Technology in medicine', script: 'Healthcare is being revolutionized...', audioUrl: 'https://example.com/podcasts/15.mp3', duration: 2400, status: 'completed' }
  ];

  for (const podcast of podcasts) {
    await prisma.podcast.create({ data: { ...podcast, userId: user.id } });
  }
  console.log('✅ Podcasts seeded (15 items)');

  // Seed Voiceovers (15+ items)
  const voiceovers = [
    { title: 'App Welcome', text: 'Welcome to our app. Let us show you around.', voice: 'friendly', language: 'en', audioUrl: 'https://example.com/voiceovers/1.mp3', duration: 15, status: 'completed' },
    { title: 'IVR Menu', text: 'Press 1 for sales, press 2 for support.', voice: 'professional', language: 'en', audioUrl: 'https://example.com/voiceovers/2.mp3', duration: 20, status: 'completed' },
    { title: 'Video Narration', text: 'In a world where technology moves fast...', voice: 'dramatic', language: 'en', audioUrl: 'https://example.com/voiceovers/3.mp3', duration: 60, status: 'completed' },
    { title: 'E-learning Module', text: 'In this lesson, you will learn about...', voice: 'educational', language: 'en', audioUrl: 'https://example.com/voiceovers/4.mp3', duration: 180, status: 'completed' },
    { title: 'Commercial VO', text: 'Introducing the all-new product that will change...', voice: 'energetic', language: 'en', audioUrl: 'https://example.com/voiceovers/5.mp3', duration: 30, status: 'completed' },
    { title: 'Meditation Guide', text: 'Take a deep breath. Let your thoughts...', voice: 'calm', language: 'en', audioUrl: 'https://example.com/voiceovers/6.mp3', duration: 300, status: 'completed' },
    { title: 'Podcast Intro', text: 'Welcome to another episode of...', voice: 'warm', language: 'en', audioUrl: 'https://example.com/voiceovers/7.mp3', duration: 20, status: 'completed' },
    { title: 'Documentary', text: 'The story of human innovation begins...', voice: 'authoritative', language: 'en', audioUrl: 'https://example.com/voiceovers/8.mp3', duration: 120, status: 'completed' },
    { title: 'Game Character', text: 'Brave adventurer, your quest begins now.', voice: 'fantasy', language: 'en', audioUrl: 'https://example.com/voiceovers/9.mp3', duration: 45, status: 'completed' },
    { title: 'Radio Spot', text: 'This weekend only at your local dealer...', voice: 'announcer', language: 'en', audioUrl: 'https://example.com/voiceovers/10.mp3', duration: 30, status: 'pending' },
    { title: 'Audiobook Sample', text: 'Chapter one. The morning sun rose over...', voice: 'narrative', language: 'en', audioUrl: 'https://example.com/voiceovers/11.mp3', duration: 90, status: 'completed' },
    { title: 'Safety Instructions', text: 'In case of emergency, please proceed...', voice: 'clear', language: 'en', audioUrl: 'https://example.com/voiceovers/12.mp3', duration: 45, status: 'completed' },
    { title: 'Product Tour', text: 'Let me walk you through our key features...', voice: 'friendly', language: 'en', audioUrl: 'https://example.com/voiceovers/13.mp3', duration: 120, status: 'completed' },
    { title: 'Spanish Welcome', text: 'Bienvenido a nuestra aplicación.', voice: 'professional', language: 'es', audioUrl: 'https://example.com/voiceovers/14.mp3', duration: 15, status: 'completed' },
    { title: 'French Tutorial', text: 'Bienvenue dans ce tutoriel.', voice: 'educational', language: 'fr', audioUrl: 'https://example.com/voiceovers/15.mp3', duration: 20, status: 'completed' }
  ];

  for (const voiceover of voiceovers) {
    await prisma.voiceover.create({ data: { ...voiceover, userId: user.id } });
  }
  console.log('✅ Voiceovers seeded (15 items)');

  // Seed Music Tracks (15+ items)
  const musicTracks = [
    { title: 'Corporate Inspiration', genre: 'corporate', mood: 'uplifting', prompt: 'Motivational corporate background music', audioUrl: 'https://example.com/music/1.mp3', duration: 180, status: 'completed' },
    { title: 'Chill Lo-Fi Beat', genre: 'lo-fi', mood: 'relaxed', prompt: 'Laid-back lo-fi hip hop for studying', audioUrl: 'https://example.com/music/2.mp3', duration: 240, status: 'completed' },
    { title: 'Epic Cinematic', genre: 'cinematic', mood: 'dramatic', prompt: 'Epic orchestral trailer music', audioUrl: 'https://example.com/music/3.mp3', duration: 120, status: 'completed' },
    { title: 'Upbeat Pop', genre: 'pop', mood: 'happy', prompt: 'Cheerful pop background for commercials', audioUrl: 'https://example.com/music/4.mp3', duration: 180, status: 'completed' },
    { title: 'Ambient Nature', genre: 'ambient', mood: 'peaceful', prompt: 'Calming ambient soundscape with nature', audioUrl: 'https://example.com/music/5.mp3', duration: 300, status: 'completed' },
    { title: 'Tech Innovation', genre: 'electronic', mood: 'futuristic', prompt: 'Modern electronic music for tech videos', audioUrl: 'https://example.com/music/6.mp3', duration: 150, status: 'completed' },
    { title: 'Acoustic Folk', genre: 'folk', mood: 'warm', prompt: 'Warm acoustic guitar folk melody', audioUrl: 'https://example.com/music/7.mp3', duration: 210, status: 'completed' },
    { title: 'Jazz Lounge', genre: 'jazz', mood: 'sophisticated', prompt: 'Smooth jazz for restaurant ambiance', audioUrl: 'https://example.com/music/8.mp3', duration: 240, status: 'completed' },
    { title: 'Action Sports', genre: 'rock', mood: 'energetic', prompt: 'High-energy rock for sports highlights', audioUrl: 'https://example.com/music/9.mp3', duration: 120, status: 'completed' },
    { title: 'Meditation Drone', genre: 'ambient', mood: 'meditative', prompt: 'Deep meditation drone music', audioUrl: 'https://example.com/music/10.mp3', duration: 600, status: 'pending' },
    { title: 'Holiday Jingle', genre: 'holiday', mood: 'festive', prompt: 'Cheerful Christmas jingle', audioUrl: 'https://example.com/music/11.mp3', duration: 90, status: 'completed' },
    { title: 'Retro Synthwave', genre: 'synthwave', mood: 'nostalgic', prompt: '80s inspired synthwave track', audioUrl: 'https://example.com/music/12.mp3', duration: 210, status: 'completed' },
    { title: 'World Music Fusion', genre: 'world', mood: 'exotic', prompt: 'World music with diverse instruments', audioUrl: 'https://example.com/music/13.mp3', duration: 240, status: 'completed' },
    { title: 'Piano Emotional', genre: 'classical', mood: 'emotional', prompt: 'Emotional piano piece for storytelling', audioUrl: 'https://example.com/music/14.mp3', duration: 180, status: 'completed' },
    { title: 'Hip Hop Beat', genre: 'hip-hop', mood: 'confident', prompt: 'Modern hip hop instrumental beat', audioUrl: 'https://example.com/music/15.mp3', duration: 180, status: 'completed' }
  ];

  for (const track of musicTracks) {
    await prisma.musicTrack.create({ data: { ...track, userId: user.id } });
  }
  console.log('✅ Music tracks seeded (15 items)');

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
