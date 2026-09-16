import React from 'react';
import { I, Ic } from '../common/Icons';
import { useApp } from '../../context/AppContext';

/** Floating "My Trip Cart" button, hidden during checkout routes. */
export function CartButton() {
  const { cart, route, go } = useApp();
  if (!cart.length || ['cart', 'payment', 'confirm'].includes(route)) return null;
  return (
    <button
      className="btn btn-coral"
      style={{ position: 'fixed', bottom: 26, left: 26, zIndex: 400, boxShadow: 'var(--sh-lg)', padding: '14px 22px' }}
      onClick={() => go('cart')}>
      <I d={Ic.cart} s={18} /> My Trip Cart
      <span style={{ background: '#fff', color: 'var(--coral)', borderRadius: 999, padding: '2px 8px', fontSize: 12, fontWeight: 800 }}>{cart.length}</span>
    </button>);

}