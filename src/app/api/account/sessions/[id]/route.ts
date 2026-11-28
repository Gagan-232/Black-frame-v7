import { route, ok, HttpError, requireUser } from '@/lib/api';
import { q1 } from '@/lib/db';
export const DELETE = route(async (_req, { params }) => {
  const u = await requireUser();
  if (!/^[0-9a-f-]{36}$/.test(params.id)) throw new HttpError(400, 'Invalid session.');
  const r = await q1(`UPDATE sessions SET revoked_at = now() WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL RETURNING id`, [params.id, u.id]);
  if (!r) throw new HttpError(404, 'Session not found.');
  return ok({ ok: true });
});
