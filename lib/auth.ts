/**
 * Auth helpers using `jose` — fully Edge-runtime compatible.
 * Works in both Next.js middleware AND API route handlers.
 */
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'festpass-dev-fallback-secret-change-me'
);
const COOKIE_NAME = 'fp_token';
const EXPIRY = '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
}

/** Sign a new JWT token */
export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(EXPIRY)
    .setIssuedAt()
    .sign(SECRET);
}

/** Verify and decode a JWT token */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

/** Set HTTP-only auth cookie (for API route handlers) */
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/** Clear auth cookie */
export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/** Get authenticated user from cookies (for API route handlers) */
export async function getAuthUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Get authenticated user from request (for Edge middleware — no next/headers) */
export async function getAuthUserFromRequest(req: NextRequest): Promise<JWTPayload | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}
