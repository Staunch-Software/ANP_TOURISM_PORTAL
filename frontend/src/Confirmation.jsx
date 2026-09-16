import React, { useEffect } from 'react';
import { I, Ic } from '../components/common/Icons';
import { TicketCard } from '../components/tickets/TicketCard';
import { useApp } from '../context/AppContext';

export function Confirm() {
  const { go, toast, clearCart } = useApp();
  useEffect(() => {clearCart();}, []);
  return <div className="sec" style={{ background: 'linear-gradient(170deg,var(--sand),#fff)' }}><div className="wrap" style={{ maxWidth: 900 }}>
    <div className="center fade" style={{ marginBottom: 36 }}>
      <div className="ebox" style={{ background: '#E5F6F0', color: 'var(--sea)', width: 92, height: 92 }}><I d={Ic.check2} s={44} /></div>
      <div className="badge b-ok" style={{ padding: '9px 20px', marginBottom: 16 }}><I d={Ic.tick} s={14} /> Booking Confirmed</div>
      <h1 className="h2" style={{ fontSize: 33 }}>Your island experience is booked</h1>
      <p className="sub" style={{ margin: '12px auto 0' }}>Your ticket has been sent to your registered mobile number and email.</p></div>
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,400px)', gap: 32, alignItems: 'start' }} className="cfgrid">
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', background: 'linear-gradient(120deg,var(--ocean),var(--ocean-2))', color: '#fff' }}>
          <div className="xs" style={{ opacity: .75, letterSpacing: 1.2, fontWeight: 700 }}>BOOKING REFERENCE</div>
          <div className="ff bold mono mt8" style={{ fontSize: 21 }}>AND-2026-084721</div></div>
        {[['Attraction', 'Radhanagar Beach'], ['Location', 'Havelock Island (Swaraj Dweep)'],
          ['Date', 'Thursday, 18 September 2026'], ['Time Slot', '09:00 AM'],
          ['Visitors', '2 Adults, 1 Child'], ['Visitor Names', 'Arun Krishnan, Meera Krishnan, Kavya Krishnan'],
          ['Nationality', 'Indian National'], ['Payment Method', 'UPI · arun.k@okaxis'], ['Transaction ID', 'TXN8847213904']].map((x, i) =>
          <div key={i} className="row between wrapf gap8" style={{ padding: '13px 24px', borderBottom: '1px solid var(--line)' }}>
            <span className="sm mut">{x[0]}</span><span className="semi sm" style={{ textAlign: 'right' }}>{x[1]}</span></div>)}
        <div className="row between" style={{ padding: '18px 24px', background: '#F7FBFC' }}>
          <span className="ff bold">Total Amount Paid</span><span className="ff bold" style={{ fontSize: 24, color: 'var(--sea)' }}>₹2,232</span></div>
        <div style={{ padding: '20px 24px' }}>
          <div className="grid g3" style={{ gap: 10 }}>
            <button className="btn btn-coral btn-sm" onClick={() => toast('Ticket PDF downloaded')}><I d={Ic.dl} s={14} /> Download PDF</button>
            <button className="btn btn-out btn-sm" onClick={() => toast('Shared via WhatsApp')}><I d={Ic.share} s={14} /> WhatsApp</button>
            <button className="btn btn-out btn-sm" onClick={() => toast('Ticket emailed')}><I d={Ic.mail} s={14} /> Email Ticket</button></div>
          <div className="card mt24 row gap12" style={{ padding: 16, background: '#F6FCF9', borderColor: '#C6E9D9', alignItems: 'flex-start' }}>
            <I d={Ic.info} s={17} style={{ color: 'var(--sea)', marginTop: 1 }} />
            <div className="xs" style={{ lineHeight: 1.75 }}>Arrive 15 minutes before your slot. Present the QR code at the entry gate — it works offline. Free cancellation until 17 Sep, 09:00 AM.</div></div>
        </div>
      </div>
      <div style={{ display: 'grid', placeItems: 'center' }}><TicketCard /></div>
    </div>
    <div className="row gap12 wrapf center mt40" style={{ justifyContent: 'center' }}>
      <button className="btn btn-out" onClick={() => go('tourist-dash')}><I d={Ic.grid} s={16} /> Go to Dashboard</button>
      <button className="btn btn-coral" onClick={() => go('explore')}>Book Another Attraction <I d={Ic.arr} s={16} /></button></div>
    <style>{`@media(max-width:900px){.cfgrid{grid-template-columns:1fr!important}}`}</style>
  </div></div>;
}