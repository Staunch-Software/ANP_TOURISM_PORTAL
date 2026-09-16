import React, { useState } from 'react';
import { Field } from '../components/common/Field';
import { I, Ic } from '../components/common/Icons';
import { useApp } from '../context/AppContext';
import { IMG } from '../services/images';
import { fmt } from '../utils/format';

export function Payment() {
  const { go, cart, toast } = useApp();
  const [pm, setPm] = useState('UPI'),[busy, setBusy] = useState(false),[fail, setFail] = useState(false);
  const [c, setC] = useState({ n: '', e: '', cv: '', h: '' }),[err, setErr] = useState({});
  const sub = cart.reduce((s, x) => s + x.amt, 0) || 2102,tax = Math.round(sub * .05),tot = sub + tax + 25;
  const pay = () => {if (pm === 'Credit Card' || pm === 'Debit Card') {const e = {};
      if (!/^\d{16}$/.test(c.n.replace(/\s/g, ''))) e.n = 'Enter a valid 16-digit card number';
      if (!/^\d{2}\/\d{2}$/.test(c.e)) e.e = 'Use MM/YY format';
      if (!/^\d{3}$/.test(c.cv)) e.cv = '3-digit CVV required';
      if (!c.h.trim()) e.h = 'Card holder name is required';
      setErr(e);if (Object.keys(e).length) return;}
    setFail(false);setBusy(true);setTimeout(() => {setBusy(false);go('confirm');}, 1500);};
  return <div className="sec"><div className="wrap" style={{ maxWidth: 1080 }}>
    <div className="center" style={{ marginBottom: 32 }}><div className="eyebrow">Secure Checkout</div><h1 className="h2" style={{ fontSize: 31 }}>Complete Your Payment</h1></div>
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.25fr)', gap: 30, alignItems: 'start' }} className="paygrid">
      <div className="card" style={{ padding: 26, position: 'sticky', top: 96 }}>
        <h3 className="ff bold" style={{ fontSize: 17 }}>Booking Summary</h3><div className="sep" />
        {(cart.length ? cart : [{ name: 'Radhanagar Beach', slot: '09:00 AM', date: '18 Sep 2026', ad: 2, ch: 1, amt: 2102, img: IMG.radha, cat: 'Beaches' }]).map((x, i) =>
          <div key={i} className="row gap12" style={{ marginBottom: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, backgroundImage: `url(${x.img})`, backgroundSize: 'cover', flex: 'none' }} />
            <div style={{ flex: 1, minWidth: 0 }}><div className="semi sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x.name}</div>
              <div className="xs mut mt8">{x.date} · {x.slot} · {x.ad + x.ch} visitors</div></div>
            <div className="semi sm">{fmt(x.amt)}</div></div>)}
        <div className="sep" />
        <div className="row between sm" style={{ marginBottom: 9 }}><span className="mut">Subtotal</span><span className="semi">{fmt(sub)}</span></div>
        <div className="row between sm" style={{ marginBottom: 9 }}><span className="mut">Taxes (GST 5%)</span><span className="semi">{fmt(tax)}</span></div>
        <div className="row between sm"><span className="mut">Convenience Fee</span><span className="semi">₹25</span></div>
        <div className="sep" />
        <div className="row between"><span className="ff bold">Total</span><span className="ff bold" style={{ fontSize: 24, color: 'var(--ocean)' }}>{fmt(tot)}</span></div>
        <div className="card mt24" style={{ padding: 14, background: '#F6FCF9', borderColor: '#C6E9D9' }}>
          {['Secure Payment', 'Encrypted Transaction', 'Refund to Original Payment Method'].map((t, i) =>
            <div key={i} className="row gap8 xs semi" style={{ marginBottom: i < 2 ? 8 : 0 }}><I d={Ic.check2} s={14} style={{ color: 'var(--sea)' }} /> {t}</div>)}</div>
      </div>
      <div className="card" style={{ padding: 28 }}>
        <h3 className="ff bold" style={{ fontSize: 18 }}>Payment Method</h3>
        <div className="grid g2 mt24" style={{ gap: 12 }}>
          {[['UPI', 'zap', 'Pay via any UPI app'], ['Credit Card', 'card', 'Visa, Mastercard, RuPay'], ['Debit Card', 'card', 'All major banks'], ['Net Banking', 'db', '60+ banks supported'], ['E-Wallet', 'wallet', 'Paytm, PhonePe, Amazon Pay']].map(([m, ic, sb]) =>
            <button key={m} className={'pm ' + (pm === m ? 'on' : '')} onClick={() => {setPm(m);setErr({});}}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: pm === m ? 'var(--ocean)' : '#F2F6F8', color: pm === m ? '#fff' : 'var(--ocean)', display: 'grid', placeItems: 'center', flex: 'none' }}><I d={Ic[ic]} s={18} /></div>
              <div><div className="semi sm">{m}</div><div className="xs mut mt8">{sb}</div></div>
              {pm === m && <I d={Ic.check2} s={18} style={{ color: 'var(--ocean)', marginLeft: 'auto' }} />}</button>)}</div>
        <div className="sep" style={{ margin: '28px 0' }} />
        {(pm === 'Credit Card' || pm === 'Debit Card') && <div className="fade">
          <h4 className="ff bold" style={{ fontSize: 15.5, marginBottom: 18 }}>Card Details</h4>
          <Field label="Card Number" error={err.n}><input className={'inp mono ' + (err.n ? 'err' : '')} maxLength={19} placeholder="0000 0000 0000 0000"
              value={c.n} onChange={(e) => setC({ ...c, n: e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim() })} /></Field>
          <div className="grid g2 mt16" style={{ gap: 16 }}>
            <Field label="Expiry Date" error={err.e}><input className={'inp mono ' + (err.e ? 'err' : '')} maxLength={5} placeholder="MM/YY" value={c.e}
                onChange={(e) => {let v = e.target.value.replace(/\D/g, '');if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2, 4);setC({ ...c, e: v });}} /></Field>
            <Field label="CVV" error={err.cv}><input type="password" className={'inp mono ' + (err.cv ? 'err' : '')} maxLength={3} placeholder="•••" value={c.cv} onChange={(e) => setC({ ...c, cv: e.target.value.replace(/\D/g, '') })} /></Field></div>
          <div className="mt16"><Field label="Card Holder Name" error={err.h}><input className={'inp ' + (err.h ? 'err' : '')} placeholder="Name as printed on card" value={c.h} onChange={(e) => setC({ ...c, h: e.target.value })} /></Field></div>
        </div>}
        {pm === 'UPI' && <div className="fade"><Field label="UPI ID" hint="You will receive a collect request on your UPI app"><input className="inp" placeholder="yourname@upi" defaultValue="arun.k@okaxis" /></Field>
          <div className="row gap12 wrapf mt24">{['Google Pay', 'PhonePe', 'Paytm', 'BHIM'].map((u) => <span key={u} className="chip b-grey" style={{ padding: '10px 16px' }}>{u}</span>)}</div></div>}
        {pm === 'Net Banking' && <div className="fade"><Field label="Select Your Bank"><select className="inp">
          {['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Punjab National Bank', 'Kotak Mahindra Bank', 'Bank of Baroda', 'Canara Bank'].map((b) => <option key={b}>{b}</option>)}</select></Field>
          <div className="xs mut mt12">You will be redirected to your bank's secure login page.</div></div>}
        {pm === 'E-Wallet' && <div className="fade"><label className="lbl">Select Wallet</label>
          <div className="grid g2" style={{ gap: 12 }}>{['Paytm Wallet', 'PhonePe Wallet', 'Amazon Pay', 'Mobikwik'].map((w) =>
              <button key={w} className="pm"><I d={Ic.wallet} s={18} style={{ color: 'var(--ocean)' }} /><span className="semi sm">{w}</span></button>)}</div></div>}
        {fail && <div className="card mt24 row gap12 fade" style={{ padding: 16, background: '#FDECEB', borderColor: '#F5C9C6', alignItems: 'flex-start' }}>
          <I d={Ic.alert} s={18} style={{ color: 'var(--bad)', marginTop: 1 }} />
          <div><div className="semi sm" style={{ color: 'var(--bad)' }}>Payment failed</div>
            <div className="xs mut mt8">The transaction was declined by your bank. No amount has been deducted. Please try a different payment method.</div></div></div>}
        <button className="btn btn-coral btn-block btn-lg mt32" disabled={busy} onClick={pay}>
          {busy ? <>Processing payment…</> : <><I d={Ic.lock} s={17} /> Pay Securely · {fmt(tot)}</>}</button>
        <button className="btn btn-out btn-block mt12" onClick={() => {setFail(true);toast('Simulated a failed transaction');}}>Simulate Payment Failure</button>
        <div className="row gap16 wrapf xs mut mt24" style={{ justifyContent: 'center' }}>
          <span className="row gap8"><I d={Ic.lock} s={13} /> 256-bit SSL</span>
          <span className="row gap8"><I d={Ic.shield} s={13} /> PCI-DSS Compliant</span>
          <span className="row gap8"><I d={Ic.refresh} s={13} /> Refund to source</span></div>
      </div>
    </div>
    <style>{`@media(max-width:980px){.paygrid{grid-template-columns:1fr!important}.paygrid>div:first-child{position:static!important}}`}</style>
  </div></div>;
}