import React, { useState } from 'react';
import { Field } from '../components/common/Field';
import { I, Ic } from '../components/common/Icons';
import { Steps } from '../components/common/Steps';
import { useApp } from '../context/AppContext';
import { ATTR, SLOTS, VISITORS } from '../services/data';
import { fmt } from '../utils/format';

export function Booking({ a }) {
  const { go, toast, addCart } = useApp();
  const [step, setStep] = useState(3),[date, setDate] = useState('2026-09-18'),[slot, setSlot] = useState('10:00 AM'),[nat, setNat] = useState('Indian');
  const [sel, setSel] = useState([1, 2, 3]),[att, setAtt] = useState(a || ATTR[0]);
  const sl = SLOTS(att.id.charCodeAt(2));
  const adults = VISITORS.filter((v) => sel.includes(v.id) && v.t === 'Adult').length,kids = VISITORS.filter((v) => sel.includes(v.id) && v.t === 'Child').length;
  const base = nat === 'Indian' ? att.inr : att.fx,sub = adults * base + kids * Math.round(base * .5),tax = Math.round(sub * .05);
  const L = ['Attraction', 'Date', 'Time Slot', 'Visitors', 'Nationality', 'Review'];
  const next = () => {if (step === 4 && !sel.length) return toast('Select at least one visitor');setStep(Math.min(6, step + 1));};
  return <div className="sec"><div className="wrap" style={{ maxWidth: 940 }}>
    <button className="row gap8 xs semi mut" style={{ marginBottom: 20 }} onClick={() => go('detail', att)}><I d={Ic.chevl} s={14} /> Back to attraction</button>
    <div className="center" style={{ marginBottom: 32 }}><div className="eyebrow">Booking</div><h1 className="h2" style={{ fontSize: 31 }}>Complete Your Booking</h1></div>
    <div className="card" style={{ padding: '26px 30px', marginBottom: 24, overflowX: 'auto' }}><Steps n={step} total={6} labels={L} /></div>
    <div className="card fade" key={step} style={{ padding: 32 }}>
      {step === 1 && <><h3 className="ff bold" style={{ fontSize: 20 }}>Select Attraction</h3><p className="sm mut mt12">Choose which island attraction you'd like to book.</p>
        <div className="grid g2 mt24" style={{ gap: 14 }}>{ATTR.slice(0, 6).map((x) =>
            <button key={x.id} className="row gap12 card" style={{ padding: 14, textAlign: 'left', borderColor: att.id === x.id ? 'var(--ocean)' : 'var(--line)', background: att.id === x.id ? '#F5F9FB' : '#fff', boxShadow: att.id === x.id ? '0 0 0 3px rgba(5,58,94,.08)' : 'none' }} onClick={() => setAtt(x)}>
            <div style={{ width: 54, height: 54, borderRadius: 12, backgroundImage: `url(${x.img})`, backgroundSize: 'cover', flex: 'none' }} />
            <div><div className="semi sm">{x.name}</div><div className="xs mut mt8">{x.cat} · from {fmt(x.inr)}</div></div>
            {att.id === x.id && <I d={Ic.check2} s={19} style={{ color: 'var(--ocean)', marginLeft: 'auto' }} />}</button>)}</div></>}
      {step === 2 && <><h3 className="ff bold" style={{ fontSize: 20 }}>Select Date</h3><p className="sm mut mt12">Pick your visit date for {att.name}.</p>
        <div style={{ maxWidth: 360 }} className="mt24"><Field label="Visit Date"><input type="date" className="inp" value={date} onChange={(e) => setDate(e.target.value)} /></Field></div>
        <div className="row gap8 wrapf mt24">{['18 Sep', '19 Sep', '20 Sep', '21 Sep', '22 Sep'].map((d, i) =>
            <button key={i} className="slot" style={{ minWidth: 96 }} onClick={() => setDate('2026-09-' + (18 + i))}>{d}<small style={{ color: i === 2 ? 'var(--warn)' : 'var(--ok)' }}>{i === 2 ? 'Filling fast' : 'Available'}</small></button>)}</div></>}
      {step === 3 && <><h3 className="ff bold" style={{ fontSize: 20 }}>Select Time Slot</h3>
        <p className="sm mut mt12">{att.name} · {new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <div className="grid mt24" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12 }}>
          {sl.map((s, i) => <button key={i} disabled={s.status === 'Fully Booked'} onClick={() => setSlot(s.time)}
            className={'slot ' + (slot === s.time ? 'on' : '') + (s.status === 'Fully Booked' ? ' full' : '')} style={{ padding: '14px 8px' }}>
            {s.time}<small style={{ color: slot === s.time ? 'rgba(255,255,255,.8)' : s.status === 'Available' ? 'var(--ok)' : s.status === 'Limited' ? 'var(--warn)' : 'var(--bad)' }}>
              {s.status === 'Fully Booked' ? 'Fully Booked' : s.left + ' of ' + s.cap + ' left'}</small></button>)}</div>
        <div className="row gap12 mt24">{[['Available', 'b-ok'], ['Limited', 'b-warn'], ['Fully Booked', 'b-bad']].map(([l, c], i) => <span key={i} className={'badge ' + c}><span className="dot" />{l}</span>)}</div></>}
      {step === 4 && <><div className="row between wrapf gap12"><div><h3 className="ff bold" style={{ fontSize: 20 }}>Select Visitors</h3>
          <p className="sm mut mt12">Saved visitors load automatically. Maximum 6 adults and 12 children.</p></div>
        <button className="btn btn-out btn-sm" onClick={() => toast('Add visitor form opened')}><I d={Ic.plus} s={14} /> Add Visitor</button></div>
        <div className="grid g2 mt24" style={{ gap: 14 }}>{VISITORS.map((v) => {const on = sel.includes(v.id);return (
                <div key={v.id} className="card row between" style={{ padding: 16, borderColor: on ? 'var(--turq)' : 'var(--line)', background: on ? '#F4FCFD' : '#fff' }}>
            <div className="row gap12">
              <button onClick={() => setSel(on ? sel.filter((x) => x !== v.id) : [...sel, v.id])} aria-label="Select visitor"
                    style={{ width: 22, height: 22, borderRadius: 7, border: '2px solid ' + (on ? 'var(--turq)' : '#CFDDE5'), background: on ? 'var(--turq)' : '#fff', color: '#fff', display: 'grid', placeItems: 'center', flex: 'none' }}>
                {on && <I d={Ic.tick} s={13} />}</button>
              <div><div className="semi sm">{v.n}</div>
                <div className="row gap8 xs mut mt8"><span className="badge b-grey" style={{ padding: '3px 8px' }}>{v.t}</span><span>{v.nat}</span><span className="mono">{v.idn}</span></div></div></div>
            <div className="row gap8"><button className="icb" style={{ width: 32, height: 32 }} onClick={() => toast('Edit visitor')} aria-label="Edit"><I d={Ic.edit} s={13} /></button>
              <button className="icb" style={{ width: 32, height: 32, color: 'var(--bad)' }} onClick={() => toast('Visitor removed')} aria-label="Remove"><I d={Ic.trash} s={13} /></button></div>
          </div>);})}</div>
        <div className="row between card mt24" style={{ padding: '14px 18px', background: '#F7FBFC' }}>
          <span className="sm semi">{adults} Adults · {kids} Children selected</span>
          <span className="xs mut">Limit: 6 adults, 12 children</span></div></>}
      {step === 5 && <><h3 className="ff bold" style={{ fontSize: 20 }}>Nationality</h3>
        <p className="sm mut mt12">Ticket pricing varies between Indian and foreign nationals as per government tariff.</p>
        <div className="grid g2 mt24" style={{ gap: 16, maxWidth: 600 }}>{[['Indian', 'Indian National', att.inr, 'flag'], ['Foreign', 'Foreign National', att.fx, 'globe']].map(([k, l, p]) =>
            <button key={k} className="card" style={{ padding: 22, textAlign: 'left', borderColor: nat === k ? 'var(--ocean)' : 'var(--line)', background: nat === k ? '#F5F9FB' : '#fff', boxShadow: nat === k ? '0 0 0 3px rgba(5,58,94,.08)' : 'none' }} onClick={() => setNat(k)}>
            <div className="row between"><div className="semi">{l}</div>{nat === k && <I d={Ic.check2} s={19} style={{ color: 'var(--ocean)' }} />}</div>
            <div className="ff bold mt12" style={{ fontSize: 25, color: 'var(--ocean)' }}>{fmt(p)}</div>
            <div className="xs mut mt8">per adult · children at 50%</div></button>)}</div>
        <div className="card mt24 row gap12" style={{ padding: 16, background: '#FFF8F2', borderColor: '#F5DFCA', alignItems: 'flex-start', maxWidth: 600 }}>
          <I d={Ic.alert} s={16} style={{ color: 'var(--warn)', marginTop: 1 }} />
          <div className="xs" style={{ lineHeight: 1.7 }}>Foreign nationals must carry a valid passport and, where applicable, a Restricted Area Permit at the attraction gate.</div></div></>}
      {step === 6 && <><h3 className="ff bold" style={{ fontSize: 20 }}>Review Your Booking</h3><p className="sm mut mt12">Confirm all details before proceeding to payment.</p>
        <div className="card mt24" style={{ overflow: 'hidden' }}>
          <div className="row gap16" style={{ padding: 20, borderBottom: '1px solid var(--line)' }}>
            <div style={{ width: 72, height: 72, borderRadius: 14, backgroundImage: `url(${att.img})`, backgroundSize: 'cover', flex: 'none' }} />
            <div><span className="badge b-turq">{att.cat}</span><h4 className="ff bold mt8" style={{ fontSize: 17 }}>{att.name}</h4>
              <div className="xs mut mt8 row gap8"><I d={Ic.pin} s={12} />{att.loc}</div></div></div>
          {[['Date', new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })],
            ['Time Slot', slot], ['Visitors', `${adults} Adults, ${kids} Children`],
            ['Visitor Names', VISITORS.filter((v) => sel.includes(v.id)).map((v) => v.n).join(', ')], ['Nationality', nat + ' National']].map((x, i) =>
            <div key={i} className="row between wrapf gap8" style={{ padding: '13px 20px', borderBottom: '1px solid var(--line)' }}>
              <span className="sm mut">{x[0]}</span><span className="semi sm" style={{ textAlign: 'right' }}>{x[1]}</span></div>)}
          <div style={{ padding: 20, background: '#F9FBFC' }}>
            <div className="row between sm" style={{ marginBottom: 9 }}><span className="mut">{adults} Adult × {fmt(base)}</span><span className="semi">{fmt(adults * base)}</span></div>
            {kids > 0 && <div className="row between sm" style={{ marginBottom: 9 }}><span className="mut">{kids} Child × {fmt(Math.round(base * .5))}</span><span className="semi">{fmt(kids * Math.round(base * .5))}</span></div>}
            <div className="row between sm" style={{ marginBottom: 9 }}><span className="mut">Taxes (GST 5%)</span><span className="semi">{fmt(tax)}</span></div>
            <div className="row between sm"><span className="mut">Convenience fee</span><span className="semi">₹25</span></div>
            <div className="sep" />
            <div className="row between"><span className="ff bold">Total Payable</span><span className="ff bold" style={{ fontSize: 25, color: 'var(--ocean)' }}>{fmt(sub + tax + 25)}</span></div></div>
        </div></>}
      <div className="row between mt32">
        <button className="btn btn-out" disabled={step === 1} onClick={() => setStep(step - 1)}><I d={Ic.chevl} s={15} /> Back</button>
        {step < 6 ? <button className="btn btn-coral" onClick={next}>Continue <I d={Ic.chev} s={15} /></button> :
          <button className="btn btn-coral btn-lg" onClick={() => {addCart(att, slot, date, adults, kids, nat);go('payment');}}><I d={Ic.lock} s={16} /> Proceed to Payment</button>}</div>
    </div>
  </div></div>;
}