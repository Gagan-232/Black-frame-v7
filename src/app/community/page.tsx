import { getSetting } from '@/lib/settings';
export const metadata = { title: 'Community' };
export default async function Community() {
  const [ig, dc] = await Promise.all([getSetting<string>('instagram_url', ''), getSetting<string>('discord_url', '')]);
  return (
    <div className="container-x max-w-3xl pt-12">
      <h1 className="h1 mb-8">Community</h1>
      <p className="mb-8 text-bone/80">Follow Black Frame Studio for development updates, behind-the-scenes material and announcements.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {ig && <a href={ig} target="_blank" rel="noopener noreferrer" className="card block hover:border-bone/50"><h2 className="h2">Instagram</h2><p className="mt-1 text-sm text-mute">@black_frame_frame_studio</p></a>}
        {dc && <a href={dc} target="_blank" rel="noopener noreferrer" className="card block hover:border-bone/50"><h2 className="h2">Discord</h2><p className="mt-1 text-sm text-mute">Join the server</p></a>}
      </div>
    </div>
  );
}
