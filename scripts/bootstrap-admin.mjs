import './_env.mjs';
import pg from 'pg';
import { hash } from '@node-rs/argon2';

const username = process.env.ADMIN_USERNAME;
const password = process.env.ADMIN_INITIAL_PASSWORD;
if (!username || !password) { console.log('ADMIN_USERNAME / ADMIN_INITIAL_PASSWORD not set — skipping admin bootstrap.'); process.exit(0); }
if (password.length < 10) { console.error('ADMIN_INITIAL_PASSWORD must be at least 10 characters.'); process.exit(1); }

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined });
await client.connect();
try {
  const exists = await client.query('SELECT 1 FROM users WHERE username_lower = lower($1)', [username]);
  if (exists.rowCount) { console.log('Admin account already exists — nothing to do.'); }
  else {
    const h = await hash(password, { memoryCost: 19456, timeCost: 2, parallelism: 1 });
    await client.query(`INSERT INTO users (username, password_hash, role, must_change_password) VALUES ($1, $2, 'SUPER_ADMIN', true)`, [username, h]);
    await client.query(`INSERT INTO audit_logs (action, target_type, target_id) VALUES ('admin.bootstrap', 'user', $1)`, [username]);
    console.log('SUPER_ADMIN created. Password change will be required at first login.');
  }
} finally { await client.end(); }
