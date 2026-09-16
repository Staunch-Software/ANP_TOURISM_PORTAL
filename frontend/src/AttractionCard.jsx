import React from 'react';
import { I, Ic } from '../common/Icons';
import { useApp } from '../../context/AppContext';
import { SLOTS } from '../../services/data';
import { fmt } from '../../utils/format';

export function ACard({ a, compact }) {
  const { go, addCart, toast } = useApp();
  return <article className="acard">
    <div className="im" style={{ backgroundImage: `url(${a.img})` }}>
      <span className="ovl badge" style={{ top: 14, left: 14, background: 'rgba(255,255,255,.95)', color: 'var(--ocean)' }}>{a.cat}</span>
      <span className="ovl" style={{ top: 14, right: 14 }}><span className="rate"><I d={Ic.star} s={12} f="currentColor" /> {a.rate}</span></span>
      <span className="ovl badge b-ok" style={{ bottom: 14, left: 14 }}><span className="dot" /> {SLOTS(a.id.charCodeAt(2)).filter((s) => s.status !== 'Fully Booked').length} slots today</span>
    </div>
    <div className="acb">
      <h3 className="ff" style={{ fontSize: 17.5, fontWeight: 700, lineHeight: 1.3 }}>{a.name}</h3>
      <div className="meta mt8"><I d={Ic.pin} s={13} /> {a.loc}</div>
      <p className="sm mut mt12" style={{ lineHeight: 1.62, flex: 1 }}>{a.desc}</p>
      <div className="sep" />
      <div className="row gap16 wrapf xs mut" style={{ marginBottom: 14 }}>
        <span className="row gap8"><I d={Ic.clock} s={13} /> {a.hrs}</span>
        <span className="row gap8"><I d={Ic.activity} s={13} /> {a.time}</span>
        <span className="row gap8"><I d={Ic.star} s={13} /> {a.rev.toLocaleString('en-IN')} reviews</span>
      </div>
      <div className="row between">
        <div><div className="xs mut">Starting from</div><div className="ff bold" style={{ fontSize: 20, color: 'var(--ocean)' }}>{fmt(a.inr)} <span className="xs mut" style={{ fontWeight: 500 }}>/ person</span></div></div>
        <div className="row gap8">
          <button className="btn btn-out btn-sm" onClick={() => go('detail', a)}>View Details</button>
          {!compact && <button className="btn btn-coral btn-sm" onClick={() => {addCart(a, '10:00 AM', '18 Sep 2026', 2, 1);toast('Added to My Trip Cart');}}>Book Now</button>}
        </div>
      </div>
    </div>
  </article>;
}