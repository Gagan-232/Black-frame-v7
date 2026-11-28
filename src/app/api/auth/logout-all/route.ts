import { route, ok, requireUser } from '@/lib/api';
import { revokeAllSessions, clearSessionCookie } from '@/lib/auth';
export const POST = route(async () => { const u = await requireUser(); await revokeAllSessions(u.id); clearSessionCookie(); return ok({ ok: true }); });
