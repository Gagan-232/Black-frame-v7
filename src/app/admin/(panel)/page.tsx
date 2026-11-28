import { dashboardStats } from '@/lib/stats';
import { fmtDateTime } from '@/lib/format';
export default async function AdminHome() {
  const s = await dashboardStats();
  const cards = [['Registered users', s.users], ['Active users (30d)', s.active], ['Games', s.games], ['Downloads', s.downloads], ['NIGHT SHIFT pre-registrations', s.nightShift]];
  return (
    <div className="space-y-8"><h1 className="h1">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">{cards.map(([l, v]) => <div key={l as string} className="card"><p className="text-3xl font-serif">{v}</p><p className="mt-1 text-xs uppercase tracking-widest text-mute">{l}</p></div>)}</div>
      <div><h2 className="h2 mb-3">Recent activity</h2>{s.recent.length ? <ul className="divide-y divide-line border-y border-line text-sm">{s.recent.map((r: any, i: number) => <li key={i} className="flex flex-wrap justify-between gap-2 py-3"><span>{r.username ?? 'system'} · {r.action}{r.target_id ? ` (${r.target_type} ${r.target_id})` : ''}</span><span className="text-mute">{fmtDateTime(r.created_at)}</span></li>)}</ul> : <p className="text-mute">No activity yet.</p>}</div>
    </div>
  );
}
