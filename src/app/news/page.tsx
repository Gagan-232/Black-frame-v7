import Link from 'next/link';
import { q } from '@/lib/db';
import AdSlot from '@/components/AdSlot';
import { fmtDate } from '@/lib/format';
export const metadata = { title: 'News' };
export default async function News() {
  const rows = await q(`SELECT slug, title, body, published_at FROM news WHERE is_published ORDER BY published_at DESC LIMIT 50`);
  return (
    <div className="container-x max-w-3xl pt-12">
      <h1 className="h1 mb-10">News & Announcements</h1>
      {rows.length ? <div className="space-y-6">{rows.map((n) => (
        <Link key={n.slug} href={`/news/${n.slug}`} className="card block hover:border-bone/50"><p className="text-xs text-mute">{fmtDate(n.published_at)}</p><h2 className="h2 mt-1">{n.title}</h2><p className="mt-2 line-clamp-2 text-bone/70">{n.body}</p></Link>))}</div>
        : <p className="text-mute">No announcements yet.</p>}
      <AdSlot placement="banner" />
    </div>
  );
}
