import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getEnv } from "@/lib/env";
import type { User } from "@/generated/prisma";

export const SESSION_COOKIE = "cm_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const ELEVATION_TTL_MS = 1000 * 60 * 10;         // 10 minutes re-auth window

// ---------------------------------------------------------------------------
// Password helpers
// ---------------------------------------------------------------------------

/**
 * Hashes a plaintext password using bcrypt with cost factor 12.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Verifies a plaintext password against a bcrypt hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ---------------------------------------------------------------------------
// Session management
// ---------------------------------------------------------------------------

/**
 * Creates a new session for the given user and sets the session cookie.
 *
 * The session token is an HMAC-SHA256 over `userId:nonce` using SESSION_SECRET,
 * making it tamper-evident without requiring symmetric encryption.
 */
export async function createSession(userId: string): Promise<void> {
  const env = getEnv();
  const nonce = crypto.randomBytes(32).toString("hex");
  const token = crypto
    .createHmac("sha256", env.SESSION_SECRET)
    .update(`${userId}:${nonce}`)
    .digest("hex");

  const expires = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: { sessionToken: token, userId, expires },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

/**
 * Destroys the current session — removes the DB record and clears the cookie.
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { sessionToken: token } });
  }
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Elevates the current session for a limited window after re-authentication.
 * Required before secret reveal operations.
 */
export async function elevateSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) throw new Error("No active session");

  await prisma.session.updateMany({
    where: { sessionToken: token },
    data: { elevated: true, elevatedAt: new Date() },
  });
}

// ---------------------------------------------------------------------------
// Session resolution
// ---------------------------------------------------------------------------

export type SessionUser = User & { isElevated: boolean };

/**
 * Resolves the current user from the session cookie.
 *
 * Returns `null` if:
 * - No session cookie is present
 * - The session has expired
 * - The session token is not found in the DB
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { sessionToken: token },
    include: { user: true },
  });

  if (!session || session.expires < new Date()) return null;

  const isElevated =
    session.elevated &&
    session.elevatedAt !== null &&
    session.elevatedAt.getTime() + ELEVATION_TTL_MS > Date.now();

  return { ...session.user, isElevated };
}

/**
 * Checks whether the current session has an active elevated claim.
 * Elevation is required for secret reveal operations.
 */
export async function isSessionElevated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.isElevated ?? false;
}
