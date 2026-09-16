import React, { useState } from 'react';
import { Empty } from '../../components/common/EmptyState';
import { Field } from '../../components/common/Field';
import { I, Ic } from '../../components/common/Icons';
import { Chart } from '../../components/dashboard/Chart';
import { KPI } from '../../components/dashboard/KPI';
import { Shell } from '../../components/dashboard/Shell';
import { useApp } from '../../context/AppContext';
import { ATTR, NOTIFS, SLOTS } from '../../services/data';
import { fmt, stCl } from '../../utils/format';

export function ProviderDash() {
  const { toast } = useApp();const [a, setA] = useState('Dashboard');
  const items = [['Dashboard', 'grid'], ['Business Profile', 'store'], ['Services', 'layers'], ['Availability', 'cal'], ['Bookings', 'ticket', '7'], '—',
  ['Ratings & Reviews', 'star'], ['Compliance Documents', 'doc', '1'], ['Revenue', 'chart'], ['Settlements', 'wallet'], '—', ['Notifications', 'bell'], ['Support', 'headset']];
  return <Shell items={items} active={a} setActive={setA} badge="Service Provider" title={a} sub={'Coral Reef Adventures Pvt Ltd · Verified Operator'}>
    {a === 'Dashboard' && <div className="fade">
      <div className="card row between wrapf gap16" style={{ padding: '18px 22px', marginBottom: 22, background: '#F6FCF9', borderColor: '#C6E9D9' }}>
        <div className="row gap12"><I d={Ic.shield} s={22} style={{ color: 'var(--sea)' }} />
          <div><div className="semi sm">Verification Status: <span style={{ color: 'var(--sea)' }}>Verified</span></div>
            <div className="xs mut mt8">All compliance documents valid · Next review 12 Mar 2027</div></div></div>
        <div className="row gap8">{['Verified', 'Pending Verification', 'Document Expired'].map((s, i) =>
          <span key={i} className={'badge ' + (i === 0 ? stCl(s) : 'b-grey')} style={{ opacity: i === 0 ? 1 : .5 }}><span className="dot" />{s}</span>)}</div></div>
      <div className="grid g4" style={{ gap: 18 }}>
        <KPI t="Today's Bookings" v="34" s="↑ 12% vs yesterday" ic="ticket" c="var(--turq)" trend="up" />
        <KPI t="Monthly Revenue" v="₹4.82 L" s="↑ 18% vs August" ic="chart" c="var(--sea)" trend="up" />
        <KPI t="Average Rating" v="4.7" s="Based on 1,284 reviews" ic="star" c="var(--warn)" />
        <KPI t="Pending Settlement" v="₹1.24 L" s="Next payout 22 Sep" ic="wallet" c="var(--coral)" /></div>
      <div className="grid mt24" style={{ gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)', gap: 24 }}>
        <Chart title="Booking Trends" data={[42, 58, 51, 73, 66, 88, 79, 94]} labels={['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']} />
        <div className="card" style={{ padding: 22 }}>
          <div className="ff bold" style={{ fontSize: 15.5, marginBottom: 16 }}>Service Performance</div>
          {[['Scuba Diving — Nemo Reef', 94, 'var(--turq)'], ['Snorkelling — North Bay', 78, 'var(--sea)'], ['Sea Walking', 61, 'var(--coral)'], ['Glass Bottom Boat', 44, 'var(--ocean-2)']].map((s, i) =>
          <div key={i} style={{ marginBottom: 16 }}>
              <div className="row between xs semi" style={{ marginBottom: 7 }}><span>{s[0]}</span><span>{s[1]}%</span></div>
              <div style={{ height: 7, background: '#EEF2F5', borderRadius: 5, overflow: 'hidden' }}><div style={{ width: s[1] + '%', height: '100%', background: s[2], borderRadius: 5 }} /></div></div>)}</div></div>
      <div className="card mt24" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="row between" style={{ padding: '18px 22px', borderBottom: '1px solid var(--line)' }}>
          <div className="ff bold" style={{ fontSize: 16 }}>Recent Bookings</div><button className="btn btn-out btn-sm" onClick={() => setA('Bookings')}>View All</button></div>
        <div style={{ overflowX: 'auto' }}><table>
          <thead><tr><th>Booking ID</th><th>Service</th><th>Customer</th><th>Date</th><th>Slot</th><th>Visitors</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>{[['AND-2026-084901', 'Scuba Diving — Nemo Reef', 'Priya Raman', '18 Sep', '07:00 AM', 2, 7350, 'Confirmed'],
              ['AND-2026-084877', 'Snorkelling — North Bay', 'Daniel Whitmore', '18 Sep', '09:00 AM', 4, 11760, 'Confirmed'],
              ['AND-2026-084812', 'Sea Walking', 'Vikram Shah', '19 Sep', '10:00 AM', 3, 9450, 'Confirmed'],
              ['AND-2026-084790', 'Glass Bottom Boat', 'Anita Desai', '19 Sep', '11:00 AM', 5, 6300, 'Confirmed'],
              ['AND-2026-084701', 'Scuba Diving — Nemo Reef', 'Marco Rossi', '20 Sep', '08:00 AM', 2, 13650, 'Confirmed']].map((r, i) =>
              <tr key={i}><td className="mono xs">{r[0]}</td><td className="semi">{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td><td>{r[4]}</td><td>{r[5]}</td><td className="bold">{fmt(r[6])}</td>
              <td><span className="badge b-ok"><span className="dot" />{r[7]}</span></td></tr>)}</tbody></table></div></div>
    </div>}
    {a === 'Compliance Documents' && <div className="fade">
      <div className="card row gap12 mt8" style={{ padding: 18, background: '#FFF8F2', borderColor: '#F5DFCA', marginBottom: 22, alignItems: 'flex-start' }}>
        <I d={Ic.alert} s={19} style={{ color: 'var(--warn)', marginTop: 1 }} />
        <div><div className="semi sm">One document requires renewal</div>
          <p className="xs mut mt8" style={{ lineHeight: 1.7 }}>Only verified service providers can list services. Compliance documents must be valid and approved. Services are automatically delisted if a mandatory document expires.</p></div></div>
      <div className="card" style={{ overflow: 'hidden' }}><div style={{ overflowX: 'auto' }}><table>
        <thead><tr><th>Document</th><th>Reference No.</th><th>Issued</th><th>Valid Until</th><th>Status</th><th></th></tr></thead>
        <tbody>{[['Tourism Trade Licence', 'TTL/AN/2024/8841', '12 Mar 2024', '11 Mar 2027', 'Verified'],
              ['PADI Operator Certification', 'PADI-IN-44219', '04 Jan 2025', '03 Jan 2027', 'Verified'],
              ['Marine Safety Clearance', 'MSC/PB/2025/119', '22 Feb 2025', '21 Feb 2027', 'Verified'],
              ['Public Liability Insurance', 'PLI-8842-AN', '18 Sep 2024', '17 Sep 2026', 'Document Expired'],
              ['GST Registration', '35AABCC1234M1Z5', '01 Apr 2023', 'Perpetual', 'Verified']].map((r, i) =>
              <tr key={i}><td className="semi row gap12"><I d={Ic.doc} s={16} style={{ color: 'var(--muted)' }} />{r[0]}</td><td className="mono xs">{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td>
            <td><span className={'badge ' + stCl(r[4])}><span className="dot" />{r[4]}</span></td>
            <td><button className="btn btn-out btn-sm" onClick={() => toast(r[4] === 'Verified' ? 'Document viewed' : 'Renewal upload opened')}>{r[4] === 'Verified' ? 'View' : 'Renew'}</button></td></tr>)}</tbody></table></div></div></div>}
    {a === 'Services' && <div className="fade">
      <div className="row between wrapf gap12" style={{ marginBottom: 20 }}>
        <div><h2 className="ff bold" style={{ fontSize: 20 }}>Listed Services</h2><p className="sm mut mt8">Ratings directly affect service visibility in search results.</p></div>
        <button className="btn btn-coral" onClick={() => toast('New service form opened')}><I d={Ic.plus} s={16} /> Add Service</button></div>
      <div className="grid g3">{ATTR.filter((a) => a.cat === 'Water Sports').concat(ATTR.slice(9, 11)).map((x) =>
        <div key={x.id} className="card" style={{ overflow: 'hidden' }}>
          <div style={{ height: 140, backgroundImage: `url(${x.img})`, backgroundSize: 'cover', position: 'relative' }}>
            <span className="ovl badge b-ok" style={{ top: 12, left: 12 }}><span className="dot" />Live</span></div>
          <div style={{ padding: 18 }}><h3 className="ff bold" style={{ fontSize: 15.5 }}>{x.name}</h3>
            <div className="row gap12 xs mut mt8"><span className="row gap8"><I d={Ic.star} s={12} />{x.rate}</span><span>{x.rev.toLocaleString('en-IN')} reviews</span></div>
            <div className="sep" />
            <div className="row between"><div><div className="xs mut">Base price</div><div className="ff bold" style={{ color: 'var(--ocean)' }}>{fmt(x.inr)}</div></div>
              <div className="row gap8"><button className="btn btn-out btn-sm" onClick={() => toast('Edit service')}><I d={Ic.edit} s={13} /></button>
                <button className="btn btn-turq btn-sm" onClick={() => setA('Availability')}>Slots</button></div></div></div></div>)}</div></div>}
    {a === 'Availability' && <div className="card fade" style={{ padding: 26 }}>
      <div className="row between wrapf gap12" style={{ marginBottom: 24 }}>
        <div><h2 className="ff bold" style={{ fontSize: 19 }}>Slot Availability · Scuba Diving — Nemo Reef</h2>
          <p className="sm mut mt8">18 September 2026 · Adjust capacity per slot</p></div>
        <button className="btn btn-coral btn-sm" onClick={() => toast('Capacity updated')}>Save Changes</button></div>
      <div style={{ overflowX: 'auto' }}><table>
        <thead><tr><th>Time Slot</th><th>Total Capacity</th><th>Booked</th><th>Available</th><th>Utilisation</th><th>Status</th><th></th></tr></thead>
        <tbody>{SLOTS(3).map((s, i) => <tr key={i}>
          <td className="semi">{s.time}</td><td>{s.cap}</td><td>{s.cap - s.left}</td><td className="bold">{s.left}</td>
          <td><div className="row gap8"><div style={{ width: 70, height: 6, background: '#EEF2F5', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: (s.cap - s.left) / s.cap * 100 + '%', height: '100%', background: s.status === 'Available' ? 'var(--sea)' : s.status === 'Limited' ? 'var(--warn)' : 'var(--bad)' }} /></div>
            <span className="xs semi">{Math.round((s.cap - s.left) / s.cap * 100)}%</span></div></td>
          <td><span className={'badge ' + stCl(s.status)}><span className="dot" />{s.status}</span></td>
          <td><button className="btn btn-out btn-sm" onClick={() => toast('Slot editor opened')}><I d={Ic.edit} s={13} /></button></td></tr>)}</tbody></table></div></div>}
    {a === 'Ratings & Reviews' && <div className="fade">
      <div className="grid g4" style={{ gap: 18, marginBottom: 24 }}>
        <KPI t="Overall Rating" v="4.7" s="↑ 0.2 this quarter" ic="star" c="var(--warn)" trend="up" />
        <KPI t="Total Reviews" v="1,284" s="86 this month" ic="doc" c="var(--turq)" />
        <KPI t="5-Star Reviews" v="72%" s="924 reviews" ic="award" c="var(--sea)" />
        <KPI t="Response Rate" v="98%" s="Avg reply in 4 hrs" ic="send" c="var(--ocean-2)" /></div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--line)' }} className="ff bold">Recent Reviews</div>
        {[['Priya Raman', 'Scuba Diving — Nemo Reef', 5, 'Exceptional visibility and a genuinely patient instructor. The underwater photographs were a lovely touch.', '2 days ago'],
        ['Daniel Whitmore', 'Snorkelling — North Bay', 5, 'Well organised from the jetty onwards. Safety briefing was thorough and the reef was in good condition.', '4 days ago'],
        ['Vikram Shah', 'Sea Walking', 4, 'Great experience overall. The wait at the jetty was longer than expected but the activity itself was superb.', '1 week ago']].map((r, i) =>
        <div key={i} style={{ padding: '18px 22px', borderBottom: i < 2 ? '1px solid var(--line)' : 'none' }}>
            <div className="row between wrapf gap8">
              <div className="row gap12"><div style={{ width: 38, height: 38, borderRadius: 11, background: '#EAF4F8', color: 'var(--ocean)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 13 }}>{r[0].split(' ').map((w) => w[0]).join('')}</div>
                <div><div className="semi sm">{r[0]}</div><div className="xs mut mt8">{r[1]}</div></div></div>
              <div className="row gap8"><span className="rate"><I d={Ic.star} s={12} f="currentColor" />{r[2]}.0</span><span className="xs mut">{r[4]}</span></div></div>
            <p className="sm mut mt12" style={{ lineHeight: 1.7 }}>{r[3]}</p>
            <button className="btn btn-out btn-sm mt12" onClick={() => toast('Reply box opened')}>Reply</button></div>)}</div></div>}
    {a === 'Revenue' && <div className="fade">
      <div className="grid g4" style={{ gap: 18, marginBottom: 24 }}>
        <KPI t="Gross Revenue (Sep)" v="₹4.82 L" s="↑ 18% MoM" ic="chart" c="var(--sea)" trend="up" />
        <KPI t="Platform Commission" v="₹48,200" s="10% standard rate" ic="card" c="var(--muted)" />
        <KPI t="Net Earnings" v="₹4.34 L" s="After commission & GST" ic="wallet" c="var(--turq)" />
        <KPI t="YTD Revenue" v="₹38.4 L" s="↑ 24% vs last year" ic="award" c="var(--coral)" trend="up" /></div>
      <div className="grid g2" style={{ gap: 24 }}>
        <Chart title="Revenue Trends (₹ lakh)" data={[2.1, 2.8, 3.2, 3.6, 3.1, 4.2, 4.1, 4.8]} labels={['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']} color="var(--sea)" />
        <Chart title="Visitor Footfall" data={[320, 410, 380, 520, 470, 610, 580, 690]} labels={['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']} color="var(--coral)" /></div></div>}
    {a === 'Settlements' && <div className="card fade" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="row between" style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)' }}>
        <div className="ff bold" style={{ fontSize: 16 }}>Settlement History</div><span className="badge b-warn">Next payout 22 Sep · ₹1.24 L</span></div>
      <div style={{ overflowX: 'auto' }}><table>
        <thead><tr><th>Settlement ID</th><th>Period</th><th>Bookings</th><th>Gross</th><th>Commission</th><th>Net Payout</th><th>Status</th></tr></thead>
        <tbody>{[['STL-2026-0912', '01–15 Sep 2026', 248, 241000, 24100, 216900, 'Pending Approval'], ['STL-2026-0831', '16–31 Aug 2026', 212, 198400, 19840, 178560, 'Approved'],
            ['STL-2026-0815', '01–15 Aug 2026', 196, 184200, 18420, 165780, 'Approved'], ['STL-2026-0731', '16–31 Jul 2026', 224, 212800, 21280, 191520, 'Approved']].map((r, i) =>
            <tr key={i}><td className="mono xs">{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td><td>{fmt(r[3])}</td><td className="mut">{fmt(r[4])}</td><td className="bold">{fmt(r[5])}</td>
            <td><span className={'badge ' + stCl(r[6])}><span className="dot" />{r[6]}</span></td></tr>)}</tbody></table></div></div>}
    {['Business Profile', 'Bookings', 'Notifications', 'Support'].includes(a) && <div className="card fade" style={{ padding: 0, overflow: 'hidden' }}>
      {a === 'Business Profile' && <div style={{ padding: 30 }}>
        <div className="row gap16" style={{ marginBottom: 24 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg,var(--coral),#E0452B)', color: '#fff', display: 'grid', placeItems: 'center' }}><I d={Ic.store} s={30} /></div>
          <div><h2 className="ff bold" style={{ fontSize: 20 }}>Coral Reef Adventures Pvt Ltd</h2>
            <div className="sm mut mt8">Registered since March 2024 · Havelock Island</div>
            <span className="badge b-ok mt12"><I d={Ic.check2} s={11} />Verified Operator</span></div></div>
        <div className="sep" />
        <div className="grid g2" style={{ gap: 18 }}>
          <Field label="Business Name"><input className="inp" defaultValue="Coral Reef Adventures Pvt Ltd" /></Field>
          <Field label="Registration Number"><input className="inp mono" defaultValue="TTL/AN/2024/8841" disabled style={{ background: '#F7F9FA' }} /></Field>
          <Field label="Contact Person"><input className="inp" defaultValue="Rajesh Menon" /></Field>
          <Field label="Mobile"><input className="inp" defaultValue="+91 94762 11840" /></Field>
          <Field label="Email"><input className="inp" defaultValue="ops@coralreefadventures.in" /></Field>
          <Field label="Service Category"><select className="inp"><option>Water Sports &amp; Diving</option><option>Transport</option><option>Accommodation</option></select></Field></div>
        <div className="mt16"><Field label="Business Address"><textarea className="inp" rows={3} defaultValue="Beach No. 3, Govind Nagar, Havelock Island (Swaraj Dweep), Andaman &amp; Nicobar Islands – 744211" /></Field></div>
        <button className="btn btn-coral mt24" onClick={() => toast('Business profile updated')}>Save Changes</button></div>}
      {a === 'Bookings' && <><div className="row between" style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)' }}>
        <div className="ff bold" style={{ fontSize: 16 }}>All Bookings</div><button className="btn btn-out btn-sm" onClick={() => toast('Export started')}><I d={Ic.dl} s={13} /> Export</button></div>
        <div style={{ overflowX: 'auto' }}><table>
          <thead><tr><th>Booking ID</th><th>Service</th><th>Customer</th><th>Date</th><th>Slot</th><th>Visitors</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>{[['AND-2026-084901', 'Scuba Diving', 'Priya Raman', '18 Sep', '07:00 AM', 2, 7350, 'Confirmed'], ['AND-2026-084877', 'Snorkelling', 'Daniel Whitmore', '18 Sep', '09:00 AM', 4, 11760, 'Confirmed'],
              ['AND-2026-084812', 'Sea Walking', 'Vikram Shah', '19 Sep', '10:00 AM', 3, 9450, 'Confirmed'], ['AND-2026-084790', 'Glass Bottom Boat', 'Anita Desai', '19 Sep', '11:00 AM', 5, 6300, 'Confirmed'],
              ['AND-2026-084701', 'Scuba Diving', 'Marco Rossi', '20 Sep', '08:00 AM', 2, 13650, 'Confirmed'], ['AND-2026-084655', 'Snorkelling', 'Neha Gupta', '20 Sep', '09:00 AM', 3, 8820, 'Confirmed'],
              ['AND-2026-084602', 'Sea Walking', 'James Fletcher', '21 Sep', '10:00 AM', 2, 8400, 'Cancelled']].map((r, i) =>
              <tr key={i}><td className="mono xs">{r[0]}</td><td className="semi">{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td><td>{r[4]}</td><td>{r[5]}</td><td className="bold">{fmt(r[6])}</td>
              <td><span className={'badge ' + stCl(r[7])}><span className="dot" />{r[7]}</span></td></tr>)}</tbody></table></div></>}
      {a === 'Notifications' && <div>{NOTIFS.map((n, i) => <div key={i} className="row gap16" style={{ padding: '18px 22px', borderBottom: i < NOTIFS.length - 1 ? '1px solid var(--line)' : 'none', alignItems: 'flex-start' }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: '#F2F7F9', color: 'var(--ocean)', display: 'grid', placeItems: 'center', flex: 'none' }}><I d={Ic[n.ic]} s={17} /></div>
        <div style={{ flex: 1 }}><span className={'badge ' + n.cl}>{n.c}</span><div className="semi sm mt8">{n.t}</div><div className="xs mut mt8">{n.s}</div></div>
        <span className="xs mut">{n.ts}</span></div>)}</div>}
      {a === 'Support' && <div style={{ padding: 30 }}><Empty icon="headset" t="No open support tickets" s="Your operator support line is 1800-345-2470, available 24/7 for service providers." cta="Raise a Ticket" onCta={() => toast('Ticket form opened')} /></div>}
    </div>}
  </Shell>;
}