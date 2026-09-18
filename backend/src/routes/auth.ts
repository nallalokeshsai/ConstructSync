import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logAudit } from '../services/auditService';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'constructsync_secure_jwt_secret_token_2026_xyz';

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await logAudit({
      userId: user.id,
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user.id,
      details: { role: user.role },
      ipAddress: req.ip,
    });

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation,
        avatar: user.avatar,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        designation: true,
        avatar: true,
        phone: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/users
router.get('/users', authenticateToken, async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        designation: true,
        avatar: true,
        phone: true,
      },
      orderBy: { name: 'asc' },
    });
    return res.json({ users });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
