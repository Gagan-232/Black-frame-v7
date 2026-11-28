'use client';
import Link from 'next/link';
import { useState } from 'react';
import { api } from '@/lib/client';

const links = [['/', 'Home'], ['/games', 'Games'], ['/news', 'News'], ['/about', 'About'], ['/community', 'Community'], ['/downloads', 'Downloads']];

export default function Nav({ user }: { user: { username: string; admin: boolean } | null }) {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  async function logout() { try { await api('/api/auth/logout', { method: 'POST', body: {} }); } finally { window.location.href = '/'; } }
  const close = () => { setOpen(false); setMenu(false); };
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between">
        <Link href="/" onClick={close} aria-label="Black Frame Studio home"><img src="/logo.png" alt="Black Frame Studio" className="h-10 w-auto" /></Link>
        <nav className="hidden items-center gap-7 text-sm md:flex">
          {links.map(([h, l]) => (<Link key={h} href={h} className="text-bone/80 transition hover:text-bone">{l}</Link>))}
          {user ? (
            <div className="relative">
              <button onClick={() => setMenu(!menu)} className="btn-ghost btn-sm" aria-expanded={menu}>{user.username} ▾</button>
              {menu && (
                <div className="absolute right-0 mt-2 w-52 border border-line bg-charcoal py-2 text-sm" onClick={close}>
                  <Link className="block px-4 py-2 hover:bg-panel" href="/account">Dashboard</Link>
                  <Link className="block px-4 py-2 hover:bg-panel" href="/account/preregistrations">Pre-registrations</Link>
                  <Link className="block px-4 py-2 hover:bg-panel" href="/account/downloads">Download history</Link>
                  <Link className="block px-4 py-2 hover:bg-panel" href="/account/settings">Settings</Link>
                  {user.admin && <Link className="block px-4 py-2 text-bone hover:bg-panel" href="/admin">Admin panel</Link>}
                  <button className="block w-full px-4 py-2 text-left text-mute hover:bg-panel" onClick={logout}>Log out</button>
                </div>
              )}
            </div>
          ) : (<Link href="/login" className="btn-ghost btn-sm">Login</Link>)}
        </nav>
        <button className="flex h-11 w-11 flex-col items-center justify-center gap-1.5 md:hidden" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>
          <span className={`h-0.5 w-6 bg-bone transition ${open ? 'translate-y-2 rotate-45' : ''}`} /><span className={`h-0.5 w-6 bg-bone transition ${open ? 'opacity-0' : ''}`} /><span className={`h-0.5 w-6 bg-bone transition ${open ? '-translate-y-2 -rotate-45' : ''}`} />
        </button>
      </div>
      {open && (
        <nav className="border-t border-line bg-ink md:hidden" onClick={close}>
          <div className="container-x flex flex-col py-2">
            {links.map(([h, l]) => (<Link key={h} href={h} className="border-b border-line/60 py-4 text-lg">{l}</Link>))}
            {user ? (<>
              <Link href="/account" className="border-b border-line/60 py-4 text-lg">Account ({user.username})</Link>
              {user.admin && <Link href="/admin" className="border-b border-line/60 py-4 text-lg">Admin panel</Link>}
              <button className="py-4 text-left text-lg text-mute" onClick={logout}>Log out</button>
            </>) : (<Link href="/login" className="py-4 text-lg">Login / Register</Link>)}
          </div>
        </nav>
      )}
    </header>
  );
}
