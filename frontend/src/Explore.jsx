import React, { useState, useEffect } from 'react';
import { ACard } from '../components/attractions/AttractionCard';
import { Empty } from '../components/common/EmptyState';
import { I, Ic } from '../components/common/Icons';
import { ATTR, CATS } from '../services/data';
import { stCl } from '../utils/format';

export function Explore() {
  const [cat, setCat] = useState('All'),[sort, setSort] = useState('pop'),[q, setQ] = useState(''),[load, setLoad] = useState(true);
  useEffect(() => {setLoad(true);const t = setTimeout(() => setLoad(false), 350);return () => clearTimeout(t);}, [cat, sort, q]);
  let list = ATTR.filter((a) => (cat === 'All' || a.cat === cat) && (a.name + a.loc + a.cat).toLowerCase().includes(q.toLowerCase()));
  list = [...list].sort((a, b) => sort === 'price' ? a.inr - b.inr : sort === 'rate' ? b.rate - a.rate : b.rev - a.rev);
  return <>
    <div style={{ background: 'linear-gradient(130deg,var(--ocean),var(--ocean-2))', color: '#fff', padding: '58px 0 44px' }}><div className="wrap">
      <div className="eyebrow" style={{ color: 'var(--turq-2)' }}>Attractions</div>
      <h1 className="h2" style={{ fontSize: 40 }}>Explore Andaman &amp; Nicobar</h1>
      <p className="sub" style={{ color: 'rgba(255,255,255,.82)' }}>Discover attractions, experiences and destinations for every kind of traveller.</p>
      <div className="row gap12 wrapf mt32" style={{ fontSize: 13, fontWeight: 600, opacity: .85 }}>
        <span className="row gap8"><I d={Ic.pin} s={15} /> {ATTR.length} attractions listed</span>
        <span className="row gap8"><I d={Ic.check2} s={15} /> All operators verified</span>
        <span className="row gap8"><I d={Ic.refresh} s={15} /> Live capacity sync</span></div>
    </div></div>
    <div className="sec" style={{ paddingTop: 34 }}><div className="wrap">
      <div className="card row between wrapf gap16" style={{ padding: 16, marginBottom: 28 }}>
        <div className="row gap8 wrapf">{CATS.map((c) => <button key={c} className="chip" onClick={() => setCat(c)}
            style={{ background: cat === c ? 'var(--ocean)' : '#F6F9FA', color: cat === c ? '#fff' : 'var(--muted)', padding: '9px 16px', fontSize: 13 }}>{c}</button>)}</div>
        <div className="row gap12">
          <div className="row gap8 inp" style={{ padding: '9px 14px', width: 220 }}><I d={Ic.search} s={15} style={{ color: 'var(--muted)' }} />
            <input style={{ border: 'none', outline: 'none', width: '100%' }} placeholder="Filter results…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <select className="inp" style={{ width: 170 }} value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="pop">Sort: Most Popular</option><option value="rate">Sort: Highest Rated</option><option value="price">Sort: Price (Low–High)</option></select>
        </div></div>
      <div className="row between wrapf gap12" style={{ marginBottom: 20 }}>
        <div className="sm mut">{load ? 'Loading attractions…' : <><b style={{ color: 'var(--ink)' }}>{list.length}</b> attraction{list.length !== 1 ? 's' : ''} found{cat !== 'All' && <> in <b style={{ color: 'var(--ink)' }}>{cat}</b></>}</>}</div>
        <div className="row gap8">{['Available', 'Limited', 'Fully Booked'].map((l, i) => <span key={i} className={'badge ' + stCl(l)}><span className="dot" />{l}</span>)}</div></div>
      {load ? <div className="grid g3">{[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="card" style={{ overflow: 'hidden' }}><div className="skel" style={{ height: 198, borderRadius: 0 }} /><div style={{ padding: 20 }}><div className="skel" style={{ height: 18, width: '70%' }} /><div className="skel mt12" style={{ height: 12 }} /><div className="skel mt8" style={{ height: 12, width: '80%' }} /><div className="skel mt24" style={{ height: 36 }} /></div></div>)}</div> :
        list.length ? <div className="grid g3 fade">{list.map((a) => <ACard key={a.id} a={a} />)}</div> :
        <div className="card"><Empty icon="search" t="No attractions match your filters" s="Try clearing the search term or choosing a different category." cta="Reset Filters" onCta={() => {setCat('All');setQ('');}} /></div>}
    </div></div>
  </>;
}