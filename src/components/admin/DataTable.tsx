'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api, uploadFile } from '@/lib/client';

export type Col = { key: string; label: string; render?: (r: any) => React.ReactNode };
export type Field = { name: string; label: string; type: 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'file'; options?: string[]; required?: boolean; kind?: string; help?: string };
export type Action = { label: string; confirm?: string; danger?: boolean; show?: (r: any) => boolean; run?: (r: any) => Promise<any>; href?: (r: any) => string };
type Props = { endpoint: string; columns: Col[]; fields?: Field[]; actions?: Action[]; canCreate?: boolean; canEdit?: boolean; canDelete?: boolean; searchable?: boolean; filters?: { name: string; label: string; options: string[] }[]; extra?: Record<string, string>; createLabel?: string; exportUrl?: string; empty?: string; defaults?: Record<string, any> };

const fmt = (v: any) => v === null || v === undefined || v === '' ? '—' : typeof v === 'boolean' ? (v ? 'Yes' : 'No') : typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v) ? new Date(v).toLocaleString() : String(v);

export default function DataTable(p: Props) {
  const [rows, setRows] = useState<any[]>([]); const [total, setTotal] = useState(0); const [page, setPage] = useState(1);
  const [qIn, setQIn] = useState(''); const [qs, setQs] = useState(''); const [fv, setFv] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true); const [msg, setMsg] = useState<{ ok: boolean; s: string } | null>(null);
  const [form, setForm] = useState<{ id?: number; v: Record<string, any> } | null>(null); const [saving, setSaving] = useState(false);
  const size = 20; const extraKey = JSON.stringify(p.extra || {});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams({ page: String(page), size: String(size), ...JSON.parse(extraKey), ...(qs ? { q: qs } : {}), ...Object.fromEntries(Object.entries(fv).filter(([, v]) => v)) });
      const d = await api(`${p.endpoint}?${sp}`); setRows(d.rows); setTotal(d.total);
    } catch (e: any) { setMsg({ ok: false, s: e.message }); } finally { setLoading(false); }
  }, [p.endpoint, page, qs, fv, extraKey]);
  useEffect(() => { load(); }, [load]);

  const flash = (ok: boolean, s: string) => { setMsg({ ok, s }); setTimeout(() => setMsg(null), 5000); };
  async function runAction(a: Action, r: any) {
    if (a.confirm && !window.confirm(a.confirm)) return;
    try { await a.run!(r); flash(true, 'Done.'); load(); } catch (e: any) { flash(false, e.message); }
  }
  async function del(r: any) { if (!window.confirm('Delete this item permanently?')) return; try { await api(`${p.endpoint}/${r.id}`, { method: 'DELETE' }); flash(true, 'Deleted.'); load(); } catch (e: any) { flash(false, e.message); } }
  function openForm(r?: any) {
    const v: Record<string, any> = {};
    for (const f of p.fields ?? []) v[f.name] = r ? r[f.name] ?? (f.type === 'checkbox' ? false : '') : p.defaults?.[f.name] ?? (f.type === 'checkbox' ? false : f.type === 'select' ? f.options![0] : '');
    setForm({ id: r?.id, v });
  }
  async function save(e: React.FormEvent) {
    e.preventDefault(); if (!form) return; setSaving(true);
    const data: Record<string, any> = {};
    for (const f of p.fields!) { const v = form.v[f.name]; data[f.name] = f.type === 'number' ? (v === '' || v == null ? null : Number(v)) : v; }
    try { await api(form.id ? `${p.endpoint}/${form.id}` : p.endpoint, { method: form.id ? 'PATCH' : 'POST', body: data }); setForm(null); flash(true, 'Saved.'); load(); }
    catch (err: any) { flash(false, err.message); } finally { setSaving(false); }
  }
  async function onFile(f: Field, file?: File) {
    if (!file) return; flash(true, 'Uploading…');
    try { const r = await uploadFile(file, f.kind!); setForm((s) => s && { ...s, v: { ...s.v, [f.name]: r.key } }); flash(true, `Uploaded ${file.name}`); } catch (e: any) { flash(false, e.message); }
  }

  const pages = Math.max(1, Math.ceil(total / size));
  return (
    <div className="space-y-4">
      {msg && <div className={msg.ok ? 'alert-ok' : 'alert-err'} role="status">{msg.s}</div>}
      <div className="flex flex-wrap items-center gap-3">
        {p.searchable !== false && <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); setPage(1); setQs(qIn); }}><input className="input !min-h-[38px] w-44 sm:w-56" placeholder="Search…" value={qIn} onChange={(e) => setQIn(e.target.value)} /><button className="btn-ghost btn-sm">Search</button></form>}
        {p.filters?.map((f) => <select key={f.name} className="input !min-h-[38px] w-auto" value={fv[f.name] ?? ''} onChange={(e) => { setPage(1); setFv({ ...fv, [f.name]: e.target.value }); }}><option value="">{f.label}: all</option>{f.options.map((o) => <option key={o}>{o}</option>)}</select>)}
        <div className="ml-auto flex gap-2">{p.exportUrl && <a className="btn-ghost btn-sm" href={`${p.exportUrl}?${new URLSearchParams({ ...(p.extra || {}), ...(qs ? { q: qs } : {}), ...Object.fromEntries(Object.entries(fv).filter(([, v]) => v)) })}`}>Export CSV</a>}
          {p.canCreate && <button className="btn btn-sm" onClick={() => openForm()}>{p.createLabel ?? 'Add new'}</button>}</div>
      </div>
      <div className="overflow-x-auto border border-line"><table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-line bg-charcoal text-xs uppercase tracking-widest text-mute"><tr>{p.columns.map((c) => <th key={c.key} className="px-4 py-3 font-normal">{c.label}</th>)}<th /></tr></thead>
        <tbody className="divide-y divide-line">{loading ? <tr><td className="px-4 py-6 text-mute" colSpan={99}>Loading…</td></tr> : rows.length === 0 ? <tr><td className="px-4 py-6 text-mute" colSpan={99}>{p.empty ?? 'Nothing here yet.'}</td></tr> :
          rows.map((r) => <tr key={r.id}>{p.columns.map((c) => <td key={c.key} className="px-4 py-3 align-top">{c.render ? c.render(r) : fmt(r[c.key])}</td>)}
            <td className="whitespace-nowrap px-4 py-3 text-right"><div className="flex justify-end gap-2">
              {p.actions?.filter((a) => !a.show || a.show(r)).map((a) => a.href ? <Link key={a.label} href={a.href(r)} className="btn-ghost btn-sm">{a.label}</Link> : <button key={a.label} className={`${a.danger ? 'btn-danger' : 'btn-ghost'} btn-sm`} onClick={() => runAction(a, r)}>{a.label}</button>)}
              {p.canEdit && <button className="btn-ghost btn-sm" onClick={() => openForm(r)}>Edit</button>}{p.canDelete && <button className="btn-danger btn-sm" onClick={() => del(r)}>Delete</button>}</div></td></tr>)}</tbody></table></div>
      <div className="flex items-center justify-between text-sm text-mute"><span>{total} total</span><div className="flex items-center gap-3"><button className="btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button><span>{page} / {pages}</span><button className="btn-ghost btn-sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button></div></div>

      {form && p.fields && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4" onClick={() => setForm(null)}>
          <form onSubmit={save} onClick={(e) => e.stopPropagation()} className="frame my-8 w-full max-w-xl space-y-4 bg-charcoal p-6">
            <h2 className="h2">{form.id ? 'Edit' : 'Add'}</h2>
            {p.fields.map((f) => <div key={f.name}>
              {f.type === 'checkbox' ? <label className="flex items-center gap-3"><input type="checkbox" className="h-5 w-5 accent-white" checked={!!form.v[f.name]} onChange={(e) => setForm({ ...form, v: { ...form.v, [f.name]: e.target.checked } })} /><span>{f.label}</span></label> : <>
                <label className="label">{f.label}</label>
                {f.type === 'textarea' ? <textarea className="input min-h-[120px]" value={form.v[f.name] ?? ''} onChange={(e) => setForm({ ...form, v: { ...form.v, [f.name]: e.target.value } })} required={f.required} />
                  : f.type === 'select' ? <select className="input" value={form.v[f.name]} onChange={(e) => setForm({ ...form, v: { ...form.v, [f.name]: e.target.value } })}>{f.options!.map((o) => <option key={o}>{o}</option>)}</select>
                  : f.type === 'file' ? <div><input type="file" className="input" onChange={(e) => onFile(f, e.target.files?.[0])} />{form.v[f.name] && <p className="mt-1 break-all text-xs text-mute">Current: {form.v[f.name]}</p>}</div>
                  : <input className="input" type={f.type === 'number' ? 'number' : 'text'} value={form.v[f.name] ?? ''} onChange={(e) => setForm({ ...form, v: { ...form.v, [f.name]: e.target.value } })} required={f.required} />}</>}
              {f.help && <p className="mt-1 text-xs text-mute">{f.help}</p>}</div>)}
            <div className="flex gap-3"><button className="btn" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button><button type="button" className="btn-ghost" onClick={() => setForm(null)}>Cancel</button></div>
          </form></div>)}
    </div>
  );
}
