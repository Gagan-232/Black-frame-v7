import { dailySeries } from '@/lib/stats';
async function Series({ title, table }: { title: string; table: 'users' | 'downloads' | 'pre_registrations' }) {
  const rows = await dailySeries(table); const max = Math.max(1, ...rows.map((r) => r.n)); const total = rows.reduce((a, r) => a + r.n, 0);
  return (<div className="card"><div className="mb-4 flex justify-between"><h2 className="h2">{title}</h2><span className="text-sm text-mute">{total} in last 30 days</span></div>
    <div className="flex h-32 items-end gap-[3px]">{rows.map((r) => <div key={r.day} title={`${r.day}: ${r.n}`} className="flex-1 bg-bone/70" style={{ height: `${Math.max(2, (r.n / max) * 100)}%`, opacity: r.n ? 1 : 0.25 }} />)}</div>
    <div className="mt-1 flex justify-between text-[10px] text-mute"><span>{rows[0]?.day}</span><span>{rows[rows.length - 1]?.day}</span></div></div>);
}
export default function Analytics() {
  return (<div className="space-y-6"><h1 className="h1">Analytics</h1><p className="text-sm text-mute">Figures come directly from database records. Page-view tracking is not implemented, so none is shown.</p>
    <Series title="New accounts" table="users" /><Series title="Pre-registrations" table="pre_registrations" /><Series title="Downloads" table="downloads" /></div>);
}
