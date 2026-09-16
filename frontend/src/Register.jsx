import React, { useState, useEffect, useRef } from 'react';
import { Field } from '../../components/common/Field';
import { I, Ic } from '../../components/common/Icons';
import { Steps } from '../../components/common/Steps';
import { useApp } from '../../context/AppContext';

export function Register() {
  const { go, login, toast } = useApp();
  const [step, setStep] = useState(1),[f, setF] = useState({ n: '', u: '', e: '', m: '', p: '', cp: '', nat: 'Indian', dob: '', agree: false });
  const [err, setErr] = useState({}),[otp, setOtp] = useState(['', '', '', '', '', '']),[busy, setBusy] = useState(false),[timer, setTimer] = useState(42);
  const refs = useRef([]);
  useEffect(() => {if (step !== 2) return;const t = setInterval(() => setTimer((v) => v > 0 ? v - 1 : 0), 1000);return () => clearInterval(t);}, [step]);
  const v1 = () => {const e = {};
    if (!f.n.trim()) e.n = 'Full name is required';else if (f.n.trim().length < 3) e.n = 'Enter your complete name';
    if (!f.u.trim()) e.u = 'Choose a username';else if (!/^[a-z0-9_.]{4,}$/i.test(f.u)) e.u = 'Min 4 characters — letters, numbers, dot or underscore';
    if (!f.e.trim()) e.e = 'Email address is required';else if (!/^\S+@\S+\.\S+$/.test(f.e)) e.e = 'Enter a valid email address';
    if (!f.m.trim()) e.m = 'Mobile number is required';else if (!/^[6-9]\d{9}$/.test(f.m)) e.m = 'Enter a valid 10-digit Indian mobile number';
    if (!f.dob) e.dob = 'Date of birth is required';
    if (!f.p) e.p = 'Create a password';else if (f.p.length < 8) e.p = 'Password must be at least 8 characters';else
    if (!/[A-Z]/.test(f.p) || !/[0-9]/.test(f.p)) e.p = 'Include at least one uppercase letter and one number';
    if (f.cp !== f.p) e.cp = 'Passwords do not match';
    if (!f.agree) e.agree = 'You must accept the Terms & Conditions to continue';
    setErr(e);return !Object.keys(e).length;};
  const otpGo = (i, val) => {if (!/^\d?$/.test(val)) return;const n = [...otp];n[i] = val;setOtp(n);if (val && i < 5) refs.current[i + 1]?.focus();};
  const strength = f.p.length >= 12 && /[A-Z]/.test(f.p) && /[0-9]/.test(f.p) && /[^\w]/.test(f.p) ? 3 : f.p.length >= 8 && /[A-Z]/.test(f.p) && /[0-9]/.test(f.p) ? 2 : f.p ? 1 : 0;
  return <div style={{ background: 'linear-gradient(170deg,var(--sand),#fff)', padding: '54px 0 84px', minHeight: '86vh' }}><div className="wrap" style={{ maxWidth: 760 }}>
    <div className="center" style={{ marginBottom: 34 }}>
      <div className="logo-m" style={{ margin: '0 auto 16px', width: 52, height: 52, borderRadius: 16 }}><I d={Ic.palm} s={25} /></div>
      <h1 className="h2" style={{ fontSize: 31 }}>Create Your Tourist Account</h1>
      <p className="sub">Register once, then book any attraction across the islands in seconds.</p></div>
    <div className="card" style={{ padding: 34, boxShadow: 'var(--sh-md)' }}>
      <div style={{ marginBottom: 32 }}><Steps n={step} total={3} labels={['Create Account', 'Mobile Verification', 'Complete']} /></div>
      {step === 1 && <div className="fade">
        <div className="grid g2" style={{ gap: 18 }}>
          <Field label="Full Name" error={err.n}><input className={'inp ' + (err.n ? 'err' : '')} value={f.n} onChange={(e) => setF({ ...f, n: e.target.value })} placeholder="e.g. Arun Krishnan" /></Field>
          <Field label="Username" error={err.u}><input className={'inp ' + (err.u ? 'err' : '')} value={f.u} onChange={(e) => setF({ ...f, u: e.target.value })} placeholder="e.g. arun_k" /></Field>
          <Field label="Email Address" error={err.e}><input type="email" className={'inp ' + (err.e ? 'err' : '')} value={f.e} onChange={(e) => setF({ ...f, e: e.target.value })} placeholder="you@example.com" /></Field>
          <Field label="Mobile Number" error={err.m} hint="OTP will be sent to this number">
            <div className="row gap8"><span className="inp semi" style={{ width: 66, textAlign: 'center', background: '#F6F9FA' }}>+91</span>
              <input className={'inp ' + (err.m ? 'err' : '')} maxLength={10} value={f.m} onChange={(e) => setF({ ...f, m: e.target.value.replace(/\D/g, '') })} placeholder="98765 43210" /></div></Field>
          <Field label="Date of Birth" error={err.dob}><input type="date" className={'inp ' + (err.dob ? 'err' : '')} value={f.dob} onChange={(e) => setF({ ...f, dob: e.target.value })} /></Field>
          <Field label="Nationality"><select className="inp" value={f.nat} onChange={(e) => setF({ ...f, nat: e.target.value })}><option>Indian</option><option>Foreign</option></select></Field>
          <Field label="Password" error={err.p}>
            <input type="password" className={'inp ' + (err.p ? 'err' : '')} value={f.p} onChange={(e) => setF({ ...f, p: e.target.value })} placeholder="Minimum 8 characters" />
            {f.p && <div className="row gap8 mt8">{[1, 2, 3].map((i) => <div key={i} style={{ height: 4, flex: 1, borderRadius: 3, background: strength >= i ? strength === 1 ? 'var(--bad)' : strength === 2 ? 'var(--warn)' : 'var(--sea)' : '#E8EEF2' }} />)}
              <span className="xs semi" style={{ color: strength === 1 ? 'var(--bad)' : strength === 2 ? 'var(--warn)' : 'var(--sea)' }}>{['', 'Weak', 'Good', 'Strong'][strength]}</span></div>}</Field>
          <Field label="Confirm Password" error={err.cp}><input type="password" className={'inp ' + (err.cp ? 'err' : '')} value={f.cp} onChange={(e) => setF({ ...f, cp: e.target.value })} placeholder="Re-enter password" /></Field>
        </div>
        <div className={'card mt24 ' + (err.agree ? '' : '')} style={{ padding: 16, background: '#F8FBFC', borderColor: err.agree ? 'var(--bad)' : 'var(--line)' }}>
          <label className="row gap12 sm" style={{ cursor: 'pointer', alignItems: 'flex-start' }}>
            <input type="checkbox" checked={f.agree} onChange={(e) => setF({ ...f, agree: e.target.checked })} style={{ width: 17, height: 17, accentColor: 'var(--turq)', marginTop: 2 }} />
            <span style={{ lineHeight: 1.65 }}>I agree to the <b style={{ color: 'var(--turq)' }}>Terms &amp; Conditions</b> and <b style={{ color: 'var(--turq)' }}>Privacy Policy</b>, and consent to receiving booking confirmations via SMS, Email and WhatsApp.</span></label>
          {err.agree && <div className="err-t" style={{ marginLeft: 29 }}>{err.agree}</div>}</div>
        <button className="btn btn-coral btn-block btn-lg mt24" onClick={() => {if (v1()) {setBusy(true);setTimeout(() => {setBusy(false);setStep(2);setTimer(42);}, 600);}}} disabled={busy}>{busy ? 'Creating account…' : 'Create Account'}</button>
        <div className="center sm mut mt24">Already registered? <button className="semi" style={{ color: 'var(--turq)' }} onClick={() => go('login-tourist')}>Sign in instead</button></div>
      </div>}
      {step === 2 && <div className="fade center">
        <div className="ebox" style={{ background: '#E6F8F9', color: 'var(--turq)' }}><I d={Ic.phone} s={30} /></div>
        <h2 className="ff bold" style={{ fontSize: 23 }}>Verify Your Mobile Number</h2>
        <p className="sm mut mt12">Enter the 6-digit OTP sent to <b style={{ color: 'var(--ink)' }}>+91 {f.m ? f.m.slice(0, 5) + ' ' + f.m.slice(5) : 'XXXXX XXXXX'}</b></p>
        <div className="row gap12 mt32" style={{ justifyContent: 'center' }}>
          {otp.map((o, i) => <input key={i} ref={(el) => refs.current[i] = el} className="otp" maxLength={1} value={o} inputMode="numeric" aria-label={'OTP digit ' + (i + 1)}
            onChange={(e) => otpGo(i, e.target.value)} onKeyDown={(e) => {if (e.key === 'Backspace' && !o && i > 0) refs.current[i - 1]?.focus();}} />)}</div>
        {err.otp && <div className="err-t mt16">{err.otp}</div>}
        <button className="btn btn-coral btn-lg mt32" style={{ minWidth: 230 }} disabled={busy}
          onClick={() => {if (otp.join('').length < 6) return setErr({ otp: 'Please enter all 6 digits' });setBusy(true);setTimeout(() => {setBusy(false);setStep(3);}, 800);}}>{busy ? 'Verifying…' : 'Verify OTP'}</button>
        <div className="sm mut mt24">{timer > 0 ? <>Resend OTP in <b style={{ color: 'var(--ocean)' }}>00:{String(timer).padStart(2, '0')}</b></> :
            <button className="semi" style={{ color: 'var(--turq)' }} onClick={() => {setTimer(42);toast('A new OTP has been sent');}}><I d={Ic.refresh} s={13} /> Resend OTP</button>}</div>
        <button className="sm mut mt24" onClick={() => setStep(1)}><I d={Ic.chevl} s={13} /> Change mobile number</button>
      </div>}
      {step === 3 && <div className="fade center" style={{ padding: '24px 0' }}>
        <div className="ebox" style={{ background: '#E5F6F0', color: 'var(--sea)', width: 88, height: 88 }}><I d={Ic.check2} s={40} /></div>
        <h2 className="ff bold" style={{ fontSize: 25 }}>Registration Successful</h2>
        <div className="badge b-ok mt16" style={{ padding: '9px 18px' }}><I d={Ic.tick} s={14} /> Account successfully verified</div>
        <p className="sm mut mt24" style={{ maxWidth: 400, margin: '24px auto 0', lineHeight: 1.75 }}>Welcome aboard, {f.n.split(' ')[0] || 'traveller'}. Your Andaman Tourism account is active. You can now book attractions, build itineraries and receive digital QR tickets.</p>
        <div className="grid g3 mt32" style={{ gap: 12, maxWidth: 480, margin: '32px auto 0' }}>
          {[['Verified mobile', 'phone'], ['Email linked', 'mail'], ['Profile created', 'user']].map((x, i) =>
            <div key={i} className="card center" style={{ padding: 16 }}><I d={Ic[x[1]]} s={18} style={{ color: 'var(--sea)', margin: '0 auto 8px' }} /><div className="xs semi">{x[0]}</div></div>)}</div>
        <button className="btn btn-coral btn-lg mt32" style={{ minWidth: 250 }} onClick={() => go('login-tourist')}>Continue to Login</button>
      </div>}
    </div>
  </div></div>;
}