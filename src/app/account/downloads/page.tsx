import { q } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { fmtDateTime } from '@/lib/format';
export const metadata = { title: 'Download history' };
export default async function Dls() {
  const u = (await getSessionUser())!;
  const rows = await q(`SELECT g.title, f.label, d.created_at FROM downloads d JOIN games g ON g.id = d.game_id LEFT JOIN game_files f ON f.id = d.file_id WHERE d.user_id = $1 ORDER BY d.created_at DESC LIMIT 100`, [u.id]);
  return (<div><h1 className="h2 mb-6">Download history</h1>{rows.length ? <ul className="divide-y divide-line border-y border-line">{rows.map((r, i) => <li key={i} className="flex justify-between py-4"><span>{r.title}{r.label ? ` — ${r.label}` : ''}</span><span className="text-sm text-mute">{fmtDateTime(r.created_at)}</span></li>)}</ul> : <p className="text-mute">No downloads yet.</p>}</div>);
}
