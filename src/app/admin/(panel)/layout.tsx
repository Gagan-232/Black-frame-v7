import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser, isAdmin } from '@/lib/auth';
const items = [['/admin', 'Dashboard'], ['/admin/games', 'Games'], ['/admin/users', 'Users'], ['/admin/downloads', 'Downloads'], ['/admin/preregistrations', 'Pre-registration'], ['/admin/news', 'News'], ['/admin/ads', 'Advertisements'], ['/admin/purchases', 'Purchases'], ['/admin/analytics', 'Analytics'], ['/admin/settings', 'Settings']];
export const metadata = { robots: { index: false } };
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const u = await getSessionUser();
  if (!u || !isAdmin(u)) redirect('/admin/login');           // server-side gate; every /api/admin call is re-checked too
  if (u.must_change_password) redirect('/account/settings?force=1');
  return (
    <div className="container-x pt-8">
      <nav className="mb-8 flex gap-1 overflow-x-auto border-b border-line">{items.map(([h, l]) => <Link key={h} href={h} className="whitespace-nowrap px-3 py-3 text-sm text-bone/80 hover:text-bone">{l}</Link>)}</nav>
      {children}
    </div>
  );
}
