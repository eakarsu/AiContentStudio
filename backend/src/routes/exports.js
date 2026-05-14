const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const PDFDocument = require('pdfkit');

// GET /api/export/content-report — comprehensive PDF content report
router.get('/content-report', auth, async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateFilter = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);
    const createdAt = Object.keys(dateFilter).length ? dateFilter : undefined;

    const baseWhere = { userId: req.userId, ...(createdAt ? { createdAt } : {}) };

    // Fetch all content counts and recent items in parallel
    const [
      blogs, social, emails, pressReleases, newsletters,
      calendarItems, blogOutlines, scripts, podcasts
    ] = await Promise.all([
      req.prisma.blog.findMany({ where: baseWhere, orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, title: true, status: true, createdAt: true } }),
      req.prisma.socialPost.findMany({ where: baseWhere, orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, title: true, platform: true, status: true, createdAt: true } }),
      req.prisma.email.findMany({ where: baseWhere, orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, subject: true, status: true, createdAt: true } }),
      req.prisma.pressRelease.findMany({ where: baseWhere, orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, title: true, status: true, createdAt: true } }),
      req.prisma.newsletter.findMany({ where: baseWhere, orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, subject: true, status: true, createdAt: true } }),
      req.prisma.contentCalendar.findMany({ where: baseWhere, orderBy: { scheduledDate: 'asc' }, take: 20, select: { id: true, title: true, platform: true, scheduledDate: true, status: true } }),
      req.prisma.blogOutline.findMany({ where: baseWhere, orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, title: true, status: true, createdAt: true } }),
      req.prisma.script.findMany({ where: baseWhere, orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, title: true, status: true, createdAt: true } }),
      req.prisma.podcast.findMany({ where: baseWhere, orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, title: true, status: true, createdAt: true } }),
    ]);

    // Build PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));

    const pdfReady = new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    const dateLabel = from || to
      ? `${from ? 'From ' + from : ''} ${to ? 'To ' + to : ''}`.trim()
      : 'All time';

    // Header
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#1a1a2e').text('Content Report', { align: 'center' });
    doc.fontSize(11).font('Helvetica').fillColor('#555').text(`Generated: ${new Date().toLocaleDateString()}  |  Period: ${dateLabel}`, { align: 'center' });
    doc.moveDown(1.5);

    // Summary stats
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#1a1a2e').text('Summary');
    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ddd').stroke();
    doc.moveDown(0.5);

    const stats = [
      { label: 'Blog Posts', count: blogs.length },
      { label: 'Social Posts', count: social.length },
      { label: 'Emails', count: emails.length },
      { label: 'Press Releases', count: pressReleases.length },
      { label: 'Newsletters', count: newsletters.length },
      { label: 'Calendar Items', count: calendarItems.length },
      { label: 'Blog Outlines', count: blogOutlines.length },
      { label: 'Scripts', count: scripts.length },
      { label: 'Podcasts', count: podcasts.length },
    ];

    const totalItems = stats.reduce((sum, s) => sum + s.count, 0);

    doc.fontSize(11).font('Helvetica');
    const colW = 160;
    let col = 0;
    let rowY = doc.y;
    stats.forEach((s, i) => {
      const x = 50 + (col * colW);
      doc.fillColor('#333').text(`${s.label}:`, x, rowY, { width: 110, continued: true });
      doc.font('Helvetica-Bold').fillColor('#1a1a2e').text(` ${s.count}`);
      doc.font('Helvetica');
      col++;
      if (col >= 3) { col = 0; rowY = doc.y + 5; }
    });

    doc.moveDown(1);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a1a2e').text(`Total Content Items: ${totalItems}`, { align: 'right' });
    doc.moveDown(1.5);

    // Helper to render a section table
    const renderSection = (title, items, columns) => {
      if (items.length === 0) return;
      if (doc.y > 680) doc.addPage();

      doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a1a2e').text(title);
      doc.moveDown(0.3);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ddd').stroke();
      doc.moveDown(0.3);

      const colWidth = 495 / columns.length;
      const headerY = doc.y;

      // Column headers
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#666');
      columns.forEach((col, i) => {
        doc.text(col.header, 50 + i * colWidth, headerY, { width: colWidth - 5 });
      });
      doc.moveDown(0.5);

      // Rows
      doc.font('Helvetica').fontSize(8).fillColor('#333');
      items.forEach((item, idx) => {
        if (doc.y > 730) { doc.addPage(); doc.y = 50; }
        const rowY = doc.y;
        if (idx % 2 === 0) {
          doc.rect(48, rowY - 2, 499, 14).fillColor('#f9f9f9').fill();
          doc.fillColor('#333');
        }
        columns.forEach((col, i) => {
          const val = String(item[col.key] || '').slice(0, 40);
          doc.text(val, 50 + i * colWidth, rowY, { width: colWidth - 5 });
        });
        doc.moveDown(0.4);
      });
      doc.moveDown(1);
    };

    renderSection('Recent Blog Posts', blogs, [
      { header: 'Title', key: 'title' },
      { header: 'Status', key: 'status' },
      { header: 'Created', key: 'createdAt' }
    ]);

    renderSection('Recent Social Posts', social, [
      { header: 'Title', key: 'title' },
      { header: 'Platform', key: 'platform' },
      { header: 'Status', key: 'status' }
    ]);

    renderSection('Recent Emails', emails, [
      { header: 'Subject', key: 'subject' },
      { header: 'Status', key: 'status' },
      { header: 'Created', key: 'createdAt' }
    ]);

    renderSection('Recent Press Releases', pressReleases, [
      { header: 'Title', key: 'title' },
      { header: 'Status', key: 'status' },
      { header: 'Created', key: 'createdAt' }
    ]);

    renderSection('Recent Newsletters', newsletters, [
      { header: 'Subject', key: 'subject' },
      { header: 'Status', key: 'status' },
      { header: 'Created', key: 'createdAt' }
    ]);

    renderSection('Upcoming Calendar Items', calendarItems, [
      { header: 'Title', key: 'title' },
      { header: 'Platform', key: 'platform' },
      { header: 'Scheduled', key: 'scheduledDate' },
      { header: 'Status', key: 'status' }
    ]);

    renderSection('Blog Outlines', blogOutlines, [
      { header: 'Title', key: 'title' },
      { header: 'Status', key: 'status' },
      { header: 'Created', key: 'createdAt' }
    ]);

    renderSection('Scripts', scripts, [
      { header: 'Title', key: 'title' },
      { header: 'Status', key: 'status' },
      { header: 'Created', key: 'createdAt' }
    ]);

    renderSection('Podcasts', podcasts, [
      { header: 'Title', key: 'title' },
      { header: 'Status', key: 'status' },
      { header: 'Created', key: 'createdAt' }
    ]);

    // Footer on last page
    doc.fontSize(8).fillColor('#aaa').text(`AI Content Studio — Content Report — ${new Date().toISOString()}`, 50, doc.page.height - 40, { align: 'center' });

    doc.end();

    const pdfBuffer = await pdfReady;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="content-report-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Content report error:', error);
    res.status(500).json({ error: 'Failed to generate content report' });
  }
});

// GET /api/export/blogs — blogs CSV
router.get('/blogs', auth, async (req, res) => {
  try {
    const { generateCSV } = require('../utils/export');
    const items = await req.prisma.blog.findMany({ where: { userId: req.userId }, orderBy: { createdAt: 'desc' } });
    const csv = generateCSV(items, ['id', 'title', 'status', 'topic', 'createdAt']);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="blogs-export.csv"');
    res.send(csv);
  } catch (error) { res.status(500).json({ error: 'Failed to export' }); }
});

// GET /api/export/calendar — calendar CSV
router.get('/calendar', auth, async (req, res) => {
  try {
    const { generateCSV } = require('../utils/export');
    const items = await req.prisma.contentCalendar.findMany({ where: { userId: req.userId }, orderBy: { scheduledDate: 'asc' } });
    const csv = generateCSV(items, ['id', 'title', 'platform', 'scheduledDate', 'status']);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="calendar-export.csv"');
    res.send(csv);
  } catch (error) { res.status(500).json({ error: 'Failed to export' }); }
});

module.exports = router;
