import React from 'react';

export const Chart = ({ data, labels, title, color = 'var(--turq)' }) =>
<div className="card" style={{ padding: 22 }}>
    <div className="row between" style={{ marginBottom: 20 }}><div className="ff bold" style={{ fontSize: 15.5 }}>{title}</div>
      <span className="badge b-grey">Last 8 periods</span></div>
    <div className="bar">{data.map((v, i) => <i key={i} style={{ height: v / Math.max(...data) * 100 + '%', background: `linear-gradient(180deg,${color},var(--ocean-2))` }} title={labels[i] + ': ' + v} />)}</div>
    <div className="row between mt12 xs mut">{labels.map((l, i) => <span key={i} style={{ flex: 1, textAlign: 'center' }}>{l}</span>)}</div></div>;