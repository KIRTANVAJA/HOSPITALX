import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    // SUPER_ADMIN has global system override
    if (req.user.role === UserRole.SUPER_ADMIN) {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access denied: Insufficient privileges. Role "${req.user.role}" does not have permission for this resource.`
        )
      );
    }

    next();
  };
}

export function enforceHospitalScope(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  // If a hospital ID is specified in params or query, non-super-admins cannot access other hospitals
  const requestedHospitalId = req.params.hospitalId || req.query.hospitalId;
  if (requestedHospitalId && req.user.role !== UserRole.SUPER_ADMIN) {
    if (requestedHospitalId !== req.user.hospitalId) {
      return next(
        new ForbiddenError('Tenant isolation violation: Access across hospital boundaries is forbidden.')
      );
    }
  }

  next();
}
