import React, { useState, useEffect } from 'react';
import { I, Ic } from '../common/Icons';
import { useApp } from '../../context/AppContext';
import { IMG } from '../../services/images';

export const SLIDES = [
{ i: IMG.radha, p: 'Welcome to the Islands', h: 'Discover the Islands. Create Unforgettable Memories.', s: 'Explore breathtaking destinations, experiences and attractions across Andaman & Nicobar.', c: 'Explore Attractions', r: 'explore', c2: 'Plan Your Visit', r2: 'plan' },
{ i: IMG.jail, p: 'Heritage & History', h: 'Discover History & Heritage', s: 'Experience the stories, culture and landmarks of the islands.', c: 'Explore Heritage', r: 'explore', c2: 'View Light & Sound Show', r2: 'explore' },
{ i: IMG.water, p: 'Marine Adventure', h: 'Adventure Begins Here', s: 'Experience unforgettable island adventures and water activities.', c: 'Explore Experiences', r: 'experiences', c2: 'Check Availability', r2: 'explore' },
{ i: IMG.sunset, p: 'Island Escape', h: 'Your Perfect Island Escape', s: 'Plan, book and experience Andaman with ease.', c: 'Start Planning', r: 'plan', c2: 'View Ferry Schedule', r2: 'ferry' }];

export function Hero() {
  const { go } = useApp();const [n, setN] = useState(0),[pause, setPause] = useState(false);
  useEffect(() => {if (pause) return;const t = setInterval(() => setN((v) => (v + 1) % SLIDES.length), 6200);return () => clearInterval(t);}, [pause]);
  return <div className="hero" onMouseEnter={() => setPause(true)} onMouseLeave={() => setPause(false)}>
    {SLIDES.map((s, i) => <div key={i} className={'slide ' + (i === n ? 'on' : '')} aria-hidden={i !== n}>
      <div className="bg" style={{ backgroundImage: `url(${s.i})` }} /><div className="hov" />
      <div className="hc"><div className="wrap" style={{ width: '100%' }}><div className="hbox">
        <div className="hpill"><I d={Ic.pin} s={14} /> {s.p}</div>
        <h1 className="htitle">{s.h}</h1><p className="hsub">{s.s}</p>
        <div className="row gap12 wrapf mt32">
          <button className="btn btn-coral btn-lg" onClick={() => go(s.r)}>{s.c} <I d={Ic.arr} s={17} /></button>
          <button className="btn btn-ghost btn-lg" onClick={() => go(s.r2)}>{s.c2}</button></div>
        <div className="row gap24 wrapf mt40" style={{ color: 'rgba(255,255,255,.88)', fontSize: 13, fontWeight: 600 }}>
          <span className="row gap8"><I d={Ic.check2} s={16} /> 120+ Verified Attractions</span>
          <span className="row gap8"><I d={Ic.qr} s={16} /> Instant Digital QR Tickets</span>
          <span className="row gap8"><I d={Ic.lock} s={16} /> Secure Government Payments</span></div>
      </div></div></div></div>)}
    <button className="harr l" aria-label="Previous slide" onClick={() => setN((n - 1 + SLIDES.length) % SLIDES.length)}><I d={Ic.chevl} s={20} /></button>
    <button className="harr r" aria-label="Next slide" onClick={() => setN((n + 1) % SLIDES.length)}><I d={Ic.chev} s={20} /></button>
    <div className="hdots">{SLIDES.map((_, i) => <button key={i} className={'hdot ' + (i === n ? 'on' : '')} aria-label={'Slide ' + (i + 1)} onClick={() => setN(i)} />)}</div>
  </div>;
}