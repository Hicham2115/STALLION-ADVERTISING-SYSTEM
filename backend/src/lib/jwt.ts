import jwt from 'jsonwebtoken';

const WEAK_DEFAULTS = ['fallback-secret-change-in-prod', 'your-super-secret-jwt-key-change-this-in-production', 'secret', 'changeme'];
const JWT_SECRET = process.env.JWT_SECRET || '';
if (!JWT_SECRET || WEAK_DEFAULTS.includes(JWT_SECRET)) {
  throw new Error('JWT_SECRET is missing or uses a weak default. Set a strong random value in .env (run: openssl rand -base64 64)');
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  agencyId?: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
