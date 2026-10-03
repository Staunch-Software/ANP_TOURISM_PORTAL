import React from 'react';

/* Decorative tourism slogan for the right edge of a hero. Purely visual, so it
   is hidden from assistive tech and from small screens where it would crowd the heading. */
export function HeroSlogan() {
  return (
    <div
      aria-hidden="true"
      className="hidden md:block absolute right-8 lg:right-14 top-1/2 -translate-y-[72%] z-10 text-right select-none pointer-events-none"
      style={{ fontFamily: "'Caveat', cursive", textShadow: '0 2px 8px rgba(3,35,65,0.45)' }}
    >
      <p className="text-white/90 text-[26px] lg:text-[32px] leading-[1.05] font-bold -rotate-3">
        Explore<br />Experience<br />Andaman
      </p>
      <svg viewBox="0 0 160 14" className="ml-auto mt-0.5 w-28 lg:w-36 h-3 text-white/80" fill="none">
        <path d="M3 9 C 30 2, 55 13, 85 7 S 135 3, 157 8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </div>
  );
}
