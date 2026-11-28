import { Pool } from 'pg';

const g = globalThis as unknown as { _bfPool?: Pool };
export const pool =
  g._bfPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });
if (process.env.NODE_ENV !== 'production') g._bfPool = pool;

export async function q<T = any>(text: string, params: any[] = []): Promise<T[]> {
  return (await pool.query(text, params)).rows as T[];
}
export async function q1<T = any>(text: string, params: any[] = []): Promise<T | null> {
  return (await q<T>(text, params))[0] ?? null;
}
