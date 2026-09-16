import React from 'react';
import { Empty } from '../components/common/EmptyState';
import { I, Ic } from '../components/common/Icons';
import { useApp } from '../context/AppContext';
import { ATTR } from '../services/data';
import { fmt } from '../utils/format';

export function Cart() {
  const { cart, go, removeCart, toast } = useApp();
  const sub = cart.reduce((s, c) => s + c.amt, 0),tax = Math.round(sub * .05),fee = cart.length ? 25 : 0;
  return <div className="sec"><div className="wrap">
    <div className="row between wrapf gap16" style={{ marginBottom: 32 }}>
      <div><div className="eyebrow">Checkout</div><h1 className="h2">My Trip Cart</h1>
        <p className="sub">Combine multiple attractions into one booking and one payment.</p></div>
      <button className="btn btn-out" onClick={() => go('explore')}><I d={Ic.plus} s={16} /> Add More Attractions</button></div>
    {!cart.length ? <div className="card"><Empty icon="cart" t="Your trip cart is empty" s="Browse island attractions and add the slots you'd like to book." cta="Explore Attractions" onCta={() => go('explore')} /></div> :
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.9fr) minmax(0,1fr)', gap: 32, alignItems: 'start' }} className="cgrid">
      <div>{cart.map((c, i) =>
          <div key={i} className="card" style={{ padding: 20, marginBottom: 16 }}>
          <div className="row between wrapf gap16">
            <div className="row gap16">
              <div style={{ width: 92, height: 92, borderRadius: 14, backgroundImage: `url(${c.img})`, backgroundSize: 'cover', flex: 'none' }} />
              <div><span className="badge b-turq">{c.cat}</span>
                <h3 className="ff bold mt8" style={{ fontSize: 16.5 }}>{c.name}</h3>
                <div className="row gap16 wrapf xs mut mt12">
                  <span className="row gap8"><I d={Ic.cal} s={13} /> {c.date}</span>
                  <span className="row gap8"><I d={Ic.clock} s={13} /> {c.slot}</span>
                  <span className="row gap8"><I d={Ic.users} s={13} /> {c.ad} Adults, {c.ch} Child{c.ch !== 1 ? 'ren' : ''}</span>
                  <span className="row gap8"><I d={Ic.globe} s={13} /> {c.nat}</span></div></div></div>
            <div style={{ textAlign: 'right' }}>
              <div className="ff bold" style={{ fontSize: 19, color: 'var(--ocean)' }}>{fmt(c.amt)}</div>
              <div className="row gap8 mt12" style={{ justifyContent: 'flex-end' }}>
                <button className="btn btn-out btn-sm" onClick={() => go('detail', ATTR.find((a) => a.id === c.id))}><I d={Ic.edit} s={13} /> Edit</button>
                <button className="btn btn-sm" style={{ color: 'var(--bad)', border: '1.5px solid #F5D6D4' }} onClick={() => {removeCart(i);toast('Removed from cart');}}><I d={Ic.trash} s={13} /></button></div></div>
          </div></div>)}
        <div className="card row gap12" style={{ padding: 18, background: '#F7FBFC', alignItems: 'flex-start' }}>
          <I d={Ic.info} s={17} style={{ color: 'var(--ocean)', marginTop: 1 }} />
          <div className="xs" style={{ lineHeight: 1.75 }}>Slots in your cart are held for <b>15 minutes</b>. Complete payment before the hold expires to guarantee your booking. Free cancellation applies up to 24 hours before each slot.</div></div>
      </div>
      <div className="card" style={{ padding: 26, position: 'sticky', top: 96 }}>
        <h3 className="ff bold" style={{ fontSize: 17 }}>Price Summary</h3>
        <div className="sep" />
        {cart.map((c, i) => <div key={i} className="row between sm" style={{ marginBottom: 10 }}>
          <span className="mut" style={{ maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span><span className="semi">{fmt(c.amt)}</span></div>)}
        <div className="sep" />
        <div className="row between sm" style={{ marginBottom: 10 }}><span className="mut">Subtotal</span><span className="semi">{fmt(sub)}</span></div>
        <div className="row between sm" style={{ marginBottom: 10 }}><span className="mut">Taxes (GST 5%)</span><span className="semi">{fmt(tax)}</span></div>
        <div className="row between sm"><span className="mut">Convenience Fee</span><span className="semi">{fmt(fee)}</span></div>
        <div className="sep" />
        <div className="row between"><span className="ff bold">Total</span>
          <span className="ff bold" style={{ fontSize: 24, color: 'var(--ocean)' }}>{fmt(sub + tax + fee)}</span></div>
        <button className="btn btn-coral btn-block btn-lg mt24" onClick={() => go('payment')}><I d={Ic.lock} s={16} /> Proceed to Payment</button>
        <button className="btn btn-out btn-block mt12" onClick={() => go('explore')}>Add More Attractions</button>
        <div className="row gap8 xs mut mt24" style={{ justifyContent: 'center' }}><I d={Ic.shield} s={13} /> Secure encrypted checkout</div>
      </div>
    </div>}
    <style>{`@media(max-width:980px){.cgrid{grid-template-columns:1fr!important}.cgrid>div:last-child{position:static!important}}`}</style>
  </div></div>;
}