'use client';
import Link from 'next/link';
import { useState } from 'react';
import { api, safeNext } from '@/lib/client';

export default function AuthForm({ mode, next }: { mode: 'login' | 'register' | 'admin'; next?: string }) {
  const [username, setUsername] = useState(''); const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [avail, setAvail] = useState('');
  const reg = mode === 'register';

  async function checkName() {
    if (!reg || username.length < 3) return setAvail('');
    try { const r = await api(`/api/auth/username?u=${encodeURIComponent(username)}`); setAvail(r.available ? '✓ Username available' : r.reason || 'Unavailable'); } catch { setAvail(''); }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError('');
    if (reg && password !== confirm) return setError('Passwords do not match.');
    setBusy(true);
    try {
      const r = await api(reg ? '/api/auth/register' : '/api/auth/login', { body: reg ? { username, password, confirmPassword: confirm } : { username, password, admin: mode === 'admin' } });
      window.location.href = r.mustChangePassword ? '/account/settings?force=1' : mode === 'admin' ? '/admin' : safeNext(next) ?? '/account';
    } catch (err: any) { setError(err.message); setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="frame mx-auto w-full max-w-md space-y-5 bg-charcoal p-6 sm:p-10">
      <h1 className="h2 text-center">{mode === 'admin' ? 'Admin Login' : reg ? 'Create Account' : 'Login'}</h1>
      {error && <div className="alert-err" role="alert">{error}</div>}
      <div><label className="label" htmlFor="u">Username</label>
        <input id="u" className="input" value={username} onChange={(e) => setUsername(e.target.value)} onBlur={checkName} autoComplete="username" autoCapitalize="none" required />
        {avail && <p className={`mt-1 text-xs ${avail.startsWith('✓') ? 'text-bone' : 'text-blood'}`}>{avail}</p>}</div>
      <div><label className="label" htmlFor="p">Password</label>
        <input id="p" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={reg ? 'new-password' : 'current-password'} required /></div>
      {reg && <div><label className="label" htmlFor="c">Confirm password</label>
        <input id="c" type="password" className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required /></div>}
      <button className="btn w-full" disabled={busy}>{busy ? 'Please wait…' : reg ? 'Register' : 'Log in'}</button>
      {mode !== 'admin' && (reg
        ? <p className="text-center text-sm text-mute">Already have an account? <Link href="/login" className="text-bone underline">Log in</Link></p>
        : <p className="text-center text-sm text-mute">New here? <Link href="/register" className="text-bone underline">Create an account</Link></p>)}
      {reg && <p className="text-center text-xs text-mute">No email needed. Note: without an email, a forgotten password can’t be self-recovered.</p>}
    </form>
  );
}
