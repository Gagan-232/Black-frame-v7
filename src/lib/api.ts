import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { ZodError } from 'zod';
import { getSessionUser, isAdmin, clientIp, SessionUser } from './auth';
import { q, q1 } from './db';

export class HttpError extends Error {
  constructor(public status: number, message: string, public extra: Record<string, any> = {}) { super(message); }
}
export const ok = (data: Record<string, any> = {}, status = 200) => NextResponse.json(data, { status });

export function route(fn: (req: NextRequest, ctx: any) => Promise<Response>) {
  return async (req: NextRequest, ctx: any) => {
    try { return await fn(req, ctx); }
    catch (e: any) {
      if (e instanceof HttpError) return NextResponse.json({ error: e.message, ...e.extra }, { status: e.status });
      if (e instanceof ZodError) return NextResponse.json({ error: e.issues[0]?.message ?? 'Invalid input.', field: e.issues[0]?.path.join('.') }, { status: 400 });
      if (e?.code === '23505') return NextResponse.json({ error: 'That value already exists.' }, { status: 409 });
      if (e?.code === '23503') return NextResponse.json({ error: 'Related record missing or still in use.' }, { status: 409 });
      if (e instanceof SyntaxError) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
      console.error('[api error]', e?.message ?? e); // never leak internals to the client
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
    }
  };
}

export async function requireUser(): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u) throw new HttpError(401, 'Please log in.');
  return u;
}
export async function requireAdmin(min: 'ADMIN' | 'SUPER_ADMIN' = 'ADMIN'): Promise<SessionUser> {
  const u = await requireUser();
  if (!isAdmin(u) || (min === 'SUPER_ADMIN' && u.role !== 'SUPER_ADMIN')) throw new HttpError(403, 'Forbidden.');
  return u;
}

export async function audit(actorId: number | null, action: string, targetType?: string, targetId?: string | number, meta: any = {}) {
  await q(`INSERT INTO audit_logs (actor_id, action, target_type, target_id, meta, ip) VALUES ($1,$2,$3,$4,$5,$6)`,
    [actorId, action, targetType ?? null, targetId != null ? String(targetId) : null, JSON.stringify(meta), clientIp(headers())]);
}

/** Postgres-backed fixed-window rate limiter (survives restarts, works across instances). */
export async function rlHit(key: string, windowSec: number): Promise<number> {
  if (Math.random() < 0.01) await q(`DELETE FROM rate_limits WHERE reset_at < now() - interval '1 day'`);
  const r = await q1(
    `INSERT INTO rate_limits (key, count, reset_at) VALUES ($1, 1, now() + ($2 || ' seconds')::interval)
     ON CONFLICT (key) DO UPDATE SET
       count = CASE WHEN rate_limits.reset_at < now() THEN 1 ELSE rate_limits.count + 1 END,
       reset_at = CASE WHEN rate_limits.reset_at < now() THEN now() + ($2 || ' seconds')::interval ELSE rate_limits.reset_at END
     RETURNING count`, [key, String(windowSec)]);
  return r.count;
}
export async function rlCount(key: string): Promise<number> {
  return (await q1(`SELECT count FROM rate_limits WHERE key = $1 AND reset_at > now()`, [key]))?.count ?? 0;
}
export async function rateLimit(key: string, limit: number, windowSec: number) {
  if ((await rlHit(key, windowSec)) > limit) throw new HttpError(429, 'Too many attempts. Please wait a while and try again.');
}
