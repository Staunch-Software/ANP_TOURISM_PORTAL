import React from 'react';
import { I, Ic } from '../../components/common/Icons';
import { useApp } from '../../context/AppContext';

export const ROLES = [
{ k: 'tourist', t: 'Tourist / Visitor', ic: 'user', d: 'Explore attractions, plan your itinerary and book experiences.', b: 'Tourist Login', g: 'linear-gradient(135deg,#12B0BC,#0A5C8F)' },
{ k: 'provider', t: 'Service Provider', ic: 'store', d: 'Manage your tourism services, availability, bookings and profile.', b: 'Service Provider Login', g: 'linear-gradient(135deg,#FF6B4A,#E0452B)' },
{ k: 'agency', t: 'Agency', ic: 'bldg', d: 'Manage agency operations, bookings and approved tourism services.', b: 'Agency Login', g: 'linear-gradient(135deg,#0E8F6F,#0A6B52)' },
{ k: 'admin', t: 'Admin / Regulatory Authority', ic: 'shield', d: 'Manage users, attractions, approvals, bookings, reports and system operations.', b: 'Admin Login', g: 'linear-gradient(135deg,#053A5E,#0A2A42)' }];

export function RoleSelect() {
  const { go } = useApp();
  return <div style={{ background: 'linear-gradient(170deg,var(--sand),#fff)', minHeight: '80vh', padding: '62px 0 80px' }}><div className="wrap">
    <div className="center" style={{ marginBottom: 46 }}>
      <div className="logo-m" style={{ margin: '0 auto 18px', width: 58, height: 58, borderRadius: 18 }}><I d={Ic.palm} s={28} /></div>
      <h1 className="h2" style={{ fontSize: 36 }}>Welcome to Andaman Tourism</h1>
      <p className="sub">Choose your portal to continue</p></div>
    <div className="grid g4">{ROLES.map((r) =>
        <div key={r.k} className="rolec" style={{ '--grad': r.g }}>
        <div className="ric" style={{ background: r.g }}><I d={Ic[r.ic]} s={28} /></div>
        <h3 className="ff bold" style={{ fontSize: 17, lineHeight: 1.3 }}>{r.t}</h3>
        <p className="sm mut mt12" style={{ lineHeight: 1.65, minHeight: 66 }}>{r.d}</p>
        <button className="btn btn-block mt16" style={{ background: r.g, color: '#fff' }} onClick={() => go('login-' + r.k)}>{r.b}</button>
      </div>)}</div>
    <div className="card row between wrapf gap16 mt48" style={{ padding: '22px 28px', background: '#F7FBFC' }}>
      <div className="row gap12"><I d={Ic.shield} s={22} style={{ color: 'var(--sea)' }} />
        <div><div className="semi sm">Secure Login</div><div className="xs mut mt8">All sessions are encrypted and audited. Never share your OTP or password with anyone.</div></div></div>
      <button className="btn btn-out btn-sm" onClick={() => go('register')}>New here? Create Tourist Account</button></div>
  </div></div>;
}