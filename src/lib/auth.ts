import { cookies } from 'next/headers';
import { cache } from 'react';
import crypto from 'crypto';
import { hash, verify } from '@node-rs/argon2';
import { q, q1 } from './db';

const prod = process.env.NODE_ENV === 'production';
export const SESSION_COOKIE = prod ? '__Host-bf_session' : 'bf_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 400;

export type Role = 'USER' | 'ADMIN' | 'SUPER_ADMIN';
export type SessionUser = { id: number; username: string; role: Role; status: string; ad_free: boolean; must_change_password: boolean; sessionId: string };

const ARGON = { memoryCost: 19456, timeCost: 2, parallelism: 1 }; // Argon2id (library default algorithm)
export const hashPassword = (p: string) => hash(p, ARGON);
export async function verifyPassword(h: string, p: string) { try { return await verify(h, p); } catch { return false; } }
let dummy: string | undefined;
/** Burn comparable time when the user doesn't exist, so login timing doesn't reveal valid usernames. */
export async function dummyVerify(p: string) { dummy ??= await hashPassword('timing-equalizer'); await verifyPassword(dummy, p); }

export const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
export const clientIp = (h: Headers) => h.get('x-forwarded-for')?.split(',')[0].trim() || h.get('x-real-ip') || 'unknown';
export const isAdmin = (u: { role: Role } | null) => !!u && (u.role === 'ADMIN' || u.role === 'SUPER_ADMIN');

const cookieOpts = { httpOnly: true, secure: prod, sameSite: 'lax' as const, path: '/' };

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = await q1(
    `SELECT s.id AS "sessionId", s.last_seen_at, u.id, u.username, u.role, u.status, u.ad_free, u.must_change_password
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1 AND s.revoked_at IS NULL`,
    [sha256(token)],
  );
  if (!row || row.status !== 'ACTIVE') return null;
  if (Date.now() - new Date(row.last_seen_at).getTime() > 86_400_000) await q(`UPDATE sessions SET last_seen_at = now() WHERE id = $1`, [row.sessionId]);
  return { id: row.id, username: row.username, role: row.role, status: row.status, ad_free: row.ad_free, must_change_password: row.must_change_password, sessionId: row.sessionId };
});

/** Creates a new device session. Any session cookie already present is revoked first (session ID rotation). */
export async function createSession(userId: number, h: Headers) {
  const old = cookies().get(SESSION_COOKIE)?.value;
  if (old) await q(`UPDATE sessions SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL`, [sha256(old)]);
  const token = crypto.randomBytes(32).toString('base64url');
  await q(`INSERT INTO sessions (user_id, token_hash, user_agent, ip) VALUES ($1, $2, $3, $4)`, [userId, sha256(token), (h.get('user-agent') || '').slice(0, 255), clientIp(h)]);
  cookies().set(SESSION_COOKIE, token, { ...cookieOpts, maxAge: SESSION_MAX_AGE });
}

export function clearSessionCookie() {
  cookies().set(SESSION_COOKIE, '', { ...cookieOpts, maxAge: 0 });
}
export async function destroyCurrentSession() {
  const t = cookies().get(SESSION_COOKIE)?.value;
  if (t) await q(`UPDATE sessions SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL`, [sha256(t)]);
  clearSessionCookie();
}
export const revokeAllSessions = (userId: number, exceptSessionId?: string) =>
  q(`UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL AND ($2::uuid IS NULL OR id <> $2::uuid)`, [userId, exceptSessionId ?? null]);
