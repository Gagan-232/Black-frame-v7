import { route, ok, rateLimit } from '@/lib/api';
import { usernameSchema, RESERVED } from '@/lib/validators';
import { clientIp } from '@/lib/auth';
import { q1 } from '@/lib/db';

export const GET = route(async (req) => {
  await rateLimit(`uname:${clientIp(req.headers)}`, 60, 600);
  const parsed = usernameSchema.safeParse(req.nextUrl.searchParams.get('u') ?? '');
  if (!parsed.success) return ok({ available: false, reason: parsed.error.issues[0].message });
  const taken = RESERVED.has(parsed.data.toLowerCase()) || !!(await q1(`SELECT 1 FROM users WHERE username_lower = lower($1)`, [parsed.data]));
  return ok({ available: !taken, reason: taken ? 'Username already taken.' : null });
});
