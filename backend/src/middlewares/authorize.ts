import { Role } from '@prisma/client';
import { AppError } from './errorHandler';

export const authorize = (...roles: Role[]) =>
  (req: any, res: any, next: any) => {
    if (!roles.includes(req.user.role)) {
      throw new AppError(403, `Access denied. Required role: ${roles.join(' or ')}`);
    }
    next();
  };
