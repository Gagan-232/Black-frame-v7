// End-to-end smoke test against a RUNNING server (npm run dev / start) with a migrated DB.
// Usage: ADMIN_USERNAME=... ADMIN_PASSWORD=<current admin password> TEST_BASE_URL=http://localhost:3000 npm run test:smoke
const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';
const host = new URL(BASE).host;
let pass = 0, fail = 0;
const check = (name, cond, extra = '') => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  ' + extra}`); };

class Client {
  jar = {};
  async req(path, { method = 'GET', body } = {}) {
    if (!this.jar.bf_csrf) await this.raw('/');
    const res = await this.raw(path, { method, body });
    let data = null; try { data = await res.json(); } catch {}
    return { status: res.status, data };
  }
  async raw(path, { method = 'GET', body } = {}) {
    const cookie = Object.entries(this.jar).map(([k, v]) => `${k}=${v}`).join('; ');
    const res = await fetch(BASE + path, { method, redirect: 'manual', headers: { 'Content-Type': 'application/json', Origin: BASE, Host: host, Cookie: cookie, 'x-csrf-token': this.jar.bf_csrf || '' }, body: body ? JSON.stringify(body) : undefined });
    for (const c of res.headers.getSetCookie?.() ?? []) { const [kv, ...attrs] = c.split(';'); const [k, ...v] = kv.split('='); if (/max-age=0/i.test(attrs.join(';'))) delete this.jar[k.trim()]; else this.jar[k.trim()] = v.join('='); }
    return res;
  }
}

const name = 'smoke' + Math.random().toString(36).slice(2, 8), pw = 'Sm0ke-test-pass!';
const a = new Client();
let r = await a.req('/api/auth/register', { body: { username: name, password: pw, confirmPassword: pw } });
check('register new user', r.status === 201, JSON.stringify(r.data));
r = await new Client().req('/api/auth/register', { body: { username: name.toUpperCase(), password: pw, confirmPassword: pw } });
check('duplicate username (different case) rejected', r.status === 409, JSON.stringify(r.data));
r = await new Client().req('/api/auth/register', { body: { username: name + 'x', password: pw, confirmPassword: 'nope' } });
check('password mismatch rejected', r.status === 400);
r = await new Client().req('/api/auth/login', { body: { username: name, password: 'wrong-password' } });
check('invalid password rejected', r.status === 401);

// Persistence: a brand-new client carrying only the saved cookie (simulates browser restart) is still logged in.
const restarted = new Client(); restarted.jar = { ...a.jar };
r = await restarted.req('/api/account/sessions'); check('session persists with only the cookie', r.status === 200 && r.data.sessions.length >= 1);

// Pre-registration
r = await a.req('/api/games/night-shift/preregister', { body: {} }); check('prereg blocked while CLOSED (default)', r.status === 403 && r.data.state === 'closed', JSON.stringify(r.data));
r = await new Client().req('/api/games/night-shift/preregister', { body: {} }); check('prereg requires login', r.status === 401);
r = await new Client().req('/api/admin/users'); check('admin API rejects anonymous', r.status === 401);
r = await a.req('/api/admin/users'); check('admin API rejects normal user', r.status === 403);

if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
  const adm = new Client();
  r = await adm.req('/api/auth/login', { body: { username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD, admin: true } });
  check('admin login', r.status === 200, JSON.stringify(r.data));
  if (r.data?.mustChangePassword) console.log('NOTE: admin must change password first; admin API tests will be skipped.');
  else {
    const games = await adm.req('/api/admin/games'); const g = games.data.rows.find((x) => x.slug === 'night-shift');
    await adm.req(`/api/admin/games/${g.id}`, { method: 'PATCH', body: { prereg_open: true } });
    r = await a.req('/api/games/night-shift/preregister', { body: {} }); check('prereg succeeds when OPEN', r.status === 201, JSON.stringify(r.data));
    const again = await Promise.all([1, 2, 3, 4, 5].map(() => a.req('/api/games/night-shift/preregister', { body: {} })));
    check('repeated/concurrent prereg creates no duplicate', again.every((x) => x.status === 200 && x.data.state === 'registered'));
    const list = await adm.req(`/api/admin/preregistrations?q=${name}`); check('exactly one registration row', list.data.total === 1, String(list.data.total));
    const users = await adm.req(`/api/admin/users?q=${name}`); const uid = users.data.rows[0].id;
    r = await adm.req(`/api/admin/users/${uid}/revoke-sessions`, { method: 'POST', body: {} }); check('admin revokes sessions', r.status === 200);
    r = await restarted.req('/api/account/sessions'); check('revoked session no longer valid', r.status === 401);
    await adm.req(`/api/admin/games/${g.id}`, { method: 'PATCH', body: { prereg_open: false } });
    const rm = list.data.rows[0]; await adm.req(`/api/admin/preregistrations/${rm.id}`, { method: 'DELETE' });
    await adm.req(`/api/admin/users/${uid}`, { method: 'PATCH', body: { status: 'BANNED' } });
    r = await new Client().req('/api/auth/login', { body: { username: name, password: pw } }); check('banned user cannot log in', r.status === 403);
  }
}
const b = new Client(); await b.req('/api/auth/login', { body: { username: 'nobody-here', password: 'x' } });
r = await b.req('/api/auth/logout', { method: 'POST', body: {} }); check('logout endpoint responds', r.status === 200 || r.status === 401);
// Brute-force limiter
let limited = false; const bf = new Client(); for (let i = 0; i < 12; i++) { const x = await bf.req('/api/auth/login', { body: { username: name + 'rl', password: 'bad' + i } }); if (x.status === 429) limited = true; }
check('login rate limiting kicks in', limited);
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
