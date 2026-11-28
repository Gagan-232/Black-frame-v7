'use client';
import { useState } from 'react';
import { api } from '@/lib/client';
export default function DownloadButton({ fileId, loggedIn }: { fileId: number; loggedIn: boolean }) {
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  if (!loggedIn) return <a className="btn-ghost btn-sm" href="/login">Log in to download</a>;
  async function go() { setBusy(true); setErr(''); try { const r = await api('/api/downloads', { body: { fileId } }); window.location.href = r.url; } catch (e: any) { setErr(e.message); } finally { setBusy(false); } }
  return (<div><button className="btn btn-sm" onClick={go} disabled={busy}>{busy ? 'Preparing…' : 'Download'}</button>{err && <p className="mt-1 text-xs text-blood">{err}</p>}</div>);
}
