import React, { useMemo } from 'react';

export const QR = ({ size = 150, seed = 'AND2026' }) => {
  const cells = useMemo(() => {const g = [];let h = 0;for (const c of seed) h = h * 31 + c.charCodeAt(0) >>> 0;
    for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) {h = h * 1103515245 + 12345 & 0x7fffffff;
      const fin = x < 7 && y < 7 || x > 13 && y < 7 || x < 7 && y > 13;
      let on = fin ? x === 0 || x === 6 || y === 0 || y === 6 || x > 1 && x < 5 && y > 1 && y < 5 || x > 13 && (x === 14 || x === 20 || y === 0 || y === 6 || x > 15 && x < 19 && y > 1 && y < 5) || y > 13 && (x === 0 || x === 6 || y === 14 || y === 20 || x > 1 && x < 5 && y > 15 && y < 19) : (h >> 7) % 100 > 50;
      if (fin && x > 13 && y < 7) on = x === 14 || x === 20 || y === 0 || y === 6 || x > 15 && x < 19 && y > 1 && y < 5;
      if (fin && x < 7 && y > 13) on = x === 0 || x === 6 || y === 14 || y === 20 || x > 1 && x < 5 && y > 15 && y < 19;
      if (on) g.push(<rect key={x + '-' + y} x={x} y={y} width="1" height="1" fill="#0B2439" />);}
    return g;}, [seed]);
  return <svg className="qr" style={{ width: size, height: size }} viewBox="-1 -1 23 23"><rect x="-1" y="-1" width="23" height="23" fill="#fff" />{cells}</svg>;
};