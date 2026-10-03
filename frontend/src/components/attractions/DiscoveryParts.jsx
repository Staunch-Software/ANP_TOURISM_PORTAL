import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, Ticket, Compass, Sun } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Decorative layers for the hero. All are aria-hidden, and the motion
   is switched off for people who prefer reduced motion (see index.css). */

export function PalmFrond({ className = '', flip = false }) {
  const leaves = [-70, -48, -26, -4, 18, 40, 62];
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 200"
      className={`pointer-events-none absolute ${className}`}
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
      fill="currentColor"
    >
      {leaves.map((angle) => (
        <path
          key={angle}
          d="M100 190 C 92 140, 96 90, 100 20 C 104 90, 108 140, 100 190 Z"
          transform={`rotate(${angle} 100 190)`}
          opacity="0.9"
        />
      ))}
    </svg>
  );
}

const PARTICLES = [
  { left: '8%', size: 4, delay: 0, dur: 9 },
  { left: '19%', size: 3, delay: 2.5, dur: 11 },
  { left: '31%', size: 5, delay: 5, dur: 10 },
  { left: '47%', size: 3, delay: 1, dur: 12 },
  { left: '58%', size: 4, delay: 6.5, dur: 9 },
  { left: '71%', size: 3, delay: 3, dur: 11 },
  { left: '83%', size: 5, delay: 7.5, dur: 10 },
  { left: '93%', size: 3, delay: 4, dur: 12 },
];

export function AttractionsHero({ slides, activeSlide, onSelectSlide }) {
  return (
    <section className="relative min-h-[300px] sm:min-h-[340px] flex items-center overflow-hidden bg-navy-900">
      {slides.map((slide, idx) => (
        <div
          key={slide.img}
          className={`absolute inset-0 bg-cover bg-center ease-in-out ${idx === activeSlide ? 'opacity-100' : 'opacity-0'}`}
          style={{
            backgroundImage: `url('${slide.img}')`,
            transform: idx === activeSlide ? 'scale(1.06)' : 'scale(1)',
            transitionProperty: 'opacity, transform',
            transitionDuration: '1500ms, 6500ms',
          }}
        />
      ))}
      {/* navy → teal readability gradient, lighter on the right so the scenery stays visible */}
      <div className="absolute inset-0 bg-gradient-to-r from-navy-950/85 via-navy-900/55 to-cyan-900/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-navy-950/60 via-transparent to-transparent" />

      <PalmFrond className="left-[-30px] bottom-[-40px] w-52 h-52 text-navy-950/45 -rotate-12 hidden sm:block" />
      <PalmFrond className="right-[-30px] bottom-[-40px] w-56 h-56 text-navy-950/40 rotate-12 hidden sm:block" flip />

      {PARTICLES.map((p, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="hero-particle absolute bottom-6 rounded-full bg-white/60"
          style={{ left: p.left, width: p.size, height: p.size, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s` }}
        />
      ))}

      <div className="relative z-10 max-w-7xl w-full mx-auto px-4 pt-10 pb-24">
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/30 text-cyan-100 text-[11px] font-bold tracking-[0.18em] uppercase backdrop-blur-sm">
          <Sparkles className="w-3.5 h-3.5" /> Explore • Experience • Discover
        </span>
        <h1 className="mt-3 font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight max-w-3xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
          Discover the Andaman &amp; Nicobar Islands
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-100 max-w-2xl leading-relaxed">
          Explore pristine beaches, historic landmarks, marine adventures and unforgettable island experiences.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {slides.map((slide, idx) => (
              <button
                key={slide.img}
                type="button"
                onClick={() => onSelectSlide(idx)}
                aria-label={`Show slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all ${idx === activeSlide ? 'w-6 bg-cyan-300' : 'w-1.5 bg-white/45 hover:bg-white/70'}`}
              />
            ))}
          </div>
          <span className="text-[11px] text-cyan-100/90 font-semibold tracking-wide">{slides[activeSlide]?.caption}</span>
        </div>
      </div>

      {/* slow drifting ocean ripple along the bottom edge */}
      <svg aria-hidden="true" viewBox="0 0 2880 60" preserveAspectRatio="none" className="hero-ripple absolute left-0 bottom-0 h-10 w-[200%] pointer-events-none" fill="#bfeaf5" fillOpacity="0.22">
        <path d="M0,30 C180,6 360,54 540,30 S900,6 1080,30 S1440,54 1440,30 C1620,6 1800,54 1980,30 S2340,6 2520,30 S2880,54 2880,30 L2880,60 L0,60 Z" />
      </svg>
    </section>
  );
}

/* ------------------------------------------------------------------ */
export function IslandCarousel({ cards, onSelect }) {
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);

  const step = useCallback(() => {
    const track = trackRef.current;
    const first = track?.firstElementChild;
    if (!track || !first) return 1;
    const gap = parseFloat(getComputedStyle(track).columnGap || '0') || 0;
    return first.getBoundingClientRect().width + gap;
  }, []);

  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    setActive(Math.min(cards.length - 1, Math.round(track.scrollLeft / step())));
  };

  const go = (dir) => {
    const track = trackRef.current;
    if (!track) return;
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    if (dir > 0 && atEnd) track.scrollTo({ left: 0, behavior: 'smooth' });
    else track.scrollBy({ left: dir * step(), behavior: 'smooth' });
  };

  useEffect(() => {
    const track = trackRef.current;
    if (track) track.scrollLeft = 0;
  }, [cards.length]);

  return (
    <div>
      <div className="flex items-end justify-between gap-3 mb-4">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-cyan-700">Explore</span>
          <h2 className="font-serif text-2xl md:text-3xl font-black text-navy-800 leading-tight">Discover the Islands</h2>
          <p className="text-sm text-slate-500 mt-0.5">{cards.length} places to start planning your visit.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:flex flex-col items-end leading-tight mr-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Explore Islands</span>
            <span className="text-sm font-bold text-navy-800 tabular-nums">{active + 1} <span className="text-slate-400">/ {cards.length}</span></span>
          </span>
          <button type="button" onClick={() => go(-1)} aria-label="Previous destination"
            className="w-10 h-10 rounded-full bg-white border border-slate-200 text-navy-800 shadow-sm hover:bg-cyan-700 hover:text-white hover:border-cyan-700 flex items-center justify-center transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Next destination"
            className="w-10 h-10 rounded-full bg-white border border-slate-200 text-navy-800 shadow-sm hover:bg-cyan-700 hover:text-white hover:border-cyan-700 flex items-center justify-center transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 -mx-1 px-1 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {cards.map((card) => (
          <button
            key={card.title}
            type="button"
            onClick={() => onSelect(card)}
            className="group relative shrink-0 snap-start w-[82%] sm:w-[46%] lg:w-[31.5%] xl:w-[24%] h-[236px] rounded-3xl overflow-hidden text-left shadow-md hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 ring-0 hover:ring-2 hover:ring-cyan-400/70"
          >
            <img src={card.img} alt={card.title} loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-900/70 via-35% to-transparent group-hover:from-navy-950 group-hover:via-navy-900/80 transition-colors duration-300" />
            <div className="absolute inset-x-0 bottom-0 p-4 pr-16 min-w-0">
              <span className="block truncate text-[10px] font-bold uppercase tracking-wider text-cyan-200">{card.subtitle}</span>
              <h3 className="font-serif text-2xl font-black text-white leading-tight drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">{card.title}</h3>
              <p className="text-xs text-slate-100 leading-snug truncate mt-0.5">{card.tags || card.blurb}</p>
            </div>
            <span className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white text-navy-800 flex items-center justify-center shadow-lg group-hover:bg-cyan-500 group-hover:text-white transition-colors">
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-center gap-1.5 mt-1" aria-hidden="true">
        {cards.map((card, i) => (
          <span key={card.title} className={`h-1.5 rounded-full transition-all ${i === active ? 'w-6 bg-cyan-600' : 'w-1.5 bg-cyan-600/30'}`} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Layered organic wave between the discovery band and the booking area.
   `fill` is the booking area's background colour. */
export function WaveTransition({ fill = '#f4fbfd' }) {
  return (
    <div className="relative h-16 sm:h-24 -mb-px overflow-hidden" aria-hidden="true">
      <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        <path d="M0,40 C180,100 340,0 560,36 S960,110 1180,50 S1380,20 1440,44 L1440,120 L0,120 Z" fill="#a5e3ee" fillOpacity="0.45" />
        <path d="M0,62 C220,20 420,110 680,64 S1100,14 1300,70 S1410,86 1440,66 L1440,120 L0,120 Z" fill="#d4f3f8" fillOpacity="0.85" />
        <path d="M0,84 C240,60 460,118 720,88 S1140,56 1440,92 L1440,120 L0,120 Z" fill={fill} />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Inspirational transition between the island carousel and the booking
   area: waves, palms, a script tagline and a short "how it works" row. */
function useRevealOnce() {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (!('IntersectionObserver' in window)) { setShown(true); return undefined; }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setShown(true); io.disconnect(); }
    }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, shown];
}

function IslandIllustration() {
  return (
    <svg aria-hidden="true" viewBox="0 0 140 70" className="island-float w-24 sm:w-28 h-auto" fill="none">
      <path d="M4 52 C 20 46, 36 58, 54 52 S 90 46, 108 52 S 128 56, 136 50" stroke="#18c6d9" strokeWidth="3" strokeLinecap="round" />
      <path d="M14 62 C 30 56, 46 66, 64 60 S 100 56, 124 62" stroke="#0089a8" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
      <path d="M36 52 C 46 40, 90 40, 104 52 Z" fill="#0089a8" />
      <g stroke="#082b49" strokeWidth="2.4" strokeLinecap="round">
        <path d="M62 46 C 60 34, 63 24, 68 16" />
        <path d="M84 46 C 85 36, 82 28, 78 22" />
      </g>
      <g fill="#082b49">
        <path d="M68 16 C 58 10, 50 14, 46 20 C 54 16, 60 16, 68 16 Z" />
        <path d="M68 16 C 70 6, 78 4, 86 8 C 78 8, 74 11, 68 16 Z" />
        <path d="M68 16 C 76 18, 82 24, 82 30 C 78 24, 74 20, 68 16 Z" />
        <path d="M78 22 C 72 16, 66 18, 64 24 C 69 21, 73 21, 78 22 Z" />
        <path d="M78 22 C 80 14, 88 14, 92 18 C 86 18, 82 19, 78 22 Z" />
      </g>
    </svg>
  );
}

const JOURNEY = [
  { n: '01', icon: Ticket, title: 'Book', sub: 'Choose your attraction' },
  { n: '02', icon: Compass, title: 'Explore', sub: 'Discover the island' },
  { n: '03', icon: Sun, title: 'Experience', sub: 'Enjoy your visit' },
];

export function TransitionBanner({ bandColor = '#dcf3f8', bottomColor = '#f4fbfd' }) {
  const [ref, shown] = useRevealOnce();
  return (
    <section ref={ref} className="relative overflow-hidden bg-gradient-to-b from-white to-[#eaf9fc]" aria-label="Book your experience">
      {/* waves: the top blends from the carousel band, the bottom into the booking area */}
      <svg aria-hidden="true" viewBox="0 0 1440 90" preserveAspectRatio="none" className="absolute top-0 left-0 w-full h-9 sm:h-12 z-[1]">
        <path d="M0,0 L1440,0 L1440,38 C1200,86 980,6 720,44 S260,92 0,34 Z" fill={bandColor} />
        <path d="M0,0 L1440,0 L1440,22 C1180,64 940,0 700,28 S240,70 0,20 Z" fill="#a5e3ee" fillOpacity="0.35" />
      </svg>
      <svg aria-hidden="true" viewBox="0 0 2880 90" preserveAspectRatio="none" className="wave-slow absolute bottom-0 left-0 h-9 sm:h-12 w-[200%] z-[1]" fill="#bfeaf5" fillOpacity="0.45">
        <path d="M0,50 C240,10 480,90 720,50 S1200,10 1440,50 C1680,10 1920,90 2160,50 S2640,10 2880,50 L2880,90 L0,90 Z" />
      </svg>
      <svg aria-hidden="true" viewBox="0 0 1440 90" preserveAspectRatio="none" className="absolute bottom-0 left-0 w-full h-8 sm:h-10 z-[1]">
        <path d="M0,60 C220,24 460,92 720,58 S1180,26 1440,62 L1440,90 L0,90 Z" fill={bottomColor} />
      </svg>

      <PalmFrond className="palm-sway left-[-26px] top-8 w-36 h-36 sm:w-44 sm:h-44 text-cyan-700/15" />
      <PalmFrond className="palm-sway right-[-26px] top-8 w-36 h-36 sm:w-44 sm:h-44 text-cyan-700/15" flip />
      <PalmFrond className="palm-sway hidden md:block left-24 bottom-6 w-20 h-20 text-cyan-600/10 rotate-12" />
      <PalmFrond className="palm-sway hidden md:block right-24 bottom-6 w-20 h-20 text-cyan-600/10 -rotate-12" flip />

      <div className={`relative z-[2] max-w-6xl mx-auto px-4 pt-10 sm:pt-12 pb-11 sm:pb-14 transition-all duration-1000 ease-out ${shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="text-center" style={{ fontFamily: "'Caveat', cursive" }}>
          <div className="flex flex-col md:flex-row items-center justify-center gap-x-6 gap-y-1 text-cyan-800 text-[26px] sm:text-[32px] leading-tight font-semibold">
            <span>From Islands of History</span>
            <IslandIllustration />
            <span>to Experiences for a Lifetime</span>
          </div>
        </div>

        <div className="mt-7 flex flex-col md:flex-row md:items-end md:justify-between gap-5">
          <div className="text-center md:text-left">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-cyan-700">Book your experience</span>
            <h2 className="font-serif text-2xl md:text-3xl font-black text-navy-800 leading-tight">Choose an Attraction</h2>
            <p className="text-sm text-slate-500 mt-0.5">Select a destination and book your preferred date and time.</p>
          </div>
          <ol className="grid grid-cols-3 gap-2 sm:flex sm:items-start sm:justify-center md:justify-end sm:gap-8">
            {JOURNEY.map(({ n, icon: Icon, title, sub }) => (
              <li key={n} className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left gap-1.5 sm:gap-2.5 sm:max-w-[150px]">
                <span className="w-10 h-10 rounded-full bg-white border border-cyan-200 text-cyan-700 flex items-center justify-center shadow-sm shrink-0">
                  <Icon className="w-5 h-5" />
                </span>
                <span className="leading-tight">
                  <span className="block text-[10px] font-bold text-cyan-600">{n}</span>
                  <span className="block text-sm font-bold text-navy-800">{title}</span>
                  <span className="block text-[11px] text-slate-500">{sub}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
