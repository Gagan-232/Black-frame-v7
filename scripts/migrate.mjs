import './_env.mjs';
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined });
await client.connect();
try {
  await client.query('SELECT pg_advisory_lock(727001)');
  await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())');
  const done = new Set((await client.query('SELECT name FROM schema_migrations')).rows.map((r) => r.name));
  const files = fs.readdirSync('migrations').filter((f) => f.endsWith('.sql')).sort();
  for (const f of files) {
    if (done.has(f)) continue;
    console.log('Applying', f);
    await client.query('BEGIN');
    try {
      await client.query(fs.readFileSync(path.join('migrations', f), 'utf8'));
      await client.query('INSERT INTO schema_migrations(name) VALUES($1)', [f]);
      await client.query('COMMIT');
    } catch (e) { await client.query('ROLLBACK'); throw e; }
  }
  console.log('Migrations up to date.');
} finally { await client.end(); }
