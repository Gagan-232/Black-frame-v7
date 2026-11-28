import { route, ok, HttpError, rateLimit, rlCount, rlHit, audit } from '@/lib/api';
import { loginSchema } from '@/lib/validators';
import { verifyPassword, dummyVerify, createSession, clientIp, isAdmin } from '@/lib/auth';
import { q, q1 } from '@/lib/db';

const BAD = 'Invalid username or password.';

export const POST = route(async (req) => {
  const body = loginSchema.parse(await req.json());
  await rateLimit(`login:ip:${clientIp(req.headers)}`, 30, 900);
  const ukey = `login:user:${body.username.toLowerCase()}`;
  if ((await rlCount(ukey)) >= 8) throw new HttpError(429, 'Too many failed attempts. Please wait 15 minutes and try again.');

  const user = await q1(`SELECT id, username, role, status, password_hash, must_change_password FROM users WHERE username_lower = lower($1)`, [body.username]);
  if (!user) { await dummyVerify(body.password); await rlHit(ukey, 900); throw new HttpError(401, BAD); }
  const good = await verifyPassword(user.password_hash, body.password);
  if (!good || (body.admin && !isAdmin(user))) { await rlHit(ukey, 900); throw new HttpError(401, BAD); }
  if (user.status !== 'ACTIVE') throw new HttpError(403, user.status === 'BANNED' ? 'This account has been banned.' : 'This account is suspended.');

  await q(`DELETE FROM rate_limits WHERE key = $1`, [ukey]);
  await createSession(user.id, req.headers);
  await q(`UPDATE users SET last_login_at = now() WHERE id = $1`, [user.id]);
  if (isAdmin(user)) await audit(user.id, 'admin.login', 'user', user.id);
  return ok({ ok: true, role: user.role, mustChangePassword: user.must_change_password });
});
