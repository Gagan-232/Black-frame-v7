'use client';
import Link from 'next/link';
import { useState } from 'react';
import { api } from '@/lib/client';

type State = 'open' | 'closed' | 'registered' | 'unavailable' | 'login';
export default function PreRegister({ slug, initial }: { slug: string; initial: State }) {
  const [state, setState] = useState<State>(initial); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true); setMsg('');
    try { const r = await api(`/api/games/${slug}/preregister`, { body: {} }); setState(r.state); setMsg(r.created ? 'Pre-registration successful! This game now appears in your account.' : r.message); }
    catch (e: any) { if (e.data?.state) setState(e.data.state); setMsg(e.message); }
    finally { setBusy(false); }
  }
  return (
    <div className="space-y-3">
      {state === 'open' && <button className="btn w-full sm:w-auto" onClick={go} disabled={busy}>{busy ? 'Registering…' : 'Pre-register now'}</button>}
      {state === 'login' && <Link href={`/login?next=/games/${slug}`} className="btn w-full sm:w-auto">Log in to pre-register</Link>}
      {state === 'registered' && <div className="alert-ok">✓ You are pre-registered. <Link href="/account/preregistrations" className="underline">View in your account</Link></div>}
      {state === 'closed' && <button className="btn" disabled>Pre-registration closed</button>}
      {state === 'unavailable' && <button className="btn" disabled>Pre-registration unavailable</button>}
      {msg && state !== 'registered' && <p className="text-sm text-mute" role="status">{msg}</p>}
      {msg && state === 'registered' && msg.includes('successful') && <p className="text-sm text-mute" role="status">{msg}</p>}
    </div>
  );
}
