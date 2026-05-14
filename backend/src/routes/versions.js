const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Map URL content type slugs to Prisma model names
const MODEL_MAP = {
  video: 'video',
  videos: 'video',
  audio: 'audio',
  text: 'textContent',
  image: 'image',
  images: 'image',
  translation: 'translation',
  translations: 'translation',
  summary: 'summary',
  summaries: 'summary',
  seo: 'sEOContent',
  social: 'socialPost',
  email: 'email',
  emails: 'email',
  blog: 'blogPost',
  blogs: 'blogPost',
  marketing: 'marketingCopy',
  script: 'script',
  scripts: 'script',
  podcast: 'podcast',
  podcasts: 'podcast',
  voiceover: 'voiceover',
  voiceovers: 'voiceover',
  music: 'musicTrack',
  calendar: 'contentCalendar',
  repurpose: 'repurposedContent',
  plagiarism: 'plagiarismCheck',
  'image-suggester': 'imageSuggestion',
  performance: 'performancePrediction',
  'blog-outline': 'blogOutline',
  'blog-outlines': 'blogOutline',
  newsletter: 'newsletter',
  newsletters: 'newsletter',
  'press-release': 'pressRelease',
  'press-releases': 'pressRelease',
};

// Normalise the contentType to a canonical form for storage
function canonicalType(type) {
  return type.replace(/-/g, '_');
}

// Verify ownership of a content item
async function verifyOwnership(prisma, type, id, userId) {
  const modelName = MODEL_MAP[type];
  if (!modelName) throw new Error(`Unknown content type: ${type}`);
  const item = await prisma[modelName].findFirst({ where: { id: parseInt(id), userId } });
  return item;
}

// GET /api/versions/:type/:id — list all versions for a content item
router.get('/:type/:id', auth, async (req, res) => {
  try {
    const { type, id } = req.params;
    const item = await verifyOwnership(req.prisma, type, id, req.userId);
    if (!item) return res.status(404).json({ error: 'Content item not found' });

    const versions = await req.prisma.contentVersion.findMany({
      where: { contentType: canonicalType(type), contentId: parseInt(id) },
      orderBy: { version: 'desc' }
    });

    res.json({ contentType: type, contentId: parseInt(id), versions });
  } catch (error) {
    if (error.message.startsWith('Unknown content type')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to fetch versions' });
  }
});

// POST /api/versions/:type/:id/restore/:versionId — restore a specific version
router.post('/:type/:id/restore/:versionId', auth, async (req, res) => {
  try {
    const { type, id, versionId } = req.params;
    const contentId = parseInt(id);
    const modelName = MODEL_MAP[type];
    if (!modelName) return res.status(400).json({ error: `Unknown content type: ${type}` });

    const item = await verifyOwnership(req.prisma, type, id, req.userId);
    if (!item) return res.status(404).json({ error: 'Content item not found' });

    const versionRecord = await req.prisma.contentVersion.findFirst({
      where: {
        id: parseInt(versionId),
        contentType: canonicalType(type),
        contentId
      }
    });
    if (!versionRecord) return res.status(404).json({ error: 'Version not found' });

    // Snapshot current state before overwriting
    const last = await req.prisma.contentVersion.findFirst({
      where: { contentType: canonicalType(type), contentId },
      orderBy: { version: 'desc' },
      select: { version: true }
    });
    const nextVersion = (last?.version ?? 0) + 1;
    await req.prisma.contentVersion.create({
      data: {
        contentType: canonicalType(type),
        contentId,
        version: nextVersion,
        data: item,
        userId: req.userId
      }
    });

    // Strip system fields from snapshot data before restoring
    const { id: _id, userId: _uid, createdAt: _ca, updatedAt: _ua, ...restoreData } = versionRecord.data;

    const restored = await req.prisma[modelName].update({
      where: { id: contentId },
      data: restoreData
    });

    res.json({
      message: `Restored to version ${versionRecord.version}`,
      item: restored,
      restoredVersion: versionRecord.version
    });
  } catch (error) {
    console.error('Version restore error:', error);
    res.status(500).json({ error: 'Failed to restore version' });
  }
});

module.exports = router;
