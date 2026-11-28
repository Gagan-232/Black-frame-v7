import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import './globals.css';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import Intro from '@/components/Intro';
import { getSessionUser, isAdmin } from '@/lib/auth';
import { getSetting } from '@/lib/settings';

export const dynamic = 'force-dynamic';
const serif = Cormorant_Garamond({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-serif' });
const sans = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: { default: 'Black Frame Studio — Independent Horror Games', template: '%s · Black Frame Studio' },
  description: 'Black Frame Studio is an independent horror game studio. Home of NIGHT SHIFT.',
  icons: { icon: '/icon.png', apple: '/icon.png' },
};
export const viewport: Viewport = { themeColor: '#000000', width: 'device-width', initialScale: 1 };

const introScript = `try{var s=localStorage.getItem('bf_intro_seen');var seen=s&&Date.now()-Number(s)<2592000000;var rm=matchMedia('(prefers-reduced-motion: reduce)').matches;if(!seen&&!rm)document.documentElement.dataset.intro='1'}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  const instagram = await getSetting<string>('instagram_url', '');
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: introScript }} /></head>
      <body className="flex min-h-screen flex-col">
        <Intro />
        <Nav user={user ? { username: user.username, admin: isAdmin(user) } : null} />
        <main className="flex-1">{children}</main>
        <Footer instagram={instagram} />
      </body>
    </html>
  );
}
