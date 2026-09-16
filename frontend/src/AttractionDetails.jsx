import React, { useState } from 'react';
import { ACard } from '../components/attractions/AttractionCard';
import { Field } from '../components/common/Field';
import { I, Ic } from '../components/common/Icons';
import { useApp } from '../context/AppContext';
import { ATTR, SLOTS } from '../services/data';
import { fmt } from '../utils/format';

export function Detail({ a }) {
  const { go, addCart, toast } = useApp();
  const [date, setDate] = useState('2026-09-18'),[slot, setSlot] = useState(null),[ad, setAd] = useState(2),[ch, setCh] = useState(1),[nat, setNat] = useState('Indian'),[tab, setTab] = useState('About');
  const sl = SLOTS(a.id.charCodeAt(2));
  const base = nat === 'Indian' ? a.inr : a.fx;
  const total = ad * base + ch * Math.round(base * 0.5);
  return <>
    <div style={{ position: 'relative', height: 400, backgroundImage: `url(${a.img})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,rgba(4,35,58,.9),rgba(4,35,58,.25))' }} />
      <div className="wrap" style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'flex-end', paddingBottom: 36, color: '#fff' }}>
        <div style={{ width: '100%' }}>
          <button className="row gap8 xs semi" style={{ opacity: .85, marginBottom: 14 }} onClick={() => go('explore')}><I d={Ic.chevl} s={14} /> Back to Explore</button>
          <div className="row gap8 wrapf" style={{ marginBottom: 12 }}>
            <span className="badge" style={{ background: 'rgba(255,255,255,.94)', color: 'var(--ocean)' }}>{a.cat}</span>
            <span className="badge b-ok"><span className="dot" /> Open Today</span>
            <span className="badge" style={{ background: 'rgba(255,255,255,.18)', color: '#fff' }}><I d={Ic.shield} s={12} /> Government Verified</span></div>
          <h1 className="ff" style={{ fontSize: 38, fontWeight: 700, letterSpacing: -1.2, lineHeight: 1.15 }}>{a.name}</h1>
          <div className="row gap24 wrapf mt16" style={{ fontSize: 13.5, opacity: .92, fontWeight: 600 }}>
            <span className="row gap8"><I d={Ic.star} s={15} f="currentColor" /> {a.rate} · {a.rev.toLocaleString('en-IN')} reviews</span>
            <span className="row gap8"><I d={Ic.pin} s={15} /> {a.loc}</span>
            <span className="row gap8"><I d={Ic.clock} s={15} /> {a.hrs}</span>
            <span className="row gap8"><I d={Ic.activity} s={15} /> {a.time}</span></div>
        </div></div></div>
    <div className="sec" style={{ paddingTop: 36 }}><div className="wrap">
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.9fr) minmax(0,1fr)', gap: 36, alignItems: 'start' }} className="dgrid">
        <div>
          <div className="row gap8 wrapf" style={{ borderBottom: '1.5px solid var(--line)', marginBottom: 26 }}>
            {['About', 'Highlights', 'Facilities', 'Important Information', 'Pricing'].map((t) =>
              <button key={t} onClick={() => setTab(t)} style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: tab === t ? 'var(--ocean)' : 'var(--muted)', borderBottom: '3px solid ' + (tab === t ? 'var(--coral)' : 'transparent'), marginBottom: -1.5 }}>{t}</button>)}
          </div>
          <div className="fade" key={tab}>
          {tab === 'About' && <><h3 className="ff bold" style={{ fontSize: 20 }}>About this attraction</h3>
            <p className="sub" style={{ maxWidth: 'none', fontSize: 15.5 }}>{a.about}</p>
            <div className="grid g3 mt32" style={{ gap: 16 }}>
              {[['Opening Hours', a.hrs, 'clock'], ['Exploration Time', a.time, 'activity'], ['Location', a.loc, 'pin']].map((x, i) =>
                  <div key={i} className="card" style={{ padding: 18 }}>
                  <div className="sicn" style={{ width: 38, height: 38, background: '#E8F6F8', color: 'var(--turq)', marginBottom: 10, borderRadius: 11 }}><I d={Ic[x[2]]} s={18} /></div>
                  <div className="xs mut">{x[0]}</div><div className="semi sm mt8">{x[1]}</div></div>)}</div></>}
          {tab === 'Highlights' && <><h3 className="ff bold" style={{ fontSize: 20 }}>Highlights</h3>
            <div className="grid g2 mt24" style={{ gap: 14 }}>{a.high.map((h, i) =>
                  <div key={i} className="row gap12 card" style={{ padding: '14px 16px', alignItems: 'flex-start' }}>
                <div style={{ width: 24, height: 24, borderRadius: 8, background: '#FFF0EC', color: 'var(--coral)', display: 'grid', placeItems: 'center', flex: 'none' }}><I d={Ic.star} s={12} f="currentColor" /></div>
                <span className="sm semi">{h}</span></div>)}</div></>}
          {tab === 'Facilities' && <><h3 className="ff bold" style={{ fontSize: 20 }}>Facilities available</h3>
            <div className="grid g3 mt24" style={{ gap: 12 }}>{a.fac.map((f, i) =>
                  <div key={i} className="row gap8 sm semi card" style={{ padding: '13px 15px' }}>
                <I d={Ic.check2} s={16} style={{ color: 'var(--sea)' }} /> {f}</div>)}</div></>}
          {tab === 'Important Information' && <><h3 className="ff bold" style={{ fontSize: 20 }}>Important information</h3>
            <div className="card mt24" style={{ padding: 8 }}>{a.info.map((f, i) =>
                  <div key={i} className="row gap12" style={{ padding: '14px 14px', borderBottom: i < a.info.length - 1 ? '1px solid var(--line)' : 'none', alignItems: 'flex-start' }}>
                <I d={Ic.alert} s={16} style={{ color: 'var(--warn)', marginTop: 1 }} /><span className="sm">{f}</span></div>)}</div>
            <div className="card mt24 row gap12" style={{ padding: 18, background: '#F2FAFB', borderColor: '#CFEAEE', alignItems: 'flex-start' }}>
              <I d={Ic.info} s={18} style={{ color: 'var(--ocean)', marginTop: 2 }} />
              <div><div className="semi sm">Cancellation policy</div>
                <p className="xs mut mt8" style={{ lineHeight: 1.7 }}>Free cancellation up to 24 hours before the slot start time, with full refund to the original payment method within 5–7 working days. Cancellations within 24 hours are refunded at 50%. No-shows are non-refundable.</p></div></div></>}
          {tab === 'Pricing' && <><h3 className="ff bold" style={{ fontSize: 20 }}>Pricing</h3>
            <div className="card mt24" style={{ overflow: 'hidden' }}><table>
              <thead><tr><th>Visitor Category</th><th>Indian National</th><th>Foreign National</th><th>Notes</th></tr></thead>
              <tbody>
                <tr><td className="semi">Adult (12+ years)</td><td className="bold">{fmt(a.inr)}</td><td className="bold">{fmt(a.fx)}</td><td className="mut">Standard entry</td></tr>
                <tr><td className="semi">Child (5–11 years)</td><td className="bold">{fmt(Math.round(a.inr * .5))}</td><td className="bold">{fmt(Math.round(a.fx * .5))}</td><td className="mut">50% concession</td></tr>
                <tr><td className="semi">Child (under 5)</td><td className="bold" style={{ color: 'var(--sea)' }}>Free</td><td className="bold" style={{ color: 'var(--sea)' }}>Free</td><td className="mut">Age proof required</td></tr>
                <tr><td className="semi">Senior Citizen (60+)</td><td className="bold">{fmt(Math.round(a.inr * .75))}</td><td className="bold">{fmt(a.fx)}</td><td className="mut">Indian nationals only</td></tr>
              </tbody></table></div>
            <div className="xs mut mt16">All prices are inclusive of attraction entry. Government taxes (5% GST) and a convenience fee of ₹25 per booking are applied at checkout.</div></>}
          </div>
          <div className="mt48">
            <h3 className="ff bold" style={{ fontSize: 20, marginBottom: 18 }}>Available Slots · {new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</h3>
            <div className="card" style={{ padding: 22 }}>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(148px,1fr))', gap: 12 }}>
                {sl.map((s, i) => <button key={i} disabled={s.status === 'Fully Booked'} onClick={() => setSlot(s.time)}
                  className={'slot ' + (slot === s.time ? 'on' : '') + (s.status === 'Fully Booked' ? ' full' : '')}>
                  {s.time}<small style={{ color: slot === s.time ? 'rgba(255,255,255,.8)' : s.status === 'Available' ? 'var(--ok)' : s.status === 'Limited' ? 'var(--warn)' : 'var(--bad)' }}>
                    {s.status === 'Fully Booked' ? 'Fully Booked' : s.left + ' of ' + s.cap + ' left'}</small></button>)}
              </div>
              <div className="sep" />
              <div className="row between wrapf gap12">
                <div className="row gap12">{[['Available', 'b-ok'], ['Limited', 'b-warn'], ['Fully Booked', 'b-bad']].map(([l, c], i) => <span key={i} className={'badge ' + c}><span className="dot" />{l}</span>)}</div>
                <span className="xs mut row gap8"><I d={Ic.refresh} s={13} /> Capacity synced 2 minutes ago</span></div>
            </div>
          </div>
        </div>
        <div style={{ position: 'sticky', top: 96 }}>
          <div className="card" style={{ padding: 24, boxShadow: 'var(--sh-md)' }}>
            <div className="row between">
              <div><div className="xs mut">Starting from</div>
                <div className="ff bold" style={{ fontSize: 27, color: 'var(--ocean)', letterSpacing: -1 }}>{fmt(base)}</div>
                <div className="xs mut">per adult · {nat} national</div></div>
              <span className="badge b-ok"><span className="dot" />Open</span></div>
            <div className="sep" />
            <Field label="Select Date"><input type="date" className="inp" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
            <div className="mt16"><label className="lbl">Available Slots</label>
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                {sl.slice(0, 6).map((s, i) => <button key={i} disabled={s.status === 'Fully Booked'} onClick={() => setSlot(s.time)}
                  className={'slot ' + (slot === s.time ? 'on' : '') + (s.status === 'Fully Booked' ? ' full' : '')} style={{ padding: '9px 4px', fontSize: 12.5 }}>
                  {s.time}<small style={{ color: slot === s.time ? 'rgba(255,255,255,.8)' : s.status === 'Available' ? 'var(--ok)' : s.status === 'Limited' ? 'var(--warn)' : 'var(--bad)' }}>{s.status === 'Fully Booked' ? 'Full' : s.left + ' left'}</small></button>)}
              </div></div>
            <div className="mt16"><label className="lbl">Visitors</label>
              {[['Adults', ad, setAd, 1, 6, '12+ years'], ['Children', ch, setCh, 0, 12, '5–11 years']].map(([l, v, set, min, max, sub], i) =>
                <div key={i} className="row between" style={{ padding: '11px 0', borderBottom: i === 0 ? '1px solid var(--line)' : 'none' }}>
                  <div><div className="semi sm">{l}</div><div className="xs mut">{sub}</div></div>
                  <div className="row gap12">
                    <button className="icb" style={{ width: 32, height: 32 }} disabled={v <= min} onClick={() => set(v - 1)} aria-label={'Fewer ' + l}><I d={Ic.minus} s={14} /></button>
                    <b style={{ minWidth: 18, textAlign: 'center' }}>{v}</b>
                    <button className="icb" style={{ width: 32, height: 32 }} disabled={v >= max} onClick={() => set(v + 1)} aria-label={'More ' + l}><I d={Ic.plus} s={14} /></button></div></div>)}
              <div className="xs mut mt8">Maximum 6 adults and 12 children per booking</div></div>
            <div className="mt16"><label className="lbl">Nationality</label>
              <div className="grid g2" style={{ gap: 9 }}>{['Indian', 'Foreign'].map((x) =>
                  <button key={x} className={'slot ' + (nat === x ? 'on' : '')} onClick={() => setNat(x)}>{x}</button>)}</div></div>
            <div className="sep" />
            <div className="sm">
              <div className="row between" style={{ marginBottom: 8 }}><span className="mut">{ad} Adult × {fmt(base)}</span><span className="semi">{fmt(ad * base)}</span></div>
              {ch > 0 && <div className="row between" style={{ marginBottom: 8 }}><span className="mut">{ch} Child × {fmt(Math.round(base * .5))}</span><span className="semi">{fmt(ch * Math.round(base * .5))}</span></div>}
              <div className="row between" style={{ marginBottom: 8 }}><span className="mut">GST (5%)</span><span className="semi">{fmt(Math.round(total * .05))}</span></div>
              <div className="row between"><span className="mut">Convenience fee</span><span className="semi">₹25</span></div>
            </div>
            <div className="sep" />
            <div className="row between" style={{ marginBottom: 16 }}>
              <span className="ff bold">Total</span>
              <span className="ff bold" style={{ fontSize: 23, color: 'var(--ocean)' }}>{fmt(Math.round(total * 1.05) + 25)}</span></div>
            {!slot && <div className="badge b-warn" style={{ width: '100%', justifyContent: 'center', padding: '9px' }}><I d={Ic.info} s={13} /> Select a time slot to continue</div>}
            <button className="btn btn-coral btn-block btn-lg mt12" disabled={!slot} onClick={() => {addCart(a, slot, date, ad, ch, nat);go('booking', a);}}>Book Now</button>
            <button className="btn btn-out btn-block mt12" onClick={() => {if (!slot) return toast('Select a slot first');addCart(a, slot, date, ad, ch, nat);toast('Added to your itinerary');}}><I d={Ic.plus} s={15} /> Add to Itinerary</button>
            <div className="row gap8 xs mut mt16" style={{ justifyContent: 'center' }}><I d={Ic.lock} s={13} /> Secure booking · Free cancellation up to 24 hrs</div>
          </div>
        </div>
      </div>
      <div className="mt48"><h3 className="ff bold" style={{ fontSize: 21, marginBottom: 20 }}>You may also like</h3>
        <div className="grid g3">{ATTR.filter((x) => x.id !== a.id).slice(0, 3).map((x) => <ACard key={x.id} a={x} compact />)}</div></div>
    </div></div>
    <style>{`@media(max-width:980px){.dgrid{grid-template-columns:1fr!important}}`}</style>
  </>;
}