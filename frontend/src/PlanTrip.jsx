import React, { useState } from 'react';
import { ACard } from '../components/attractions/AttractionCard';
import { Empty } from '../components/common/EmptyState';
import { Field } from '../components/common/Field';
import { I, Ic } from '../components/common/Icons';
import { useApp } from '../context/AppContext';
import { ATTR } from '../services/data';
import { IMG } from '../services/images';

export function Plan() {
  const { go, toast } = useApp();
  const [f, setF] = useState({ date: '2026-09-18', days: 2, ad: 2, ch: 1 }),[prefs, setPrefs] = useState(['Adventure', 'Heritage']),[built, setBuilt] = useState(false),[busy, setBusy] = useState(false);
  const P = ['Adventure', 'Nature', 'Heritage', 'Family', 'Relaxation', 'Water Sports'];
  const tog = (p) => setPrefs(prefs.includes(p) ? prefs.filter((x) => x !== p) : [...prefs, p]);
  const plan = [[IMG.radha, '09:00 AM', 'Radhanagar Beach', 'Havelock Island', '3 hrs', '₹750'],
  [null, '12:00 PM', 'Lunch / Break', 'Beach No. 5 food court', '1.5 hrs', '—'],
  [IMG.jail, '02:00 PM', 'Cellular Jail National Memorial', 'Port Blair', '2.5 hrs', '₹900'],
  [IMG.night, '06:00 PM', 'Light & Sound Show', 'Cellular Jail courtyard', '1 hr', '₹1,050']];
  return <>
    <div style={{ background: 'linear-gradient(130deg,var(--ocean),var(--ocean-2))', color: '#fff', padding: '56px 0 42px' }}><div className="wrap">
      <div className="eyebrow" style={{ color: 'var(--turq-2)' }}>Trip Planner</div>
      <h1 className="h2" style={{ fontSize: 38 }}>Plan Your Perfect Island Day</h1>
      <p className="sub" style={{ color: 'rgba(255,255,255,.82)' }}>Tell us your dates and interests. We'll match them against live slot availability.</p></div></div>
    <div className="sec" style={{ paddingTop: 34 }}><div className="wrap">
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,380px) minmax(0,1fr)', gap: 32, alignItems: 'start' }} className="pgrid">
        <div className="card" style={{ padding: 26, position: 'sticky', top: 96 }}>
          <h3 className="ff bold" style={{ fontSize: 18 }}>Trip Details</h3>
          <div className="mt24"><Field label="Visit Date"><input type="date" className="inp" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field></div>
          <div className="mt16"><Field label="Number of Days"><select className="inp" value={f.days} onChange={(e) => setF({ ...f, days: +e.target.value })}>
            {[1, 2, 3, 4, 5, 6, 7].map((d) => <option key={d} value={d}>{d} {d === 1 ? 'Day' : 'Days'}</option>)}</select></Field></div>
          <div className="grid g2 mt16" style={{ gap: 12 }}>
            <Field label="Adults"><input type="number" min="1" max="6" className="inp" value={f.ad} onChange={(e) => setF({ ...f, ad: +e.target.value })} /></Field>
            <Field label="Children"><input type="number" min="0" max="12" className="inp" value={f.ch} onChange={(e) => setF({ ...f, ch: +e.target.value })} /></Field></div>
          <div className="mt24"><label className="lbl">Preferences</label>
            <div className="row gap8 wrapf">{P.map((p) => <button key={p} className="chip" onClick={() => tog(p)}
                style={{ background: prefs.includes(p) ? 'var(--turq)' : '#F4F8FA', color: prefs.includes(p) ? '#fff' : 'var(--muted)', padding: '9px 15px', fontSize: 13, border: '1.5px solid ' + (prefs.includes(p) ? 'var(--turq)' : 'transparent') }}>
              {prefs.includes(p) && <I d={Ic.tick} s={12} />}{p}</button>)}</div>
            <div className="xs mut mt12">{prefs.length === 0 ? 'Select at least one preference for better recommendations' : `${prefs.length} preference${prefs.length > 1 ? 's' : ''} selected`}</div></div>
          <button className="btn btn-coral btn-block btn-lg mt24" disabled={busy || !prefs.length}
            onClick={() => {setBusy(true);setTimeout(() => {setBusy(false);setBuilt(true);toast('Itinerary generated from live availability');}, 900);}}>
            {busy ? 'Matching live slots…' : <><I d={Ic.zap} s={17} /> Build My Itinerary</>}</button>
        </div>
        <div>
          {!built && !busy && <div className="card"><Empty icon="layers" t="Your itinerary will appear here" s="Set your dates, party size and preferences, then build a slot-aware plan that fits the day." /></div>}
          {busy && <div className="card" style={{ padding: 26 }}>
            <div className="skel" style={{ height: 22, width: '40%' }} />
            {[1, 2, 3, 4].map((i) => <div key={i} className="row gap16 mt24"><div className="skel" style={{ width: 52, height: 52, borderRadius: 14 }} />
              <div style={{ flex: 1 }}><div className="skel" style={{ height: 14, width: '50%' }} /><div className="skel mt8" style={{ height: 11, width: '32%' }} /></div></div>)}</div>}
          {built && <div className="fade">
            <div className="card row between wrapf gap16" style={{ padding: '20px 24px', marginBottom: 20, background: 'linear-gradient(120deg,#F3FBFC,#fff)' }}>
              <div><div className="ff bold" style={{ fontSize: 18 }}>Your {f.days}-Day Island Plan</div>
                <div className="sm mut mt8">{new Date(f.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} · {f.ad} Adults, {f.ch} Child{f.ch !== 1 ? 'ren' : ''} · {prefs.join(', ')}</div></div>
              <span className="badge b-ok"><I d={Ic.check2} s={13} /> All slots available</span></div>
            <div className="card" style={{ padding: 28 }}>
              <div className="row between" style={{ marginBottom: 24 }}><h3 className="ff bold" style={{ fontSize: 17 }}>Day 1 · Thursday</h3>
                <span className="badge b-turq">Havelock + Port Blair circuit</span></div>
              {plan.map((t, i) => <div key={i} className="tl"><div className="tl-d">{i + 1}</div>
                <div className="row between wrapf gap12">
                  <div className="row gap16">
                    {t[0] ? <div style={{ width: 60, height: 60, borderRadius: 14, backgroundImage: `url(${t[0]})`, backgroundSize: 'cover', flex: 'none' }} /> :
                      <div style={{ width: 60, height: 60, borderRadius: 14, background: '#F2F6F8', display: 'grid', placeItems: 'center', color: 'var(--muted)', flex: 'none' }}><I d={Ic.gift} s={22} /></div>}
                    <div><div className="xs bold" style={{ color: 'var(--turq)', letterSpacing: .6 }}>{t[1]}</div>
                      <div className="ff semi mt8" style={{ fontSize: 15.5 }}>{t[2]}</div>
                      <div className="row gap12 xs mut mt8"><span className="row gap8"><I d={Ic.pin} s={12} />{t[3]}</span><span className="row gap8"><I d={Ic.clock} s={12} />{t[4]}</span></div></div></div>
                  <div className="row gap12"><span className="semi sm">{t[5]}</span>
                    {t[0] && <span className="badge b-ok"><span className="dot" />Slot held 15 min</span>}</div>
                </div></div>)}
              <div className="card row between wrapf gap16" style={{ padding: '18px 22px', background: '#F7FBFC', marginTop: 8 }}>
                <div><div className="xs mut">Estimated total for {f.ad + f.ch} visitors</div>
                  <div className="ff bold" style={{ fontSize: 24, color: 'var(--ocean)' }}>₹8,240</div>
                  <div className="xs mut mt8">Inclusive of GST and convenience fee</div></div>
                <div className="row gap12 wrapf">
                  <button className="btn btn-out" onClick={() => setBuilt(false)}><I d={Ic.edit} s={15} /> Customize Itinerary</button>
                  <button className="btn btn-coral" onClick={() => go('cart')}><I d={Ic.cart} s={16} /> Add All to Cart</button></div></div>
            </div>
            <div className="grid g3 mt24">{ATTR.slice(4, 7).map((a) => <ACard key={a.id} a={a} compact />)}</div>
          </div>}
        </div>
      </div></div></div>
    <style>{`@media(max-width:980px){.pgrid{grid-template-columns:1fr!important}.pgrid>div:first-child{position:static!important}}`}</style>
  </>;
}