import { q } from '@/lib/db';
import GameCard from '@/components/GameCard';
import AdSlot from '@/components/AdSlot';
export const metadata = { title: 'Games' };
export default async function Games() {
  const games = await q(`SELECT * FROM games WHERE is_published ORDER BY created_at`);
  return (
    <div className="container-x pt-12">
      <h1 className="h1 mb-10">Games</h1>
      {games.length ? <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">{games.map((g) => <GameCard key={g.id} g={g} />)}</div> : <p className="text-mute">No games published yet.</p>}
      <AdSlot placement="banner" />
    </div>
  );
}
