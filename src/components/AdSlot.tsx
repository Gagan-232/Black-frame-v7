import { q } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { getSetting } from '@/lib/settings';

/** Renders admin-managed ad units in isolated, sandboxed frames. Hidden for ad-free accounts or when ads are switched off. */
export default async function AdSlot({ placement }: { placement: 'content' | 'banner' }) {
  const [on, user] = await Promise.all([getSetting('ads_enabled', true), getSessionUser()]);
  if (!on || user?.ad_free) return null;
  const ads = await q(`SELECT id, width, height FROM advertisements WHERE is_active AND placement = $1 ORDER BY id`, [placement]);
  if (!ads.length) return null;
  return (
    <div className="container-x my-10 flex flex-col items-center gap-6">
      {ads.map((a) => (
        <div key={a.id} className="flex max-w-full flex-col items-center">
          <span className="mb-1 text-[10px] uppercase tracking-[0.3em] text-mute">Advertisement</span>
          <iframe src={`/ad-frame/${a.id}`} width={a.width} height={a.height} title="Advertisement" loading="lazy"
            sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" referrerPolicy="no-referrer" style={{ border: 0, maxWidth: '100%' }} />
        </div>
      ))}
    </div>
  );
}
