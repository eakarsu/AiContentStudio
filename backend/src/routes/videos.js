const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const auth = require('../middleware/auth');
const { generateVideoContent, generateText } = require('../services/openrouter');
const { generateTTS, generateImage } = require('../services/openai-media');

const UPLOADS_DIR = path.join(__dirname, '../../public/uploads');

// Get all videos for user
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
        { prompt: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      req.prisma.video.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limitNum
      }),
      req.prisma.video.count({ where })
    ]);

    res.json({ items, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Export CSV
router.get('/export/csv', auth, async (req, res) => {
  try {
    const { generateCSV } = require('../utils/export');
    const items = await req.prisma.video.findMany({
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
    res.setHeader('Content-Disposition', `attachment; filename="videos-export.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// Export PDF
router.get('/export/pdf', auth, async (req, res) => {
  try {
    const { generatePDF } = require('../utils/export');
    const items = await req.prisma.video.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    const fields = [
      { label: 'ID', value: 'id' },
      { label: 'Title', value: 'title' },
      { label: 'Status', value: 'status' },
      { label: 'Created', value: 'createdAt' },
    ];
    const pdf = await generatePDF(items, 'Video Export', fields);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="videos-export.pdf"`);
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export PDF' });
  }
});

// Get single video
router.get('/:id', auth, async (req, res) => {
  try {
    const video = await req.prisma.video.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    res.json(video);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch video' });
  }
});

// Create new video
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, prompt, style, resolution } = req.body;

    const video = await req.prisma.video.create({
      data: {
        title,
        description,
        prompt,
        style: style || 'professional',
        resolution: resolution || '1080p',
        userId: req.userId,
        status: 'pending'
      }
    });

    res.status(201).json(video);
  } catch (error) {
    console.error('Create video error:', error);
    res.status(500).json({ error: 'Failed to create video' });
  }
});

// Generate video content with AI
router.post('/:id/generate', auth, async (req, res) => {
  try {
    const video = await req.prisma.video.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    await req.prisma.video.update({
      where: { id: video.id },
      data: { status: 'processing' }
    });

    const timestamp = Date.now();
    console.log(`[Video ${video.id}] Step 1/5: Generating script...`);
    const rawContent = await generateVideoContent(video.prompt, video.style);

    // Clean up and ensure professional formatting
    let content = rawContent.trim();
    if (!content.startsWith('#')) {
      content = `# Video Concept: ${video.title}\n\n> **Style:** ${video.style} | **Resolution:** ${video.resolution}\n\n---\n\n${content}`;
    }
    const wordCount = content.split(/\s+/).length;
    content += `\n\n---\n*Video: "${video.title}" | Style: ${video.style} | Resolution: ${video.resolution} | ~${wordCount} words*`;

    // Generate scene descriptions from script
    console.log(`[Video ${video.id}] Step 2/5: Generating scene descriptions...`);
    const scenesPrompt = `Based on this video script, create exactly 4 short image descriptions for 4 different scenes. Each description should be a safe, simple visual scene suitable for AI image generation. IMPORTANT: Do NOT describe people in detail, avoid describing body parts, clothing details, or physical actions. Focus on environments, objects, landscapes, abstract concepts, and text overlays instead. Return ONLY 4 lines, one description per line, no numbering or extra text.\n\nScript: ${content.slice(0, 2000)}`;
    const scenesText = await generateText(scenesPrompt, {
      systemPrompt: 'You create concise, safe visual scene descriptions for AI image generation. Focus on environments, objects, and abstract visuals. Avoid describing people in detail. Return exactly 4 lines.',
      maxTokens: 500
    });
    const scenes = scenesText.split('\n').filter(s => s.trim().length > 10).slice(0, 4);
    if (scenes.length < 2) {
      scenes.push(video.prompt);
      scenes.push(`${video.prompt}, different angle`);
    }

    // Generate multiple images for scenes (with content filter retry)
    console.log(`[Video ${video.id}] Step 3/5: Generating ${scenes.length} scene images with DALL-E...`);
    const imagePaths = [];
    for (let i = 0; i < scenes.length; i++) {
      console.log(`[Video ${video.id}]   - Scene ${i + 1}/${scenes.length}: "${scenes[i].slice(0, 50)}..."`);
      try {
        const imgResult = await generateImage(
          `${scenes[i]}. Style: ${video.style || 'professional'}, cinematic, high quality`,
          { size: '1792x1024', filename: `video_${video.id}_scene${i}_${timestamp}.png` }
        );
        imagePaths.push(path.join(UPLOADS_DIR, imgResult.url.replace('/uploads/', '')));
      } catch (imgError) {
        if (imgError.code === 'content_policy_violation') {
          console.log(`[Video ${video.id}]   - Scene ${i + 1} blocked by content filter, retrying with safer prompt...`);
          try {
            // Retry with a generic safe prompt
            const safePrompt = `A professional ${video.style || 'modern'} scene related to ${video.title}. Clean, minimal, corporate style with soft lighting and neutral colors.`;
            const retryResult = await generateImage(safePrompt, {
              size: '1792x1024',
              filename: `video_${video.id}_scene${i}_${timestamp}.png`
            });
            imagePaths.push(path.join(UPLOADS_DIR, retryResult.url.replace('/uploads/', '')));
          } catch (retryError) {
            console.log(`[Video ${video.id}]   - Scene ${i + 1} retry also failed, skipping...`);
          }
        } else {
          throw imgError; // Re-throw non-content-filter errors
        }
      }
    }

    // Need at least 1 image to make a video
    if (imagePaths.length === 0) {
      throw new Error('All scene images were blocked by content filters. Try a different topic.');
    }

    // Generate narration audio with TTS
    console.log(`[Video ${video.id}] Step 4/5: Generating narration audio with TTS...`);
    const narrationText = content.slice(0, 4096);
    const ttsResult = await generateTTS(narrationText, {
      voice: 'onyx',
      filename: `video_narration_${video.id}_${timestamp}.mp3`
    });

    // Get audio duration using ffprobe
    let audioDuration;
    try {
      const probeResult = execSync(`ffprobe -v quiet -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${path.join(UPLOADS_DIR, ttsResult.url.replace('/uploads/', ''))}"`, { timeout: 10000 });
      audioDuration = parseFloat(probeResult.toString().trim());
    } catch (e) {
      audioDuration = ttsResult.duration || 30;
    }

    // Calculate duration per scene
    const durationPerScene = Math.max(3, Math.floor(audioDuration / imagePaths.length));

    // Create concat file for ffmpeg
    console.log(`[Video ${video.id}] Step 5/5: Combining ${imagePaths.length} scenes + audio into video (${Math.round(audioDuration)}s)...`);
    const concatFile = path.join(UPLOADS_DIR, 'videos', `concat_${video.id}_${timestamp}.txt`);
    const concatContent = imagePaths.map(p => `file '${p}'\nduration ${durationPerScene}`).join('\n') + `\nfile '${imagePaths[imagePaths.length - 1]}'`;
    fs.writeFileSync(concatFile, concatContent);

    const videoFilename = `video_${video.id}_${timestamp}.mp4`;
    const videoPath = path.join(UPLOADS_DIR, 'videos', videoFilename);
    const audioPath = path.join(UPLOADS_DIR, ttsResult.url.replace('/uploads/', ''));

    execSync(
      `ffmpeg -y -f concat -safe 0 -i "${concatFile}" -i "${audioPath}" -c:v libx264 -vf "scale=1792:1024,format=yuv420p" -c:a aac -b:a 192k -shortest -movflags +faststart "${videoPath}"`,
      { timeout: 180000 }
    );

    // Cleanup concat file
    fs.unlinkSync(concatFile);

    console.log(`[Video ${video.id}] Done! Video saved: ${videoFilename}`);

    const updatedVideo = await req.prisma.video.update({
      where: { id: video.id },
      data: {
        description: content,
        status: 'completed',
        videoUrl: `/uploads/videos/${videoFilename}`,
        thumbnail: `/uploads/images/video_${video.id}_scene0_${timestamp}.png`,
        duration: Math.round(audioDuration)
      }
    });

    res.json(updatedVideo);
  } catch (error) {
    console.error('Generate video error:', error);
    await req.prisma.video.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'failed' }
    });
    res.status(500).json({ error: 'Failed to generate video content' });
  }
});

// Update video
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, prompt, style, resolution, status } = req.body;
    const updated = await req.prisma.video.updateMany({
      where: { id: parseInt(req.params.id), userId: req.userId },
      data: { title, description, prompt, style, resolution, status }
    });
    if (updated.count === 0) return res.status(404).json({ error: 'Video not found' });
    const item = await req.prisma.video.findFirst({ where: { id: parseInt(req.params.id) } });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update video' });
  }
});

// Bulk delete videos
router.post('/bulk-delete', auth, async (req, res) => {
  try {
    const { ids } = req.body;
    const result = await req.prisma.video.deleteMany({
      where: { id: { in: ids }, userId: req.userId }
    });
    res.json({ message: `${result.count} videos deleted` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk delete videos' });
  }
});

// Bulk update videos
router.post('/bulk-update', auth, async (req, res) => {
  try {
    const { ids, data } = req.body;
    const result = await req.prisma.video.updateMany({
      where: { id: { in: ids }, userId: req.userId },
      data
    });
    res.json({ message: `${result.count} videos updated` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk update videos' });
  }
});

// Delete video
router.delete('/:id', auth, async (req, res) => {
  try {
    await req.prisma.video.deleteMany({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    res.json({ message: 'Video deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

module.exports = router;
