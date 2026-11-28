import { NextRequest, NextResponse } from 'next/server';

const prod = process.env.NODE_ENV === 'production';
const SESSION = prod ? '__Host-bf_session' : 'bf_session';
const MAX_AGE = 60 * 60 * 24 * 400; // browsers cap cookie lifetime at ~400 days; we refresh it on every visit

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith('/api/');

  // CSRF: for every state-changing API call require a same-origin Origin header AND a matching double-submit token.
  if (isApi && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
    let originHost: string | null = null;
    try { originHost = new URL(req.headers.get('origin') ?? '').host; } catch {}
    if (!originHost || originHost !== host) return NextResponse.json({ error: 'Bad origin.' }, { status: 403 });
    const cookie = req.cookies.get('bf_csrf')?.value;
    const header = req.headers.get('x-csrf-token');
    if (!cookie || !header || cookie !== header) return NextResponse.json({ error: 'Invalid CSRF token. Refresh the page and try again.' }, { status: 403 });
  }

  const res = NextResponse.next();
  const base = { secure: prod, sameSite: 'lax' as const, path: '/', maxAge: MAX_AGE };
  if (!req.cookies.get('bf_csrf')) {
    res.cookies.set('bf_csrf', crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, ''), { ...base, httpOnly: false });
  }
  // Rolling persistent session: re-issue the same opaque token with a fresh max-age on page visits.
  const s = req.cookies.get(SESSION)?.value;
  if (s && !isApi) res.cookies.set(SESSION, s, { ...base, httpOnly: true });
  return res;
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.png|logo.png|ad-frame).*)'] };
