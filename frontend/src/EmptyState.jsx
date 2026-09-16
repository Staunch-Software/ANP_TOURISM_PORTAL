import React from 'react';
import { I, Ic } from './Icons';

export const Empty = ({ icon, t, s, cta, onCta }) =>
<div className="empty"><div className="ebox"><I d={Ic[icon]} s={30} /></div>
    <div className="ff bold" style={{ fontSize: 17, color: 'var(--ink)' }}>{t}</div>
    <p className="sm mt8" style={{ maxWidth: 360, margin: '8px auto 0' }}>{s}</p>
    {cta && <button className="btn btn-coral mt24" onClick={onCta}>{cta}</button>}</div>;