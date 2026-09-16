import React from 'react';
import { I, Ic } from './Icons';

export const Steps = ({ n, total, labels }) =>
<div className="steps">{Array.from({ length: total }, (_, i) =>
  <div key={i} className={'stp ' + (i + 1 === n ? 'on' : i + 1 < n ? 'done' : '')}>
      <div className="n">{i + 1 < n ? <I d={Ic.tick} s={15} /> : i + 1}</div>
      <div className="sm semi" style={{ color: i + 1 <= n ? 'var(--ocean)' : 'var(--muted)', whiteSpace: 'nowrap' }}>{labels[i]}</div>
      {i < total - 1 && <div className="ln" />}
    </div>)}</div>;