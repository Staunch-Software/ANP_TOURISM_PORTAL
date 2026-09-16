import React, { useState, useEffect } from 'react';
import { I, Ic } from '../common/Icons';
import { useApp } from '../../context/AppContext';
import { ATTR, FERRIES } from '../../services/data';
import { fmt, stCl } from '../../utils/format';

export function Nav() {
  const { go, route, user, logout, toast } = useApp();
  const [sc, setSc] = useState(false),[mm, setMm] = useState(false),[sr, setSr] = useState(false),[q, setQ] = useState(''),[lang, setLang] = useState(false);
  useEffect(() => {const f = () => setSc(window.scrollY > 24);window.addEventListener('scroll', f);return () => window.removeEventListener('scroll', f);}, []);
  const links = [['Home', 'home'], ['Explore', 'explore'], ['Attractions', 'explore'], ['Experiences', 'experiences'], ['Plan Your Trip', 'plan'], ['Ferry', 'ferry'], ['Group Booking', 'group'], ['About', 'about']];
  const res = q ? ATTR.filter((a) => a.name.toLowerCase().includes(q.toLowerCase()) || a.cat.toLowerCase().includes(q.toLowerCase())).slice(0, 5) : [];
  const fres = q ? FERRIES.filter((f) => f.n.toLowerCase().includes(q.toLowerCase()) || f.r.toLowerCase().includes(q.toLowerCase())).slice(0, 3) : [];
  return <>
    <div className="topbar"><div className="wrap">
      <span className="row gap8"><I d={Ic.wave} s={14} /> Discover • Plan • Book • Experience Andaman &amp; Nicobar</span>
      <span className="row gap16"><span className="row gap8"><I d={Ic.headset} s={13} /> Helpline 1800-345-2465</span><span className="row gap8"><I d={Ic.shield} s={13} /> Official Government Tourism Platform</span></span>
    </div></div>
    <nav className={'nav ' + (sc ? 'sm' : '')}><div className="wrap">
      <a className="logo" href="#" onClick={(e) => {e.preventDefault();go('home');}}>
        <div className="logo-m"><I d={Ic.palm} s={22} /></div>
        <div><div className="logo-t">Andaman Tourism</div><div className="logo-s">Explore Andaman</div></div>
      </a>
      <div className="nlinks">{links.map(([l, r], i) => <a key={i} className={'nlink ' + (route === r && !(l === 'Attractions' && route === 'explore') ? 'on' : '')} href="#" onClick={(e) => {e.preventDefault();go(r);}}>{l}</a>)}</div>
      <div className="nact">
        <button className="icb" aria-label="Search" onClick={() => setSr(!sr)}><I d={Ic.search} s={17} /></button>
        <button className="icb" aria-label="Help" onClick={() => go('help')}><I d={Ic.help} s={17} /></button>
        <div style={{ position: 'relative' }}>
          <button className="icb" aria-label="Language" onClick={() => setLang(!lang)}><I d={Ic.globe} s={17} /></button>
          {lang && <div className="card" style={{ position: 'absolute', right: 0, top: 46, width: 190, padding: 8, boxShadow: 'var(--sh-lg)', zIndex: 60 }}>
            {['English', 'हिन्दी', 'বাংলা', 'தமிழ்', 'తెలుగు'].map((l, i) => <button key={i} className="sl" style={{ color: i ? 'var(--muted)' : 'var(--ocean)', background: i ? '' : '#F1F7FA' }} onClick={() => {setLang(false);i && toast('Additional languages coming soon');}}>{l}{!i && <I d={Ic.tick} s={14} style={{ marginLeft: 'auto' }} />}</button>)}
          </div>}
        </div>
        {user ? <>
          <button className="icb" onClick={() => go(user.role + '-dash')} aria-label="Notifications"><I d={Ic.bell} s={17} /><span style={{ position: 'absolute', top: 7, right: 8, width: 7, height: 7, background: 'var(--coral)', borderRadius: 9 }} /></button>
          <button className="btn btn-ocean btn-sm" onClick={() => go(user.role + '-dash')}><I d={Ic.grid} s={15} /> Dashboard</button>
          <button className="btn btn-out btn-sm" onClick={logout}>Logout</button>
        </> : <>
          <button className="btn btn-out btn-sm" onClick={() => go('login')}>Login</button>
          <button className="btn btn-coral btn-sm" onClick={() => go('register')}>Register</button>
        </>}
        <button className="icb burger" aria-label="Menu" onClick={() => setMm(true)}><I d={Ic.menu} s={19} /></button>
      </div>
    </div>
    {sr && <div style={{ borderTop: '1px solid var(--line)', background: '#fff', padding: '18px 0' }} className="fade"><div className="wrap">
      <div className="row gap12" style={{ border: '1.5px solid var(--turq)', borderRadius: 14, padding: '10px 16px', boxShadow: '0 0 0 4px rgba(18,176,188,.1)' }}>
        <I d={Ic.search} s={19} style={{ color: 'var(--turq)' }} />
        <input autoFocus className="inp" style={{ border: 'none', padding: '4px 0', boxShadow: 'none' }} placeholder="Search attractions, experiences, ferries and services…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="icb" onClick={() => {setSr(false);setQ('');}}><I d={Ic.x} s={16} /></button>
      </div>
      {!q && <div className="row gap8 wrapf mt16"><span className="xs bold mut">TRENDING:</span>{['Radhanagar Beach', 'Cellular Jail', 'Scuba Diving', 'Ferry to Havelock', 'Light & Sound Show'].map((t, i) => <button key={i} className="chip b-grey" onClick={() => setQ(t)}>{t}</button>)}</div>}
      {q && <div className="mt16">
        {res.length === 0 && fres.length === 0 && <div className="sm mut" style={{ padding: '14px 0' }}>No results for “{q}”. Try “beach”, “heritage” or “ferry”.</div>}
        {res.map((a) => <button key={a.id} className="row gap12 between" style={{ width: '100%', padding: '11px 12px', borderRadius: 12, textAlign: 'left' }} onClick={() => {setSr(false);setQ('');go('detail', a);}}>
          <div className="row gap12"><div style={{ width: 44, height: 44, borderRadius: 10, backgroundImage: `url(${a.img})`, backgroundSize: 'cover' }} />
            <div><div className="semi sm">{a.name}</div><div className="xs mut">{a.cat} · {a.loc}</div></div></div>
          <span className="badge b-turq">from {fmt(a.inr)}</span></button>)}
        {fres.map((f) => <button key={f.id} className="row gap12 between" style={{ width: '100%', padding: '11px 12px', borderRadius: 12, textAlign: 'left' }} onClick={() => {setSr(false);setQ('');go('ferry');}}>
          <div className="row gap12"><div style={{ width: 44, height: 44, borderRadius: 10, background: '#EAF4F8', display: 'grid', placeItems: 'center', color: 'var(--ocean)' }}><I d={Ic.ship} s={20} /></div>
            <div><div className="semi sm">{f.n}</div><div className="xs mut">{f.r} · {f.dep}</div></div></div>
          <span className={'badge ' + stCl(f.st)}>{f.st}</span></button>)}
      </div>}
    </div></div>}
    </nav>
    <div className={'mmenu ' + (mm ? 'open' : '')}>
      <div className="row between" style={{ marginBottom: 24 }}>
        <div className="logo"><div className="logo-m"><I d={Ic.palm} s={22} /></div><div><div className="logo-t">Andaman Tourism</div></div></div>
        <button className="icb" onClick={() => setMm(false)}><I d={Ic.x} s={19} /></button></div>
      {links.map(([l, r], i) => <button key={i} className="sl" style={{ color: 'var(--ocean)', fontSize: 16, padding: '14px 12px' }} onClick={() => {setMm(false);go(r);}}>{l}<I d={Ic.chev} s={16} style={{ marginLeft: 'auto' }} /></button>)}
      <div className="grid g2 mt24">
        <button className="btn btn-out" onClick={() => {setMm(false);go('login');}}>Login</button>
        <button className="btn btn-coral" onClick={() => {setMm(false);go('register');}}>Register</button></div>
    </div>
  </>;
}