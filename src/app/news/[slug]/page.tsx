import { notFound } from 'next/navigation';
import { q1 } from '@/lib/db';
import AdSlot from '@/components/AdSlot';
import { fmtDate } from '@/lib/format';
export default async function Article({ params }: { params: { slug: string } }) {
  const n = await q1(`SELECT title, body, published_at FROM news WHERE slug = $1 AND is_published`, [params.slug]);
  if (!n) notFound();
  return (
    <article className="container-x max-w-3xl pt-12"><p className="text-xs text-mute">{fmtDate(n.published_at)}</p><h1 className="h1 mt-2">{n.title}</h1>
      <div className="mt-8 whitespace-pre-wrap leading-relaxed text-bone/85">{n.body}</div><AdSlot placement="banner" /></article>
  );
}
