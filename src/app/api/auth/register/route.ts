import { route, ok, HttpError, rateLimit } from '@/lib/api';
import { registerSchema, RESERVED } from '@/lib/validators';
import { hashPassword, createSession, clientIp } from '@/lib/auth';
import { q1 } from '@/lib/db';
import { getSetting } from '@/lib/settings';

export const POST = route(async (req) => {
  await rateLimit(`reg:${clientIp(req.headers)}`, 10, 3600);
  const body = registerSchema.parse(await req.json());
  if (!(await getSetting('registrations_enabled', true))) throw new HttpError(403, 'New registrations are currently closed.');
  if (RESERVED.has(body.username.toLowerCase())) throw new HttpError(409, 'Username already taken.');
  const passwordHash = await hashPassword(body.password);
  try {
    const u = await q1(`INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id`, [body.username, passwordHash]);
    await createSession(u.id, req.headers);
    return ok({ ok: true }, 201);
  } catch (e: any) {
    if (e?.code === '23505') throw new HttpError(409, 'Username already taken.'); // enforced by UNIQUE(username_lower)
    throw e;
  }
});
