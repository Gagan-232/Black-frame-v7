import { route, ok, HttpError, requireUser, rateLimit, audit } from '@/lib/api';
import { changePasswordSchema } from '@/lib/validators';
import { verifyPassword, hashPassword, revokeAllSessions } from '@/lib/auth';
import { q, q1 } from '@/lib/db';

export const POST = route(async (req) => {
  const user = await requireUser();
  await rateLimit(`pw:${user.id}`, 10, 900);
  const body = changePasswordSchema.parse(await req.json());
  if (['ADMIN', 'SUPER_ADMIN'].includes(user.role) && body.next.length < 12) throw new HttpError(400, 'Administrator passwords must be at least 12 characters.');
  const row = await q1(`SELECT password_hash FROM users WHERE id = $1`, [user.id]);
  if (!(await verifyPassword(row.password_hash, body.current))) throw new HttpError(400, 'Current password is incorrect.');
  await q(`UPDATE users SET password_hash = $1, must_change_password = false, updated_at = now() WHERE id = $2`, [await hashPassword(body.next), user.id]);
  await revokeAllSessions(user.id, user.sessionId); // sign out every other device
  await audit(user.id, 'account.password_changed', 'user', user.id);
  return ok({ ok: true });
});
