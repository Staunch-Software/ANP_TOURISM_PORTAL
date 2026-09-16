import React from 'react';
import { I, Ic } from '../common/Icons';
import { QR } from '../common/QRCode';
import { useApp } from '../../context/AppContext';

export function TicketCard({ b }) {
  const { toast } = useApp();
  const d = b || { id: 'AND-2026-084721', a: 'Radhanagar Beach', d: '18 Sep 2026', t: '09:00 AM', v: 3 };
  return <div className="tkt">
    <div className="tkt-h"><div className="row between">
      <div><div className="xs" style={{ opacity: .72, letterSpacing: 1.2, fontWeight: 700 }}>E-TICKET · ANDAMAN TOURISM</div>
        <div className="ff bold mt8" style={{ fontSize: 18 }}>{d.a}</div></div>
      <div className="logo-m" style={{ width: 36, height: 36, background: 'rgba(255,255,255,.18)', boxShadow: 'none' }}><I d={Ic.palm} s={18} /></div></div></div>
    <div className="tkt-b">
      <div className="grid g2" style={{ gap: 16 }}>
        {[['Date', d.d], ['Time', d.t], ['Visitors', d.v + ' Persons'], ['Status', 'Confirmed']].map((x, i) =>
        <div key={i}><div className="xs mut">{x[0]}</div><div className="semi mt8" style={{ fontSize: 14.5 }}>{x[1]}</div></div>)}
      </div>
      <div className="perf"><span /></div>
      <div className="center">
        <QR seed={d.id} />
        <div className="xs mut mt12">Booking ID</div>
        <div className="mono bold" style={{ fontSize: 14, color: 'var(--ocean)' }}>{d.id}</div>
        <div className="xs mut mt8">Present this QR code at the attraction entry gate</div>
      </div>
      <div className="grid g2 mt24" style={{ gap: 10 }}>
        <button className="btn btn-out btn-sm" onClick={() => toast('Ticket PDF downloaded')}><I d={Ic.dl} s={14} /> PDF</button>
        <button className="btn btn-turq btn-sm" onClick={() => toast('Shared via WhatsApp')}><I d={Ic.share} s={14} /> Share</button></div>
    </div></div>;
}