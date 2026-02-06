import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface UserPayload {
  id: string;
  role: string;
  email?: string;
  name?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.header('Authorization')?.replace('Bearer ', '');

  if (!authHeader) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // DEVELOPMENT BYPASS: Accept mock token for superadmin@axivers.com
  if (authHeader === 'dev-superadmin-token-12345') {
    console.log('✅ Development token accepted for superadmin');
    req.user = {
      id: 'superadmin-dev-id',
      email: 'superadmin@axivers.com',
      role: 'admin',
      name: 'Super Admin',
    };
    return next();
  }

  // NORMAL JWT VERIFICATION for all other tokens
  try {
    const decoded = jwt.verify(
      authHeader,
      process.env.JWT_SECRET as string,
    ) as UserPayload;
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
      name: decoded.name,
    };
    next();
  } catch (error) {
    console.error('JWT verification failed:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};
