import React, { useState } from 'react';
import { Field } from '../../components/common/Field';
import { I, Ic } from '../../components/common/Icons';
import { Chart } from '../../components/dashboard/Chart';
import { KPI } from '../../components/dashboard/KPI';
import { Shell } from '../../components/dashboard/Shell';
import { useApp } from '../../context/AppContext';
import { ATTR, FERRIES, SLOTS } from '../../services/data';
import { fmt, stCl } from '../../utils/format';

export function AdminDash() {
  const { toast } = useApp();const [a, setA] = useState('Dashboard');
  const items = [['Dashboard', 'grid'], ['User Management', 'users'], ['Tourist Management', 'user'], ['Service Providers', 'store', '3'], ['Agency Management', 'bldg'], '—',
  ['Attractions', 'pin'], ['Ticket Types', 'ticket'], ['Slots & Capacity', 'cal'], ['Bookings', 'doc'], ['Group Booking Approvals', 'users', '6'], '—',
  ['Payments', 'card'], ['Refunds', 'refresh', '4'], ['Ferry Management', 'ship'], ['QR Validation', 'scan'], ['LPU Monitoring', 'activity'], '—',
  ['Reports & Analytics', 'chart'], ['Compliance', 'shield'], ['Audit Logs', 'db'], ['System Settings', 'set']];
  return <Shell admin items={items} active={a} setActive={setA} badge="Regulatory Authority" title={a}
  sub="Directorate of Tourism, Andaman & Nicobar Administration">
    {a === 'Dashboard' && <div className="fade">
      <div className="grid g4" style={{ gap: 18 }}>
        <KPI t="Total Bookings" v="1,24,840" s="↑ 18% YoY" ic="ticket" c="var(--turq)" trend="up" />
        <KPI t="Today's Visitors" v="4,218" s="↑ 312 vs yesterday" ic="users" c="var(--sea)" trend="up" />
        <KPI t="Revenue (Sep)" v="₹3.84 Cr" s="↑ 22% vs August" ic="chart" c="var(--coral)" trend="up" />
        <KPI t="Active Attractions" v="120" s="Across 9 islands" ic="pin" c="var(--ocean-2)" /></div>
      <div className="grid g4 mt24" style={{ gap: 18 }}>
        <KPI t="Pending Approvals" v="6" s="Group bookings awaiting review" ic="clock" c="var(--warn)" />
        <KPI t="Pending Refunds" v="4" s="₹18,420 total value" ic="refresh" c="var(--bad)" />
        <KPI t="Service Providers" v="482" s="3 pending verification" ic="store" c="var(--turq)" />
        <KPI t="Registered Agencies" v="96" s="All licences current" ic="bldg" c="var(--sea)" /></div>
      <div className="grid g2 mt24" style={{ gap: 24 }}>
        <Chart title="Booking Trends" data={[8420, 9860, 9120, 12400, 11200, 14800, 13900, 16200]} labels={['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']} />
        <Chart title="Revenue Trends (₹ lakh)" data={[186, 224, 208, 296, 268, 348, 322, 384]} labels={['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']} color="var(--sea)" />
        <Chart title="Visitor Footfall" data={[24800, 29600, 27200, 38400, 34800, 44200, 41600, 48900]} labels={['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']} color="var(--coral)" />
        <div className="card" style={{ padding: 22 }}>
          <div className="ff bold" style={{ fontSize: 15.5, marginBottom: 20 }}>Attraction Popularity</div>
          {[['Radhanagar Beach', 92, 'var(--turq)'], ['Cellular Jail', 84, 'var(--ocean-2)'], ['Light & Sound Show', 76, 'var(--coral)'],
          ['Elephant Beach', 68, 'var(--sea)'], ['Ross Island', 54, 'var(--warn)'], ['North Bay', 47, 'var(--muted)']].map((x, i) =>
          <div key={i} style={{ marginBottom: 13 }}>
              <div className="row between xs semi" style={{ marginBottom: 6 }}><span>{x[0]}</span><span>{x[1]}%</span></div>
              <div style={{ height: 6, background: '#EEF2F5', borderRadius: 5, overflow: 'hidden' }}><div style={{ width: x[1] + '%', height: '100%', background: x[2], borderRadius: 5 }} /></div></div>)}</div></div>
      <div className="grid mt24" style={{ gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)', gap: 24 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="row between" style={{ padding: '18px 22px', borderBottom: '1px solid var(--line)' }}>
            <div className="ff bold" style={{ fontSize: 16 }}>Pending Approvals</div><button className="btn btn-out btn-sm" onClick={() => setA('Group Booking Approvals')}>View All</button></div>
          <div style={{ overflowX: 'auto' }}><table>
            <thead><tr><th>Reference</th><th>Organization</th><th>Visitors</th><th>Visit Date</th><th>Status</th><th></th></tr></thead>
            <tbody>{[['GRP-2026-0391', "St. Mary's H.S. School", 48, '25 Sep'], ['GRP-2026-0412', 'Meridian Corp Retreat', 42, '24 Sep'],
                ['GRP-2026-0405', 'Coastal Expedition Group', 36, '25 Sep'], ['GRP-2026-0399', 'Andaman Science College', 72, '28 Sep']].map((r, i) =>
                <tr key={i}><td className="mono xs">{r[0]}</td><td className="semi">{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td>
                <td><span className="badge b-warn"><span className="dot" />Pending</span></td>
                <td><div className="row gap8"><button className="btn btn-sm" style={{ background: 'var(--sea)', color: '#fff' }} onClick={() => toast(r[0] + ' approved')}>Approve</button>
                  <button className="btn btn-sm" style={{ color: 'var(--bad)', border: '1.5px solid #F5D6D4' }} onClick={() => toast(r[0] + ' rejected')}>Reject</button></div></td></tr>)}</tbody></table></div></div>
        <div className="card" style={{ padding: 22 }}>
          <div className="ff bold" style={{ fontSize: 15.5, marginBottom: 18 }}>Nationality Distribution</div>
          {[['Indian Nationals', 78, 'var(--turq)'], ['European', 10, 'var(--sea)'], ['North American', 6, 'var(--coral)'], ['East Asian', 4, 'var(--ocean-2)'], ['Other', 2, 'var(--muted)']].map((x, i) =>
          <div key={i} style={{ marginBottom: 14 }}>
              <div className="row between xs semi" style={{ marginBottom: 6 }}><span>{x[0]}</span><span>{x[1]}%</span></div>
              <div style={{ height: 6, background: '#EEF2F5', borderRadius: 5, overflow: 'hidden' }}><div style={{ width: x[1] + '%', height: '100%', background: x[2], borderRadius: 5 }} /></div></div>)}
          <div className="sep" />
          <div className="xs mut" style={{ lineHeight: 1.7 }}>Based on 48,900 visitor records for September 2026. LPU (Local Permit Unit) monitoring flags any nationality mismatch at gate validation.</div></div></div>
    </div>}
    {a === 'Group Booking Approvals' && <div className="fade">
      <div className="grid g4" style={{ gap: 16, marginBottom: 22 }}>
        {[['Pending Approval', 6, 'b-warn'], ['Approved', 142, 'b-ok'], ['Rejected', 8, 'b-bad'], ['Cancelled', 3, 'b-grey']].map((s, i) =>
        <div key={i} className="card" style={{ padding: 18 }}><span className={'badge ' + s[2]}><span className="dot" />{s[0]}</span>
            <div className="kv" style={{ color: 'var(--ocean)' }}>{s[1]}</div><div className="xs mut">this month</div></div>)}</div>
      <div className="card" style={{ overflow: 'hidden' }}><div style={{ overflowX: 'auto' }}><table>
        <thead><tr><th>Reference</th><th>Organization</th><th>Type</th><th>Visit Date</th><th>Indian</th><th>Foreign</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>{[['GRP-2026-0391', "St. Mary's H.S. School", 'School', '25 Sep', 30, 18, 32940, 'Pending Approval'],
              ['GRP-2026-0412', 'Meridian Corp Retreat', 'Corporate', '24 Sep', 42, 0, 14700, 'Pending Approval'],
              ['GRP-2026-0405', 'Coastal Expedition Group', 'Tour Operator', '25 Sep', 18, 18, 56700, 'Pending Approval'],
              ['GRP-2026-0399', 'Andaman Science College', 'College', '28 Sep', 72, 0, 25200, 'Pending Approval'],
              ['GRP-2026-0398', 'Bengal Heritage Tour', 'Tour Operator', '22 Sep', 28, 0, 9800, 'Approved'],
              ['GRP-2026-0350', 'Sunrise Senior Tours', 'Organization', '19 Sep', 54, 0, 19845, 'Rejected']].map((r, i) =>
              <tr key={i}><td className="mono xs">{r[0]}</td><td className="semi">{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td><td>{r[4]}</td><td>{r[5]}</td><td className="bold">{fmt(r[6])}</td>
            <td><span className={'badge ' + stCl(r[7])}><span className="dot" />{r[7]}</span></td>
            <td>{r[7] === 'Pending Approval' ? <div className="row gap8">
              <button className="btn btn-sm" style={{ background: 'var(--sea)', color: '#fff' }} onClick={() => toast(r[0] + ' approved')}>Approve</button>
              <button className="btn btn-sm" style={{ color: 'var(--bad)', border: '1.5px solid #F5D6D4' }} onClick={() => toast(r[0] + ' rejected')}>Reject</button></div> :
                  <button className="btn btn-out btn-sm" onClick={() => toast('Record opened')}>View</button>}</td></tr>)}</tbody></table></div></div></div>}
    {a === 'Service Providers' && <div className="fade">
      <div className="row between wrapf gap12" style={{ marginBottom: 20 }}>
        <div><h2 className="ff bold" style={{ fontSize: 20 }}>Service Provider Registry</h2><p className="sm mut mt8">482 registered · 3 awaiting verification</p></div>
        <div className="row gap8"><button className="btn btn-out btn-sm"><I d={Ic.filter} s={13} /> Filter</button>
          <button className="btn btn-coral btn-sm" onClick={() => toast('Export started')}><I d={Ic.dl} s={13} /> Export Registry</button></div></div>
      <div className="card" style={{ overflow: 'hidden' }}><div style={{ overflowX: 'auto' }}><table>
        <thead><tr><th>Provider</th><th>Licence No.</th><th>Category</th><th>Services</th><th>Rating</th><th>Bookings (MTD)</th><th>Verification</th><th>Action</th></tr></thead>
        <tbody>{[['Coral Reef Adventures', 'TTL/AN/2024/8841', 'Water Sports', 6, 4.7, 248, 'Document Expired'],
              ['Havelock Marine Services', 'TTL/AN/2023/6612', 'Water Sports', 4, 4.8, 196, 'Verified'],
              ['Island Heritage Guides', 'TTL/AN/2022/4410', 'Heritage Tours', 3, 4.6, 142, 'Verified'],
              ['Neil Island Dive Co.', 'TTL/AN/2025/9902', 'Diving', 5, 4.9, 118, 'Pending Verification'],
              ['Baratang Eco Safaris', 'TTL/AN/2024/7731', 'Nature Tours', 2, 4.5, 96, 'Verified'],
              ['Port Blair Boat Union', 'TTL/AN/2021/2204', 'Transport', 8, 4.3, 312, 'Verified']].map((r, i) =>
              <tr key={i}><td className="semi">{r[0]}</td><td className="mono xs">{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td>
            <td><span className="rate"><I d={Ic.star} s={11} f="currentColor" />{r[4]}</span></td><td className="bold">{r[5]}</td>
            <td><span className={'badge ' + stCl(r[6])}><span className="dot" />{r[6]}</span></td>
            <td><button className="btn btn-out btn-sm" onClick={() => toast(r[6] === 'Verified' ? 'Provider record opened' : 'Verification review opened')}>{r[6] === 'Verified' ? 'View' : 'Review'}</button></td></tr>)}</tbody></table></div></div>
      <div className="card mt24 row gap12" style={{ padding: 18, background: '#FFF8F2', borderColor: '#F5DFCA', alignItems: 'flex-start' }}>
        <I d={Ic.info} s={18} style={{ color: 'var(--warn)', marginTop: 1 }} />
        <div className="xs" style={{ lineHeight: 1.75 }}><b>Business rules enforced:</b> only verified service providers may list services; compliance documents must be valid and approved; ratings directly affect service visibility in search; and all bookings must be processed through the platform.</div></div></div>}
    {a === 'QR Validation' && <div className="fade">
      <div className="grid g4" style={{ gap: 18, marginBottom: 24 }}>
        <KPI t="Scans Today" v="4,218" s="Across 120 gates" ic="scan" c="var(--turq)" />
        <KPI t="Valid Entries" v="4,186" s="99.2% success rate" ic="check2" c="var(--sea)" trend="up" />
        <KPI t="Rejected Scans" v="32" s="Expired or duplicate" ic="alert" c="var(--bad)" />
        <KPI t="Avg. Scan Time" v="1.8 s" s="Within 2s target" ic="zap" c="var(--ocean-2)" /></div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="row between" style={{ padding: '18px 22px', borderBottom: '1px solid var(--line)' }}>
          <div className="ff bold" style={{ fontSize: 16 }}>Live Validation Log</div><span className="badge b-ok"><span className="dot" />Streaming</span></div>
        <div style={{ overflowX: 'auto' }}><table>
          <thead><tr><th>Timestamp</th><th>Booking ID</th><th>Attraction</th><th>Gate</th><th>Visitors</th><th>Result</th></tr></thead>
          <tbody>{[['09:42:18', 'AND-2026-084721', 'Radhanagar Beach', 'Gate 1', 3, 'Valid'], ['09:41:52', 'AND-2026-084690', 'Radhanagar Beach', 'Gate 2', 2, 'Valid'],
              ['09:41:07', 'AND-2026-084112', 'Cellular Jail', 'Main Gate', 4, 'Valid'], ['09:40:33', 'AND-2026-079441', 'Cellular Jail', 'Main Gate', 2, 'Rejected'],
              ['09:39:58', 'AND-2026-084655', 'North Bay', 'Jetty Gate', 5, 'Valid'], ['09:39:12', 'AND-2026-084588', 'Ross Island', 'Ferry Gate', 3, 'Valid']].map((r, i) =>
              <tr key={i}><td className="mono xs">{r[0]}</td><td className="mono xs">{r[1]}</td><td className="semi">{r[2]}</td><td>{r[3]}</td><td>{r[4]}</td>
              <td><span className={'badge ' + (r[5] === 'Valid' ? 'b-ok' : 'b-bad')}><I d={r[5] === 'Valid' ? Ic.tick : Ic.x} s={11} />{r[5]}</span></td></tr>)}</tbody></table></div></div></div>}
    {a === 'Refunds' && <div className="fade">
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="row between" style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)' }}>
          <div className="ff bold" style={{ fontSize: 16 }}>Refund Queue</div><span className="badge b-warn">4 pending · ₹18,420</span></div>
        <div style={{ overflowX: 'auto' }}><table>
          <thead><tr><th>Refund ID</th><th>Booking</th><th>Customer</th><th>Reason</th><th>Amount</th><th>Requested</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>{[['RFD-2026-1142', 'AND-2026-084221', 'Neha Gupta', 'Cancelled by visitor', 4820, '15 Sep', 'Pending Approval'],
              ['RFD-2026-1141', 'AND-2026-084190', 'James Fletcher', 'Show cancelled — rain', 3500, '15 Sep', 'Pending Approval'],
              ['RFD-2026-1138', 'AND-2026-083944', 'Marco Rossi', 'Operator unavailable', 6300, '14 Sep', 'Pending Approval'],
              ['RFD-2026-1136', 'AND-2026-083812', 'Anita Desai', 'Duplicate booking', 3800, '14 Sep', 'Pending Approval'],
              ['RFD-2026-1120', 'AND-2026-081190', 'Vikram Shah', 'Cancelled by visitor', 2360, '09 Sep', 'Approved']].map((r, i) =>
              <tr key={i}><td className="mono xs">{r[0]}</td><td className="mono xs">{r[1]}</td><td className="semi">{r[2]}</td><td>{r[3]}</td><td className="bold">{fmt(r[4])}</td><td>{r[5]}</td>
              <td><span className={'badge ' + stCl(r[6])}><span className="dot" />{r[6]}</span></td>
              <td>{r[6] === 'Pending Approval' ? <button className="btn btn-sm" style={{ background: 'var(--sea)', color: '#fff' }} onClick={() => toast(r[0] + ' approved for refund')}>Approve</button> :
                  <button className="btn btn-out btn-sm">View</button>}</td></tr>)}</tbody></table></div></div></div>}
    {a === 'Ferry Management' && <div className="fade">
      <div className="grid g4" style={{ gap: 18, marginBottom: 24 }}>
        <KPI t="Active Services" v="38" s="Across 9 routes" ic="ship" c="var(--turq)" />
        <KPI t="Seats Today" v="9,420" s="72% utilisation" ic="users" c="var(--sea)" />
        <KPI t="On-Time Rate" v="94%" s="↑ 3% vs August" ic="clock" c="var(--ocean-2)" trend="up" />
        <KPI t="Cancelled Sailings" v="2" s="Weather advisory" ic="alert" c="var(--bad)" /></div>
      <div className="card" style={{ overflow: 'hidden' }}><div style={{ overflowX: 'auto' }}><table>
        <thead><tr><th>Ferry</th><th>Route</th><th>Date</th><th>Departure</th><th>Arrival</th><th>Capacity</th><th>Available</th><th>Status</th><th></th></tr></thead>
        <tbody>{FERRIES.map((f) => <tr key={f.id}>
          <td className="semi">{f.n}<div className="xs mut mono">{f.id}</div></td><td>{f.r}</td><td>{f.d}</td><td className="semi">{f.dep}</td><td>{f.arr}</td><td>{f.cap}</td><td className="bold">{f.left}</td>
          <td><span className={'badge ' + stCl(f.st)}><span className="dot" />{f.st}</span></td>
          <td><button className="btn btn-out btn-sm" onClick={() => toast('Ferry record opened')}><I d={Ic.edit} s={13} /></button></td></tr>)}</tbody></table></div></div></div>}
    {a === 'Audit Logs' && <div className="card fade" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="row between" style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)' }}>
        <div className="ff bold" style={{ fontSize: 16 }}>System Audit Trail</div>
        <button className="btn btn-out btn-sm" onClick={() => toast('Audit log exported')}><I d={Ic.dl} s={13} /> Export</button></div>
      <div style={{ overflowX: 'auto' }}><table>
        <thead><tr><th>Timestamp</th><th>User</th><th>Role</th><th>Action</th><th>Entity</th><th>IP Address</th></tr></thead>
        <tbody>{[['16 Sep 2026, 11:42:08', 's.iyer@andamantourism.gov.in', 'Admin', 'Approved group booking', 'GRP-2026-0398', '10.14.2.88'],
            ['16 Sep 2026, 11:38:41', 'r.menon@coralreef.in', 'Service Provider', 'Updated slot capacity', 'SVC-A09-0918', '10.44.9.12'],
            ['16 Sep 2026, 11:30:12', 's.iyer@andamantourism.gov.in', 'Admin', 'Rejected refund request', 'RFD-2026-1129', '10.14.2.88'],
            ['16 Sep 2026, 11:22:55', 'system', 'System', 'Auto-delisted expired service', 'SVC-A04-0112', '—'],
            ['16 Sep 2026, 11:18:03', 'l.pillai@coastaltravels.in', 'Agency', 'Submitted group request', 'GRP-2026-0412', '10.62.4.31'],
            ['16 Sep 2026, 11:04:27', 'm.das@andamantourism.gov.in', 'Admin', 'Modified attraction tariff', 'A02', '10.14.2.91']].map((r, i) =>
            <tr key={i}><td className="mono xs">{r[0]}</td><td className="xs">{r[1]}</td>
            <td><span className="badge b-grey">{r[2]}</span></td><td className="semi">{r[3]}</td><td className="mono xs">{r[4]}</td><td className="mono xs mut">{r[5]}</td></tr>)}</tbody></table></div></div>}
    {a === 'Attractions' && <div className="fade">
      <div className="row between wrapf gap12" style={{ marginBottom: 20 }}>
        <div><h2 className="ff bold" style={{ fontSize: 20 }}>Attraction Registry</h2><p className="sm mut mt8">120 active attractions across 9 islands</p></div>
        <button className="btn btn-coral" onClick={() => toast('New attraction form opened')}><I d={Ic.plus} s={16} /> Add Attraction</button></div>
      <div className="card" style={{ overflow: 'hidden' }}><div style={{ overflowX: 'auto' }}><table>
        <thead><tr><th>ID</th><th>Attraction</th><th>Category</th><th>Location</th><th>Indian Fare</th><th>Foreign Fare</th><th>Daily Capacity</th><th>Status</th><th></th></tr></thead>
        <tbody>{ATTR.map((x) => <tr key={x.id}>
          <td className="mono xs">{x.id}</td><td className="semi">{x.name}</td><td><span className="badge b-grey">{x.cat}</span></td><td className="xs">{x.loc}</td>
          <td className="bold">{fmt(x.inr)}</td><td className="bold">{fmt(x.fx)}</td><td>1,050</td>
          <td><span className="badge b-ok"><span className="dot" />Active</span></td>
          <td><button className="btn btn-out btn-sm" onClick={() => toast('Attraction record opened')}><I d={Ic.edit} s={13} /></button></td></tr>)}</tbody></table></div></div></div>}
    {a === 'LPU Monitoring' && <div className="fade">
      <div className="grid g4" style={{ gap: 18, marginBottom: 24 }}>
        <KPI t="Permits Issued" v="1,842" s="This month" ic="doc" c="var(--turq)" />
        <KPI t="Active Permits" v="612" s="Currently in effect" ic="check2" c="var(--sea)" />
        <KPI t="Expiring (7 days)" v="84" s="Renewal reminders sent" ic="clock" c="var(--warn)" />
        <KPI t="Flagged Cases" v="6" s="Under investigation" ic="alert" c="var(--bad)" /></div>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="row between" style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)' }}>
          <div className="ff bold" style={{ fontSize: 16 }}>Local Permit Unit — Foreign Visitor Monitoring</div><span className="badge b-info">Restricted Area Permits</span></div>
        <div style={{ overflowX: 'auto' }}><table>
          <thead><tr><th>Permit No.</th><th>Visitor</th><th>Nationality</th><th>Issued</th><th>Valid Until</th><th>Zones</th><th>Status</th></tr></thead>
          <tbody>{[['RAP-2026-44821', 'Daniel Whitmore', 'United Kingdom', '12 Sep 2026', '26 Sep 2026', 'Havelock, Neil', 'Active'],
              ['RAP-2026-44819', 'Marco Rossi', 'Italy', '12 Sep 2026', '22 Sep 2026', 'Havelock', 'Active'],
              ['RAP-2026-44802', 'Emily Carter', 'United States', '10 Sep 2026', '18 Sep 2026', 'Port Blair, Ross', 'Active'],
              ['RAP-2026-44788', 'Liam Novak', 'Czech Republic', '08 Sep 2026', '15 Sep 2026', 'Neil, Baratang', 'Expired'],
              ['RAP-2026-44771', 'Yuki Tanaka', 'Japan', '06 Sep 2026', '20 Sep 2026', 'Havelock, Neil', 'Active']].map((r, i) =>
              <tr key={i}><td className="mono xs">{r[0]}</td><td className="semi">{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td><td>{r[4]}</td><td className="xs">{r[5]}</td>
              <td><span className={'badge ' + (r[6] === 'Active' ? 'b-ok' : 'b-bad')}><span className="dot" />{r[6]}</span></td></tr>)}</tbody></table></div></div></div>}
    {['User Management', 'Tourist Management', 'Agency Management', 'Ticket Types', 'Slots & Capacity', 'Bookings', 'Payments', 'Reports & Analytics', 'Compliance', 'System Settings'].includes(a) && <div className="fade">
      {a === 'Reports & Analytics' && <><div className="grid g2" style={{ gap: 24 }}>
        <Chart title="Booking Trends" data={[8420, 9860, 9120, 12400, 11200, 14800, 13900, 16200]} labels={['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']} />
        <Chart title="Revenue Trends (₹ lakh)" data={[186, 224, 208, 296, 268, 348, 322, 384]} labels={['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']} color="var(--sea)" />
        <Chart title="Visitor Footfall" data={[24800, 29600, 27200, 38400, 34800, 44200, 41600, 48900]} labels={['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']} color="var(--coral)" />
        <Chart title="Ferry Utilisation (%)" data={[62, 68, 64, 76, 71, 84, 79, 88]} labels={['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']} color="var(--ocean-2)" /></div>
        <div className="row gap12 mt24"><button className="btn btn-coral" onClick={() => toast('Report exported as PDF')}><I d={Ic.dl} s={16} /> Export PDF</button>
          <button className="btn btn-out" onClick={() => toast('Report exported as Excel')}><I d={Ic.file} s={15} /> Export Excel</button>
          <button className="btn btn-out" onClick={() => toast('Report scheduled')}><I d={Ic.cal} s={15} /> Schedule Report</button></div></>}
      {a === 'User Management' && <div className="card" style={{ overflow: 'hidden' }}>
        <div className="row between" style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)' }}><div className="ff bold" style={{ fontSize: 16 }}>Platform Users</div>
          <button className="btn btn-coral btn-sm" onClick={() => toast('New user form opened')}><I d={Ic.plus} s={14} /> Add User</button></div>
        <div style={{ overflowX: 'auto' }}><table>
          <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Registered</th><th>Last Active</th><th>Status</th><th></th></tr></thead>
          <tbody>{[['Arun Krishnan', 'arun.k@example.com', 'Tourist', '12 Mar 2024', 'Today', 'Active'],
              ['Rajesh Menon', 'ops@coralreefadventures.in', 'Service Provider', '04 Mar 2024', 'Today', 'Active'],
              ['Lakshmi Pillai', 'bookings@coastaltravels.in', 'Agency', '18 Nov 2023', 'Yesterday', 'Active'],
              ['S. Iyer', 's.iyer@andamantourism.gov.in', 'Admin', '01 Jan 2023', 'Today', 'Active'],
              ['Priya Raman', 'priya.r@example.com', 'Tourist', '22 Jun 2025', '3 days ago', 'Active'],
              ['M. Das', 'm.das@andamantourism.gov.in', 'Admin', '14 Feb 2024', 'Today', 'Active']].map((r, i) =>
              <tr key={i}><td className="semi">{r[0]}</td><td className="xs">{r[1]}</td><td><span className="badge b-grey">{r[2]}</span></td><td>{r[3]}</td><td>{r[4]}</td>
              <td><span className="badge b-ok"><span className="dot" />{r[5]}</span></td>
              <td><button className="btn btn-out btn-sm" onClick={() => toast('User record opened')}><I d={Ic.edit} s={13} /></button></td></tr>)}</tbody></table></div></div>}
      {a === 'Tourist Management' && <div className="card" style={{ overflow: 'hidden' }}>
        <div className="row between" style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)' }}><div className="ff bold" style={{ fontSize: 16 }}>Registered Tourists</div>
          <span className="badge b-info">82,440 total</span></div>
        <div style={{ overflowX: 'auto' }}><table>
          <thead><tr><th>Name</th><th>Email</th><th>Mobile</th><th>Nationality</th><th>Bookings</th><th>Total Spend</th><th>Status</th></tr></thead>
          <tbody>{[['Arun Krishnan', 'arun.k@example.com', '+91 98765 43210', 'Indian', 12, 28420, 'Verified'],
              ['Priya Raman', 'priya.r@example.com', '+91 90482 11740', 'Indian', 8, 19640, 'Verified'],
              ['Daniel Whitmore', 'd.whitmore@example.co.uk', '+44 7700 900412', 'Foreign', 4, 32800, 'Verified'],
              ['Marco Rossi', 'm.rossi@example.it', '+39 340 1122334', 'Foreign', 3, 24150, 'Verified'],
              ['Neha Gupta', 'neha.g@example.com', '+91 94411 86203', 'Indian', 6, 14280, 'Pending Verification']].map((r, i) =>
              <tr key={i}><td className="semi">{r[0]}</td><td className="xs">{r[1]}</td><td className="xs">{r[2]}</td><td>{r[3]}</td><td>{r[4]}</td><td className="bold">{fmt(r[5])}</td>
              <td><span className={'badge ' + stCl(r[6])}><span className="dot" />{r[6]}</span></td></tr>)}</tbody></table></div></div>}
      {a === 'Agency Management' && <div className="card" style={{ overflow: 'hidden' }}>
        <div className="row between" style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)' }}><div className="ff bold" style={{ fontSize: 16 }}>Registered Agencies</div>
          <span className="badge b-ok">96 active · all licences current</span></div>
        <div style={{ overflowX: 'auto' }}><table>
          <thead><tr><th>Agency</th><th>Licence No.</th><th>Contact</th><th>Bookings (MTD)</th><th>Group Requests</th><th>Revenue</th><th>Status</th></tr></thead>
          <tbody>{[['Coastal Travels & Tours', 'AGY/AN/2023/1184', 'Lakshmi Pillai', 86, 4, 1260000, 'Approved'],
              ['Island Voyages Pvt Ltd', 'AGY/AN/2022/0912', 'Suresh Nair', 124, 7, 1840000, 'Approved'],
              ['Bay Explorer Holidays', 'AGY/AN/2024/1441', 'Farida Sheikh', 62, 3, 920000, 'Approved'],
              ['Nicobar Trails', 'AGY/AN/2025/1602', 'Ravi Chandran', 38, 2, 540000, 'Under Review']].map((r, i) =>
              <tr key={i}><td className="semi">{r[0]}</td><td className="mono xs">{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td><td>{r[4]}</td><td className="bold">{fmt(r[5])}</td>
              <td><span className={'badge ' + stCl(r[6])}><span className="dot" />{r[6]}</span></td></tr>)}</tbody></table></div></div>}
      {a === 'Ticket Types' && <div className="card" style={{ overflow: 'hidden' }}>
        <div className="row between" style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)' }}><div className="ff bold" style={{ fontSize: 16 }}>Ticket Type Configuration</div>
          <button className="btn btn-coral btn-sm" onClick={() => toast('New ticket type form opened')}><I d={Ic.plus} s={14} /> Add Type</button></div>
        <div style={{ overflowX: 'auto' }}><table>
          <thead><tr><th>Type</th><th>Code</th><th>Indian Rate</th><th>Foreign Rate</th><th>Concession</th><th>Proof Required</th><th>Status</th></tr></thead>
          <tbody>{[['Adult', 'ADT', '100%', '100%', '—', 'Photo ID', 'Active'], ['Child (5–11)', 'CHD', '50%', '50%', '50%', 'Birth Certificate', 'Active'],
              ['Child (under 5)', 'INF', 'Free', 'Free', '100%', 'Age Proof', 'Active'], ['Senior Citizen (60+)', 'SNR', '75%', '100%', '25%', 'Photo ID', 'Active'],
              ['Student', 'STU', '60%', '100%', '40%', 'Student ID', 'Active'], ['Differently Abled', 'DVA', 'Free', '50%', '100%', 'Disability Certificate', 'Active']].map((r, i) =>
              <tr key={i}><td className="semi">{r[0]}</td><td className="mono xs">{r[1]}</td><td className="bold">{r[2]}</td><td className="bold">{r[3]}</td><td>{r[4]}</td><td className="xs">{r[5]}</td>
              <td><span className="badge b-ok"><span className="dot" />{r[6]}</span></td></tr>)}</tbody></table></div></div>}
      {a === 'Slots & Capacity' && <div className="card" style={{ padding: 26 }}>
        <div className="row between wrapf gap12" style={{ marginBottom: 24 }}>
          <div><h2 className="ff bold" style={{ fontSize: 19 }}>Slot &amp; Capacity Management</h2><p className="sm mut mt8">Radhanagar Beach · 18 September 2026</p></div>
          <button className="btn btn-coral btn-sm" onClick={() => toast('Capacity configuration saved')}>Save Configuration</button></div>
        <div style={{ overflowX: 'auto' }}><table>
          <thead><tr><th>Time Slot</th><th>Capacity</th><th>Booked</th><th>Available</th><th>Utilisation</th><th>Status</th><th></th></tr></thead>
          <tbody>{SLOTS(1).map((s, i) => <tr key={i}>
            <td className="semi">{s.time}</td><td>{s.cap}</td><td>{s.cap - s.left}</td><td className="bold">{s.left}</td>
            <td><div className="row gap8"><div style={{ width: 70, height: 6, background: '#EEF2F5', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: (s.cap - s.left) / s.cap * 100 + '%', height: '100%', background: s.status === 'Available' ? 'var(--sea)' : s.status === 'Limited' ? 'var(--warn)' : 'var(--bad)' }} /></div>
              <span className="xs semi">{Math.round((s.cap - s.left) / s.cap * 100)}%</span></div></td>
            <td><span className={'badge ' + stCl(s.status)}><span className="dot" />{s.status}</span></td>
            <td><button className="btn btn-out btn-sm" onClick={() => toast('Slot editor opened')}><I d={Ic.edit} s={13} /></button></td></tr>)}</tbody></table></div></div>}
      {a === 'Bookings' && <div className="card" style={{ overflow: 'hidden' }}>
        <div className="row between" style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)' }}><div className="ff bold" style={{ fontSize: 16 }}>All Platform Bookings</div>
          <button className="btn btn-out btn-sm" onClick={() => toast('Export started')}><I d={Ic.dl} s={13} /> Export</button></div>
        <div style={{ overflowX: 'auto' }}><table>
          <thead><tr><th>Booking ID</th><th>Attraction</th><th>Customer</th><th>Date</th><th>Slot</th><th>Visitors</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>{[['AND-2026-085012', 'Cellular Jail', 'Bengal Heritage Tour', '22 Sep', '10:00 AM', 28, 9800, 'Confirmed'],
              ['AND-2026-084998', 'Ross Island', 'Nordic Travel Circle', '18 Sep', '09:00 AM', 22, 13860, 'Confirmed'],
              ['AND-2026-084944', 'Scuba — Nemo Reef', 'Global Divers Collective', '20 Sep', '07:00 AM', 18, 68250, 'Confirmed'],
              ['AND-2026-084901', 'Radhanagar Beach', 'Meridian Corp Retreat', '24 Sep', '09:00 AM', 42, 14700, 'Under Review'],
              ['AND-2026-084822', 'Light & Sound Show', 'Sunrise Senior Tours', '19 Sep', '06:00 PM', 54, 19845, 'Cancelled'],
              ['AND-2026-084721', 'Radhanagar Beach', 'Arun Krishnan', '18 Sep', '09:00 AM', 3, 2232, 'Confirmed']].map((r, i) =>
              <tr key={i}><td className="mono xs">{r[0]}</td><td className="semi">{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td><td>{r[4]}</td><td>{r[5]}</td><td className="bold">{fmt(r[6])}</td>
              <td><span className={'badge ' + stCl(r[7])}><span className="dot" />{r[7]}</span></td></tr>)}</tbody></table></div></div>}
      {a === 'Payments' && <div className="card" style={{ overflow: 'hidden' }}>
        <div className="row between" style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)' }}><div className="ff bold" style={{ fontSize: 16 }}>Payment Reconciliation</div>
          <span className="badge b-ok">99.7% reconciled</span></div>
        <div style={{ overflowX: 'auto' }}><table>
          <thead><tr><th>Transaction ID</th><th>Booking</th><th>Date</th><th>Method</th><th>Gross</th><th>Commission</th><th>Status</th></tr></thead>
          <tbody>{[['TXN9012441', 'AND-2026-085012', '14 Sep 2026', 'Net Banking', 9800, 980, 'Success'], ['TXN9012388', 'AND-2026-084944', '12 Sep 2026', 'UPI', 68250, 6825, 'Success'],
              ['TXN9012301', 'AND-2026-084998', '10 Sep 2026', 'Credit Card', 13860, 1386, 'Success'], ['TXN9012244', 'AND-2026-084822', '08 Sep 2026', 'UPI', 19845, 1984, 'Refunded'],
              ['TXN9012199', 'AND-2026-084721', '16 Sep 2026', 'UPI', 2232, 223, 'Success']].map((r, i) =>
              <tr key={i}><td className="mono xs">{r[0]}</td><td className="mono xs">{r[1]}</td><td>{r[2]}</td><td className="semi">{r[3]}</td><td className="bold">{fmt(r[4])}</td><td className="mut">{fmt(r[5])}</td>
              <td><span className={'badge ' + (r[6] === 'Success' ? 'b-ok' : 'b-info')}><span className="dot" />{r[6]}</span></td></tr>)}</tbody></table></div></div>}
      {a === 'Compliance' && <div className="card" style={{ overflow: 'hidden' }}>
        <div className="row between" style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)' }}><div className="ff bold" style={{ fontSize: 16 }}>Compliance Monitoring</div>
          <span className="badge b-warn">3 documents expiring within 30 days</span></div>
        <div style={{ overflowX: 'auto' }}><table>
          <thead><tr><th>Entity</th><th>Type</th><th>Document</th><th>Valid Until</th><th>Days Left</th><th>Status</th><th></th></tr></thead>
          <tbody>{[['Coral Reef Adventures', 'Service Provider', 'Public Liability Insurance', '17 Sep 2026', 1, 'Document Expired'],
              ['Neil Island Dive Co.', 'Service Provider', 'PADI Operator Certification', '02 Oct 2026', 16, 'Pending Verification'],
              ['Nicobar Trails', 'Agency', 'Tourism Trade Licence', '12 Oct 2026', 26, 'Under Review'],
              ['Havelock Marine Services', 'Service Provider', 'Marine Safety Clearance', '21 Feb 2027', 158, 'Verified'],
              ['Island Voyages Pvt Ltd', 'Agency', 'Agency Licence', '08 Nov 2027', 418, 'Verified']].map((r, i) =>
              <tr key={i}><td className="semi">{r[0]}</td><td><span className="badge b-grey">{r[1]}</span></td><td>{r[2]}</td><td>{r[3]}</td>
              <td className="bold" style={{ color: r[4] < 30 ? 'var(--bad)' : 'var(--ink)' }}>{r[4]}</td>
              <td><span className={'badge ' + stCl(r[5])}><span className="dot" />{r[5]}</span></td>
              <td><button className="btn btn-out btn-sm" onClick={() => toast('Compliance record opened')}>Review</button></td></tr>)}</tbody></table></div></div>}
      {a === 'System Settings' && <div className="card" style={{ padding: 30, maxWidth: 760 }}>
        <h2 className="ff bold" style={{ fontSize: 19 }}>System Settings</h2><p className="sm mut mt12">Platform-wide configuration parameters.</p>
        <div className="sep" />
        <div className="grid g2" style={{ gap: 18 }}>
          <Field label="Platform Commission Rate"><input className="inp" defaultValue="10%" /></Field>
          <Field label="GST Rate"><input className="inp" defaultValue="5%" /></Field>
          <Field label="Convenience Fee (per booking)"><input className="inp" defaultValue="₹25" /></Field>
          <Field label="Cart Hold Duration"><select className="inp"><option>15 minutes</option><option>10 minutes</option><option>20 minutes</option></select></Field>
          <Field label="Free Cancellation Window"><select className="inp"><option>24 hours</option><option>48 hours</option><option>12 hours</option></select></Field>
          <Field label="Refund Processing Time"><select className="inp"><option>5–7 working days</option><option>3–5 working days</option></select></Field>
          <Field label="Max Adults per Booking"><input type="number" className="inp" defaultValue="6" /></Field>
          <Field label="Max Children per Booking"><input type="number" className="inp" defaultValue="12" /></Field></div>
        <div className="sep" />
        <div className="ff bold" style={{ fontSize: 15.5, marginBottom: 14 }}>Notification Channels</div>
        {[['SMS Notifications', true], ['Email Notifications', true], ['WhatsApp Notifications', true], ['Push Notifications', false]].map((x, i) =>
        <label key={i} className="row between" style={{ padding: '11px 0', borderBottom: i < 3 ? '1px solid var(--line)' : 'none', cursor: 'pointer' }}>
            <span className="semi sm">{x[0]}</span>
            <input type="checkbox" defaultChecked={x[1]} style={{ width: 18, height: 18, accentColor: 'var(--turq)' }} /></label>)}
        <button className="btn btn-coral mt24" onClick={() => toast('System settings saved')}>Save Settings</button></div>}
    </div>}
  </Shell>;
}