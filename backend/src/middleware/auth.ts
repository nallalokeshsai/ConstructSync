import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

const JWT_SECRET = process.env.JWT_SECRET || 'constructsync_secure_jwt_secret_token_2026_xyz';

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role) && req.user.role !== 'admin') {
      return res.status(403).json({
        error: `Permission denied. Required role: [${allowedRoles.join(', ')}], your role is: ${req.user.role}`,
      });
    }

    next();
  };
}
