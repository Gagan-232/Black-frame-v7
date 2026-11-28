import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { q, q1 } from './db';
import { HttpError, ok, requireAdmin, audit } from './api';
import { SessionUser, revokeAllSessions } from './auth';
import { presignUpload, storageConfigured, headKey } from './storage';

type Ctx = { req: NextRequest; p: Record<string, string>; sp: URLSearchParams; user: SessionUser };
type H = (c: Ctx) => Promise<Response>;
const routes: { method: string; parts: string[]; min: 'ADMIN' | 'SUPER_ADMIN'; h: H }[] = [];
const add = (method: string, path: string, h: H, min: 'ADMIN' | 'SUPER_ADMIN' = 'ADMIN') => routes.push({ method, parts: path.split('/'), min, h });

/** Every admin request passes through requireAdmin() here — the server is the authority, never the UI. */
export async function dispatch(req: NextRequest, path: string[]) {
  const user = await requireAdmin('ADMIN');
  const r = routes.find((x) => x.method === req.method && x.parts.length === path.length && x.parts.every((s, i) => s.startsWith(':') || s === path[i]));
  if (!r) throw new HttpError(404, 'Not found.');
  if (r.min === 'SUPER_ADMIN' && user.role !== 'SUPER_ADMIN') throw new HttpError(403, 'Super admin only.');
  const p: Record<string, string> = {};
  r.parts.forEach((s, i) => { if (s.startsWith(':')) p[s.slice(1)] = path[i]; });
  return r.h({ req, p, sp: req.nextUrl.searchParams, user });
}

// ---------- helpers ----------
const int = (v: string) => { const n = Number(v); if (!Number.isInteger(n)) throw new HttpError(400, 'Invalid id.'); return n; };
const paging = (sp: URLSearchParams) => { const size = Math.min(100, Math.max(1, Number(sp.get('size')) || 20)); const page = Math.max(1, Number(sp.get('page')) || 1); return { size, page, offset: (page - 1) * size }; };
const blank = (o: any) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v === '' ? null : v]));
const body = async (req: NextRequest) => blank(await req.json());
async function insertRow(table: string, data: Record<string, any>) {
  const keys = Object.keys(data);
  return q1(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map((_, i) => '$' + (i + 1)).join(',')}) RETURNING *`, keys.map((k) => data[k]));
}
async function patchRow(table: string, id: number, data: Record<string, any>) {
  const keys = Object.keys(data);
  if (!keys.length) throw new HttpError(400, 'Nothing to update.');
  const row = await q1(`UPDATE ${table} SET ${keys.map((k, i) => `${k} = $${i + 1}`).join(', ')}, updated_at = now() WHERE id = $${keys.length + 1} RETURNING *`, [...keys.map((k) => data[k]), id]);
  if (!row) throw new HttpError(404, 'Not found.');
  return row;
}
const csvCell = (v: any) => { let s = v == null ? '' : v instanceof Date ? v.toISOString() : String(v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };

// ---------- games ----------
const key = (kind: string) => z.string().regex(new RegExp(`^${kind}/[A-Za-z0-9._-]+$`), `Invalid ${kind} file.`).nullish();
const gameSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug: lowercase letters, numbers and dashes.').max(60),
  title: z.string().min(1).max(120), tagline: z.string().max(200).nullish(), description: z.string().max(20000).nullish(),
  status: z.enum(['COMING_SOON', 'IN_DEVELOPMENT', 'RELEASED']), version: z.string().max(40).nullish(), release_info: z.string().max(500).nullish(),
  system_requirements: z.string().max(5000).nullish(), cover_key: key('cover'), trailer_key: key('trailer'),
  price_paise: z.number().int().min(0).max(10_000_000).nullish(), is_published: z.boolean(), prereg_open: z.boolean(),
});
add('GET', 'games', async ({ sp }) => {
  const { size, offset } = paging(sp); const params: any[] = []; const where: string[] = [];
  if (sp.get('q')) { params.push(`%${sp.get('q')}%`); where.push(`g.title ILIKE $${params.length}`); }
  if (sp.get('status')) { params.push(sp.get('status')); where.push(`g.status = $${params.length}`); }
  const w = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const rows = await q(`SELECT g.*, (SELECT COUNT(*)::int FROM pre_registrations p WHERE p.game_id = g.id) AS prereg_count FROM games g ${w} ORDER BY g.created_at DESC LIMIT ${size} OFFSET ${offset}`, params);
  const total = (await q1(`SELECT COUNT(*)::int AS n FROM games g ${w}`, params)).n;
  return ok({ rows, total });
});
add('POST', 'games', async ({ req, user }) => {
  const d = gameSchema.parse(await body(req)); const g = await insertRow('games', d);
  await audit(user.id, 'game.create', 'game', g.id, { slug: g.slug }); return ok(g, 201);
});
add('PATCH', 'games/:id', async ({ req, p, user }) => {
  const d = gameSchema.partial().parse(await body(req)); const g = await patchRow('games', int(p.id), d);
  await audit(user.id, 'prereg_open' in d ? (d.prereg_open ? 'prereg.open' : 'prereg.close') : 'game.update', 'game', g.id, d); return ok(g);
});
add('DELETE', 'games/:id', async ({ p, user }) => {
  const r = await q1(`DELETE FROM games WHERE id = $1 RETURNING slug`, [int(p.id)]); if (!r) throw new HttpError(404, 'Not found.');
  await audit(user.id, 'game.delete', 'game', p.id, { slug: r.slug }); return ok({ ok: true });
}, 'SUPER_ADMIN');

// ---------- game files & screenshots ----------
const fileSchema = z.object({ label: z.string().min(1).max(100), version: z.string().max(40).nullish(), platform: z.string().max(40).nullish(), storage_key: key('file'), is_active: z.boolean() });
add('GET', 'games/:id/files', async ({ p }) => { const rows = await q(`SELECT * FROM game_files WHERE game_id = $1 ORDER BY created_at DESC`, [int(p.id)]); return ok({ rows, total: rows.length }); });
add('POST', 'games/:id/files', async ({ req, p, user }) => {
  const d = fileSchema.parse(await body(req)); if (!d.storage_key) throw new HttpError(400, 'Upload a file first.');
  let size: number | null = null;
  if (storageConfigured()) { const h = await headKey(d.storage_key); if (!h) throw new HttpError(400, 'Uploaded file not found in storage.'); size = h.size; }
  const f = await insertRow('game_files', { ...d, game_id: int(p.id), size_bytes: size }); await audit(user.id, 'file.create', 'game_file', f.id); return ok(f, 201);
});
add('PATCH', 'games/:id/files/:fid', async ({ req, p, user }) => {
  const d = fileSchema.pick({ label: true, version: true, platform: true, is_active: true }).partial().parse(await body(req));
  const f = await patchRow('game_files', int(p.fid), d); await audit(user.id, 'file.update', 'game_file', f.id); return ok(f);
});
add('DELETE', 'games/:id/files/:fid', async ({ p, user }) => { await q(`DELETE FROM game_files WHERE id = $1 AND game_id = $2`, [int(p.fid), int(p.id)]); await audit(user.id, 'file.delete', 'game_file', p.fid); return ok({ ok: true }); });

const shotSchema = z.object({ storage_key: key('screenshot'), caption: z.string().max(200).nullish(), sort_order: z.number().int().nullish() });
add('GET', 'games/:id/screenshots', async ({ p }) => { const rows = await q(`SELECT * FROM game_screenshots WHERE game_id = $1 ORDER BY sort_order, id`, [int(p.id)]); return ok({ rows, total: rows.length }); });
add('POST', 'games/:id/screenshots', async ({ req, p, user }) => {
  const d = shotSchema.parse(await body(req)); if (!d.storage_key) throw new HttpError(400, 'Upload an image first.');
  const s = await insertRow('game_screenshots', { ...d, sort_order: d.sort_order ?? 0, game_id: int(p.id) }); await audit(user.id, 'screenshot.create', 'game', p.id); return ok(s, 201);
});
add('DELETE', 'games/:id/screenshots/:sid', async ({ p, user }) => { await q(`DELETE FROM game_screenshots WHERE id = $1 AND game_id = $2`, [int(p.sid), int(p.id)]); await audit(user.id, 'screenshot.delete', 'game', p.id); return ok({ ok: true }); });

add('POST', 'uploads', async ({ req, user }) => {
  if (!storageConfigured()) throw new HttpError(503, 'Object storage is not configured (see S3_* environment variables).');
  const d = z.object({ kind: z.enum(['cover', 'screenshot', 'trailer', 'file']), filename: z.string().min(1).max(200), size: z.number().int().positive() }).parse(await req.json());
  try { const r = await presignUpload(d.kind, d.filename, d.size); await audit(user.id, 'upload.presign', 'upload', r.key); return ok(r); }
  catch (e: any) { throw new HttpError(e.status ?? 500, e.message); }
});

// ---------- users ----------
add('GET', 'users', async ({ sp }) => {
  const { size, offset } = paging(sp); const params: any[] = []; const where: string[] = [];
  if (sp.get('q')) { params.push(`%${sp.get('q')}%`); where.push(`u.username ILIKE $${params.length}`); }
  if (sp.get('status')) { params.push(sp.get('status')); where.push(`u.status = $${params.length}`); }
  if (sp.get('role')) { params.push(sp.get('role')); where.push(`u.role = $${params.length}`); }
  const w = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const rows = await q(`SELECT u.id, u.username, u.role, u.status, u.ad_free, u.created_at, u.last_login_at,
      (SELECT COUNT(*)::int FROM sessions s WHERE s.user_id = u.id AND s.revoked_at IS NULL) AS active_sessions,
      (SELECT COUNT(*)::int FROM pre_registrations p WHERE p.user_id = u.id) AS preregs,
      (SELECT COUNT(*)::int FROM downloads d WHERE d.user_id = u.id) AS downloads
    FROM users u ${w} ORDER BY u.created_at DESC LIMIT ${size} OFFSET ${offset}`, params);
  return ok({ rows, total: (await q1(`SELECT COUNT(*)::int AS n FROM users u ${w}`, params)).n });
});
async function targetUser(id: number, actor: SessionUser) {
  const t = await q1(`SELECT id, role, status FROM users WHERE id = $1`, [id]);
  if (!t) throw new HttpError(404, 'User not found.');
  if (t.id === actor.id) throw new HttpError(400, 'You cannot modify your own account here.');
  if (t.role === 'SUPER_ADMIN') throw new HttpError(403, 'Super admin accounts cannot be modified from the panel.');
  if (t.role === 'ADMIN' && actor.role !== 'SUPER_ADMIN') throw new HttpError(403, 'Only a super admin can modify administrators.');
  return t;
}
add('PATCH', 'users/:id', async ({ req, p, user }) => {
  const d = z.object({ status: z.enum(['ACTIVE', 'SUSPENDED', 'BANNED']).optional(), ad_free: z.boolean().optional(), role: z.enum(['USER', 'ADMIN']).optional() }).parse(await req.json());
  const id = int(p.id); await targetUser(id, user);
  if (d.role !== undefined && user.role !== 'SUPER_ADMIN') throw new HttpError(403, 'Only a super admin can change roles.');
  const u = await patchRow('users', id, d);
  if (d.status && d.status !== 'ACTIVE') await revokeAllSessions(id);
  await audit(user.id, 'user.update', 'user', id, d); return ok({ id: u.id });
});
add('POST', 'users/:id/revoke-sessions', async ({ p, user }) => { const id = int(p.id); await targetUser(id, user); await revokeAllSessions(id); await audit(user.id, 'user.revoke_sessions', 'user', id); return ok({ ok: true }); });

// ---------- pre-registrations ----------
function preregQuery(sp: URLSearchParams) {
  const params: any[] = []; const where: string[] = [];
  if (sp.get('q')) { params.push(`%${sp.get('q')}%`); where.push(`u.username ILIKE $${params.length}`); }
  if (sp.get('game_id')) { params.push(int(sp.get('game_id')!)); where.push(`p.game_id = $${params.length}`); }
  return { params, w: where.length ? 'WHERE ' + where.join(' AND ') : '', from: `FROM pre_registrations p JOIN users u ON u.id = p.user_id JOIN games g ON g.id = p.game_id` };
}
add('GET', 'preregistrations', async ({ sp }) => {
  const { size, offset } = paging(sp); const { params, w, from } = preregQuery(sp);
  const rows = await q(`SELECT p.id, u.username, g.title AS game, p.created_at ${from} ${w} ORDER BY p.created_at DESC LIMIT ${size} OFFSET ${offset}`, params);
  return ok({ rows, total: (await q1(`SELECT COUNT(*)::int AS n ${from} ${w}`, params)).n });
});
add('GET', 'preregistrations/export', async ({ sp, user }) => {
  const { params, w, from } = preregQuery(sp);
  const rows = await q(`SELECT p.id, u.username, g.title AS game, p.created_at ${from} ${w} ORDER BY p.created_at`, params);
  await audit(user.id, 'prereg.export', 'game', sp.get('game_id') ?? 'all', { rows: rows.length });
  const csv = ['id,username,game,registered_at', ...rows.map((r) => [r.id, r.username, r.game, r.created_at].map(csvCell).join(','))].join('\n');
  return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="pre-registrations.csv"' } });
});
add('DELETE', 'preregistrations/:id', async ({ p, user }) => {
  const r = await q1(`DELETE FROM pre_registrations WHERE id = $1 RETURNING user_id, game_id`, [int(p.id)]); if (!r) throw new HttpError(404, 'Not found.');
  await audit(user.id, 'prereg.remove', 'pre_registration', p.id, r); return ok({ ok: true });
});

// ---------- news ----------
const newsSchema = z.object({ title: z.string().min(1).max(200), slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug: lowercase letters, numbers and dashes.').max(80), body: z.string().min(1).max(50000), is_published: z.boolean() });
add('GET', 'news', async ({ sp }) => {
  const { size, offset } = paging(sp); const params: any[] = []; let w = '';
  if (sp.get('q')) { params.push(`%${sp.get('q')}%`); w = 'WHERE title ILIKE $1'; }
  const rows = await q(`SELECT id, slug, title, is_published, published_at, created_at FROM news ${w} ORDER BY created_at DESC LIMIT ${size} OFFSET ${offset}`, params);
  return ok({ rows, total: (await q1(`SELECT COUNT(*)::int AS n FROM news ${w}`, params)).n });
});
add('POST', 'news', async ({ req, user }) => {
  const d = newsSchema.parse(await body(req));
  const n = await insertRow('news', { ...d, author_id: user.id, published_at: d.is_published ? new Date() : null }); await audit(user.id, 'news.create', 'news', n.id); return ok(n, 201);
});
add('PATCH', 'news/:id', async ({ req, p, user }) => {
  const d = newsSchema.partial().parse(await body(req)); let n = await patchRow('news', int(p.id), d);
  if (n.is_published && !n.published_at) n = await patchRow('news', n.id, { published_at: new Date() });
  await audit(user.id, 'news.update', 'news', n.id); return ok(n);
});
add('DELETE', 'news/:id', async ({ p, user }) => { await q(`DELETE FROM news WHERE id = $1`, [int(p.id)]); await audit(user.id, 'news.delete', 'news', p.id); return ok({ ok: true }); });

// ---------- advertisements ----------
const adSchema = z.object({
  name: z.string().min(1).max(100), placement: z.enum(['content', 'banner']), ad_key: z.string().regex(/^[a-f0-9]{32}$/, 'Ad key must be 32 hex characters.'),
  width: z.number().int().min(1).max(1000), height: z.number().int().min(1).max(1000),
  script_url: z.string().url().max(300).refine((u) => u.startsWith('https://') && !/["'<>\s]/.test(u), 'Script URL must be a plain https URL.'), is_active: z.boolean(),
});
add('GET', 'ads', async () => { const rows = await q(`SELECT * FROM advertisements ORDER BY id`); return ok({ rows, total: rows.length }); });
add('POST', 'ads', async ({ req, user }) => { const a = await insertRow('advertisements', adSchema.parse(await body(req))); await audit(user.id, 'ad.create', 'ad', a.id); return ok(a, 201); });
add('PATCH', 'ads/:id', async ({ req, p, user }) => { const a = await patchRow('advertisements', int(p.id), adSchema.partial().parse(await body(req))); await audit(user.id, 'ad.update', 'ad', a.id); return ok(a); });
add('DELETE', 'ads/:id', async ({ p, user }) => { await q(`DELETE FROM advertisements WHERE id = $1`, [int(p.id)]); await audit(user.id, 'ad.delete', 'ad', p.id); return ok({ ok: true }); });

// ---------- purchases & downloads (read) ----------
add('GET', 'purchases', async ({ sp }) => {
  const { size, offset } = paging(sp); const params: any[] = []; let w = '';
  if (sp.get('status')) { params.push(sp.get('status')); w = 'WHERE p.status = $1'; }
  const rows = await q(`SELECT p.id, u.username, g.title AS game, p.amount_paise, p.currency, p.status, p.provider, p.created_at FROM purchases p JOIN users u ON u.id = p.user_id JOIN games g ON g.id = p.game_id ${w} ORDER BY p.created_at DESC LIMIT ${size} OFFSET ${offset}`, params);
  return ok({ rows, total: (await q1(`SELECT COUNT(*)::int AS n FROM purchases p ${w}`, params)).n });
});
add('PATCH', 'purchases/:id', async ({ req, p, user }) => {
  const d = z.object({ status: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']) }).parse(await req.json());
  const r = await patchRow('purchases', int(p.id), d);
  if (d.status === 'PAID') await q(`UPDATE users SET ad_free = true WHERE id = $1`, [r.user_id]);
  await audit(user.id, 'purchase.status', 'purchase', r.id, d); return ok(r);
}, 'SUPER_ADMIN');
add('GET', 'downloads', async ({ sp }) => {
  const { size, offset } = paging(sp); const params: any[] = []; let w = '';
  if (sp.get('q')) { params.push(`%${sp.get('q')}%`); w = 'WHERE u.username ILIKE $1'; }
  const from = `FROM downloads d JOIN users u ON u.id = d.user_id JOIN games g ON g.id = d.game_id LEFT JOIN game_files f ON f.id = d.file_id`;
  const rows = await q(`SELECT d.id, u.username, g.title AS game, f.label AS file, d.created_at ${from} ${w} ORDER BY d.created_at DESC LIMIT ${size} OFFSET ${offset}`, params);
  return ok({ rows, total: (await q1(`SELECT COUNT(*)::int AS n ${from} ${w}`, params)).n });
});

// ---------- settings ----------
const SETTINGS = { ads_enabled: z.boolean(), downloads_enabled: z.boolean(), registrations_enabled: z.boolean(), instagram_url: z.string().url().or(z.literal('')), discord_url: z.string().url().or(z.literal('')) };
add('GET', 'settings', async () => {
  const rows = await q(`SELECT key, value FROM site_settings`); return ok({ settings: Object.fromEntries(rows.map((r) => [r.key, r.value])) });
}, 'SUPER_ADMIN');
add('PUT', 'settings', async ({ req, user }) => {
  const d = z.object(SETTINGS).partial().strict().parse(await req.json());
  for (const [k, v] of Object.entries(d)) await q(`INSERT INTO site_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = now()`, [k, JSON.stringify(v)]);
  await audit(user.id, 'settings.update', 'settings', undefined, d); return ok({ ok: true });
}, 'SUPER_ADMIN');
