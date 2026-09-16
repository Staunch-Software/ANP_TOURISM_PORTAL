import React, { useState } from 'react';
import { ACard } from '../../components/attractions/AttractionCard';
import { Empty } from '../../components/common/EmptyState';
import { Field } from '../../components/common/Field';
import { I, Ic } from '../../components/common/Icons';
import { Chart } from '../../components/dashboard/Chart';
import { KPI } from '../../components/dashboard/KPI';
import { Shell } from '../../components/dashboard/Shell';
import { useApp } from '../../context/AppContext';
import { ATTR, NOTIFS } from '../../services/data';
import { fmt, stCl } from '../../utils/format';

export function AgencyDash() {
  const { toast } = useApp();const [a, setA] = useState('Dashboard');
  const items = [['Dashboard', 'grid'], ['Agency Profile', 'bldg'], ['Bookings', 'ticket'], ['Group Bookings', 'users', '4'], ['Visitors', 'user'], '—',
  ['Attractions', 'pin'], ['Payments', 'card'], ['Reports', 'chart'], '—', ['Notifications', 'bell'], ['Support', 'headset']];
  return <Shell items={items} active={a} setActive={setA} badge="Agency Portal" title={a} sub="Coastal Travels & Tours · Approved Agency">
    {a === 'Dashboard' && <div className="fade">
      <div className="grid g4" style={{ gap: 18 }}>
        <KPI t="Active Bookings" v="86" s="↑ 14 this week" ic="ticket" c="var(--turq)" trend="up" />
        <KPI t="Group Requests" v="4" s="Awaiting authority review" ic="users" c="var(--warn)" />
        <KPI t="Managed Visitors" v="1,248" s="Across 12 attractions" ic="user" c="var(--sea)" />
        <KPI t="Monthly Revenue" v="₹12.6 L" s="↑ 21% vs August" ic="chart" c="var(--coral)" trend="up" /></div>
      <div className="card mt24" style={{ padding: '18px 22px' }}>
        <div className="row between wrapf gap12">
          <div className="semi sm">Workflow Status Legend</div>
          <div className="row gap8 wrapf">{['Submitted', 'Under Review', 'Approved', 'Rejected'].map((s, i) =>
            <span key={i} className={'badge ' + stCl(s)}><span className="dot" />{s}</span>)}</div></div></div>
      <div className="grid mt24" style={{ gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)', gap: 24 }}>
        <Chart title="Booking Volume" data={[48, 62, 55, 81, 74, 96, 88, 112]} labels={['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']} />
        <div className="card" style={{ padding: 22 }}>
          <div className="ff bold" style={{ fontSize: 15.5, marginBottom: 16 }}>Top Attractions Booked</div>
          {[['Radhanagar Beach', 248], ['Cellular Jail', 196], ['Light & Sound Show', 174], ['Elephant Beach', 142], ['Ross Island', 98]].map((x, i) =>
          <div key={i} className="row between" style={{ padding: '11px 0', borderBottom: i < 4 ? '1px solid var(--line)' : 'none' }}>
              <span className="row gap12"><span className="badge b-grey" style={{ width: 22, justifyContent: 'center', padding: '3px 0' }}>{i + 1}</span><span className="semi sm">{x[0]}</span></span>
              <span className="bold sm">{x[1]}</span></div>)}</div></div>
      <div className="card mt24" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="row between" style={{ padding: '18px 22px', borderBottom: '1px solid var(--line)' }}>
          <div className="ff bold" style={{ fontSize: 16 }}>Recent Group Bookings</div><button className="btn btn-out btn-sm" onClick={() => setA('Group Bookings')}>View All</button></div>
        <div style={{ overflowX: 'auto' }}><table>
          <thead><tr><th>Reference</th><th>Client</th><th>Attraction</th><th>Visit Date</th><th>Visitors</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>{[['GRP-2026-0412', 'Meridian Corp Retreat', 'Radhanagar Beach', '24 Sep 2026', '42', 14700, 'Under Review'],
              ['GRP-2026-0398', 'Bengal Heritage Tour', 'Cellular Jail', '22 Sep 2026', '28', 9800, 'Approved'],
              ['GRP-2026-0391', 'Coastal Expedition Group', 'Elephant Beach', '25 Sep 2026', '36', 56700, 'Submitted'],
              ['GRP-2026-0377', 'Global Divers Collective', 'Scuba — Nemo Reef', '20 Sep 2026', '18', 68250, 'Approved'],
              ['GRP-2026-0350', 'Sunrise Senior Tours', 'Light & Sound Show', '19 Sep 2026', '54', 19845, 'Rejected']].map((r, i) =>
              <tr key={i}><td className="mono xs">{r[0]}</td><td className="semi">{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td><td>{r[4]}</td><td className="bold">{fmt(r[5])}</td>
              <td><span className={'badge ' + stCl(r[6])}><span className="dot" />{r[6]}</span></td></tr>)}</tbody></table></div></div>
    </div>}
    {a === 'Group Bookings' && <div className="fade">
      <div className="row between wrapf gap12" style={{ marginBottom: 20 }}>
        <div><h2 className="ff bold" style={{ fontSize: 20 }}>Group Bookings</h2><p className="sm mut mt8">Track approval workflow across all client requests.</p></div>
        <button className="btn btn-coral" onClick={() => toast('New group request form opened')}><I d={Ic.plus} s={16} /> New Request</button></div>
      <div className="grid g4" style={{ gap: 16, marginBottom: 22 }}>
        {[['Submitted', 6, 'b-info'], ['Under Review', 4, 'b-warn'], ['Approved', 18, 'b-ok'], ['Rejected', 2, 'b-bad']].map((s, i) =>
        <div key={i} className="card" style={{ padding: 18 }}><span className={'badge ' + s[2]}><span className="dot" />{s[0]}</span>
            <div className="kv" style={{ color: 'var(--ocean)' }}>{s[1]}</div><div className="xs mut">requests this month</div></div>)}</div>
      <div className="card" style={{ overflow: 'hidden' }}><div style={{ overflowX: 'auto' }}><table>
        <thead><tr><th>Reference</th><th>Client</th><th>Attraction</th><th>Visit Date</th><th>Indian</th><th>Foreign</th><th>Amount</th><th>Status</th><th></th></tr></thead>
        <tbody>{[['GRP-2026-0412', 'Meridian Corp Retreat', 'Radhanagar Beach', '24 Sep', 42, 0, 14700, 'Under Review'],
              ['GRP-2026-0398', 'Bengal Heritage Tour', 'Cellular Jail', '22 Sep', 28, 0, 9800, 'Approved'],
              ['GRP-2026-0391', 'Coastal Expedition Group', 'Elephant Beach', '25 Sep', 18, 18, 56700, 'Submitted'],
              ['GRP-2026-0377', 'Global Divers Collective', 'Scuba — Nemo Reef', '20 Sep', 4, 14, 68250, 'Approved'],
              ['GRP-2026-0350', 'Sunrise Senior Tours', 'Light & Sound Show', '19 Sep', 54, 0, 19845, 'Rejected'],
              ['GRP-2026-0341', 'Nordic Travel Circle', 'Ross Island', '18 Sep', 0, 22, 13860, 'Approved']].map((r, i) =>
              <tr key={i}><td className="mono xs">{r[0]}</td><td className="semi">{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td><td>{r[4]}</td><td>{r[5]}</td><td className="bold">{fmt(r[6])}</td>
            <td><span className={'badge ' + stCl(r[7])}><span className="dot" />{r[7]}</span></td>
            <td><button className="btn btn-out btn-sm" onClick={() => toast('Request opened')}>View</button></td></tr>)}</tbody></table></div></div></div>}
    {a === 'Visitors' && <div className="card fade" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="row between wrapf gap12" style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)' }}>
        <div className="ff bold" style={{ fontSize: 16 }}>Managed Visitors</div>
        <div className="row gap8"><button className="btn btn-out btn-sm"><I d={Ic.filter} s={13} /> Filter</button>
          <button className="btn btn-out btn-sm" onClick={() => toast('Visitor list exported')}><I d={Ic.dl} s={13} /> Export</button></div></div>
      <div style={{ overflowX: 'auto' }}><table>
        <thead><tr><th>Visitor Name</th><th>Type</th><th>Nationality</th><th>ID Reference</th><th>Group</th><th>Visit Date</th><th>Status</th></tr></thead>
        <tbody>{[['Arjun Mehta', 'Adult', 'Indian', 'XXXX 3312', 'GRP-2026-0398', '22 Sep', 'Confirmed'],
            ['Sneha Raj', 'Adult', 'Indian', 'XXXX 8841', 'GRP-2026-0398', '22 Sep', 'Confirmed'],
            ['Emily Carter', 'Adult', 'Foreign', 'Passport US-9921', 'GRP-2026-0341', '18 Sep', 'Confirmed'],
            ['Rohit Nair', 'Child', 'Indian', 'Birth Cert. 2014', 'GRP-2026-0412', '24 Sep', 'Under Review'],
            ['Liam Novak', 'Adult', 'Foreign', 'Passport CZ-4417', 'GRP-2026-0377', '20 Sep', 'Confirmed'],
            ['Ananya Bose', 'Adult', 'Indian', 'XXXX 6620', 'GRP-2026-0391', '25 Sep', 'Submitted']].map((r, i) =>
            <tr key={i}><td className="semi">{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td><td className="mono xs">{r[3]}</td><td className="mono xs">{r[4]}</td><td>{r[5]}</td>
            <td><span className={'badge ' + stCl(r[6])}><span className="dot" />{r[6]}</span></td></tr>)}</tbody></table></div></div>}
    {a === 'Reports' && <div className="fade">
      <div className="grid g2" style={{ gap: 24 }}>
        <Chart title="Booking Trends" data={[48, 62, 55, 81, 74, 96, 88, 112]} labels={['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']} />
        <Chart title="Revenue (₹ lakh)" data={[5.2, 6.8, 6.1, 9.4, 8.2, 11.1, 10.4, 12.6]} labels={['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']} color="var(--sea)" />
        <Chart title="Visitor Footfall" data={[420, 560, 510, 720, 660, 880, 810, 1020]} labels={['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']} color="var(--coral)" />
        <div className="card" style={{ padding: 22 }}>
          <div className="ff bold" style={{ fontSize: 15.5, marginBottom: 20 }}>Nationality Distribution</div>
          {[['Indian Nationals', 72, 'var(--turq)'], ['European', 12, 'var(--sea)'], ['North American', 8, 'var(--coral)'], ['East Asian', 5, 'var(--ocean-2)'], ['Other', 3, 'var(--muted)']].map((x, i) =>
          <div key={i} style={{ marginBottom: 15 }}>
              <div className="row between xs semi" style={{ marginBottom: 7 }}><span>{x[0]}</span><span>{x[1]}%</span></div>
              <div style={{ height: 7, background: '#EEF2F5', borderRadius: 5, overflow: 'hidden' }}><div style={{ width: x[1] + '%', height: '100%', background: x[2], borderRadius: 5 }} /></div></div>)}</div></div>
      <div className="row gap12 mt24"><button className="btn btn-coral" onClick={() => toast('Report exported as PDF')}><I d={Ic.dl} s={16} /> Export PDF</button>
        <button className="btn btn-out" onClick={() => toast('Report exported as Excel')}><I d={Ic.file} s={15} /> Export Excel</button></div></div>}
    {['Agency Profile', 'Bookings', 'Attractions', 'Payments', 'Notifications', 'Support'].includes(a) && <div className="fade">
      {a === 'Agency Profile' && <div className="card" style={{ padding: 30, maxWidth: 820 }}>
        <div className="row gap16" style={{ marginBottom: 24 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg,var(--sea),#0A6B52)', color: '#fff', display: 'grid', placeItems: 'center' }}><I d={Ic.bldg} s={30} /></div>
          <div><h2 className="ff bold" style={{ fontSize: 20 }}>Coastal Travels &amp; Tours</h2>
            <div className="sm mut mt8">Approved Agency · Licence AGY/AN/2023/1184</div>
            <span className="badge b-ok mt12"><I d={Ic.check2} s={11} />Approved</span></div></div>
        <div className="sep" />
        <div className="grid g2" style={{ gap: 18 }}>
          <Field label="Agency Name"><input className="inp" defaultValue="Coastal Travels & Tours" /></Field>
          <Field label="Licence Number"><input className="inp mono" defaultValue="AGY/AN/2023/1184" disabled style={{ background: '#F7F9FA' }} /></Field>
          <Field label="Contact Person"><input className="inp" defaultValue="Lakshmi Pillai" /></Field>
          <Field label="Mobile"><input className="inp" defaultValue="+91 90482 33710" /></Field>
          <Field label="Email"><input className="inp" defaultValue="bookings@coastaltravels.in" /></Field>
          <Field label="Operating Since"><input className="inp" defaultValue="2023" disabled style={{ background: '#F7F9FA' }} /></Field></div>
        <button className="btn btn-coral mt24" onClick={() => toast('Agency profile updated')}>Save Changes</button></div>}
      {a === 'Bookings' && <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="row between" style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)' }}><div className="ff bold" style={{ fontSize: 16 }}>All Bookings</div>
          <button className="btn btn-out btn-sm" onClick={() => toast('Export started')}><I d={Ic.dl} s={13} /> Export</button></div>
        <div style={{ overflowX: 'auto' }}><table>
          <thead><tr><th>Booking ID</th><th>Client</th><th>Attraction</th><th>Date</th><th>Slot</th><th>Visitors</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>{[['AND-2026-085012', 'Bengal Heritage Tour', 'Cellular Jail', '22 Sep', '10:00 AM', 28, 9800, 'Confirmed'],
              ['AND-2026-084998', 'Nordic Travel Circle', 'Ross Island', '18 Sep', '09:00 AM', 22, 13860, 'Confirmed'],
              ['AND-2026-084944', 'Global Divers Collective', 'Scuba — Nemo Reef', '20 Sep', '07:00 AM', 18, 68250, 'Confirmed'],
              ['AND-2026-084901', 'Meridian Corp Retreat', 'Radhanagar Beach', '24 Sep', '09:00 AM', 42, 14700, 'Under Review'],
              ['AND-2026-084822', 'Sunrise Senior Tours', 'Light & Sound Show', '19 Sep', '06:00 PM', 54, 19845, 'Cancelled']].map((r, i) =>
              <tr key={i}><td className="mono xs">{r[0]}</td><td className="semi">{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td><td>{r[4]}</td><td>{r[5]}</td><td className="bold">{fmt(r[6])}</td>
              <td><span className={'badge ' + stCl(r[7])}><span className="dot" />{r[7]}</span></td></tr>)}</tbody></table></div></div>}
      {a === 'Attractions' && <div className="grid g3">{ATTR.slice(0, 6).map((x) => <ACard key={x.id} a={x} compact />)}</div>}
      {a === 'Payments' && <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="row between" style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)' }}><div className="ff bold" style={{ fontSize: 16 }}>Payment Ledger</div>
          <span className="badge b-ok">All reconciled</span></div>
        <div style={{ overflowX: 'auto' }}><table>
          <thead><tr><th>Transaction ID</th><th>Reference</th><th>Date</th><th>Method</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>{[['TXN9012441', 'GRP-2026-0398', '14 Sep 2026', 'Net Banking', 9800, 'Success'], ['TXN9012388', 'GRP-2026-0377', '12 Sep 2026', 'Net Banking', 68250, 'Success'],
              ['TXN9012301', 'GRP-2026-0341', '10 Sep 2026', 'UPI', 13860, 'Success'], ['TXN9012244', 'GRP-2026-0350', '08 Sep 2026', 'Credit Card', 19845, 'Refunded']].map((r, i) =>
              <tr key={i}><td className="mono xs">{r[0]}</td><td className="mono xs">{r[1]}</td><td>{r[2]}</td><td className="semi">{r[3]}</td><td className="bold">{fmt(r[4])}</td>
              <td><span className={'badge ' + (r[5] === 'Success' ? 'b-ok' : 'b-info')}><span className="dot" />{r[5]}</span></td></tr>)}</tbody></table></div></div>}
      {a === 'Notifications' && <div className="card" style={{ overflow: 'hidden' }}>{NOTIFS.map((n, i) =>
        <div key={i} className="row gap16" style={{ padding: '18px 22px', borderBottom: i < NOTIFS.length - 1 ? '1px solid var(--line)' : 'none', alignItems: 'flex-start' }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: '#F2F7F9', color: 'var(--ocean)', display: 'grid', placeItems: 'center', flex: 'none' }}><I d={Ic[n.ic]} s={17} /></div>
          <div style={{ flex: 1 }}><span className={'badge ' + n.cl}>{n.c}</span><div className="semi sm mt8">{n.t}</div><div className="xs mut mt8">{n.s}</div></div>
          <span className="xs mut">{n.ts}</span></div>)}</div>}
      {a === 'Support' && <div className="card"><Empty icon="headset" t="No open support tickets" s="Agency support: 1800-345-2480, weekdays 09:00–18:00 IST." cta="Raise a Ticket" onCta={() => toast('Ticket form opened')} /></div>}
    </div>}
  </Shell>;
}