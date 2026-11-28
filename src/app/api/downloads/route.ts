import { z } from 'zod';
import { route, ok, HttpError, requireUser, rateLimit } from '@/lib/api';
import { clientIp } from '@/lib/auth';
import { q1, q } from '@/lib/db';
import { getSetting } from '@/lib/settings';
import { presignGet, storageConfigured } from '@/lib/storage';

export const POST = route(async (req) => {
  const user = await requireUser();
  await rateLimit(`dl:${user.id}`, 30, 3600);
  const { fileId } = z.object({ fileId: z.number().int() }).parse(await req.json());
  if (!(await getSetting('downloads_enabled', true))) throw new HttpError(503, 'Downloads are temporarily disabled.');
  if (!storageConfigured()) throw new HttpError(503, 'File storage is not configured yet.');
  const f = await q1(`SELECT f.id, f.storage_key, f.label, f.version, g.id AS game_id, g.title FROM game_files f JOIN games g ON g.id = f.game_id WHERE f.id = $1 AND f.is_active AND g.is_published`, [fileId]);
  if (!f) throw new HttpError(404, 'File not available.');
  const ext = f.storage_key.split('.').pop();
  const url = await presignGet(f.storage_key, { expiresIn: 300, downloadName: `${f.title}-${f.version || f.label}.${ext}`.replace(/\s+/g, '_') });
  await q(`INSERT INTO downloads (user_id, game_id, file_id, ip) VALUES ($1, $2, $3, $4)`, [user.id, f.game_id, f.id, clientIp(req.headers)]);
  return ok({ url });
});
