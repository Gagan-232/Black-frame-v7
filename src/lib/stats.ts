import { q, q1 } from './db';

export async function dashboardStats() {
  const n = (sql: string) => q1(sql).then((r) => r?.n ?? 0);
  const [users, active, games, downloads, nightShift, recent] = await Promise.all([
    n(`SELECT COUNT(*)::int AS n FROM users`),
    n(`SELECT COUNT(DISTINCT user_id)::int AS n FROM sessions WHERE revoked_at IS NULL AND last_seen_at > now() - interval '30 days'`),
    n(`SELECT COUNT(*)::int AS n FROM games`),
    n(`SELECT COUNT(*)::int AS n FROM downloads`),
    n(`SELECT COUNT(*)::int AS n FROM pre_registrations p JOIN games g ON g.id = p.game_id WHERE g.slug = 'night-shift'`),
    q(`SELECT a.action, a.target_type, a.target_id, a.created_at, u.username FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_id ORDER BY a.created_at DESC LIMIT 10`),
  ]);
  return { users, active, games, downloads, nightShift, recent };
}

/** Daily counts for the last 30 days, derived only from real database rows. */
export async function dailySeries(table: 'users' | 'downloads' | 'pre_registrations') {
  return q<{ day: string; n: number }>(
    `SELECT to_char(d::date, 'YYYY-MM-DD') AS day, COALESCE(c.n, 0)::int AS n
       FROM generate_series(now()::date - 29, now()::date, '1 day') d
       LEFT JOIN (SELECT created_at::date AS day, COUNT(*) AS n FROM ${table} GROUP BY 1) c ON c.day = d::date ORDER BY d`);
}
