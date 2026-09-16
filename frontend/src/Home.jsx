import React, { useState, useEffect } from 'react';
import { ACard } from '../components/attractions/AttractionCard';
import { Empty } from '../components/common/EmptyState';
import { I, Ic } from '../components/common/Icons';
import { Sec } from '../components/common/Section';
import { Hero } from '../components/home/Hero';
import { SearchPanel } from '../components/home/SearchPanel';
import { TicketCard } from '../components/tickets/TicketCard';
import { useApp } from '../context/AppContext';
import { ATTR, CATS, EXPS, SLOTS } from '../services/data';
import { IMG } from '../services/images';
import { stCl } from '../utils/format';

export function Home() {
  const { go, toast } = useApp();const [cat, setCat] = useState('All'),[load, setLoad] = useState(true);
  useEffect(() => {setLoad(true);const t = setTimeout(() => setLoad(false), 380);return () => clearTimeout(t);}, [cat]);
  const list = cat === 'All' ? ATTR : ATTR.filter((a) => a.cat === cat);
  return <>
    <Hero /><SearchPanel />
    <section className="sec" style={{ paddingBottom: 0 }}><div className="wrap">
      <div className="grid g4" style={{ gap: 20 }}>
        {[['120+', 'Verified Attractions', 'pin', 'var(--turq)'], ['4.8 / 5', 'Average Visitor Rating', 'star', 'var(--coral)'], ['1.2 M+', 'Tickets Issued Digitally', 'ticket', 'var(--sea)'], ['38', 'Registered Ferry Services', 'ship', 'var(--ocean-2)']].map((s, i) =>
          <div key={i} className="stat"><div className="sicn" style={{ background: s[3] + '1A', color: s[3] }}><I d={Ic[s[2]]} s={22} /></div>
            <div className="ff bold" style={{ fontSize: 28, letterSpacing: -1, color: 'var(--ocean)' }}>{s[0]}</div>
            <div className="sm mut mt8">{s[1]}</div></div>)}
      </div></div></section>

    <Sec e="Explore" t="Explore Andaman & Nicobar" s="Discover attractions, experiences and destinations for every kind of traveller.">
      <div className="row gap8 wrapf" style={{ marginTop: -24, marginBottom: 32 }}>
        {CATS.map((c) => <button key={c} className="chip" onClick={() => setCat(c)}
        style={{ background: cat === c ? 'var(--ocean)' : '#fff', color: cat === c ? '#fff' : 'var(--muted)', border: '1.5px solid ' + (cat === c ? 'var(--ocean)' : 'var(--line)'), padding: '9px 18px', fontSize: 13.5, transition: '.2s' }}>{c}</button>)}
        <button className="chip b-grey" style={{ marginLeft: 'auto' }} onClick={() => go('explore')}>View all {ATTR.length} <I d={Ic.arr} s={13} /></button>
      </div>
      {load ? <div className="grid g3">{[1, 2, 3].map((i) => <div key={i} className="card" style={{ overflow: 'hidden' }}><div className="skel" style={{ height: 198, borderRadius: 0 }} /><div style={{ padding: 20 }}><div className="skel" style={{ height: 18, width: '70%' }} /><div className="skel mt12" style={{ height: 12 }} /><div className="skel mt8" style={{ height: 12, width: '80%' }} /><div className="skel mt24" style={{ height: 36 }} /></div></div>)}</div> :
      list.length ? <div className="grid g3 fade">{list.slice(0, 6).map((a) => <ACard key={a.id} a={a} />)}</div> :
      <Empty icon="search" t="No attractions in this category" s="Try selecting a different category or browse the full catalogue." cta="View All Attractions" onCta={() => setCat('All')} />}
    </Sec>

    <section className="sec sec-sand"><div className="wrap">
      <div className="row between wrapf gap16" style={{ marginBottom: 40 }}>
        <div><div className="eyebrow">Most Booked</div><h2 className="h2">Popular Attractions</h2>
          <p className="sub">The island experiences travellers book most, with live slot availability.</p></div>
        <button className="btn btn-out" onClick={() => go('explore')}>View All <I d={Ic.arr} s={16} /></button></div>
      <div className="scroller">{ATTR.slice(0, 6).map((a) => <div key={a.id} style={{ minWidth: 340, maxWidth: 340 }}><ACard a={a} /></div>)}</div>
    </div></section>

    <Sec e="Real-Time Inventory" t="Book Your Perfect Time" s="Every attraction publishes live capacity. Reserve the exact slot that fits your day.">
      <div className="grid g3">
        {ATTR.slice(0, 3).map((a, ai) => {const sl = SLOTS(ai);return (
            <div key={a.id} className="card" style={{ padding: 22 }}>
            <div className="row between" style={{ marginBottom: 6 }}>
              <div><h3 className="ff bold" style={{ fontSize: 16.5 }}>{a.name}</h3><div className="xs mut mt8">18 September 2026 · Thursday</div></div>
              <span className="rate"><I d={Ic.star} s={12} f="currentColor" /> {a.rate}</span></div>
            <div className="sep" />
            {sl.slice(0, 5).map((s, i) => <div key={i} className="row between" style={{ padding: '10px 0', borderBottom: i < 4 ? '1px solid #F1F5F7' : 'none' }}>
              <span className="row gap8 semi sm"><I d={Ic.clock} s={14} style={{ color: 'var(--muted)' }} /> {s.time}</span>
              <span className="row gap12">{s.status !== 'Fully Booked' && <span className="xs mut">{s.left} left</span>}
                <span className={'badge ' + stCl(s.status)}><span className="dot" />{s.status}</span></span></div>)}
            <button className="btn btn-out btn-block mt16" onClick={() => go('detail', a)}>View All Slots</button>
          </div>);})}
      </div>
      <div className="row gap24 wrapf center mt40" style={{ justifyContent: 'center' }}>
        {[['Available', 'b-ok'], ['Limited', 'b-warn'], ['Fully Booked', 'b-bad']].map(([l, c], i) =>
        <span key={i} className={'badge ' + c} style={{ padding: '8px 16px' }}><span className="dot" />{l}</span>)}
      </div>
    </Sec>

    <section className="sec" style={{ background: 'linear-gradient(180deg,#fff,#F3FAFB)' }}><div className="wrap">
      <div className="center" style={{ marginBottom: 44 }}><div className="eyebrow">Curated Collections</div>
        <h2 className="h2">Experiences You'll Love</h2><p className="sub">Handpicked island journeys organised by the way you like to travel.</p></div>
      <div className="grid g4">{EXPS.map((e, i) =>
          <button key={i} className="exp" style={{ backgroundImage: `url(${e.i})` }} onClick={() => go('experiences')}>
          <div><div className="ff bold" style={{ fontSize: 18 }}>{e.n}</div>
            <div className="sm" style={{ opacity: .9, marginTop: 4 }}>{e.c}</div>
            <div className="row gap8 mt12 xs bold" style={{ color: 'var(--turq-2)' }}>Explore <I d={Ic.arr} s={14} /></div></div></button>)}
      </div></div></section>

    <section className="sec sec-sand"><div className="wrap"><div className="split">
      <div>
        <div className="eyebrow">Smart Planning</div><h2 className="h2">Plan Your Perfect Island Day</h2>
        <p className="sub">Tell us when you're visiting and what you enjoy. The platform matches your preferences against live slot inventory and builds a realistic, travel-time-aware itinerary.</p>
        <div className="grid g2 mt32" style={{ gap: 14 }}>
          {[['Slot-aware sequencing', 'Only suggests times that are genuinely available'], ['Travel time built in', 'Accounts for ferry and road transfers between islands'], ['Nationality pricing', 'Applies correct Indian or foreign visitor tariffs'], ['One-tap booking', 'Convert the full itinerary into a single cart']].map((x, i) =>
              <div key={i} className="row gap12" style={{ alignItems: 'flex-start' }}>
              <div style={{ width: 24, height: 24, borderRadius: 8, background: '#E5F6F0', color: 'var(--sea)', display: 'grid', placeItems: 'center', flex: 'none', marginTop: 1 }}><I d={Ic.tick} s={13} /></div>
              <div><div className="semi sm">{x[0]}</div><div className="xs mut mt8">{x[1]}</div></div></div>)}
        </div>
        <button className="btn btn-coral btn-lg mt32" onClick={() => go('plan')}><I d={Ic.zap} s={17} /> Build My Itinerary</button>
      </div>
      <div className="card" style={{ padding: 28, boxShadow: 'var(--sh-lg)' }}>
        <div className="row between" style={{ marginBottom: 20 }}>
          <div className="ff bold" style={{ fontSize: 16 }}>Sample Day Itinerary</div>
          <span className="badge b-turq">18 Sep · Havelock + Port Blair</span></div>
        {[['09:00 AM', 'Radhanagar Beach', '3 hrs · Swimming, sunset point', IMG.radha],
            ['12:00 PM', 'Lunch / Break', '1.5 hrs · Beach No. 5 food court', null],
            ['02:00 PM', 'Cellular Jail', '2.5 hrs · Guided heritage walk', IMG.jail],
            ['06:00 PM', 'Light & Sound Show', '1 hr · Reserved seating', IMG.night]].map((t, i) =>
            <div key={i} className="tl"><div className="tl-d">{i + 1}</div>
            <div className="xs bold" style={{ color: 'var(--turq)', letterSpacing: .6 }}>{t[0]}</div>
            <div className="row gap12 mt8">{t[3] && <div style={{ width: 44, height: 44, borderRadius: 11, backgroundImage: `url(${t[3]})`, backgroundSize: 'cover', flex: 'none' }} />}
              <div><div className="semi" style={{ fontSize: 14.5 }}>{t[1]}</div><div className="xs mut mt8">{t[2]}</div></div></div>
          </div>)}
        <div className="row between card" style={{ padding: '14px 16px', background: '#F7FBFC', marginTop: 4 }}>
          <div><div className="xs mut">Estimated total · 3 visitors</div><div className="ff bold" style={{ color: 'var(--ocean)' }}>₹3,342</div></div>
          <button className="btn btn-turq btn-sm" onClick={() => go('plan')}>Customize Itinerary</button></div>
      </div>
    </div></div></section>

    <Sec center e="Why Choose Us" t="Everything You Need for Your Island Journey" s="One official platform for discovering, planning, booking and experiencing the islands.">
      <div className="grid g3">{[
        ['Easy Booking', 'Book any attraction in under 90 seconds with saved visitor profiles and instant confirmation.', 'ticket', 'var(--turq)'],
        ['Secure Payments', 'PCI-DSS compliant gateway supporting UPI, cards, net banking and wallets with encrypted transactions.', 'lock', 'var(--sea)'],
        ['Digital QR Tickets', 'Scannable entry passes delivered instantly. No printing, no queues, no paperwork at the gate.', 'qr', 'var(--ocean-2)'],
        ['Smart Itinerary', 'Preference-aware day plans that respect real slot availability and inter-island travel time.', 'layers', 'var(--coral)'],
        ['Timely Reminders', 'Automated SMS, email and WhatsApp alerts before every booked experience.', 'bell', 'var(--warn)'],
        ['Multi-Attraction Booking', 'Combine several attractions into one cart, one payment and one consolidated ticket set.', 'cart', 'var(--ocean)']].
        map((c, i) => <div key={i} className="stat" style={{ padding: 26, textAlign: 'left' }}>
        <div className="sicn" style={{ background: c[3] + '18', color: c[3], width: 52, height: 52 }}><I d={Ic[c[2]]} s={24} /></div>
        <h3 className="ff bold" style={{ fontSize: 17 }}>{c[0]}</h3><p className="sm mut mt12" style={{ lineHeight: 1.65 }}>{c[1]}</p></div>)}
      </div></Sec>

    <section className="sec" style={{ background: 'linear-gradient(140deg,var(--ocean),#083E63 60%,#0A5C8F)', color: '#fff' }}><div className="wrap"><div className="split">
      <div>
        <div className="eyebrow" style={{ color: 'var(--turq-2)' }}>Digital Ticketing</div>
        <h2 className="h2">Your Ticket. Your Phone. Your Journey.</h2>
        <p className="sub" style={{ color: 'rgba(255,255,255,.82)' }}>Every confirmed booking generates a tamper-proof QR pass validated at the attraction gate. No printing, no counters, no waiting.</p>
        <div className="grid g2 mt32" style={{ gap: 16 }}>
          {[['Instant issuance', 'Generated the moment payment clears', 'zap'], ['Gate validation', 'Scanned and verified in under 2 seconds', 'scan'], ['Offline capable', 'Works without mobile network at the venue', 'wifi'], ['Multi-channel delivery', 'SMS, Email and WhatsApp simultaneously', 'send']].map((x, i) =>
              <div key={i} className="row gap12" style={{ alignItems: 'flex-start' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,.13)', display: 'grid', placeItems: 'center', flex: 'none' }}><I d={Ic[x[2]]} s={16} /></div>
              <div><div className="semi sm">{x[0]}</div><div className="xs mt8" style={{ opacity: .72 }}>{x[1]}</div></div></div>)}
        </div>
        <p className="sm mt32" style={{ opacity: .78 }}>Receive your booking confirmation through SMS, Email and WhatsApp.</p>
        <div className="row gap12 wrapf mt24">
          <button className="btn btn-coral" onClick={() => go('confirm')}><I d={Ic.dl} s={16} /> Download PDF</button>
          <button className="btn btn-ghost" onClick={() => toast('Opening WhatsApp share…')}><I d={Ic.share} s={16} /> Share via WhatsApp</button></div>
      </div>
      <div style={{ display: 'grid', placeItems: 'center' }}><TicketCard /></div>
    </div></div></section>

    <Sec e="The Islands in Pictures" t="A Glimpse of Andaman & Nicobar" s="Over 570 islands of rainforest, reef and remarkable history.">
      <div className="imgrid">
        {[[IMG.radha, 'Radhanagar Beach'], [IMG.jail, 'Cellular Jail'], [IMG.coral, 'Coral Reefs'], [IMG.mangrove, 'Mangrove Creeks'], [IMG.ross, 'Ross Island'], [IMG.beach2, 'Neil Island']].map((g, i) =>
        <div key={i} style={{ backgroundImage: `url(${g[0]})` }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 55%,rgba(4,35,58,.78))', display: 'flex', alignItems: 'flex-end', padding: 16 }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 14, fontFamily: 'Poppins' }}>{g[1]}</span></div></div>)}
      </div></Sec>

    <section style={{ background: 'var(--sand)', padding: '56px 0' }}><div className="wrap">
      <div className="card row between wrapf gap24" style={{ padding: '34px 40px', background: 'linear-gradient(120deg,#fff,#F4FBFC)', boxShadow: 'var(--sh-md)' }}>
        <div><h3 className="ff" style={{ fontSize: 24, fontWeight: 700 }}>Planning a school, college or corporate visit?</h3>
          <p className="sub" style={{ fontSize: 15, marginTop: 8 }}>Upload your visitor list via Excel, get automated validation and a single consolidated approval from the tourism authority.</p></div>
        <div className="row gap12 wrapf">
          <button className="btn btn-out" onClick={() => go('help')}><I d={Ic.headset} s={16} /> Need Help?</button>
          <button className="btn btn-coral btn-lg" onClick={() => go('group')}><I d={Ic.users} s={17} /> Plan a Group Visit</button></div>
      </div></div></section>
  </>;
}