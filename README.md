# Black Frame Studio — website platform

Next.js 14 (App Router) · TypeScript · Tailwind · PostgreSQL · S3-compatible storage. One Railway service.

> **Status: source complete, NOT yet executed.** The environment this was written in had no network, no PostgreSQL and no npm registry,
> so nothing here has been built, run or tested. Follow *Verify before launch* below — don't treat any feature as working until it passes.

## Versions
Node ≥ 20 (22 recommended) · next ^14.2 · react 18.3 · pg ^8.13 · @node-rs/argon2 ^2 (Argon2id) · zod ^3.23 · @aws-sdk/client-s3 ^3.750 · tailwindcss ^3.4 · typescript ^5.5.
(Plain SQL migrations + `pg` were used instead of an ORM: fewer moving parts.)

## Local setup
```bash
cp .env.example .env      # fill DATABASE_URL, ADMIN_*, S3_*
npm install
npm run migrate           # applies migrations/*.sql
npm run bootstrap         # creates the SUPER_ADMIN from ADMIN_USERNAME / ADMIN_INITIAL_PASSWORD
npm run dev
```
Admin sign-in: `/admin/login`. The bootstrap account is flagged `must_change_password`; you are forced to set a new password (≥ 12 chars) first.
**The password originally pasted into chat is compromised — use a different one in your real `.env`.**

## Environment variables
| Name | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string (Railway provides it) |
| `DATABASE_SSL` | `true` if your provider needs TLS |
| `ADMIN_USERNAME`, `ADMIN_INITIAL_PASSWORD` | One-time SUPER_ADMIN bootstrap (hash stored only; never in client code) |
| `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | Object storage for covers, screenshots, trailers, game files |

## Structure
```
migrations/         001_init.sql (schema) · 002_seed.sql (NIGHT SHIFT entry, settings, ad units)
scripts/            migrate.mjs · bootstrap-admin.mjs
src/middleware.ts   CSRF (Origin + double-submit token), rolling session cookie
src/lib/            db · auth (sessions, Argon2id) · api (errors, rate limit, audit) · admin (all admin endpoints) · storage (S3) · stats
src/app/            public pages · /account/* · /admin/* · /api/* · /ad-frame/[id]
src/components/     Nav, Intro, AdSlot, AuthForm, PreRegister, admin/DataTable …
tests/smoke.mjs     end-to-end checks against a running server
```

## Database
`users` (UNIQUE generated `username_lower` → case-insensitive uniqueness) · `sessions` (SHA-256 token hash, per device, `revoked_at`) · `games` · `game_files` · `game_screenshots` ·
`pre_registrations` (**UNIQUE (user_id, game_id)**) · `news` · `downloads` · `purchases` · `advertisements` · `audit_logs` · `site_settings` · `rate_limits`.
All with FKs, timestamps and indexes. Pre-registration is per-game `prereg_open`, default **false**.

## Auth & sessions
- Argon2id hashes; registration needs username + password + confirmation only. Usernames: 3–24 chars `[A-Za-z0-9_]`, reserved names blocked.
- Login: random 256-bit token → HTTP-only, SameSite=Lax cookie (`__Host-` prefixed + Secure in production). Only its hash is stored in Postgres. No fixed server-side expiry.
  Browsers cap cookie lifetime at ~400 days, so the cookie is re-issued on every page visit (rolling) — an actively used device stays logged in indefinitely.
- Token is rotated on every login. Logout (this device), logout-all, per-device revoke, password change (signs out other devices), ban/suspend (revokes all), admin revoke.
- Rate limits (Postgres): login 30 / 15 min per IP + 8 failed / 15 min per username; registration 10 / h per IP.
- Trade-off: a stolen cookie works until revoked. Users can see/revoke devices under Account → Settings.
- No email ⇒ no self-service password recovery. An admin can't reset passwords either (not built) — consider adding recovery before launch.

## API (JSON; all state-changing calls need `Origin` + `x-csrf-token` = `bf_csrf` cookie)
| Method & path | Auth | Notes |
|---|---|---|
| POST `/api/auth/register` · `/login` · `/logout` · `/logout-all` | – / user | |
| GET `/api/auth/username?u=` | – | availability |
| POST `/api/account/password` · GET `/api/account/sessions` · DELETE `/api/account/sessions/:id` | user | |
| GET / POST `/api/games/:slug/preregister` | – / user | states: open, closed, registered, unavailable |
| POST `/api/downloads` `{fileId}` | user | returns 5-minute signed URL; logs download |
| GET `/api/media/<cover|screenshot|trailer>/<file>` | – | redirects to signed URL (binaries never served) |
| `/api/admin/*` | ADMIN (some SUPER_ADMIN) | games, games/:id/files, games/:id/screenshots, uploads, users, users/:id/revoke-sessions, preregistrations (+/export CSV), news, ads, purchases, downloads, settings |

## Advertising
Ad units are rows in `advertisements` (seeded from the codes you supplied: 300×250 `content`, 320×50 `banner`; the 320×50 code was pasted twice — one row is seeded, add more in Admin → Advertisements).
Each ad renders in `/ad-frame/:id` inside an `<iframe sandbox="allow-scripts allow-popups …">` **without `allow-same-origin`**, so ad scripts can't read your cookies, storage or DOM.
Hidden for users flagged `ad_free` and when Settings → "Show advertisements" is off. No ads on login/register/account/admin pages. Rewarded ads are **not** implemented (only prepared structurally).
Ad networks can serve unsuitable or aggressive creatives (popups/redirects) — review what actually appears and the network's category filters.

## Monetization
Price (paise) is editable per game. The purchase button is **disabled**; no gateway is connected and the site never claims a payment succeeded.
Purchases table + admin tooling exist for when a gateway (e.g. Razorpay) is added.

## Storage setup (Cloudflare R2 example)
Create a private bucket + API token; set the `S3_*` vars. Add CORS on the bucket so browsers can upload directly:
```json
[{"AllowedOrigins":["https://YOUR-DOMAIN"],"AllowedMethods":["PUT","GET"],"AllowedHeaders":["Content-Type"],"ExposeHeaders":["ETag"]}]
```

## Deploy to Railway
1. Push to GitHub (`.env` is git-ignored). 2. New Railway project → deploy from repo → add the **PostgreSQL** plugin.
3. Set variables above (`DATABASE_URL` from the plugin). 4. Start command (already in `railway.json`): `npm run start:prod` — migrates, bootstraps admin, starts Next.
5. Log in at `/admin/login`, change the password, then open NIGHT SHIFT pre-registration under Admin → Pre-registration when ready.

## Verify before launch
1. `npm install && npm run build` — fix any type/build errors first (none could be checked here).
2. `npm run migrate && npm run bootstrap && npm run dev`, then in another shell:
   `ADMIN_USERNAME=… ADMIN_PASSWORD=<changed password> npm run test:smoke`
   (covers: register, duplicate/case-insensitive usernames, bad password, cookie-only session persistence, closed/open/duplicate/concurrent pre-registration, admin authz, session revocation, ban, rate limiting).
3. Manually: intro animation + skip, mobile layouts on a real phone, file upload → download, ads rendering, logout-all, restart browser while logged in.
4. `npm run audit` for dependency vulnerabilities.

## Known limitations
- Untested code (see top). Expect small fixes on first build.
- Uploads go browser → storage via signed URL; type/size are enforced at signing and existence/size is re-checked on save, but file *contents* are not virus-scanned or magic-byte verified.
- CSP allows inline scripts (Next.js hydration) — a nonce-based CSP would be stricter.
- Images use plain `<img>` (no resizing pipeline). No page-view analytics, no email, no password recovery, no payment gateway, no rewarded-ad flow.
- Intro: the frame/typography animation is a faithful recreation drawn in SVG; it cross-fades to your exact logo PNG at the end.
- The per-username login lockout can be abused to temporarily lock a known username (standard trade-off).
