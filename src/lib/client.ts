export async function api(path: string, opts: { method?: string; body?: any } = {}) {
  const csrf = document.cookie.split('; ').find((c) => c.startsWith('bf_csrf='))?.split('=')[1] ?? '';
  const res = await fetch(path, {
    method: opts.method ?? (opts.body !== undefined ? 'POST' : 'GET'),
    headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    credentials: 'same-origin',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Request failed.'), { status: res.status, data });
  return data;
}
export async function uploadFile(file: File, kind: string) {
  const p = await api('/api/admin/uploads', { body: { kind, filename: file.name, size: file.size } });
  const r = await fetch(p.url, { method: 'PUT', headers: { 'Content-Type': p.contentType }, body: file });
  if (!r.ok) throw new Error('Upload to storage failed. Check the bucket CORS settings.');
  return p as { key: string; contentType: string };
}
export const safeNext = (n?: string | null) => (n && n.startsWith('/') && !n.startsWith('//') ? n : null);
export const money = (paise?: number | null) => (paise == null ? '' : `₹${(paise / 100).toFixed(paise % 100 ? 2 : 0)}`);
