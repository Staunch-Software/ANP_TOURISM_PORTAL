import React, { useState } from 'react';
import { Field } from '../components/common/Field';
import { I, Ic } from '../components/common/Icons';
import { useApp } from '../context/AppContext';
import { FERRIES } from '../services/data';
import { fmt, stCl } from '../utils/format';

export function Ferry() {
  const { toast } = useApp();const [route, setRoute] = useState('All'),[date, setDate] = useState('2026-09-18');
  const routes = ['All', ...new Set(FERRIES.map((f) => f.r))];
  const list = FERRIES.filter((f) => route === 'All' || f.r === route);
  return <>
    <div style={{ background: 'linear-gradient(130deg,var(--ocean),#0A6B84)', color: '#fff', padding: '56px 0 42px' }}><div className="wrap">
      <div className="eyebrow" style={{ color: 'var(--turq-2)' }}>Inter-Island Connectivity</div>
      <h1 className="h2" style={{ fontSize: 38 }}>Ferry Management &amp; Schedules</h1>
      <p className="sub" style={{ color: 'rgba(255,255,255,.82)' }}>Live seat availability across government and private ferry operators.</p></div></div>
    <div className="sec" style={{ paddingTop: 34 }}><div className="wrap">
      <div className="card row between wrapf gap16" style={{ padding: 20, marginBottom: 26 }}>
        <div className="row gap16 wrapf" style={{ flex: 1 }}>
          <div style={{ minWidth: 260, flex: 1 }}><Field label="Route"><select className="inp" value={route} onChange={(e) => setRoute(e.target.value)}>{routes.map((r) => <option key={r}>{r}</option>)}</select></Field></div>
          <div style={{ minWidth: 180 }}><Field label="Travel Date"><input type="date" className="inp" value={date} onChange={(e) => setDate(e.target.value)} /></Field></div>
          <div style={{ minWidth: 150 }}><Field label="Passengers"><select className="inp"><option>1 Passenger</option><option>2 Passengers</option><option>3 Passengers</option><option>4+ Passengers</option></select></Field></div>
        </div>
        <button className="btn btn-coral" style={{ alignSelf: 'flex-end' }} onClick={() => toast('Showing live ferry availability')}><I d={Ic.search} s={16} /> Search Ferries</button></div>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="row between" style={{ padding: '18px 22px', borderBottom: '1px solid var(--line)' }}>
          <div className="ff bold" style={{ fontSize: 16 }}>{list.length} services found</div>
          <span className="badge b-info"><I d={Ic.refresh} s={12} /> Synced with operator systems</span></div>
        <div style={{ overflowX: 'auto' }}><table>
          <thead><tr><th>Ferry</th><th>Route</th><th>Date</th><th>Departure</th><th>Arrival</th><th>Capacity</th><th>Available</th><th>Fare</th><th>Status</th><th></th></tr></thead>
          <tbody>{list.map((f) => <tr key={f.id}>
            <td><div className="row gap12"><div style={{ width: 36, height: 36, borderRadius: 10, background: '#EAF4F8', color: 'var(--ocean)', display: 'grid', placeItems: 'center' }}><I d={Ic.ship} s={18} /></div>
              <div><div className="semi">{f.n}</div><div className="xs mut mono">{f.id}</div></div></div></td>
            <td className="semi">{f.r}</td><td>{f.d}</td><td className="semi">{f.dep}</td><td>{f.arr}</td><td>{f.cap}</td>
            <td><div className="row gap8"><b>{f.left}</b><div style={{ width: 48, height: 5, background: '#EEF2F5', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: f.left / f.cap * 100 + '%', height: '100%', background: f.st === 'Available' ? 'var(--sea)' : f.st === 'Limited' ? 'var(--warn)' : 'var(--bad)' }} /></div></div></td>
            <td className="bold">{fmt(f.fare)}</td>
            <td><span className={'badge ' + stCl(f.st)}><span className="dot" />{f.st}</span></td>
            <td><button className="btn btn-sm" disabled={f.st === 'Fully Booked'} style={{ background: f.st === 'Fully Booked' ? '#EEF2F5' : 'var(--ocean)', color: f.st === 'Fully Booked' ? 'var(--muted)' : '#fff' }}
                    onClick={() => toast('Ferry booking opens shortly — currently in view-only mode')}>{f.st === 'Fully Booked' ? 'Full' : 'Select'}</button></td>
          </tr>)}</tbody></table></div>
      </div>
      <div className="card mt24 row gap12" style={{ padding: 20, background: '#FFF8F2', borderColor: '#F5DFCA', alignItems: 'flex-start' }}>
        <I d={Ic.info} s={19} style={{ color: 'var(--warn)', marginTop: 1 }} />
        <div><div className="semi sm">Ferry booking availability</div>
          <p className="xs mut mt8" style={{ lineHeight: 1.75 }}>Ferry schedules and seat availability are displayed live from operator systems. Direct ferry booking through this platform is being onboarded in phases — private operators are live for viewing, with transactional booking scheduled for the next release. Government ferry tickets continue to be issued at the Phoenix Bay jetty counters.</p></div></div>
    </div></div>
  </>;
}