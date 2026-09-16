import React, { useState } from 'react';
import { ACard } from '../../components/attractions/AttractionCard';
import { Empty } from '../../components/common/EmptyState';
import { Field } from '../../components/common/Field';
import { I, Ic } from '../../components/common/Icons';
import { QR } from '../../components/common/QRCode';
import { KPI } from '../../components/dashboard/KPI';
import { Shell } from '../../components/dashboard/Shell';
import { useApp } from '../../context/AppContext';
import { ATTR, BOOKINGS, NOTIFS, VISITORS } from '../../services/data';
import { IMG } from '../../services/images';
import { fmt, stCl } from '../../utils/format';

export function TouristDash() {
  const { go, user, toast } = useApp();const [a, setA] = useState('Dashboard'),[tab, setTab] = useState('Upcoming');
  const items = [['Dashboard', 'grid'], ['My Profile', 'user'], ['My Visitors', 'users'], ['Explore Attractions', 'pin'], ['Calendar', 'cal'], ['My Itinerary', 'layers'], '—',
  ['My Bookings', 'ticket'], ['Group Bookings', 'users'], ['My Tickets', 'qr'], ['Payments', 'card'], '—', ['Notifications', 'bell', '3'], ['Help & Support', 'headset']];
  const name = user?.name || 'Arun Krishnan';
  return <><Shell items={items} active={a} setActive={setA} badge="Tourist Portal"
    title={a === 'Dashboard' ? `Good Morning, ${name.split(' ')[0]}` : a} sub={a === 'Dashboard' ? 'Ready to explore Andaman?' : 'Tourist Portal · ' + a}>
    {a === 'Dashboard' && <div className="fade">
      <div className="grid g4" style={{ gap: 18 }}>
        <KPI t="Upcoming Visit" v="18 Sep" s="Radhanagar Beach · 09:00 AM" ic="cal" c="var(--turq)" />
        <KPI t="Total Bookings" v="12" s="↑ 3 this month" ic="ticket" c="var(--sea)" trend="up" />
        <KPI t="Saved Attractions" v="8" s="Across 4 islands" ic="heart" c="var(--coral)" />
        <KPI t="Wallet Balance" v="₹1,250" s="Refund credited 12 Sep" ic="wallet" c="var(--ocean-2)" /></div>
      <div className="grid mt24" style={{ gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)', gap: 24 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ height: 170, backgroundImage: `url(${IMG.radha})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,rgba(4,35,58,.85),rgba(4,35,58,.2))' }} />
            <div style={{ position: 'relative', padding: 22, color: '#fff' }}>
              <div className="badge" style={{ background: 'rgba(255,255,255,.2)', color: '#fff', marginBottom: 10 }}>Your Next Experience</div>
              <h3 className="ff bold" style={{ fontSize: 23 }}>Radhanagar Beach</h3>
              <div className="xs mt8" style={{ opacity: .9 }}>Havelock Island (Swaraj Dweep)</div></div></div>
          <div style={{ padding: 22 }}>
            <div className="grid g4" style={{ gap: 16 }}>
              {[['Date', '18 Sep 2026'], ['Time', '09:00 AM'], ['Visitors', '3 Persons'], ['Status', 'Confirmed']].map((x, i) =>
                <div key={i}><div className="xs mut">{x[0]}</div>
                  {x[0] === 'Status' ? <span className="badge b-ok mt8"><span className="dot" />Confirmed</span> : <div className="semi sm mt8">{x[1]}</div>}</div>)}</div>
            <div className="sep" />
            <div className="row gap12 wrapf">
              <button className="btn btn-coral" onClick={() => setA('My Tickets')}><I d={Ic.qr} s={16} /> View Ticket</button>
              <button className="btn btn-out" onClick={() => toast('Directions opened')}><I d={Ic.pin} s={15} /> Directions</button>
              <button className="btn btn-out" onClick={() => toast('Booking cancelled — refund initiated')}>Cancel Booking</button></div></div></div>
        <div className="card" style={{ padding: 22 }}>
          <div className="row between" style={{ marginBottom: 16 }}><div className="ff bold" style={{ fontSize: 15.5 }}>Recent Notifications</div>
            <button className="xs semi" style={{ color: 'var(--turq)' }} onClick={() => setA('Notifications')}>View all</button></div>
          {NOTIFS.slice(0, 4).map((n, i) => <div key={i} className="row gap12" style={{ padding: '12px 0', borderBottom: i < 3 ? '1px solid var(--line)' : 'none', alignItems: 'flex-start' }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: '#F2F7F9', color: 'var(--ocean)', display: 'grid', placeItems: 'center', flex: 'none' }}><I d={Ic[n.ic]} s={15} /></div>
            <div style={{ minWidth: 0 }}><div className="semi xs" style={{ lineHeight: 1.5 }}>{n.t}</div><div className="xs mut mt8">{n.ts}</div></div></div>)}</div></div>
      <div className="grid g3 mt24">
        <div className="card" style={{ padding: 22, gridColumn: 'span 2' }}>
          <div className="row between" style={{ marginBottom: 16 }}><div className="ff bold" style={{ fontSize: 15.5 }}>Upcoming Bookings</div>
            <button className="xs semi" style={{ color: 'var(--turq)' }} onClick={() => setA('My Bookings')}>View all</button></div>
          <div style={{ overflowX: 'auto' }}><table>
            <thead><tr><th>Booking ID</th><th>Attraction</th><th>Date</th><th>Time</th><th>Visitors</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>{BOOKINGS.filter((b) => b.tab === 'Upcoming').map((b) => <tr key={b.id}>
              <td className="mono xs">{b.id}</td><td className="semi">{b.a}</td><td>{b.d}</td><td>{b.t}</td><td>{b.v}</td><td className="bold">{fmt(b.amt)}</td>
              <td><span className={'badge ' + stCl(b.st)}><span className="dot" />{b.st}</span></td></tr>)}</tbody></table></div></div>
        <div className="card" style={{ padding: 22 }}>
          <div className="ff bold" style={{ fontSize: 15.5, marginBottom: 16 }}>Quick Actions</div>
          {[['Explore Attractions', 'pin', () => go('explore')], ['Build Itinerary', 'layers', () => go('plan')], ['Group Booking', 'users', () => go('group')], ['Ferry Schedule', 'ship', () => go('ferry')], ['My Trip Cart', 'cart', () => go('cart')]].map((q, i) =>
            <button key={i} className="row gap12 between" style={{ width: '100%', padding: '12px 14px', borderRadius: 12, textAlign: 'left', marginBottom: 6, background: '#F7FAFB' }} onClick={q[2]}>
              <span className="row gap12"><I d={Ic[q[1]]} s={16} style={{ color: 'var(--turq)' }} /><span className="semi sm">{q[0]}</span></span>
              <I d={Ic.chev} s={14} style={{ color: 'var(--muted)' }} /></button>)}</div></div>
    </div>}
    {a === 'My Profile' && <div className="card fade" style={{ padding: 30, maxWidth: 820 }}>
      <div className="row between wrapf gap16" style={{ marginBottom: 26 }}>
        <div className="row gap16">
          <div style={{ width: 82, height: 82, borderRadius: 22, background: 'linear-gradient(135deg,var(--turq),var(--ocean))', color: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'Poppins', fontWeight: 700, fontSize: 27 }}>AK</div>
          <div><h2 className="ff bold" style={{ fontSize: 21 }}>{name}</h2>
            <div className="sm mut mt8">@arun_k · Member since March 2024</div>
            <div className="row gap8 mt12"><span className="badge b-ok"><I d={Ic.check2} s={11} />Mobile Verified</span><span className="badge b-info"><I d={Ic.mail} s={11} />Email Verified</span></div></div></div>
        <button className="btn btn-out btn-sm" onClick={() => toast('Photo upload opened')}><I d={Ic.camera} s={14} /> Change Photo</button></div>
      <div className="sep" />
      <div className="grid g2" style={{ gap: 18 }}>
        <Field label="Full Name"><input className="inp" defaultValue={name} /></Field>
        <Field label="Username"><input className="inp" defaultValue="arun_k" disabled style={{ background: '#F7F9FA' }} /></Field>
        <Field label="Email Address"><input className="inp" defaultValue="arun.k@example.com" /></Field>
        <Field label="Mobile Number"><input className="inp" defaultValue="+91 98765 43210" /></Field>
        <Field label="Nationality"><select className="inp"><option>Indian</option><option>Foreign</option></select></Field>
        <Field label="Date of Birth"><input type="date" className="inp" defaultValue="1989-03-12" /></Field></div>
      <div className="mt16"><Field label="Address"><textarea className="inp" rows={3} defaultValue="14 Marine Hill Road, Port Blair, South Andaman – 744101" /></Field></div>
      <div className="row gap12 mt24"><button className="btn btn-coral" onClick={() => toast('Profile updated successfully')}>Save Changes</button>
        <button className="btn btn-out">Edit Profile</button></div></div>}
    {a === 'My Visitors' && <div className="fade">
      <div className="row between wrapf gap12" style={{ marginBottom: 20 }}>
        <div><h2 className="ff bold" style={{ fontSize: 20 }}>My Visitors</h2><p className="sm mut mt8">Saved visitor profiles load automatically during booking.</p></div>
        <button className="btn btn-coral" onClick={() => toast('Add visitor form opened')}><I d={Ic.plus} s={16} /> Add Visitor</button></div>
      <div className="grid g3">{VISITORS.map((v) =>
          <div key={v.id} className="card" style={{ padding: 20 }}>
          <div className="row between"><div className="row gap12">
            <div style={{ width: 44, height: 44, borderRadius: 13, background: v.t === 'Adult' ? '#E8F6F8' : '#FFF3DC', color: v.t === 'Adult' ? 'var(--turq)' : 'var(--warn)', display: 'grid', placeItems: 'center' }}><I d={Ic.user} s={20} /></div>
            <div><div className="semi sm">{v.n}</div><div className="xs mut mt8">{v.dob}</div></div></div></div>
          <div className="row gap8 wrapf mt16"><span className="badge b-grey">{v.t}</span><span className="badge b-info">{v.nat}</span></div>
          <div className="xs mut mono mt12">{v.idn}</div><div className="sep" />
          <div className="row gap8"><button className="btn btn-turq btn-sm" style={{ flex: 1 }} onClick={() => toast(v.n + ' selected')}>Select</button>
            <button className="btn btn-out btn-sm" onClick={() => toast('Edit ' + v.n)}><I d={Ic.edit} s={13} /></button>
            <button className="btn btn-sm" style={{ color: 'var(--bad)', border: '1.5px solid #F5D6D4' }} onClick={() => toast(v.n + ' removed')}><I d={Ic.trash} s={13} /></button></div></div>)}</div></div>}
    {a === 'My Tickets' && <div className="fade">
      <div className="row gap8" style={{ marginBottom: 24, borderBottom: '1.5px solid var(--line)' }}>
        {['Upcoming', 'Completed', 'Cancelled'].map((t) => <button key={t} onClick={() => setTab(t)}
          style={{ padding: '12px 18px', fontSize: 14, fontWeight: 700, color: tab === t ? 'var(--ocean)' : 'var(--muted)', borderBottom: '3px solid ' + (tab === t ? 'var(--coral)' : 'transparent'), marginBottom: -1.5 }}>
          {t} <span className="badge b-grey" style={{ marginLeft: 6, padding: '2px 7px' }}>{BOOKINGS.filter((b) => b.tab === t).length}</span></button>)}</div>
      {BOOKINGS.filter((b) => b.tab === tab).length ? <div className="grid g3">
        {BOOKINGS.filter((b) => b.tab === tab).map((b) =>
          <div key={b.id} className="card" style={{ padding: 20, opacity: tab === 'Cancelled' ? .72 : 1 }}>
            <div className="row between"><span className={'badge ' + stCl(b.st)}><span className="dot" />{b.st}</span>
              <span className="xs mut mono">{b.id}</span></div>
            <h3 className="ff bold mt16" style={{ fontSize: 16 }}>{b.a}</h3>
            <div className="row gap16 wrapf xs mut mt12">
              <span className="row gap8"><I d={Ic.cal} s={13} />{b.d}</span><span className="row gap8"><I d={Ic.clock} s={13} />{b.t}</span>
              <span className="row gap8"><I d={Ic.users} s={13} />{b.v}</span></div>
            <div className="sep" />
            <div className="row gap16" style={{ alignItems: 'center' }}>
              <QR size={86} seed={b.id} />
              <div style={{ flex: 1 }}><div className="xs mut">Amount Paid</div><div className="ff bold" style={{ fontSize: 18, color: 'var(--ocean)' }}>{fmt(b.amt)}</div>
                <div className="xs mut mt8">{tab === 'Upcoming' ? 'Scan at entry gate' : tab === 'Completed' ? 'Visit completed' : 'Refund processed'}</div></div></div>
            <div className="row gap8 mt16">
              <button className="btn btn-out btn-sm" style={{ flex: 1 }} onClick={() => toast('Ticket opened')}>View</button>
              <button className="btn btn-out btn-sm" onClick={() => toast('PDF downloaded')}><I d={Ic.dl} s={13} /></button>
              {tab === 'Upcoming' && <button className="btn btn-sm" style={{ color: 'var(--bad)', border: '1.5px solid #F5D6D4' }} onClick={() => toast('Cancellation requested')}>Cancel</button>}</div></div>)}</div> :
        <div className="card"><Empty icon="ticket" t={`No ${tab.toLowerCase()} tickets`} s={tab === 'Upcoming' ? "You have no upcoming visits booked. Explore attractions to plan your next island day." : `You have no ${tab.toLowerCase()} bookings yet.`} cta={tab === 'Upcoming' ? 'Explore Attractions' : null} onCta={() => go('explore')} /></div>}</div>}
    {a === 'My Bookings' && <div className="card fade" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="row between wrapf gap12" style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)' }}>
        <div className="ff bold" style={{ fontSize: 16 }}>All Bookings</div>
        <div className="row gap8"><button className="btn btn-out btn-sm"><I d={Ic.filter} s={13} /> Filter</button>
          <button className="btn btn-out btn-sm" onClick={() => toast('Export started')}><I d={Ic.dl} s={13} /> Export</button></div></div>
      <div style={{ overflowX: 'auto' }}><table>
        <thead><tr><th>Booking ID</th><th>Attraction</th><th>Date</th><th>Time</th><th>Visitors</th><th>Amount</th><th>Status</th><th></th></tr></thead>
        <tbody>{BOOKINGS.map((b) => <tr key={b.id}>
          <td className="mono xs">{b.id}</td><td className="semi">{b.a}</td><td>{b.d}</td><td>{b.t}</td><td>{b.v}</td><td className="bold">{fmt(b.amt)}</td>
          <td><span className={'badge ' + stCl(b.st)}><span className="dot" />{b.st}</span></td>
          <td><button className="btn btn-out btn-sm" onClick={() => setA('My Tickets')}>View</button></td></tr>)}</tbody></table></div></div>}
    {a === 'Calendar' && <div className="grid fade" style={{ gridTemplateColumns: 'minmax(0,1.3fr) minmax(0,1fr)', gap: 24 }}>
      <div className="card" style={{ padding: 24 }}>
        <div className="row between" style={{ marginBottom: 20 }}>
          <div className="ff bold" style={{ fontSize: 17 }}>My Travel Calendar</div>
          <div className="row gap8"><button className="icb" style={{ width: 32, height: 32 }}><I d={Ic.chevl} s={15} /></button>
            <span className="semi sm">September 2026</span><button className="icb" style={{ width: 32, height: 32 }}><I d={Ic.chev} s={15} /></button></div></div>
        <div className="cal" style={{ marginBottom: 10 }}>{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className="xs bold mut center">{d}</div>)}</div>
        <div className="cal">{Array.from({ length: 35 }, (_, i) => {const d = i - 1;
              if (d < 1 || d > 30) return <div key={i} />;
              const bk = [18, 19].includes(d),un = d < 16,on = d === 18;
              return <button key={i} className={'cd ' + (on ? 'on' : bk ? 'bk' : un ? 'un' : '')} disabled={un} onClick={() => toast(`${d} September · ${bk ? '1 booking' : '8 attractions available'}`)}>
            {d}{bk && <i />}</button>;})}</div>
        <div className="sep" />
        <div className="row gap12 wrapf">{[['Available', '#F7FAFB', 'var(--muted)'], ['Selected', 'var(--ocean)', '#fff'], ['Booked', '#E5F6F0', 'var(--ok)'], ['Unavailable', '#F2F4F5', '#B6C1C9']].map((l, i) =>
            <span key={i} className="row gap8 xs semi"><span style={{ width: 15, height: 15, borderRadius: 5, background: l[1], border: '1px solid var(--line)' }} />{l[0]}</span>)}</div></div>
      <div className="card" style={{ padding: 24 }}>
        <div className="ff bold" style={{ fontSize: 16 }}>18 September 2026</div><div className="xs mut mt8">Thursday</div><div className="sep" />
        <div className="xs bold mut" style={{ letterSpacing: .8, marginBottom: 12 }}>YOUR BOOKINGS</div>
        {BOOKINGS.filter((b) => b.d === '18 Sep 2026').map((b, i) =>
          <div key={i} className="row gap12 card" style={{ padding: 13, marginBottom: 9, background: '#F6FCF9', borderColor: '#C6E9D9' }}>
            <I d={Ic.check2} s={17} style={{ color: 'var(--sea)' }} />
            <div><div className="semi xs">{b.a}</div><div className="xs mut mt8">{b.t} · {b.v} visitors</div></div></div>)}
        <div className="xs bold mut mt24" style={{ letterSpacing: .8, marginBottom: 12 }}>AVAILABLE ATTRACTIONS</div>
        {ATTR.slice(3, 7).map((x) => <div key={x.id} className="row between" style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
          <div className="row gap12"><div style={{ width: 34, height: 34, borderRadius: 10, backgroundImage: `url(${x.img})`, backgroundSize: 'cover' }} />
            <div><div className="semi xs">{x.name}</div><div className="xs mut mt8">from {fmt(x.inr)}</div></div></div>
          <span className="badge b-ok"><span className="dot" />{4 + x.id.charCodeAt(2) % 3} slots</span></div>)}</div></div>}
    {a === 'Notifications' && <div className="fade">
      <div className="row between wrapf gap12" style={{ marginBottom: 20 }}>
        <div><h2 className="ff bold" style={{ fontSize: 20 }}>Notification Center</h2><p className="sm mut mt8">Reminders, confirmations and platform updates.</p></div>
        <button className="btn btn-out btn-sm" onClick={() => toast('All marked as read')}>Mark all as read</button></div>
      <div className="card" style={{ overflow: 'hidden' }}>{NOTIFS.map((n, i) =>
          <div key={i} className="row gap16" style={{ padding: '18px 22px', borderBottom: i < NOTIFS.length - 1 ? '1px solid var(--line)' : 'none', alignItems: 'flex-start', background: i < 2 ? '#FAFCFD' : '#fff' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F2F7F9', color: 'var(--ocean)', display: 'grid', placeItems: 'center', flex: 'none' }}><I d={Ic[n.ic]} s={18} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="row gap8 wrapf" style={{ marginBottom: 6 }}><span className={'badge ' + n.cl}>{n.c}</span>{i < 2 && <span className="badge b-bad" style={{ padding: '3px 8px' }}>New</span>}</div>
            <div className="semi sm">{n.t}</div><div className="xs mut mt8">{n.s}</div></div>
          <div className="xs mut" style={{ flex: 'none' }}>{n.ts}</div></div>)}</div></div>}
    {a === 'My Itinerary' && <div className="card fade" style={{ padding: 28, maxWidth: 760 }}>
      <div className="row between wrapf gap12" style={{ marginBottom: 24 }}>
        <div><h2 className="ff bold" style={{ fontSize: 19 }}>My Itinerary · 18 September</h2><p className="sm mut mt8">Slot-aware plan across Havelock and Port Blair.</p></div>
        <button className="btn btn-out btn-sm" onClick={() => go('plan')}><I d={Ic.edit} s={13} /> Customize</button></div>
      {[['09:00 AM', 'Radhanagar Beach', 'Havelock Island · 3 hrs', IMG.radha], ['12:00 PM', 'Lunch / Break', 'Beach No. 5 food court · 1.5 hrs', null],
        ['02:00 PM', 'Cellular Jail', 'Port Blair · 2.5 hrs', IMG.jail], ['06:00 PM', 'Light & Sound Show', 'Cellular Jail courtyard · 1 hr', IMG.night]].map((t, i) =>
        <div key={i} className="tl"><div className="tl-d">{i + 1}</div>
          <div className="xs bold" style={{ color: 'var(--turq)', letterSpacing: .6 }}>{t[0]}</div>
          <div className="row gap12 mt8">{t[3] ? <div style={{ width: 48, height: 48, borderRadius: 12, backgroundImage: `url(${t[3]})`, backgroundSize: 'cover', flex: 'none' }} /> :
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#F2F6F8', display: 'grid', placeItems: 'center', color: 'var(--muted)', flex: 'none' }}><I d={Ic.gift} s={20} /></div>}
            <div><div className="semi sm">{t[1]}</div><div className="xs mut mt8">{t[2]}</div></div></div></div>)}</div>}
    {a === 'Payments' && <div className="card fade" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="row between" style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)' }}>
        <div className="ff bold" style={{ fontSize: 16 }}>Payment History</div><span className="badge b-ok">All settled</span></div>
      <div style={{ overflowX: 'auto' }}><table>
        <thead><tr><th>Transaction ID</th><th>Booking</th><th>Date</th><th>Method</th><th>Amount</th><th>Status</th><th></th></tr></thead>
        <tbody>{[['TXN8847213904', 'AND-2026-084721', '16 Sep 2026', 'UPI', 2232, 'Success'], ['TXN8847213811', 'AND-2026-084655', '16 Sep 2026', 'UPI', 1239, 'Success'],
              ['TXN8821004412', 'AND-2026-081190', '30 Jul 2026', 'Credit Card', 354, 'Success'], ['TXN8798113220', 'AND-2026-076441', '09 Jul 2026', 'Net Banking', 236, 'Refunded']].map((r, i) =>
              <tr key={i}><td className="mono xs">{r[0]}</td><td className="mono xs">{r[1]}</td><td>{r[2]}</td><td className="semi">{r[3]}</td><td className="bold">{fmt(r[4])}</td>
            <td><span className={'badge ' + (r[5] === 'Success' ? 'b-ok' : 'b-info')}><span className="dot" />{r[5]}</span></td>
            <td><button className="btn btn-out btn-sm" onClick={() => toast('Receipt downloaded')}><I d={Ic.dl} s={13} /> Receipt</button></td></tr>)}</tbody></table></div></div>}
    {a === 'Group Bookings' && <div className="fade">
      <div className="row between wrapf gap12" style={{ marginBottom: 20 }}>
        <div><h2 className="ff bold" style={{ fontSize: 20 }}>Group Bookings</h2><p className="sm mut mt8">Track approval status of institutional requests.</p></div>
        <button className="btn btn-coral" onClick={() => go('group')}><I d={Ic.plus} s={16} /> New Group Booking</button></div>
      <div className="card" style={{ overflow: 'hidden' }}><div style={{ overflowX: 'auto' }}><table>
        <thead><tr><th>Reference</th><th>Organization</th><th>Type</th><th>Visit Date</th><th>Visitors</th><th>Amount</th><th>Status</th></tr></thead>
        <tbody>{[['GRP-2026-0391', "St. Mary's H.S. School", 'School', '25 Sep 2026', '48 (30 IN · 18 FX)', 32940, 'Pending Approval'],
                ['GRP-2026-0342', 'Nexus Solutions Pvt Ltd', 'Corporate', '12 Sep 2026', '22 (22 IN)', 7392, 'Approved'],
                ['GRP-2026-0288', 'Coastal Travels', 'Tour Operator', '04 Sep 2026', '36 (12 IN · 24 FX)', 26460, 'Approved'],
                ['GRP-2026-0201', 'Delhi Public School', 'School', '22 Aug 2026', '60 (60 IN)', 18900, 'Rejected']].map((r, i) =>
                <tr key={i}><td className="mono xs">{r[0]}</td><td className="semi">{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td><td>{r[4]}</td><td className="bold">{fmt(r[5])}</td>
            <td><span className={'badge ' + stCl(r[6])}><span className="dot" />{r[6]}</span></td></tr>)}</tbody></table></div></div></div>}
    {a === 'Explore Attractions' && <div className="fade"><div className="grid g3">{ATTR.slice(0, 6).map((x) => <ACard key={x.id} a={x} />)}</div>
      <div className="center mt32"><button className="btn btn-coral" onClick={() => go('explore')}>View All Attractions <I d={Ic.arr} s={16} /></button></div></div>}
    {a === 'Help & Support' && <div className="card fade" style={{ padding: 30, maxWidth: 700 }}>
      <h2 className="ff bold" style={{ fontSize: 20 }}>Help &amp; Support</h2>
      <p className="sm mut mt12">Raise a ticket or reach our support desk directly.</p>
      <div className="grid g2 mt24" style={{ gap: 16 }}>
        {[['Toll-Free Helpline', '1800-345-2465', 'phone'], ['Email Support', 'support@andamantourism.gov.in', 'mail']].map((x, i) =>
          <div key={i} className="card row gap12" style={{ padding: 16 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: '#E9F4F8', color: 'var(--ocean)', display: 'grid', placeItems: 'center' }}><I d={Ic[x[2]]} s={17} /></div>
            <div><div className="xs mut">{x[0]}</div><div className="semi xs mt8">{x[1]}</div></div></div>)}</div>
      <div className="mt24"><Field label="Subject"><input className="inp" placeholder="Brief description of your issue" /></Field></div>
      <div className="mt16"><Field label="Category"><select className="inp"><option>Booking Help</option><option>Payment Help</option><option>Cancellation &amp; Refund</option><option>Technical Issue</option><option>Other</option></select></Field></div>
      <div className="mt16"><Field label="Message"><textarea className="inp" rows={4} placeholder="Describe your issue in detail…" /></Field></div>
      <button className="btn btn-coral mt24" onClick={() => toast('Support ticket submitted · SUP-2026-4412')}><I d={Ic.send} s={15} /> Submit Ticket</button></div>}
  </Shell>
  <nav className="bottomnav">{[['Home', 'home', () => go('home')], ['Explore', 'pin', () => go('explore')], ['Bookings', 'ticket', () => setA('My Bookings')], ['Tickets', 'qr', () => setA('My Tickets')], ['Profile', 'user', () => setA('My Profile')]].map((b, i) =>
      <button key={i} className={'bn ' + (a === 'My Bookings' && i === 2 || a === 'My Tickets' && i === 3 || a === 'My Profile' && i === 4 ? 'on' : '')} onClick={b[2]}>
      <I d={Ic[b[1]]} s={19} />{b[0]}</button>)}</nav>
  </>;
}