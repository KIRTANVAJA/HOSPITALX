import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError } from '../utils/errors';
import { UserRole } from '@prisma/client';

export interface AuthUser {
  id: string;
  hospitalId: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    let token: string | undefined;

    // 1. Check Authorization Bearer header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    // 2. Check HTTP-only cookie
    else if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      throw new UnauthorizedError('Authentication required: Missing token');
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    if (!decoded || !decoded.id || !decoded.hospitalId || !decoded.role) {
      throw new UnauthorizedError('Invalid authentication token payload');
    }

    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      next(new UnauthorizedError('Authentication token expired'));
    } else if (err.name === 'JsonWebTokenError') {
      next(new UnauthorizedError('Invalid authentication token'));
    } else {
      next(err);
    }
  }
}
