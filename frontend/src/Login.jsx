import React, { useState } from 'react';
import { Field } from '../../components/common/Field';
import { I, Ic } from '../../components/common/Icons';
import { useApp } from '../../context/AppContext';
import { ROLES } from './RoleSelect';
import { IMG } from '../../services/images';

export function Login({ role = 'tourist' }) {
  const { go, login, toast } = useApp();
  const [f, setF] = useState({ u: '', p: '' }),[err, setErr] = useState({}),[show, setShow] = useState(false),[busy, setBusy] = useState(false),[rem, setRem] = useState(true);
  const R = ROLES.find((r) => r.k === role);
  const submit = (e) => {e.preventDefault();const er = {};
    if (!f.u.trim()) er.u = 'Enter your username or registered email';
    if (!f.p) er.p = 'Enter your password';else if (f.p.length < 6) er.p = 'Password must be at least 6 characters';
    setErr(er);if (Object.keys(er).length) return;
    setBusy(true);setTimeout(() => {setBusy(false);login(role, f.u);toast('Signed in successfully');}, 700);};
  return <div style={{ minHeight: '86vh', display: 'grid', gridTemplateColumns: '1.05fr 1fr' }} className="lgrid">
    <div style={{ backgroundImage: `url(${IMG.radha})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', display: 'flex', alignItems: 'flex-end' }} className="lside">
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,rgba(4,35,58,.94),rgba(4,35,58,.35))' }} />
      <div style={{ position: 'relative', padding: '0 56px 56px', color: '#fff', maxWidth: 520 }}>
        <div className="hpill"><I d={Ic.wave} s={14} /> Andaman &amp; Nicobar Islands</div>
        <h2 className="ff" style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.2, letterSpacing: -1 }}>Every island journey begins with a single booking.</h2>
        <p className="sm mt16" style={{ opacity: .84, lineHeight: 1.7 }}>Access 120+ verified attractions, live slot availability, digital QR tickets and a single itinerary across all islands.</p>
        <div className="row gap24 mt32 wrapf" style={{ fontSize: 12.5, fontWeight: 600, opacity: .9 }}>
          <span className="row gap8"><I d={Ic.lock} s={15} /> Encrypted</span>
          <span className="row gap8"><I d={Ic.shield} s={15} /> Government Verified</span>
          <span className="row gap8"><I d={Ic.qr} s={15} /> Digital Tickets</span></div>
      </div></div>
    <div style={{ display: 'grid', placeItems: 'center', padding: '56px 32px' }}><div style={{ width: '100%', maxWidth: 420 }}>
      <button className="row gap8 xs semi mut" style={{ marginBottom: 24 }} onClick={() => go('login')}><I d={Ic.chevl} s={14} /> Change portal</button>
      <div className="ric" style={{ background: R.g, margin: '0 0 20px', width: 54, height: 54, borderRadius: 16 }}><I d={Ic[R.ic]} s={24} /></div>
      <h1 className="ff" style={{ fontSize: 28, fontWeight: 700, letterSpacing: -.8 }}>{R.b}</h1>
      <p className="sm mut mt12">Sign in to continue to your {role === 'admin' ? 'administrative' : role} portal.</p>
      <form onSubmit={submit} className="mt32">
        <Field label={role === 'tourist' ? 'Username / Email' : 'Official Username / Email'} error={err.u}>
          <input className={'inp ' + (err.u ? 'err' : '')} value={f.u} onChange={(e) => setF({ ...f, u: e.target.value })} placeholder={role === 'tourist' ? 'arun.k@example.com' : role + '@andamantourism.gov.in'} autoComplete="username" /></Field>
        <div className="mt16"><Field label="Password" error={err.p}>
          <div style={{ position: 'relative' }}>
            <input type={show ? 'text' : 'password'} className={'inp ' + (err.p ? 'err' : '')} style={{ paddingRight: 44 }} value={f.p} onChange={(e) => setF({ ...f, p: e.target.value })} placeholder="Enter your password" autoComplete="current-password" />
            <button type="button" onClick={() => setShow(!show)} aria-label="Toggle password" style={{ position: 'absolute', right: 12, top: 11, color: 'var(--muted)' }}><I d={show ? Ic.eyeoff : Ic.eye} s={17} /></button></div></Field></div>
        <div className="row between mt16">
          <label className="row gap8 sm semi" style={{ cursor: 'pointer' }}><input type="checkbox" checked={rem} onChange={(e) => setRem(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--turq)' }} /> Remember Me</label>
          <button type="button" className="sm semi" style={{ color: 'var(--turq)' }} onClick={() => toast('Password reset link sent to registered email')}>Forgot Password?</button></div>
        <button className="btn btn-coral btn-block btn-lg mt24" disabled={busy}>{busy ? <><span className="skel" style={{ width: 15, height: 15, borderRadius: 9 }} /> Signing in…</> : 'Login'}</button>
      </form>
      {role === 'tourist' && <div className="center mt32">
        <div className="sm mut">New visitor?</div>
        <button className="btn btn-out btn-block mt12" onClick={() => go('register')}>Create Tourist Account</button>
        <p className="xs mut mt16" style={{ lineHeight: 1.7 }}>OTP verification is required only once during registration. Subsequent logins use your password.</p></div>}
      {role !== 'tourist' && <div className="card mt32 row gap12" style={{ padding: 16, background: '#FFF8F2', borderColor: '#F5DFCA', alignItems: 'flex-start' }}>
        <I d={Ic.alert} s={17} style={{ color: 'var(--warn)', marginTop: 1 }} />
        <div className="xs" style={{ lineHeight: 1.7 }}><b>Restricted portal.</b> Access is limited to authorised personnel. All activity is logged in the system audit trail under the Andaman &amp; Nicobar Tourism IT policy.</div></div>}
      <div className="row gap8 xs mut mt32" style={{ justifyContent: 'center' }}><I d={Ic.lock} s={13} /> Secure Login · 256-bit TLS encryption</div>
    </div></div>
    <style>{`@media(max-width:900px){.lgrid{grid-template-columns:1fr!important}.lside{display:none!important}}`}</style>
  </div>;
}