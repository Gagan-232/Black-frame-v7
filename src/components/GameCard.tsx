import Link from 'next/link';
import { media, STATUS_LABEL } from '@/lib/format';
export default function GameCard({ g }: { g: any }) {
  const cover = media(g.cover_key);
  return (
    <Link href={`/games/${g.slug}`} className="frame group block bg-charcoal">
      <div className="aspect-[16/10] overflow-hidden bg-panel">
        {cover ? <img src={cover} alt={`${g.title} cover`} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          : <div className="flex h-full items-center justify-center font-serif text-3xl tracking-widest text-bone/30">{g.title}</div>}
      </div>
      <div className="p-5"><p className="text-[11px] uppercase tracking-[0.25em] text-mute">{STATUS_LABEL[g.status]}</p>
        <h3 className="h2 mt-1">{g.title}</h3>{g.tagline && <p className="mt-2 text-sm text-bone/70">{g.tagline}</p>}</div>
    </Link>
  );
}
