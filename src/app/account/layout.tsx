import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const tabs = [['/account', 'Dashboard'], ['/account/profile', 'Profile'], ['/account/preregistrations', 'Pre-registrations'], ['/account/downloads', 'Downloads'], ['/account/settings', 'Settings']];
  return (
    <div className="container-x pt-10">
      <nav className="mb-8 flex gap-1 overflow-x-auto border-b border-line">{tabs.map(([h, l]) => <Link key={h} href={h} className="whitespace-nowrap px-4 py-3 text-sm text-bone/80 hover:text-bone">{l}</Link>)}</nav>
      {children}
    </div>
  );
}
