'use client';
import { useCallback, useEffect, useState } from 'react';

export default function Intro() {
  const [gone, setGone] = useState(false);
  const finish = useCallback(() => {
    try { localStorage.setItem('bf_intro_seen', String(Date.now())); } catch {}
    document.getElementById('bf-intro')?.classList.add('intro-out');
    setTimeout(() => { document.documentElement.removeAttribute('data-intro'); setGone(true); }, 700);
  }, []);
  useEffect(() => {
    if (document.documentElement.dataset.intro !== '1') return;
    const t = setTimeout(finish, 4600);
    return () => clearTimeout(t);
  }, [finish]);
  if (gone) return null;
  return (
    <div id="bf-intro" role="presentation" aria-label="Black Frame Studio intro">
      <button onClick={finish} className="absolute right-4 top-4 border border-bone/40 px-4 py-2 text-xs uppercase tracking-widest text-bone/80 hover:bg-bone hover:text-ink">Skip</button>
      <div className="intro-stage">
        <svg viewBox="0 0 840 460" className="intro-build absolute inset-0 h-full w-full" aria-hidden>
          <defs>
            <filter id="rough" x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="4" result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale="7" />
            </filter>
          </defs>
          <g filter="url(#rough)" fill="none" stroke="#f2f2f2">
            <rect className="intro-draw" x="30" y="30" width="780" height="400" strokeWidth="6" />
            <rect className="intro-draw d2" x="44" y="44" width="752" height="372" strokeWidth="2" />
          </g>
        </svg>
        <div className="intro-build absolute inset-0 flex flex-col items-center justify-center">
          <div className="intro-word font-serif text-[clamp(2rem,9vw,5rem)] font-semibold tracking-[0.04em]">BLACK FRAME</div>
          <div className="intro-sub mt-2 flex items-center gap-4 text-[clamp(0.6rem,2.4vw,1.1rem)] tracking-[0.5em]"><span className="h-px w-12 bg-bone sm:w-24" />STUDIO<span className="h-px w-12 bg-bone sm:w-24" /></div>
        </div>
        <img src="/logo.png" alt="Black Frame Studio" className="intro-final absolute inset-0 h-full w-full object-contain" />
      </div>
    </div>
  );
}
