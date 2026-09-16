import React from 'react';
import { I, Ic } from '../common/Icons';

export const KPI = ({ t, v, s, ic, c, trend }) =>
<div className="kpi"><div className="row between">
    <div><div className="xs mut semi">{t}</div><div className="kv" style={{ color: 'var(--ocean)' }}>{v}</div>
      <div className="xs mt8" style={{ color: trend === 'up' ? 'var(--sea)' : trend === 'down' ? 'var(--bad)' : 'var(--muted)', fontWeight: 600 }}>{s}</div></div>
    <div className="sicn" style={{ background: c + '18', color: c, marginBottom: 0, width: 42, height: 42, borderRadius: 12 }}><I d={Ic[ic]} s={19} /></div>
  </div></div>;