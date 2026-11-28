import Link from 'next/link';
export default function Footer({ instagram }: { instagram: string }) {
  return (
    <footer className="mt-24 border-t border-line bg-charcoal">
      <div className="container-x flex flex-col items-center gap-6 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
        <img src="/logo.png" alt="Black Frame Studio" className="h-14 w-auto" />
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-mute">
          <Link href="/games" className="hover:text-bone">Games</Link><Link href="/news" className="hover:text-bone">News</Link>
          <Link href="/about" className="hover:text-bone">About</Link><Link href="/community" className="hover:text-bone">Community</Link>
          {instagram && <a href={instagram} target="_blank" rel="noopener noreferrer" className="hover:text-bone">Instagram</a>}
        </nav>
        <p className="text-xs text-mute">© {new Date().getFullYear()} Black Frame Studio</p>
      </div>
    </footer>
  );
}
