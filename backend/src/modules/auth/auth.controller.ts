import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { sendSuccess } from '../../utils/response';
import { env } from '../../config/env';
import { recordAuditEvent } from '../../services/audit.service';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body, req.ip, req.headers['user-agent']);

      // Set secure HTTP-only cookie
      res.cookie('access_token', result.token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      return sendSuccess(res, result, 'Authentication successful');
    } catch (error) {
      next(error);
    }
  }

  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.registerPatient(req.body, req.ip, req.headers['user-agent']);

      res.cookie('access_token', result.token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      });

      return sendSuccess(res, result, 'Registration successful', 201);
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user) {
        await recordAuditEvent({
          hospitalId: req.user.hospitalId,
          userId: req.user.id,
          action: 'AUTH_LOGOUT',
          entity: 'User',
          entityId: req.user.id,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
      }

      res.clearCookie('access_token', {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
      });

      return sendSuccess(res, { loggedOut: true }, 'Successfully logged out');
    } catch (error) {
      next(error);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.getCurrentUser(req.user!.id, req.user!.hospitalId);
      return sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }
}
