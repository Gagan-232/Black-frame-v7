'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/client';

export default function SettingsPanel({ forced, admin }: { forced: boolean; admin: boolean }) {
  const [f, setF] = useState({ current: '', next: '', confirm: '' }); const [msg, setMsg] = useState<{ ok: boolean; s: string } | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const load = useCallback(async () => { try { setSessions((await api('/api/account/sessions')).sessions); } catch {} }, []);
  useEffect(() => { load(); }, [load]);
  async function change(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    try { await api('/api/account/password', { body: f }); setMsg({ ok: true, s: 'Password changed. Other devices were signed out.' }); setF({ current: '', next: '', confirm: '' }); load(); if (forced) setTimeout(() => (window.location.href = '/admin'), 800); }
    catch (err: any) { setMsg({ ok: false, s: err.message }); }
  }
  async function revoke(id: string) { await api(`/api/account/sessions/${id}`, { method: 'DELETE' }); load(); }
  async function logoutAll() { if (!confirm('Sign out of every device, including this one?')) return; await api('/api/auth/logout-all', { method: 'POST', body: {} }); window.location.href = '/login'; }
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form onSubmit={change} className="card space-y-4">
        <h1 className="h2">Change password</h1>
        {forced && <div className="alert-err">You must change your password before continuing.</div>}
        {msg && <div className={msg.ok ? 'alert-ok' : 'alert-err'}>{msg.s}</div>}
        <div><label className="label">Current password</label><input type="password" className="input" value={f.current} onChange={set('current')} autoComplete="current-password" required /></div>
        <div><label className="label">New password {admin && '(min. 12 characters)'}</label><input type="password" className="input" value={f.next} onChange={set('next')} autoComplete="new-password" required /></div>
        <div><label className="label">Confirm new password</label><input type="password" className="input" value={f.confirm} onChange={set('confirm')} autoComplete="new-password" required /></div>
        <button className="btn">Update password</button>
      </form>
      <div className="card space-y-4">
        <h2 className="h2">Signed-in devices</h2>
        <ul className="divide-y divide-line">{sessions.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm">{s.user_agent || 'Unknown device'}{s.current && <span className="ml-2 text-xs text-bone">(this device)</span>}</p>
            <p className="text-xs text-mute">Last active {new Date(s.last_seen_at).toLocaleString()}</p></div>
            {!s.current && <button className="btn-ghost btn-sm" onClick={() => revoke(s.id)}>Sign out</button>}</li>))}</ul>
        <button className="btn-danger" onClick={logoutAll}>Log out of all devices</button>
      </div>
    </div>
  );
}
