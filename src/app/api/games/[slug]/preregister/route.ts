import { route, ok, HttpError, requireUser, rateLimit } from '@/lib/api';
import { getSessionUser } from '@/lib/auth';
import { q1 } from '@/lib/db';

async function loadGame(slug: string) {
  const g = await q1(`SELECT id, status, prereg_open FROM games WHERE slug = $1 AND is_published`, [slug]);
  if (!g) throw new HttpError(404, 'Game not found.');
  return g;
}

export const GET = route(async (_req, { params }) => {
  const g = await loadGame(params.slug);
  const user = await getSessionUser();
  const registered = user ? !!(await q1(`SELECT 1 FROM pre_registrations WHERE user_id = $1 AND game_id = $2`, [user.id, g.id])) : false;
  const state = registered ? 'registered' : g.status === 'RELEASED' ? 'unavailable' : g.prereg_open ? 'open' : 'closed';
  return ok({ state, loggedIn: !!user });
});

export const POST = route(async (_req, { params }) => {
  const user = await requireUser();
  await rateLimit(`prereg:${user.id}`, 20, 600);
  const g = await loadGame(params.slug);
  const existing = await q1(`SELECT 1 FROM pre_registrations WHERE user_id = $1 AND game_id = $2`, [user.id, g.id]);
  if (existing) return ok({ state: 'registered', message: 'You are already pre-registered.' });
  if (g.status === 'RELEASED') throw new HttpError(409, 'Pre-registration is not available for this game.', { state: 'unavailable' });
  if (!g.prereg_open) throw new HttpError(403, 'Pre-registration is currently closed.', { state: 'closed' });
  // UNIQUE (user_id, game_id) + ON CONFLICT makes concurrent/repeated requests safe.
  const inserted = await q1(`INSERT INTO pre_registrations (user_id, game_id) VALUES ($1, $2) ON CONFLICT (user_id, game_id) DO NOTHING RETURNING id`, [user.id, g.id]);
  return ok(inserted ? { state: 'registered', message: 'Pre-registration successful.', created: true } : { state: 'registered', message: 'You are already pre-registered.' }, inserted ? 201 : 200);
});
