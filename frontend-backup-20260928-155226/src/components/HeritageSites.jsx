import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Landmark, Palmtree, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const HERITAGE_SITES = [
  { name: 'Cellular Jail National Memorial', description: 'The former colonial prison in Port Blair, now a national memorial to India\'s freedom fighters.', image: '/images/cellular-jail.jpg' },
  { name: 'Cellular Jail Light & Sound Show', description: 'An evening interpretation of the Cellular Jail\'s history in its preserved brick corridors.', image: '/images/cellular-jail-corridor.jpg' },
  { name: 'Ross Island Church Ruins', description: 'Historic church ruins on Netaji Subhash Chandra Bose Dweep, framed by coastal forest.', image: '/images/ross-island-church-ruins.jpg' },
  { name: 'Ross Island Heritage Ruins', description: 'Remains of the former British administrative settlement reclaimed by banyan roots.', image: '/images/ross-island-ruins.jpg' },
  { name: 'Ross Island Deer Reserve', description: 'A quiet island landscape where spotted deer move through the restored heritage grounds.', image: '/images/ross-island-deer.jpg' },
  { name: 'North Bay Coral Safari', description: 'A glass-bottom coastal experience revealing North Bay\'s coral-rich marine environment.', image: '/images/north-bay-glassboat.jpg' },
  { name: 'Elephant Beach Coral Waters', description: 'Clear coastal waters and coral scenery at Elephant Beach on Swaraj Dweep.', image: '/images/elephant-beach-coral.jpg' },
  { name: 'Neil Island Natural Bridge', description: 'A natural limestone sea arch at Shaheed Dweep, best viewed during low tide.', image: '/images/neil-island-natural-bridge.jpg' },
  { name: 'Andaman Lagoon', description: 'A protected island lagoon that reflects the Andaman\'s coastal ecology and island character.', image: '/images/hero-lagoon.jpg' },
];

export const CONNECTED_ISLANDS = [
  { name: 'Havelock Island (Swaraj Dweep)', description: 'Famous for Radhanagar Beach and scuba diving.', image: '/images/elephant-beach-coral.jpg' },
  { name: 'Shaheed Dweep (Neil Island)', description: 'Known for quiet beaches and a relaxed atmosphere.', image: '/images/neil-island-natural-bridge.jpg' },
  { name: 'Netaji Subhas Chandra Bose Dweep (Ross Island)', description: 'Known for British-era colonial ruins.', image: '/images/ross-island-church-ruins.jpg' },
];

export function InfoPopoverCarousel({ title, eyebrow, items, to, triggerIcon: TriggerIcon = Landmark }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const closeTimer = useRef(null);
  const previewRef = useRef(null);

  const openPreview = () => {
    window.clearTimeout(closeTimer.current);
    setIsOpen(true);
  };

  const scheduleClose = () => {
    closeTimer.current = window.setTimeout(() => setIsOpen(false), 180);
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    const interval = window.setInterval(() => setActiveIndex((index) => (index + 1) % items.length), 3200);
    const closeOnEscape = (event) => event.key === 'Escape' && setIsOpen(false);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen, items.length]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  const item = items[activeIndex];
  const titleMatch = title.match(/^(\d+)\s+(.+)$/);

  return (
    <div ref={previewRef} className="portal-heritage-trigger" onPointerEnter={openPreview} onPointerLeave={scheduleClose}>
      <button type="button" className="portal-heritage-trigger-button" aria-expanded={isOpen} aria-haspopup="dialog" onFocus={openPreview}>
        <span className="portal-heritage-trigger-icon"><TriggerIcon className="w-6 h-6" /></span>
        <span className="portal-trust-copy">
          {titleMatch ? <><strong>{titleMatch[1]}</strong><span>{titleMatch[2]}</span></> : <span>{title}</span>}
        </span>
      </button>
      {isOpen && (
        <div className="portal-heritage-preview" role="dialog" aria-label={title}>
          <button type="button" className="portal-heritage-close" aria-label={`Close ${title} preview`} onClick={() => setIsOpen(false)}><X className="w-4 h-4" /></button>
          <p className="portal-heritage-eyebrow">{eyebrow}</p>
          <h3>{title}</h3>
          <div className="portal-heritage-image-wrap"><img src={item.image} alt={item.name} className="portal-heritage-image" /></div>
          <div className="portal-heritage-copy"><h4>{item.name}</h4><p>{item.description}</p></div>
          <div className="portal-heritage-preview-footer">
            <div className="portal-heritage-dots" aria-label={`${activeIndex + 1} of ${items.length} items`}>
              {items.map((carouselItem, index) => <span key={carouselItem.name} className={index === activeIndex ? 'is-active' : ''} />)}
            </div>
            <Link to={to} className="portal-heritage-view-all" onClick={() => setIsOpen(false)}>View All <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
        </div>
      )}
    </div>
  );
}

export function HeritageSitesPreview() {
  return <InfoPopoverCarousel title="9 Heritage & Nature Sites" eyebrow="Explore the islands" items={HERITAGE_SITES} to="/heritage-sites" />;
}

export function ConnectedIslandsPreview() {
  return <InfoPopoverCarousel title="3 Islands Connected" eyebrow="Island connections" items={CONNECTED_ISLANDS} to="/connected-islands" triggerIcon={Palmtree} />;
}

export function InformationSitesPage({ title, introduction, items, category }) {
  const navigate = useNavigate();
  return (
    <main className="portal-heritage-page max-w-6xl w-full mx-auto px-4 py-10">
      <button type="button" className="portal-heritage-back" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4" /> Back</button>
      <header className="portal-heritage-page-header"><span>Andaman & Nicobar Islands</span><h1>{title}</h1><p>{introduction}</p></header>
      <section className="portal-heritage-site-list" aria-label={title}>
        {items.map((site) => (
          <article key={site.name} className="portal-heritage-site-card"><img src={site.image} alt={site.name} /><div><span>{category}</span><h2>{site.name}</h2><p>{site.description}</p></div></article>
        ))}
      </section>
    </main>
  );
}

export function HeritageSitesPage() {
  return <InformationSitesPage title="9 Heritage & Nature Sites" introduction="Discover the islands' national memorials, historic settlements, coastal landscapes, and coral-rich waters." items={HERITAGE_SITES} category="Heritage & Nature" />;
}

export function ConnectedIslandsPage() {
  return <InformationSitesPage title="3 Islands Connected" introduction="Explore three iconic islands of the Andaman region." items={CONNECTED_ISLANDS} category="Island Connection" />;
}
