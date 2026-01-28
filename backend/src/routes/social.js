const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateSocialPost } = require('../services/openrouter');

router.get('/', auth, async (req, res) => {
  try {
    const posts = await req.prisma.socialPost.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch social posts' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const post = await req.prisma.socialPost.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!post) return res.status(404).json({ error: 'Social post not found' });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch social post' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, platform, prompt } = req.body;
    const post = await req.prisma.socialPost.create({
      data: {
        title,
        platform: platform || 'instagram',
        prompt,
        userId: req.userId,
        status: 'pending'
      }
    });
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create social post' });
  }
});

router.post('/:id/generate', auth, async (req, res) => {
  try {
    const post = await req.prisma.socialPost.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!post) return res.status(404).json({ error: 'Social post not found' });

    await req.prisma.socialPost.update({
      where: { id: post.id },
      data: { status: 'processing' }
    });

    const content = await generateSocialPost(post.platform, post.prompt);
    const hashtagMatch = content.match(/#\w+/g);
    const hashtags = hashtagMatch ? hashtagMatch.join(' ') : '';

    const updated = await req.prisma.socialPost.update({
      where: { id: post.id },
      data: { content, hashtags, status: 'completed' }
    });
    res.json(updated);
  } catch (error) {
    await req.prisma.socialPost.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'failed' }
    });
    res.status(500).json({ error: 'Failed to generate social post' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await req.prisma.socialPost.deleteMany({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    res.json({ message: 'Social post deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete social post' });
  }
});

module.exports = router;
