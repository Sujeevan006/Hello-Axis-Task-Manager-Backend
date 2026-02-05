import { Request, Response, NextFunction } from 'express';
import { Role } from '../types/enums';

export const authorize = (roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!(req as any).user || !roles.includes((req as any).user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};
