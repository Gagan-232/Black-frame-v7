export const media = (k?: string | null) => (k ? `/api/media/${k}` : null);
export const fmtDate = (d: any) => (d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');
export const fmtDateTime = (d: any) => (d ? new Date(d).toLocaleString('en-IN') : '—');
export const fmtBytes = (n?: number | string | null) => { const b = Number(n); if (!b) return ''; const u = ['B', 'KB', 'MB', 'GB']; let i = 0, v = b; while (v >= 1024 && i < 3) { v /= 1024; i++; } return `${v.toFixed(i ? 1 : 0)} ${u[i]}`; };
export const STATUS_LABEL: Record<string, string> = { COMING_SOON: 'Coming soon', IN_DEVELOPMENT: 'In development', RELEASED: 'Released' };
export const money = (paise?: number | null) => (paise == null ? '' : `₹${(paise / 100).toFixed(paise % 100 ? 2 : 0)}`);
