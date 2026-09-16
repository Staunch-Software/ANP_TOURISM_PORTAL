import React from 'react';

export const Sec = ({ e, t, s, center, children, className = '', style }) =>
<section className={'sec ' + className} style={style}><div className="wrap">
    <div className={center ? 'center' : ''} style={{ marginBottom: 44 }}>
      {e && <div className="eyebrow">{e}</div>}<h2 className="h2">{t}</h2>{s && <p className="sub">{s}</p>}
    </div>{children}</div></section>;