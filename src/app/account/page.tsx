import Link from 'next/link';
import { q } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { fmtDate } from '@/lib/format';
export const metadata = { title: 'Dashboard' };
export default async function Dashboard() {
  const u = (await getSessionUser())!;
  const [regs, dls] = await Promise.all([
    q(`SELECT g.title, g.slug, p.created_at FROM pre_registrations p JOIN games g ON g.id = p.game_id WHERE p.user_id = $1 ORDER BY p.created_at DESC LIMIT 5`, [u.id]),
    q(`SELECT g.title, d.created_at FROM downloads d JOIN games g ON g.id = d.game_id WHERE d.user_id = $1 ORDER BY d.created_at DESC LIMIT 5`, [u.id]),
  ]);
  return (
    <div className="space-y-8">
      <h1 className="h1">Welcome, {u.username}</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card"><h2 className="h2 mb-4">Pre-registrations</h2>{regs.length ? <ul className="space-y-2">{regs.map((r) => <li key={r.slug} className="flex justify-between"><Link href={`/games/${r.slug}`} className="hover:underline">{r.title}</Link><span className="text-sm text-mute">{fmtDate(r.created_at)}</span></li>)}</ul> : <p className="text-mute">You haven’t pre-registered for any game yet.</p>}</div>
        <div className="card"><h2 className="h2 mb-4">Recent downloads</h2>{dls.length ? <ul className="space-y-2">{dls.map((d, i) => <li key={i} className="flex justify-between"><span>{d.title}</span><span className="text-sm text-mute">{fmtDate(d.created_at)}</span></li>)}</ul> : <p className="text-mute">No downloads yet.</p>}</div>
      </div>
    </div>
  );
}
