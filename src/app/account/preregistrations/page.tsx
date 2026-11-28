import Link from 'next/link';
import { q } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { fmtDateTime } from '@/lib/format';
export const metadata = { title: 'Pre-registrations' };
export default async function Regs() {
  const u = (await getSessionUser())!;
  const rows = await q(`SELECT g.title, g.slug, p.created_at FROM pre_registrations p JOIN games g ON g.id = p.game_id WHERE p.user_id = $1 ORDER BY p.created_at DESC`, [u.id]);
  return (<div><h1 className="h2 mb-6">Pre-registration history</h1>{rows.length ? <ul className="divide-y divide-line border-y border-line">{rows.map((r) => <li key={r.slug} className="flex justify-between py-4"><Link href={`/games/${r.slug}`} className="hover:underline">{r.title}</Link><span className="text-sm text-mute">{fmtDateTime(r.created_at)}</span></li>)}</ul> : <p className="text-mute">No pre-registrations yet.</p>}</div>);
}
