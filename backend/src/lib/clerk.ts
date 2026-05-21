import { createClerkClient } from '@clerk/backend';

const secretKey = process.env.CLERK_SECRET_KEY;

export const clerkClient = secretKey
  ? createClerkClient({ secretKey })
  : null;

export function isClerkConfigured(): boolean {
  return Boolean(secretKey);
}
