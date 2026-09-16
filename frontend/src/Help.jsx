import React, { useState } from 'react';
import { I, Ic } from '../components/common/Icons';
import { useApp } from '../context/AppContext';

export function Help() {
  const { toast } = useApp();const [open, setOpen] = useState(0);
  const faqs = [['How do I book an attraction?', 'Select an attraction, choose your date and time slot, add visitors, confirm nationality and pay. Your QR ticket is issued instantly.'],
  ['Can I cancel or reschedule a booking?', 'Yes. Free cancellation is available up to 24 hours before your slot, with a full refund to the original payment method within 5–7 working days. Cancellations within 24 hours are refunded at 50%.'],
  ['What is the difference between Indian and foreign visitor pricing?', 'Attraction tariffs are set by the tourism department and differ for Indian and foreign nationals. Foreign nationals should carry a passport and, where applicable, a Restricted Area Permit.'],
  ['Do I need to print my ticket?', 'No. The QR code on your phone is sufficient and works offline at the entry gate.'],
  ['How does group booking approval work?', 'Submit your organization details with the completed visitor Excel file. The Regulatory Authority reviews and responds within 2 working days via SMS and email.'],
  ['Which payment methods are accepted?', 'UPI, credit and debit cards, net banking and major e-wallets. All transactions are encrypted and PCI-DSS compliant.']];
  return <>
    <div style={{ background: 'linear-gradient(130deg,var(--ocean),var(--ocean-2))', color: '#fff', padding: '56px 0 42px' }}><div className="wrap">
      <div className="eyebrow" style={{ color: 'var(--turq-2)' }}>Support</div><h1 className="h2" style={{ fontSize: 38 }}>Help Center</h1>
      <p className="sub" style={{ color: 'rgba(255,255,255,.82)' }}>Answers, guidance and direct support for your island journey.</p></div></div>
    <div className="sec" style={{ paddingTop: 34 }}><div className="wrap">
      <div className="grid g3" style={{ marginBottom: 44 }}>
        {[['Booking Help', 'Slots, visitors, itineraries and modifications', 'ticket', 'var(--turq)'],
          ['Payment Help', 'Transactions, receipts, failures and retries', 'card', 'var(--ocean-2)'],
          ['Cancellation & Refund', 'Policy, timelines and refund tracking', 'refresh', 'var(--coral)'],
          ['Contact Us', 'Reach the tourism support desk directly', 'headset', 'var(--sea)'],
          ['FAQs', 'Common questions answered in detail', 'help', 'var(--warn)'],
          ['Accessibility', 'Facilities and assistance at attractions', 'users', 'var(--ocean)']].map((c, i) =>
          <button key={i} className="stat" style={{ textAlign: 'left' }} onClick={() => toast(c[0] + ' section opened')}>
            <div className="sicn" style={{ background: c[3] + '18', color: c[3] }}><I d={Ic[c[2]]} s={22} /></div>
            <h3 className="ff bold" style={{ fontSize: 16.5 }}>{c[0]}</h3><p className="sm mut mt8">{c[1]}</p>
            <div className="row gap8 xs bold mt16" style={{ color: c[3] }}>Open <I d={Ic.arr} s={13} /></div></button>)}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)', gap: 32, alignItems: 'start' }} className="hgrid">
        <div><h2 className="ff bold" style={{ fontSize: 24, marginBottom: 20 }}>Frequently Asked Questions</h2>
          <div className="card" style={{ overflow: 'hidden' }}>{faqs.map(([q, a], i) =>
              <div key={i} style={{ borderBottom: i < faqs.length - 1 ? '1px solid var(--line)' : 'none' }}>
              <button className="row between" style={{ width: '100%', padding: '18px 22px', textAlign: 'left', gap: 16 }} onClick={() => setOpen(open === i ? -1 : i)}>
                <span className="semi sm">{q}</span><I d={Ic.chevd} s={17} style={{ color: 'var(--muted)', transform: open === i ? 'rotate(180deg)' : 'none', transition: '.25s', flex: 'none' }} /></button>
              {open === i && <p className="sm mut fade" style={{ padding: '0 22px 20px', lineHeight: 1.75 }}>{a}</p>}</div>)}</div></div>
        <div className="card" style={{ padding: 26, background: 'linear-gradient(160deg,#F4FBFC,#fff)' }}>
          <div className="sicn" style={{ background: 'var(--coral)18', color: 'var(--coral)', width: 52, height: 52 }}><I d={Ic.headset} s={24} /></div>
          <h3 className="ff bold" style={{ fontSize: 19 }}>Need Help?</h3>
          <p className="sm mut mt12" style={{ lineHeight: 1.7 }}>Our support desk operates 7 days a week, 08:00 AM to 08:00 PM IST.</p>
          <div className="sep" />
          {[['Toll-Free Helpline', '1800-345-2465', 'phone'], ['Email Support', 'support@andamantourism.gov.in', 'mail'], ['Tourism Office', 'Directorate of Tourism, Port Blair – 744101', 'pin']].map((x, i) =>
            <div key={i} className="row gap12" style={{ marginBottom: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#E9F4F8', color: 'var(--ocean)', display: 'grid', placeItems: 'center', flex: 'none' }}><I d={Ic[x[2]]} s={16} /></div>
              <div><div className="xs mut">{x[0]}</div><div className="semi sm mt8">{x[1]}</div></div></div>)}
          <button className="btn btn-coral btn-block mt16" onClick={() => toast('Support ticket form opened')}><I d={Ic.send} s={15} /> Raise a Support Ticket</button>
        </div></div>
      <style>{`@media(max-width:900px){.hgrid{grid-template-columns:1fr!important}}`}</style>
    </div></div>
  </>;
}