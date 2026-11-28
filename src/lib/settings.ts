import { q1 } from './db';
export async function getSetting<T = any>(key: string, fallback: T): Promise<T> {
  const r = await q1(`SELECT value FROM site_settings WHERE key = $1`, [key]);
  return r ? (r.value as T) : fallback;
}
