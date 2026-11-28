import { notFound } from 'next/navigation';
import { q, q1 } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import PreRegister from '@/components/PreRegister';
import DownloadButton from '@/components/DownloadButton';
import AdSlot from '@/components/AdSlot';
import { media, STATUS_LABEL, fmtBytes, money } from '@/lib/format';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const g = await q1(`SELECT title, tagline FROM games WHERE slug = $1 AND is_published`, [params.slug]);
  return g ? { title: g.title, description: g.tagline ?? undefined } : {};
}

export default async function GamePage({ params }: { params: { slug: string } }) {
  const g = await q1(`SELECT * FROM games WHERE slug = $1 AND is_published`, [params.slug]);
  if (!g) notFound();
  const user = await getSessionUser();
  const [shots, files, reg] = await Promise.all([
    q(`SELECT * FROM game_screenshots WHERE game_id = $1 ORDER BY sort_order, id`, [g.id]),
    q(`SELECT id, label, version, platform, size_bytes FROM game_files WHERE game_id = $1 AND is_active ORDER BY created_at DESC`, [g.id]),
    user ? q1(`SELECT 1 FROM pre_registrations WHERE user_id = $1 AND game_id = $2`, [user.id, g.id]) : null,
  ]);
  const state = reg ? 'registered' : g.status === 'RELEASED' ? 'unavailable' : !g.prereg_open ? 'closed' : user ? 'open' : 'login';
  const cover = media(g.cover_key), trailer = media(g.trailer_key);
  return (
    <div className="container-x pt-10">
      <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <div className="frame aspect-video overflow-hidden bg-panel">
            {trailer ? <video controls preload="metadata" poster={cover ?? undefined} className="h-full w-full" src={trailer} />
              : cover ? <img src={cover} alt={`${g.title} cover`} className="h-full w-full object-cover" />
              : <div className="flex h-full items-center justify-center font-serif text-4xl tracking-widest text-bone/30">{g.title}</div>}
          </div>
          {shots.length > 0 && <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{shots.map((s) => <a key={s.id} href={media(s.storage_key)!} target="_blank" rel="noopener noreferrer"><img src={media(s.storage_key)!} alt={s.caption || `${g.title} screenshot`} loading="lazy" className="aspect-video w-full border border-line object-cover" /></a>)}</div>}
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-mute">{STATUS_LABEL[g.status]}</p>
          <h1 className="h1 mt-2">{g.title}</h1>
          {g.tagline && <p className="mt-3 text-bone/70">{g.tagline}</p>}
          <div className="mt-6"><PreRegister slug={g.slug} initial={state as any} /></div>
          <dl className="mt-8 grid grid-cols-2 gap-y-3 border-t border-line pt-6 text-sm">
            <dt className="text-mute">Status</dt><dd>{STATUS_LABEL[g.status]}</dd>
            {g.version && <><dt className="text-mute">Version</dt><dd>{g.version}</dd></>}
            {g.release_info && <><dt className="text-mute">Release</dt><dd>{g.release_info}</dd></>}
            <dt className="text-mute">Genre</dt><dd>Horror</dd>
          </dl>
        </div>
      </div>
      <section className="mt-12 grid gap-10 md:grid-cols-2">
        <div><h2 className="h2 mb-3">About</h2><p className="whitespace-pre-wrap text-bone/80">{g.description || 'Details coming soon.'}</p></div>
        <div><h2 className="h2 mb-3">System requirements</h2><p className="whitespace-pre-wrap text-bone/80">{g.system_requirements || 'To be announced.'}</p></div>
      </section>
      <section className="mt-12">
        <h2 className="h2 mb-3">Downloads</h2>
        {files.length ? <ul className="divide-y divide-line border-y border-line">{files.map((f) => (
          <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p>{f.label}</p><p className="text-xs text-mute">{[f.platform, f.version && `v${f.version}`, fmtBytes(f.size_bytes)].filter(Boolean).join(' · ')}</p></div><DownloadButton fileId={f.id} loggedIn={!!user} /></li>))}</ul>
          : <p className="text-mute">No downloads available yet.</p>}
        {g.price_paise != null && g.price_paise > 0 && (
          <div className="card mt-6"><p>Ad-free download — {money(g.price_paise)}</p><button className="btn mt-3" disabled>Payments not available yet</button>
            <p className="mt-2 text-xs text-mute">Purchases will be enabled once a payment gateway is configured. Free downloads may show ads.</p></div>)}
      </section>
      <AdSlot placement="content" />
    </div>
  );
}
