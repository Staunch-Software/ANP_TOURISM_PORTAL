import React from 'react';
import { I, Ic } from '../common/Icons';
import { useApp } from '../../context/AppContext';

export function Footer() {
  const { go, toast } = useApp();
  const cols = [['Explore', [['Home', 'home'], ['Attractions', 'explore'], ['Experiences', 'experiences'], ['Beaches', 'explore'], ['Heritage', 'explore'], ['Water Sports', 'explore']]],
  ['Plan Your Trip', [['Itinerary', 'plan'], ['Calendar', 'tourist-dash'], ['Group Booking', 'group'], ['My Bookings', 'tourist-dash'], ['My Tickets', 'tourist-dash'], ['Ferry Schedule', 'ferry']]],
  ['Support', [['Help Center', 'help'], ['FAQs', 'help'], ['Contact Us', 'help'], ['Cancellation & Refund', 'help'], ['Booking Help', 'help'], ['Payment Help', 'help']]],
  ['Information', [['About', 'about'], ['Privacy Policy', 'about'], ['Terms & Conditions', 'about'], ['Accessibility', 'about'], ['Tourism Policy', 'about'], ['RTI', 'about']]]];
  return <footer className="ftr"><div className="wrap">
    <div className="grid" style={{ gridTemplateColumns: '1.5fr repeat(4,1fr)', gap: 40, paddingBottom: 48 }}>
      <div>
        <div className="row gap12" style={{ marginBottom: 18 }}>
          <div className="logo-m" style={{ boxShadow: 'none' }}><I d={Ic.palm} s={22} /></div>
          <div><div style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 17, color: '#fff' }}>Andaman Tourism</div>
            <div style={{ fontSize: 10.5, color: 'var(--turq-2)', fontWeight: 700, letterSpacing: 1.3, textTransform: 'uppercase' }}>Explore Andaman</div></div></div>
        <p style={{ fontSize: 13.5, lineHeight: 1.85, maxWidth: 300 }}>Discover, plan and experience the Andaman &amp; Nicobar Islands. The official integrated tourism management and e-ticketing platform of the Andaman &amp; Nicobar Administration.</p>
        <div className="row gap8 mt24">{['globe', 'mail', 'share', 'camera', 'send'].map((s, i) =>
            <button key={i} className="soc" aria-label="Social link" onClick={() => toast('Opening social channel')}><I d={Ic[s]} s={17} /></button>)}</div>
        <div className="mt24" style={{ padding: '14px 16px', border: '1px solid rgba(255,255,255,.14)', borderRadius: 14, background: 'rgba(255,255,255,.04)' }}>
          <div className="row gap8" style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: .8, color: 'var(--turq-2)', marginBottom: 6 }}><I d={Ic.shield} s={13} /> OFFICIAL GOVERNMENT PLATFORM</div>
          <div style={{ fontSize: 12, lineHeight: 1.7 }}>Directorate of Information, Publicity &amp; Tourism<br />Andaman &amp; Nicobar Administration, Port Blair</div></div>
      </div>
      {cols.map(([h, ls], i) => <div key={i}><div className="fh">{h}</div>
        <ul>{ls.map(([l, r], j) => <li key={j}><a href="#" onClick={(e) => {e.preventDefault();go(r);}}>{l}</a></li>)}</ul></div>)}
    </div>
    <div style={{ borderTop: '1px solid rgba(255,255,255,.12)', padding: '22px 0', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, fontSize: 12.5 }}>
      <span>© 2026 Andaman &amp; Nicobar Tourism. All rights reserved.</span>
      <div className="row gap24 wrapf" style={{ fontSize: 12 }}>
        <span className="row gap8"><I d={Ic.headset} s={13} /> Helpline 1800-345-2465</span>
        <span className="row gap8"><I d={Ic.mail} s={13} /> support@andamantourism.gov.in</span>
        <span className="row gap8"><I d={Ic.lock} s={13} /> Secure &amp; Encrypted</span></div>
    </div>
  </div></footer>;
}