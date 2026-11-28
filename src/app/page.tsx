import Link from 'next/link';
import { q, q1 } from '@/lib/db';
import GameCard from '@/components/GameCard';
import AdSlot from '@/components/AdSlot';
import { fmtDate } from '@/lib/format';

export default async function Home() {
  const [featured, news] = await Promise.all([
    q1(`SELECT * FROM games WHERE slug = 'night-shift' AND is_published`),
    q(`SELECT slug, title, published_at FROM news WHERE is_published ORDER BY published_at DESC LIMIT 3`),
  ]);
  return (
    <>
      <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_center,#161616_0%,#000_70%)] px-4 text-center">
        <div>
          <img src="/logo.png" alt="Black Frame Studio" className="mx-auto w-full max-w-xl" />
          <p className="mx-auto mt-8 max-w-xl text-bone/70">Independent horror game development.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/games/night-shift" className="btn">Explore NIGHT SHIFT</Link><Link href="/games" className="btn-ghost">All games</Link>
          </div>
        </div>
      </section>
      {featured && (
        <section className="container-x mt-20">
          <h2 className="h2 mb-6">Featured game</h2>
          <div className="grid gap-8 md:grid-cols-2"><GameCard g={featured} />
            <div className="flex flex-col justify-center gap-4">
              <p className="text-bone/80">{featured.description || 'More details about NIGHT SHIFT will be revealed here.'}</p>
              <p className="text-sm text-mute">Pre-registration is currently <span className="text-bone">{featured.prereg_open ? 'open' : 'closed'}</span>.</p>
              <div><Link href="/games/night-shift" className="btn-ghost">View game page</Link></div></div></div>
        </section>
      )}
      <AdSlot placement="content" />
      <section className="container-x mt-12">
        <div className="mb-6 flex items-end justify-between"><h2 className="h2">Latest news</h2><Link href="/news" className="text-sm text-mute hover:text-bone">All news →</Link></div>
        {news.length ? <ul className="divide-y divide-line border-y border-line">{news.map((n) => (
          <li key={n.slug}><Link href={`/news/${n.slug}`} className="flex flex-col gap-1 py-4 sm:flex-row sm:justify-between hover:text-bone"><span>{n.title}</span><span className="text-sm text-mute">{fmtDate(n.published_at)}</span></Link></li>))}</ul>
          : <p className="text-mute">No announcements yet.</p>}
      </section>
      <AdSlot placement="banner" />
    </>
  );
}
