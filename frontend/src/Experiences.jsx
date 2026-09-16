import React from 'react';
import { ACard } from '../components/attractions/AttractionCard';
import { I, Ic } from '../components/common/Icons';
import { useApp } from '../context/AppContext';
import { ATTR, EXPS } from '../services/data';
import { IMG } from '../services/images';

export function Experiences() {
  const { go } = useApp();
  return <>
    <div style={{ position: 'relative', height: 300, backgroundImage: `url(${IMG.kayak})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,rgba(4,35,58,.9),rgba(4,35,58,.4))' }} />
      <div className="wrap" style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'flex-end', paddingBottom: 38, color: '#fff' }}>
        <div><div className="eyebrow" style={{ color: 'var(--turq-2)' }}>Curated Collections</div>
          <h1 className="h2" style={{ fontSize: 38 }}>Experiences You'll Love</h1>
          <p className="sub" style={{ color: 'rgba(255,255,255,.85)' }}>Eight ways to experience the archipelago, curated by the tourism department.</p></div></div></div>
    <div className="sec"><div className="wrap">
      <div className="grid g4">{EXPS.map((e, i) =>
          <button key={i} className="exp" style={{ backgroundImage: `url(${e.i})`, height: 250 }} onClick={() => go('explore')}>
          <div><div className="ff bold" style={{ fontSize: 19 }}>{e.n}</div><div className="sm" style={{ opacity: .9, marginTop: 4 }}>{e.c}</div>
            <div className="row gap8 mt12 xs bold" style={{ color: 'var(--turq-2)' }}>Browse <I d={Ic.arr} s={14} /></div></div></button>)}</div>
      <div className="mt48"><h2 className="ff bold" style={{ fontSize: 24, marginBottom: 22 }}>Featured this season</h2>
        <div className="grid g3">{ATTR.slice(3, 9).map((a) => <ACard key={a.id} a={a} />)}</div></div>
    </div></div>
  </>;
}