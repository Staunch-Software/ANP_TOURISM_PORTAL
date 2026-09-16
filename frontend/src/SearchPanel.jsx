import React, { useState } from 'react';
import { Field } from '../common/Field';
import { I, Ic } from '../common/Icons';
import { useApp } from '../../context/AppContext';
import { ATTR } from '../../services/data';

export function SearchPanel() {
  const { go, toast } = useApp();
  const [f, setF] = useState({ dest: '', date: '2026-09-18', ad: 2, ch: 1, nat: 'Indian' }),[err, setErr] = useState({});
  const submit = () => {const e = {};if (!f.dest) e.dest = 'Please select an attraction';if (!f.date) e.date = 'Select a visit date';
    setErr(e);if (Object.keys(e).length) return;const a = ATTR.find((x) => x.id === f.dest);toast('Checking live availability…');setTimeout(() => go('detail', a), 450);};
  return <div className="wrap"><div className="searchp fade">
    <div className="row between wrapf gap12" style={{ marginBottom: 20 }}>
      <div><div className="ff bold" style={{ fontSize: 21 }}>Plan Your Visit</div><div className="sm mut mt8">Check real-time slot availability across all island attractions</div></div>
      <span className="badge b-ok"><span className="dot" /> Live availability · updated 2 min ago</span></div>
    <div className="sgrid">
      <Field label="Destination / Attraction" error={err.dest}>
        <select className={'inp ' + (err.dest ? 'err' : '')} value={f.dest} onChange={(e) => setF({ ...f, dest: e.target.value })}>
          <option value="">Select Attraction</option>{ATTR.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>
      <Field label="Visit Date" error={err.date}><input type="date" className={'inp ' + (err.date ? 'err' : '')} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
      <Field label="Visitors">
        <div className="row gap8">
          <div className="row between inp" style={{ padding: '8px 10px' }}><span className="xs semi">Adults</span>
            <span className="row gap8"><button onClick={() => setF({ ...f, ad: Math.max(1, f.ad - 1) })} aria-label="less"><I d={Ic.minus} s={13} /></button><b style={{ minWidth: 12, textAlign: 'center' }}>{f.ad}</b><button onClick={() => setF({ ...f, ad: Math.min(6, f.ad + 1) })} aria-label="more"><I d={Ic.plus} s={13} /></button></span></div>
          <div className="row between inp" style={{ padding: '8px 10px' }}><span className="xs semi">Children</span>
            <span className="row gap8"><button onClick={() => setF({ ...f, ch: Math.max(0, f.ch - 1) })} aria-label="less"><I d={Ic.minus} s={13} /></button><b style={{ minWidth: 12, textAlign: 'center' }}>{f.ch}</b><button onClick={() => setF({ ...f, ch: Math.min(12, f.ch + 1) })} aria-label="more"><I d={Ic.plus} s={13} /></button></span></div>
        </div></Field>
      <Field label="Nationality"><select className="inp" value={f.nat} onChange={(e) => setF({ ...f, nat: e.target.value })}><option>Indian</option><option>Foreign</option></select></Field>
      <button className="btn btn-coral btn-lg" onClick={submit}><I d={Ic.search} s={17} /> Check Availability</button>
    </div>
    <div className="trust">
      <span className="row gap8"><I d={Ic.shield} s={15} style={{ color: 'var(--sea)' }} /> Official Tourism Platform</span>
      <span className="row gap8"><I d={Ic.lock} s={15} style={{ color: 'var(--sea)' }} /> Secure Encrypted Payments</span>
      <span className="row gap8"><I d={Ic.qr} s={15} style={{ color: 'var(--sea)' }} /> Digital QR Tickets</span>
      <span className="row gap8"><I d={Ic.check2} s={15} style={{ color: 'var(--sea)' }} /> Verified Service Providers</span>
      <span className="row gap8"><I d={Ic.refresh} s={15} style={{ color: 'var(--sea)' }} /> Free Cancellation up to 24 hrs</span>
    </div>
  </div></div>;
}