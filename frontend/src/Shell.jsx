import React, { useState } from 'react';
import { I, Ic } from '../common/Icons';
import { useApp } from '../../context/AppContext';

export function Shell({ items, active, setActive, title, sub, children, admin, badge }) {
  const { go, logout, user } = useApp();const [open, setOpen] = useState(false);
  return <div className="dash">
    <aside className={'side ' + (admin ? 'adm ' : '') + (open ? 'open' : '')}>
      <div className="row gap12" style={{ padding: '6px 12px 22px' }}>
        <div className="logo-m" style={{ width: 36, height: 36, background: 'rgba(255,255,255,.16)', boxShadow: 'none' }}><I d={Ic.palm} s={18} /></div>
        <div><div style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 14.5, color: '#fff' }}>Andaman Tourism</div>
          <div style={{ fontSize: 10, color: 'var(--turq-2)', fontWeight: 700, letterSpacing: 1.1, textTransform: 'uppercase' }}>{badge}</div></div></div>
      {items.map((it, i) => it === '—' ? <div key={i} style={{ height: 1, background: 'rgba(255,255,255,.12)', margin: '12px 8px' }} /> :
      <button key={i} className={'sl ' + (active === it[0] ? 'on' : '')} onClick={() => {setActive(it[0]);setOpen(false);}}>
          <I d={Ic[it[1]]} s={17} />{it[0]}{it[2] && <span className="badge" style={{ marginLeft: 'auto', background: 'var(--coral)', color: '#fff', padding: '2px 7px', fontSize: 10 }}>{it[2]}</span>}</button>)}
      <div style={{ height: 1, background: 'rgba(255,255,255,.12)', margin: '12px 8px' }} />
      <button className="sl" onClick={logout}><I d={Ic.logout} s={17} />Logout</button>
    </aside>
    <div className="dmain">
      <header className="dtop">
        <div className="row gap12">
          <button className="icb burger" onClick={() => setOpen(!open)} aria-label="Toggle sidebar"><I d={Ic.menu} s={18} /></button>
          <div><h1 className="ff bold" style={{ fontSize: 19 }}>{title}</h1><div className="xs mut mt8">{sub}</div></div></div>
        <div className="row gap12">
          <button className="icb" onClick={() => go('home')} aria-label="Home"><I d={Ic.home} s={17} /></button>
          <button className="icb" aria-label="Notifications"><I d={Ic.bell} s={17} /><span style={{ position: 'absolute', top: 7, right: 8, width: 7, height: 7, background: 'var(--coral)', borderRadius: 9 }} /></button>
          <div className="row gap8" style={{ paddingLeft: 12, borderLeft: '1px solid var(--line)' }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: 'linear-gradient(135deg,var(--turq),var(--ocean))', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 13, fontFamily: 'Poppins' }}>
              {(user?.name || 'AK').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</div>
            <div className="hideSm"><div className="semi xs">{user?.name || 'Arun Krishnan'}</div><div className="xs mut">{badge}</div></div></div>
        </div></header>
      <div className="dbody">{children}</div>
    </div>
    <style>{`@media(max-width:760px){.hideSm{display:none}}`}</style>
  </div>;
}