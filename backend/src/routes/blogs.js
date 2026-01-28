const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateBlogPost } = require('../services/openrouter');

router.get('/', auth, async (req, res) => {
  try {
    const blogs = await req.prisma.blogPost.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const blog = await req.prisma.blogPost.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!blog) return res.status(404).json({ error: 'Blog post not found' });
    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch blog post' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, topic, keywords } = req.body;
    const blog = await req.prisma.blogPost.create({
      data: {
        title,
        topic,
        keywords,
        userId: req.userId,
        status: 'pending'
      }
    });
    res.status(201).json(blog);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create blog post' });
  }
});

router.post('/:id/generate', auth, async (req, res) => {
  try {
    const blog = await req.prisma.blogPost.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (!blog) return res.status(404).json({ error: 'Blog post not found' });

    await req.prisma.blogPost.update({
      where: { id: blog.id },
      data: { status: 'processing' }
    });

    const content = await generateBlogPost(blog.topic, blog.keywords);
    const excerpt = content.split('\n').slice(0, 3).join(' ').slice(0, 200) + '...';

    const updated = await req.prisma.blogPost.update({
      where: { id: blog.id },
      data: { content, excerpt, status: 'completed' }
    });
    res.json(updated);
  } catch (error) {
    await req.prisma.blogPost.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'failed' }
    });
    res.status(500).json({ error: 'Failed to generate blog post' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await req.prisma.blogPost.deleteMany({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    res.json({ message: 'Blog post deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete blog post' });
  }
});

module.exports = router;
