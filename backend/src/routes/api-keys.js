const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const auth = require('../middleware/auth');

// Get all API keys for user
router.get('/', auth, async (req, res) => {
  try {
    const keys = await req.prisma.apiKey.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, key: true, lastUsed: true, expiresAt: true, active: true, createdAt: true }
    });
    // Mask keys - only show last 8 chars
    const masked = keys.map(k => ({
      ...k,
      key: '••••••••' + k.key.slice(-8)
    }));
    res.json(masked);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

// Create new API key
router.post('/', auth, async (req, res) => {
  try {
    const { name, expiresAt } = req.body;
    if (!name) return res.status(400).json({ error: 'Key name is required' });

    const key = 'acs_' + crypto.randomBytes(32).toString('hex');

    const apiKey = await req.prisma.apiKey.create({
      data: {
        name,
        key,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        userId: req.userId
      }
    });

    // Return full key only on creation
    res.status(201).json(apiKey);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

// Delete API key
router.delete('/:id', auth, async (req, res) => {
  try {
    await req.prisma.apiKey.deleteMany({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    res.json({ message: 'API key deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

// Regenerate API key
router.post('/:id/regenerate', auth, async (req, res) => {
  try {
    const newKey = 'acs_' + crypto.randomBytes(32).toString('hex');
    const updated = await req.prisma.apiKey.updateMany({
      where: { id: parseInt(req.params.id), userId: req.userId },
      data: { key: newKey }
    });
    if (updated.count === 0) return res.status(404).json({ error: 'API key not found' });

    res.json({ key: newKey });
  } catch (error) {
    res.status(500).json({ error: 'Failed to regenerate API key' });
  }
});

module.exports = router;
