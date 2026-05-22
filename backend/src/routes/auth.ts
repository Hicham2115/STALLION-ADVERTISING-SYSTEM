import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { verifyToken } from '@clerk/backend';
import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { signToken } from '../lib/jwt';
import { authenticate, AuthRequest } from '../middleware/auth';
import { formatZodErrors, registerBodySchema } from '../schemas/auth';
import { clerkClient, isClerkConfigured } from '../lib/clerk';

const router = Router();

const USER_PUBLIC_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  clerkId: true,
  avatar: true,
  phone: true,
  suspended: true,
} as const;

const USER_ME_SELECT = {
  ...USER_PUBLIC_SELECT,
  active: true,
  lastLogin: true,
  createdAt: true,
} as const;

async function getRegistrationRole(): Promise<Role | null> {
  const superAdminCount = await prisma.user.count({ where: { role: 'SUPER_ADMIN' } });
  if (superAdminCount === 0) return 'SUPER_ADMIN';
  return 'ADMIN';
}

// GET /api/auth/setup-status — whether admin self-registration is open
router.get('/setup-status', async (_req: Request, res: Response): Promise<void> => {
  const role = await getRegistrationRole();
  res.json({
    registrationAvailable: role !== null,
    createsRole: role,
  });
});

// POST /api/auth/register — bootstrap super-admin, then allow additional admin accounts
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const role = await getRegistrationRole();
  if (!role) {
    res.status(403).json({
      message: 'Registration is not available. Sign in with your account or ask an administrator to invite you.',
    });
    return;
  }

  const parsed = registerBodySchema.safeParse(req.body);
  if (!parsed.success) {
    const fieldErrors = formatZodErrors(parsed.error);
    const firstMessage = Object.values(fieldErrors)[0] || 'Invalid registration data';
    res.status(400).json({ message: firstMessage, errors: fieldErrors });
    return;
  }

  const { name, email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ message: 'Email already in use', errors: { email: 'Email already in use' } });
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role,
    },
    select: USER_PUBLIC_SELECT,
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  const fresh = await prisma.user.findUnique({
    where: { id: user.id },
    select: USER_ME_SELECT,
  });
  res.status(201).json({ token, user: fresh! });
});

function clerkDisplayName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  email: string,
): string {
  const full = [firstName, lastName].filter(Boolean).join(' ').trim();
  return full || email.split('@')[0] || 'User';
}

// POST /api/auth/clerk — exchange Clerk session for app JWT
router.post('/clerk', async (req: Request, res: Response): Promise<void> => {
  if (!isClerkConfigured() || !clerkClient) {
    res.status(503).json({ message: 'Clerk authentication is not configured' });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Clerk session token required' });
    return;
  }

  const clerkSessionToken = authHeader.slice(7);
  const mode = req.body?.mode === 'sign-up' ? 'sign-up' : 'sign-in';

  let clerkUserId: string;
  try {
    const payload = await verifyToken(clerkSessionToken, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });
    if (!payload?.sub) {
      res.status(401).json({ message: 'Invalid Clerk session' });
      return;
    }
    clerkUserId = payload.sub;
  } catch {
    res.status(401).json({ message: 'Invalid or expired Clerk session' });
    return;
  }

  let clerkUser;
  try {
    clerkUser = await clerkClient.users.getUser(clerkUserId);
  } catch {
    res.status(401).json({ message: 'Could not load Clerk user profile' });
    return;
  }

  const email =
    clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ||
    clerkUser.emailAddresses[0]?.emailAddress;

  if (!email) {
    res.status(400).json({ message: 'Clerk account must have a verified email address' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const displayName = clerkDisplayName(
    clerkUser.firstName,
    clerkUser.lastName,
    normalizedEmail,
  );
  const avatar = clerkUser.imageUrl || undefined;

  let user = await prisma.user.findFirst({
    where: { OR: [{ clerkId: clerkUserId }, { email: normalizedEmail }] },
  });

  if (!user) {
    if (mode === 'sign-in') {
      res.status(404).json({
        message:
          'No account found for this email. Please sign up first or ask an administrator to invite you.',
      });
      return;
    }

    const role = await getRegistrationRole();
    if (!role) {
      res.status(403).json({
        message: 'Registration is not available. Ask an administrator to invite you.',
      });
      return;
    }

    const hashed = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
    user = await prisma.user.create({
      data: {
        clerkId: clerkUserId,
        name: displayName,
        email: normalizedEmail,
        password: hashed,
        role,
        avatar,
      },
      select: USER_PUBLIC_SELECT,
    }) as any;
  } else {
    if (!user.active) {
      res.status(403).json({ message: 'Account is inactive' });
      return;
    }
    if (user.suspended) {
      res.status(403).json({
        message: 'Your account has been suspended. Please contact an administrator.',
      });
      return;
    }

    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        clerkId: user.clerkId ?? clerkUserId,
        name: displayName,
        avatar: avatar ?? user.avatar,
        lastLogin: new Date(),
      },
      select: USER_PUBLIC_SELECT,
    }) as any;
  }

  const token = signToken({ userId: user!.id, email: user!.email, role: user!.role });
  res.json({ token, user });
});

// POST /api/auth/clerk/sync — refresh profile from Clerk (Google users)
router.post('/clerk/sync', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!isClerkConfigured() || !clerkClient) {
    res.status(503).json({ message: 'Clerk is not configured' });
    return;
  }

  const dbUser = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!dbUser?.clerkId) {
    res.status(400).json({ message: 'Account is not linked to Google' });
    return;
  }

  let clerkUser;
  try {
    clerkUser = await clerkClient.users.getUser(dbUser.clerkId);
  } catch {
    res.status(502).json({ message: 'Could not load Google account profile' });
    return;
  }

  const email =
    clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ||
    clerkUser.emailAddresses[0]?.emailAddress ||
    dbUser.email;

  const user = await prisma.user.update({
    where: { id: dbUser.id },
    data: {
      name: clerkDisplayName(clerkUser.firstName, clerkUser.lastName, email),
      avatar: clerkUser.imageUrl || dbUser.avatar,
    },
    select: USER_ME_SELECT,
  });

  res.json(user);
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ message: 'Email and password required' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user || !user.active) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  if (user.suspended) {
    res.status(403).json({ message: 'Your account has been suspended. Please contact an administrator.' });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  // Record last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  const fresh = await prisma.user.findUnique({
    where: { id: user.id },
    select: USER_ME_SELECT,
  });
  res.json({ token, user: fresh! });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: USER_ME_SELECT,
  });
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  if (user.suspended) {
    res.status(403).json({ message: 'Account suspended' });
    return;
  }
  res.json(user);
});

// PUT /api/auth/profile — email/password users only (Google users manage profile in Clerk)
router.put('/profile', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, avatar, phone } = req.body;
  const existing = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!existing) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  if (existing.clerkId) {
    res.status(400).json({
      message: 'Google accounts manage name and photo in the account menu. You can update phone below via sync.',
    });
    return;
  }

  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: { name, avatar, phone },
    select: { id: true, name: true, email: true, role: true, clerkId: true, avatar: true, phone: true },
  });
  res.json(user);
});

// PUT /api/auth/change-password
router.put('/change-password', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ message: 'Current and new password are required' });
    return;
  }
  if (newPassword.length < 8) {
    res.status(400).json({ message: 'New password must be at least 8 characters' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  if (user.clerkId) {
    res.status(400).json({
      message: 'Password is managed by your Google account. Use the account menu to manage security.',
    });
    return;
  }

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    res.status(400).json({ message: 'Current password is incorrect' });
    return;
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
  res.json({ message: 'Password updated successfully' });
});

export default router;
