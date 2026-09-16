import React from 'react';
import { I, Ic } from './Icons';
import { useApp } from '../../context/AppContext';

/** Global toast, driven by toast() from AppContext. */
export function Toast() {
  const { toastMsg } = useApp();
  if (!toastMsg) return null;
  return (
    <div className="toast">
      <I d={Ic.check2} s={17} style={{ color: 'var(--turq-2)' }} /> {toastMsg}
    </div>);

}