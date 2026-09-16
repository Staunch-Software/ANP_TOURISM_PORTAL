import React from 'react';
import { I, Ic } from '../components/common/Icons';
import { ROLES } from './auth/RoleSelect';
import { IMG } from '../services/images';

export function About() {
  return <>
    <div style={{ position: 'relative', height: 320, backgroundImage: `url(${IMG.sunset})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,rgba(4,35,58,.92),rgba(4,35,58,.4))' }} />
      <div className="wrap" style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'flex-end', paddingBottom: 40, color: '#fff' }}>
        <div><div className="eyebrow" style={{ color: 'var(--turq-2)' }}>About the Platform</div>
          <h1 className="h2" style={{ fontSize: 38 }}>Integrated Tourism Management &amp; E-Ticketing</h1>
          <p className="sub" style={{ color: 'rgba(255,255,255,.85)' }}>A single official platform connecting visitors, service providers, agencies and the regulatory authority.</p></div></div></div>
    <div className="sec"><div className="wrap">
      <div className="split">
        <div><div className="eyebrow">Our Mandate</div><h2 className="h2">One platform for the entire island tourism ecosystem</h2>
          <p className="sub" style={{ maxWidth: 'none' }}>The Andaman &amp; Nicobar Integrated Tourism Management Platform consolidates attraction discovery, real-time capacity management, digital ticketing, group approvals, ferry coordination and regulatory oversight into a single system.</p>
          <p className="sub" style={{ maxWidth: 'none' }}>It replaces fragmented counter-based ticketing with verified digital entry, giving the authority live visibility of visitor footfall while giving travellers a modern booking experience.</p>
          <div className="grid g2 mt32" style={{ gap: 20 }}>
            {[['1.2 M+', 'Digital tickets issued'], ['120+', 'Verified attractions'], ['480+', 'Registered service providers'], ['96%', 'Gate validation success rate']].map((s, i) =>
              <div key={i}><div className="ff bold" style={{ fontSize: 28, color: 'var(--ocean)', letterSpacing: -1 }}>{s[0]}</div><div className="sm mut mt8">{s[1]}</div></div>)}</div></div>
        <div className="imgrid" style={{ gridTemplateRows: '160px 160px' }}>
          {[IMG.radha, IMG.jail, IMG.coral, IMG.ferry, IMG.ross, IMG.bird].map((g, i) => <div key={i} style={{ backgroundImage: `url(${g})` }} />)}</div>
      </div>
      <div className="mt48"><h2 className="ff bold center" style={{ fontSize: 26, marginBottom: 32 }}>Four connected portals</h2>
        <div className="grid g4">{ROLES.map((r) =>
            <div key={r.k} className="card" style={{ padding: 24 }}>
            <div className="ric" style={{ background: r.g, margin: '0 0 16px', width: 48, height: 48, borderRadius: 14 }}><I d={Ic[r.ic]} s={21} /></div>
            <h3 className="ff bold" style={{ fontSize: 16 }}>{r.t}</h3><p className="sm mut mt12" style={{ lineHeight: 1.65 }}>{r.d}</p></div>)}</div></div>
    </div></div>
  </>;
}