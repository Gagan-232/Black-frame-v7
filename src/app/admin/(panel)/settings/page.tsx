'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/client';
const toggles: [string, string][] = [['ads_enabled', 'Show advertisements'], ['downloads_enabled', 'Allow downloads'], ['registrations_enabled', 'Allow new account registration']];
export default function SettingsAdmin() {
  const [s, setS] = useState<any>(null); const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  useEffect(() => { api('/api/admin/settings').then((d) => setS(d.settings)).catch((e) => setMsg({ ok: false, t: e.message })); }, []);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    try { await api('/api/admin/settings', { method: 'PUT', body: { ads_enabled: !!s.ads_enabled, downloads_enabled: !!s.downloads_enabled, registrations_enabled: !!s.registrations_enabled, instagram_url: s.instagram_url || '', discord_url: s.discord_url || '' } }); setMsg({ ok: true, t: 'Settings saved.' }); }
    catch (err: any) { setMsg({ ok: false, t: err.message }); }
  }
  if (!s) return <div className="space-y-4"><h1 className="h1">Settings</h1>{msg ? <div className="alert-err">{msg.t}</div> : <p className="text-mute">Loading…</p></div>;
  return (<form onSubmit={save} className="card max-w-xl space-y-5"><h1 className="h2">Website settings</h1>{msg && <div className={msg.ok ? 'alert-ok' : 'alert-err'}>{msg.t}</div>}
    {toggles.map(([k, l]) => <label key={k} className="flex items-center gap-3"><input type="checkbox" className="h-5 w-5 accent-white" checked={!!s[k]} onChange={(e) => setS({ ...s, [k]: e.target.checked })} />{l}</label>)}
    <div><label className="label">Instagram URL</label><input className="input" value={s.instagram_url ?? ''} onChange={(e) => setS({ ...s, instagram_url: e.target.value })} /></div>
    <div><label className="label">Discord URL (optional)</label><input className="input" value={s.discord_url ?? ''} onChange={(e) => setS({ ...s, discord_url: e.target.value })} /></div>
    <button className="btn">Save settings</button></form>);
}
