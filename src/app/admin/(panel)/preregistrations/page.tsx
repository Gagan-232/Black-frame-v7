'use client';
import { useEffect, useState } from 'react';
import DataTable from '@/components/admin/DataTable';
import { api } from '@/lib/client';

export default function PreregAdmin() {
  const [games, setGames] = useState<any[]>([]); const [gid, setGid] = useState(''); const [err, setErr] = useState('');
  const load = () => api('/api/admin/games?size=100').then((d) => setGames(d.rows)).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);
  async function toggle(g: any) {
    if (!confirm(`${g.prereg_open ? 'Close' : 'Open'} pre-registration for ${g.title}?`)) return;
    try { await api(`/api/admin/games/${g.id}`, { method: 'PATCH', body: { prereg_open: !g.prereg_open } }); load(); } catch (e: any) { setErr(e.message); }
  }
  return (<div className="space-y-8"><h1 className="h1">Pre-registration</h1>{err && <div className="alert-err">{err}</div>}
    <div className="grid gap-4 sm:grid-cols-2">{games.map((g) => (
      <div key={g.id} className="card flex items-center justify-between gap-4"><div><p className="font-serif text-xl">{g.title}</p><p className="text-sm text-mute">{g.prereg_count} registered · currently <span className={g.prereg_open ? 'text-bone' : 'text-blood'}>{g.prereg_open ? 'OPEN' : 'CLOSED'}</span></p></div>
        <button className={g.prereg_open ? 'btn-danger btn-sm' : 'btn btn-sm'} onClick={() => toggle(g)}>{g.prereg_open ? 'Close' : 'Open'}</button></div>))}</div>
    <div className="space-y-4"><div className="flex items-center gap-3"><h2 className="h2">Registrations</h2>
      <select className="input !min-h-[38px] w-auto" value={gid} onChange={(e) => setGid(e.target.value)}><option value="">All games</option>{games.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}</select></div>
      <DataTable endpoint="/api/admin/preregistrations" extra={gid ? { game_id: gid } : {}} exportUrl="/api/admin/preregistrations/export" canDelete empty="No registrations yet."
        columns={[{ key: 'username', label: 'Username' }, { key: 'game', label: 'Game' }, { key: 'created_at', label: 'Registered at' }]} /></div></div>);
}
