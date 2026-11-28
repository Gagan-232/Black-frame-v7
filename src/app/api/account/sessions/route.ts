import { route, ok, requireUser } from '@/lib/api';
import { q } from '@/lib/db';
export const GET = route(async () => {
  const u = await requireUser();
  const rows = await q(`SELECT id, user_agent, ip, created_at, last_seen_at FROM sessions WHERE user_id = $1 AND revoked_at IS NULL ORDER BY last_seen_at DESC`, [u.id]);
  return ok({ sessions: rows.map((r) => ({ ...r, current: r.id === u.sessionId })) });
});
