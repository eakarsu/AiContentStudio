const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateBlogPost } = require('../services/openrouter');

// Snapshot helper — save a version before overwriting
async function createVersionSnapshot(prisma, contentId, data, userId) {
  const last = await prisma.contentVersion.findFirst({
    where: { contentType: 'blog', contentId },
    orderBy: { version: 'desc' },
    select: { version: true }
  });
  await prisma.contentVersion.create({
    data: {
      contentType: 'blog',
      contentId,
      version: (last?.version ?? 0) + 1,
      data,
      userId
    }
  });
}

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
        { topic: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { keywords: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      req.prisma.blogPost.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limitNum
      }),
      req.prisma.blogPost.count({ where })
    ]);

    res.json({ items, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

// Export CSV
router.get('/export/csv', auth, async (req, res) => {
  try {
    const { generateCSV } = require('../utils/export');
    const items = await req.prisma.blogPost.findMany({
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
    res.setHeader('Content-Disposition', `attachment; filename="blogs-export.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// Export PDF
router.get('/export/pdf', auth, async (req, res) => {
  try {
    const { generatePDF } = require('../utils/export');
    const items = await req.prisma.blogPost.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    const fields = [
      { label: 'ID', value: 'id' },
      { label: 'Title', value: 'title' },
      { label: 'Status', value: 'status' },
      { label: 'Created', value: 'createdAt' },
    ];
    const pdf = await generatePDF(items, 'Blog Post Export', fields);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="blogs-export.pdf"`);
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export PDF' });
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

    const rawContent = await generateBlogPost(blog.topic, blog.keywords);

    // Clean up and ensure professional formatting
    let content = rawContent.trim();
    // Ensure title is present
    if (!content.startsWith('#')) {
      content = `# ${blog.title}\n\n${content}`;
    }
    // Add metadata footer
    const wordCount = content.split(/\s+/).length;
    content += `\n\n---\n*Generated for: "${blog.topic}" | Words: ~${wordCount}${blog.keywords ? ` | Keywords: ${blog.keywords}` : ''}*`;

    // Create a clean excerpt from first meaningful paragraph
    const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#') && !l.startsWith('>') && !l.startsWith('---') && !l.startsWith('*'));
    const excerpt = (lines[0] || '').replace(/\*\*/g, '').slice(0, 200) + '...';

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

// Update blog post (snapshots a version before overwriting)
router.put('/:id', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, topic, keywords, status, content, excerpt } = req.body;

    // Fetch existing record to snapshot
    const existing = await req.prisma.blogPost.findFirst({
      where: { id, userId: req.userId }
    });
    if (!existing) return res.status(404).json({ error: 'Blog post not found' });

    // Save version snapshot before overwriting
    await createVersionSnapshot(req.prisma, id, existing, req.userId);

    const item = await req.prisma.blogPost.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(topic !== undefined && { topic }),
        ...(keywords !== undefined && { keywords }),
        ...(status !== undefined && { status }),
        ...(content !== undefined && { content }),
        ...(excerpt !== undefined && { excerpt }),
      }
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update blog post' });
  }
});

// GET /:id/versions — list all versions of a blog post
router.get('/:id/versions', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const item = await req.prisma.blogPost.findFirst({ where: { id, userId: req.userId } });
    if (!item) return res.status(404).json({ error: 'Blog post not found' });

    const versions = await req.prisma.contentVersion.findMany({
      where: { contentType: 'blog', contentId: id },
      orderBy: { version: 'desc' }
    });
    res.json(versions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch versions' });
  }
});

// Bulk delete blog posts
router.post('/bulk-delete', auth, async (req, res) => {
  try {
    const { ids } = req.body;
    const result = await req.prisma.blogPost.deleteMany({
      where: { id: { in: ids }, userId: req.userId }
    });
    res.json({ message: `${result.count} blog posts deleted` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk delete blog posts' });
  }
});

// Bulk update blog posts
router.post('/bulk-update', auth, async (req, res) => {
  try {
    const { ids, data } = req.body;
    const result = await req.prisma.blogPost.updateMany({
      where: { id: { in: ids }, userId: req.userId },
      data
    });
    res.json({ message: `${result.count} blog posts updated` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk update blog posts' });
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
