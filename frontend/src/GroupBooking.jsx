import React, { useState } from 'react';
import { Field } from '../components/common/Field';
import { I, Ic } from '../components/common/Icons';
import { useApp } from '../context/AppContext';
import { fmt, stCl } from '../utils/format';

export function Group() {
  const { toast } = useApp();
  const [f, setF] = useState({ org: 'School', name: '', cp: '', mob: '', em: '', ind: 30, fx: 18, date: '2026-09-25', slot: '10:00 AM' });
  const [err, setErr] = useState({}),[up, setUp] = useState(null),[sub, setSub] = useState(false),[busy, setBusy] = useState(false);
  const doUp = () => {setBusy(true);setTimeout(() => {setBusy(false);setUp({ n: 'visitor_list_stmarys_2026.xlsx', size: '48 KB', total: 48, ind: 30, fx: 18 });}, 1100);};
  const submit = () => {const e = {};
    if (!f.name.trim()) e.name = 'Organization name is required';
    if (!f.cp.trim()) e.cp = 'Contact person name is required';
    if (!/^[6-9]\d{9}$/.test(f.mob)) e.mob = 'Enter a valid 10-digit mobile number';
    if (!/^\S+@\S+\.\S+$/.test(f.em)) e.em = 'Enter a valid email address';
    if (!up) e.up = 'Please upload the completed visitor Excel file';
    setErr(e);if (Object.keys(e).length) return toast('Please correct the highlighted fields');
    setBusy(true);setTimeout(() => {setBusy(false);setSub(true);}, 900);};
  if (sub) return <div className="sec"><div className="wrap" style={{ maxWidth: 760 }}>
    <div className="card center fade" style={{ padding: '54px 40px' }}>
      <div className="ebox" style={{ background: '#FFF3DC', color: 'var(--warn)', width: 88, height: 88 }}><I d={Ic.clock} s={38} /></div>
      <h2 className="ff bold" style={{ fontSize: 26 }}>Group Booking Submitted</h2>
      <div className="badge b-warn mt16" style={{ padding: '9px 18px' }}><span className="dot" /> Pending Approval</div>
      <p className="sm mut mt24" style={{ maxWidth: 440, margin: '24px auto 0', lineHeight: 1.75 }}>Your group booking request has been forwarded to the Regulatory Authority for review. You will receive a decision via SMS and email within 2 working days.</p>
      <div className="card mt32" style={{ padding: 0, overflow: 'hidden', textAlign: 'left' }}>
        {[['Reference ID', 'GRP-2026-0391'], ['Organization', f.name], ['Organization Type', f.org], ['Visit Date', '25 September 2026'], ['Time Slot', f.slot], ['Total Visitors', '48 (30 Indian · 18 Foreign)'], ['Estimated Amount', '₹32,940'], ['Submitted', '16 Sep 2026, 11:42 AM']].map((x, i) =>
          <div key={i} className="row between" style={{ padding: '13px 20px', borderBottom: i < 7 ? '1px solid var(--line)' : 'none' }}>
            <span className="sm mut">{x[0]}</span><span className="semi sm">{x[1]}</span></div>)}</div>
      <div className="row gap12 mt32" style={{ justifyContent: 'center' }}>
        <button className="btn btn-out" onClick={() => toast('Acknowledgement PDF downloaded')}><I d={Ic.dl} s={15} /> Download Acknowledgement</button>
        <button className="btn btn-coral" onClick={() => setSub(false)}>Submit Another Request</button></div>
      <div className="row gap16 wrapf mt40" style={{ justifyContent: 'center' }}>
        {['Pending Approval', 'Approved', 'Rejected', 'Cancelled'].map((s, i) =>
          <span key={i} className={'badge ' + (i === 0 ? stCl(s) : 'b-grey')} style={{ opacity: i === 0 ? 1 : .55 }}><span className="dot" />{s}</span>)}</div>
    </div></div></div>;
  return <>
    <div style={{ background: 'linear-gradient(130deg,#0E8F6F,#0A5C8F)', color: '#fff', padding: '56px 0 42px' }}><div className="wrap">
      <div className="eyebrow" style={{ color: '#9FEBDC' }}>Institutional Bookings</div>
      <h1 className="h2" style={{ fontSize: 38 }}>Plan a Group Visit</h1>
      <p className="sub" style={{ color: 'rgba(255,255,255,.85)' }}>For schools, colleges, corporates and tour operators — bulk visitor upload with single-point approval.</p></div></div>
    <div className="sec" style={{ paddingTop: 34 }}><div className="wrap" style={{ maxWidth: 980 }}>
      <div className="card" style={{ padding: 34 }}>
        <h3 className="ff bold" style={{ fontSize: 19 }}>Organization Details</h3>
        <div className="mt24"><label className="lbl">Organization Type</label>
          <div className="row gap8 wrapf">{['School', 'College', 'Corporate', 'Organization', 'Tour Operator', 'Other'].map((o) =>
              <button key={o} className="chip" onClick={() => setF({ ...f, org: o })}
              style={{ background: f.org === o ? 'var(--ocean)' : '#F4F8FA', color: f.org === o ? '#fff' : 'var(--muted)', padding: '10px 18px', fontSize: 13.5 }}>{o}</button>)}</div></div>
        <div className="grid g2 mt24" style={{ gap: 18 }}>
          <Field label="Organization Name" error={err.name}><input className={'inp ' + (err.name ? 'err' : '')} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. St. Mary's Higher Secondary School" /></Field>
          <Field label="Contact Person" error={err.cp}><input className={'inp ' + (err.cp ? 'err' : '')} value={f.cp} onChange={(e) => setF({ ...f, cp: e.target.value })} placeholder="Full name of coordinator" /></Field>
          <Field label="Mobile Number" error={err.mob}>
            <div className="row gap8"><span className="inp semi" style={{ width: 66, textAlign: 'center', background: '#F6F9FA' }}>+91</span>
              <input className={'inp ' + (err.mob ? 'err' : '')} maxLength={10} value={f.mob} onChange={(e) => setF({ ...f, mob: e.target.value.replace(/\D/g, '') })} placeholder="98765 43210" /></div></Field>
          <Field label="Email Address" error={err.em}><input type="email" className={'inp ' + (err.em ? 'err' : '')} value={f.em} onChange={(e) => setF({ ...f, em: e.target.value })} placeholder="coordinator@organization.in" /></Field>
        </div>
        <div className="sep" style={{ margin: '32px 0' }} />
        <h3 className="ff bold" style={{ fontSize: 19 }}>Visit Details</h3>
        <div className="grid g4 mt24" style={{ gap: 18 }}>
          <Field label="Indian Visitors"><input type="number" min="0" className="inp" value={f.ind} onChange={(e) => setF({ ...f, ind: +e.target.value })} /></Field>
          <Field label="Foreign Visitors"><input type="number" min="0" className="inp" value={f.fx} onChange={(e) => setF({ ...f, fx: +e.target.value })} /></Field>
          <Field label="Visit Date"><input type="date" className="inp" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
          <Field label="Time Slot"><select className="inp" value={f.slot} onChange={(e) => setF({ ...f, slot: e.target.value })}>
            {['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'].map((s) => <option key={s}>{s}</option>)}</select></Field></div>
        <div className="sep" style={{ margin: '32px 0' }} />
        <h3 className="ff bold" style={{ fontSize: 19 }}>Visitor List Upload</h3>
        <p className="sm mut mt12">Download the official template, complete all visitor rows, then upload. Data is validated automatically before submission.</p>
        <div className="row gap12 wrapf mt24">
          <button className="btn btn-out" onClick={() => toast('Excel template downloaded')}><I d={Ic.dl} s={16} /> Download Excel Template</button>
          <span className="xs mut row gap8"><I d={Ic.file} s={14} /> group_visitor_template_v3.xlsx · 12 KB</span></div>
        {!up ? <div className="card mt24" style={{ padding: '42px 24px', textAlign: 'center', border: '2px dashed ' + (err.up ? 'var(--bad)' : '#CFE0E8'), background: err.up ? '#FFFAFA' : '#FAFCFD', boxShadow: 'none' }}>
          {busy ? <><div className="skel" style={{ width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px' }} />
            <div className="semi sm">Uploading and validating…</div><div className="xs mut mt8">Checking visitor records against booking rules</div></> :
            <><div className="ebox" style={{ width: 62, height: 62, background: '#E9F4F8', color: 'var(--ocean)' }}><I d={Ic.upload} s={26} /></div>
            <div className="ff semi" style={{ fontSize: 15.5 }}>Upload Completed Excel File</div>
            <div className="xs mut mt8">Drag and drop, or browse. .xlsx and .xls up to 5 MB</div>
            <button className="btn btn-ocean mt24" onClick={doUp}><I d={Ic.clip} s={15} /> Browse Files</button></>}
          {err.up && <div className="err-t mt16">{err.up}</div>}</div> :
          <div className="card mt24 fade" style={{ padding: 24, background: '#F6FCF9', borderColor: '#C6E9D9' }}>
            <div className="row between wrapf gap12">
              <div className="row gap12"><div style={{ width: 44, height: 44, borderRadius: 12, background: '#E5F6F0', color: 'var(--sea)', display: 'grid', placeItems: 'center' }}><I d={Ic.file} s={21} /></div>
                <div><div className="semi sm">{up.n}</div><div className="xs mut mt8">{up.size} · Uploaded just now</div></div></div>
              <button className="btn btn-out btn-sm" onClick={() => setUp(null)}><I d={Ic.trash} s={14} /> Remove</button></div>
            <div className="sep" />
            <div className="grid g2" style={{ gap: 10 }}>
              {[['File uploaded successfully', true], [`${up.total} visitors detected`, true], [`${up.ind} Indian visitors`, true], [`${up.fx} Foreign visitors`, true], ['Data validation successful', true], ['No duplicate records found', true]].map((x, i) =>
              <div key={i} className="row gap8 sm semi"><I d={Ic.check2} s={16} style={{ color: 'var(--sea)' }} /> {x[0]}</div>)}</div>
            <div className="card mt24" style={{ padding: 0, overflow: 'hidden' }}><div style={{ overflowX: 'auto' }}><table>
              <thead><tr><th>#</th><th>Visitor Name</th><th>Type</th><th>Nationality</th><th>ID Reference</th><th>Status</th></tr></thead>
              <tbody>{[['Arjun Mehta', 'Adult', 'Indian', 'XXXX 3312'], ['Sneha Raj', 'Adult', 'Indian', 'XXXX 8841'], ['Emily Carter', 'Adult', 'Foreign', 'Passport US-9921'], ['Rohit Nair', 'Child', 'Indian', 'Birth Cert. 2014'], ['Liam Novak', 'Adult', 'Foreign', 'Passport CZ-4417']].map((r, i) =>
                    <tr key={i}><td className="mut">{i + 1}</td><td className="semi">{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td><td className="mono xs">{r[3]}</td><td><span className="badge b-ok"><I d={Ic.tick} s={11} />Valid</span></td></tr>)}
              </tbody></table></div>
              <div className="center sm mut" style={{ padding: '12px' }}>Showing 5 of {up.total} records</div></div>
          </div>}
        <div className="card mt32 row between wrapf gap16" style={{ padding: '20px 24px', background: '#F7FBFC' }}>
          <div><div className="xs mut">Estimated total · {f.ind + f.fx} visitors</div>
            <div className="ff bold" style={{ fontSize: 23, color: 'var(--ocean)' }}>{fmt(f.ind * 300 + f.fx * 900 + Math.round((f.ind * 300 + f.fx * 900) * .05))}</div>
            <div className="xs mut mt8">Final amount confirmed after approval</div></div>
          <button className="btn btn-coral btn-lg" disabled={busy} onClick={submit}>{busy ? 'Submitting…' : <><I d={Ic.send} s={16} /> Submit Group Booking</>}</button></div>
      </div>
    </div></div>
  </>;
}