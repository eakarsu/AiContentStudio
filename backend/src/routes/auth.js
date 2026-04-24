const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');
const multer = require('multer');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// Avatar upload config
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../public/uploads/avatars'),
  filename: (req, file, cb) => {
    cb(null, `avatar_${req.userId}_${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
}});

// Ensure avatars directory exists
const fs = require('fs');
const avatarDir = path.join(__dirname, '../../public/uploads/avatars');
if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const prisma = req.prisma;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name }
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar },
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, twoFactorToken } = req.body;
    const prisma = req.prisma;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check 2FA
    if (user.twoFactorEnabled) {
      if (!twoFactorToken) {
        return res.status(200).json({ requires2FA: true, message: 'Please provide your 2FA code' });
      }
      try {
        const { authenticator } = require('otplib');
        const isValid = authenticator.verify({ token: twoFactorToken, secret: user.twoFactorSecret });
        if (!isValid) {
          return res.status(401).json({ error: 'Invalid 2FA code' });
        }
      } catch (e) {
        return res.status(401).json({ error: 'Invalid 2FA code' });
      }
    }

    // Update login tracking
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date(), loginCount: { increment: 1 } }
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const prisma = req.prisma;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true, avatar: true, twoFactorEnabled: true, lastLogin: true, loginCount: true, createdAt: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Change password
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await req.prisma.user.findUnique({ where: { id: req.userId } });
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await req.prisma.user.update({ where: { id: req.userId }, data: { password: hashedPassword } });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Update profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, email } = req.body;
    const data = {};
    if (name) data.name = name;
    if (email) {
      const existing = await req.prisma.user.findFirst({ where: { email, NOT: { id: req.userId } } });
      if (existing) return res.status(400).json({ error: 'Email already in use' });
      data.email = email;
    }

    const user = await req.prisma.user.update({
      where: { id: req.userId },
      data,
      select: { id: true, email: true, name: true, role: true, avatar: true }
    });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Upload avatar
router.post('/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await req.prisma.user.update({ where: { id: req.userId }, data: { avatar: avatarUrl } });

    res.json({ avatar: avatarUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// Forgot password - generate reset token
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await req.prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await req.prisma.passwordReset.create({
      data: { token, expiresAt, userId: user.id }
    });

    // In a real app, you'd send an email here
    // For demo purposes, we'll return the token
    console.log(`Password reset token for ${email}: ${token}`);

    res.json({ message: 'If the email exists, a reset link has been sent', token }); // Remove token from response in production
  } catch (error) {
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const resetRecord = await req.prisma.passwordReset.findUnique({ where: { token } });
    if (!resetRecord || resetRecord.used || resetRecord.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await req.prisma.user.update({ where: { id: resetRecord.userId }, data: { password: hashedPassword } });
    await req.prisma.passwordReset.update({ where: { id: resetRecord.id }, data: { used: true } });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// 2FA Setup
router.post('/2fa/setup', authMiddleware, async (req, res) => {
  try {
    const { authenticator } = require('otplib');
    const QRCode = require('qrcode');

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(
      (await req.prisma.user.findUnique({ where: { id: req.userId }, select: { email: true } })).email,
      'AI Content Studio',
      secret
    );

    await req.prisma.user.update({ where: { id: req.userId }, data: { twoFactorSecret: secret } });

    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

    res.json({ secret, qrCodeUrl });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ error: 'Failed to setup 2FA' });
  }
});

// 2FA Verify & Enable
router.post('/2fa/verify', authMiddleware, async (req, res) => {
  try {
    const { authenticator } = require('otplib');
    const { token } = req.body;

    const user = await req.prisma.user.findUnique({ where: { id: req.userId } });
    if (!user.twoFactorSecret) {
      return res.status(400).json({ error: 'Please setup 2FA first' });
    }

    const isValid = authenticator.verify({ token, secret: user.twoFactorSecret });
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    await req.prisma.user.update({ where: { id: req.userId }, data: { twoFactorEnabled: true } });

    res.json({ message: '2FA enabled successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify 2FA' });
  }
});

// 2FA Disable
router.post('/2fa/disable', authMiddleware, async (req, res) => {
  try {
    const { authenticator } = require('otplib');
    const { token } = req.body;

    const user = await req.prisma.user.findUnique({ where: { id: req.userId } });
    if (!user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is not enabled' });
    }

    const isValid = authenticator.verify({ token, secret: user.twoFactorSecret });
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    await req.prisma.user.update({
      where: { id: req.userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null }
    });

    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to disable 2FA' });
  }
});

// Get demo credentials
router.get('/demo-credentials', (req, res) => {
  res.json({
    email: process.env.DEMO_EMAIL || 'demo@aicontentstudio.com',
    password: process.env.DEMO_PASSWORD || 'Demo123!'
  });
});

module.exports = router;
