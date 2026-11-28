import { q } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import DownloadButton from '@/components/DownloadButton';
import AdSlot from '@/components/AdSlot';
import { fmtBytes } from '@/lib/format';
export const metadata = { title: 'Downloads' };
export default async function Downloads() {
  const user = await getSessionUser();
  const files = await q(`SELECT f.id, f.label, f.version, f.platform, f.size_bytes, g.title FROM game_files f JOIN games g ON g.id = f.game_id WHERE f.is_active AND g.is_published ORDER BY g.title, f.created_at DESC`);
  return (
    <div className="container-x max-w-3xl pt-12">
      <h1 className="h1 mb-8">Downloads</h1>
      {files.length ? <ul className="divide-y divide-line border-y border-line">{files.map((f) => (
        <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p>{f.title} — {f.label}</p><p className="text-xs text-mute">{[f.platform, f.version && `v${f.version}`, fmtBytes(f.size_bytes)].filter(Boolean).join(' · ')}</p></div><DownloadButton fileId={f.id} loggedIn={!!user} /></li>))}</ul>
        : <p className="text-mute">No downloads are available yet.</p>}
      <AdSlot placement="content" />
    </div>
  );
}
