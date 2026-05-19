const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { repurposeContent } = require('../services/openrouter');

// In-memory job store (suitable for single-process; replace with Redis for multi-process)
const jobs = new Map();

// Generate a simple unique job ID
function makeJobId() {
  return `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Process a single repurpose item — fetches original content, calls AI, saves result
async function processItem(prisma, contentId, originalType, targetType, userId) {
  const modelMap = {
    video: 'video',
    blog: 'blogPost',
    blogPost: 'blogPost',
    email: 'email',
    social: 'socialPost',
    socialPost: 'socialPost',
    text: 'textContent',
    textContent: 'textContent',
    script: 'script',
    podcast: 'podcast',
    newsletter: 'newsletter',
    pressRelease: 'pressRelease',
    marketing: 'marketingCopy',
    marketingCopy: 'marketingCopy',
    seo: 'sEOContent',
    sEOContent: 'sEOContent',
  };

  const prismaModel = modelMap[originalType];
  if (!prismaModel) throw new Error(`Unknown originalType: ${originalType}`);

  // Fetch source content
  const source = await prisma[prismaModel].findFirst({
    where: { id: contentId, userId }
  });
  if (!source) throw new Error(`Content item ${contentId} not found`);

  // Determine the text to repurpose (different models store content in different fields)
  const originalContent =
    source.content ||
    source.repurposedContent ||
    source.script ||
    source.body ||
    source.originalText ||
    source.prompt ||
    source.topic ||
    source.text ||
    JSON.stringify(source);

  const repurposed = await repurposeContent(
    originalContent,
    originalType,
    targetType,
    null // no specific platform in batch mode
  );

  // Save as a new RepurposedContent record
  const record = await prisma.repurposedContent.create({
    data: {
      title: `${source.title || `Item ${contentId}`} → ${targetType}`,
      originalContent,
      originalType,
      targetType,
      repurposedContent: repurposed,
      status: 'completed',
      userId
    }
  });

  return { contentId, repurposedId: record.id, status: 'completed' };
}

// Concurrency-limited batch processor (max 3 concurrent AI calls)
async function runBatch(jobId, prisma, contentIds, originalType, targetType, userId) {
  const job = jobs.get(jobId);
  job.status = 'processing';
  job.total = contentIds.length;
  job.processed = 0;
  job.results = [];
  job.errors = [];

  const CONCURRENCY = 3;

  async function processWithLimit(ids) {
    const queue = [...ids];
    const inFlight = new Set();
    const results = [];

    return new Promise((resolve, reject) => {
      function next() {
        while (inFlight.size < CONCURRENCY && queue.length > 0) {
          const id = queue.shift();
          const p = processItem(prisma, id, originalType, targetType, userId)
            .then(result => {
              results.push(result);
              job.results.push(result);
              job.processed++;
            })
            .catch(err => {
              const errResult = { contentId: id, status: 'error', error: err.message };
              results.push(errResult);
              job.errors.push(errResult);
              job.processed++;
            })
            .finally(() => {
              inFlight.delete(p);
              next();
              if (inFlight.size === 0 && queue.length === 0) resolve(results);
            });
          inFlight.add(p);
        }
      }
      next();
      if (contentIds.length === 0) resolve([]);
    });
  }

  try {
    await processWithLimit(contentIds);
    job.status = job.errors.length === 0 ? 'completed' : 'completed_with_errors';
  } catch (err) {
    job.status = 'failed';
    job.fatalError = err.message;
  }
  job.completedAt = new Date().toISOString();
}

// POST /api/repurpose/batch — kick off a batch repurpose job
router.post('/batch', auth, async (req, res) => {
  try {
    const { contentIds, originalType, targetType } = req.body;

    if (!Array.isArray(contentIds) || contentIds.length === 0) {
      return res.status(400).json({ error: 'contentIds must be a non-empty array' });
    }
    if (!originalType || !targetType) {
      return res.status(400).json({ error: 'originalType and targetType are required' });
    }
    if (contentIds.length > 50) {
      return res.status(400).json({ error: 'Batch size cannot exceed 50 items' });
    }

    const jobId = makeJobId();
    jobs.set(jobId, {
      jobId,
      status: 'queued',
      total: contentIds.length,
      processed: 0,
      results: [],
      errors: [],
      originalType,
      targetType,
      userId: req.userId,
      createdAt: new Date().toISOString(),
      completedAt: null,
      fatalError: null
    });

    // Fire and forget — do NOT await
    setImmediate(() => {
      runBatch(jobId, req.prisma, contentIds.map(Number), originalType, targetType, req.userId)
        .catch(err => {
          const job = jobs.get(jobId);
          if (job) { job.status = 'failed'; job.fatalError = err.message; }
        });
    });

    res.status(202).json({ jobId, message: 'Batch job queued', total: contentIds.length });
  } catch (error) {
    console.error('Batch repurpose error:', error);
    res.status(500).json({ error: 'Failed to start batch job' });
  }
});

// GET /api/repurpose/batch/:jobId — get batch job status and results
router.get('/batch/:jobId', auth, async (req, res) => {
  try {
    const job = jobs.get(req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    // Ensure the requesting user owns the job
    if (job.userId !== req.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json({
      jobId: job.jobId,
      status: job.status,
      total: job.total,
      processed: job.processed,
      successCount: job.results.length,
      errorCount: job.errors.length,
      results: job.results,
      errors: job.errors,
      originalType: job.originalType,
      targetType: job.targetType,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      ...(job.fatalError && { fatalError: job.fatalError })
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch job status' });
  }
});

module.exports = router;
