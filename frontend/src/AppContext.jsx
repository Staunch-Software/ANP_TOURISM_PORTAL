import React, { createContext, useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const Ctx = createContext(null);

/** Access global app state (navigation, session, cart, toasts). */
export const useApp = () => useContext(Ctx);

const NAMES = {
  tourist: 'Arun Krishnan',
  provider: 'Rajesh Menon',
  agency: 'Lakshmi Pillai',
  admin: 'S. Iyer'
};

export function AppProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [param, setParam] = useState(null);
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [toastMsg, setToastMsg] = useState(null);

  const route = location.pathname === '/' ? 'home' : location.pathname.replace(/^\//, '');

  const toast = (m) => {
    setToastMsg(m);
    setTimeout(() => setToastMsg(null), 2600);
  };

  const go = (r, p) => {
    setParam(p ?? null);
    navigate(r === 'home' ? '/' : '/' + r);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const login = (role) => {
    setUser({ role, name: NAMES[role] || 'Guest User' });
    go(role + '-dash');
  };

  const logout = () => {
    setUser(null);
    go('home');
    toast('Signed out successfully');
  };

  const addCart = (
  a,
  slot,
  date,
  ad,
  ch,
  nat = 'Indian') =>
  {
    const base = nat === 'Indian' ? a.inr : a.fx;
    setCart((c) => [
    ...c,
    {
      id: a.id,
      name: a.name,
      img: a.img,
      cat: a.cat,
      slot,
      date:
      typeof date === 'string' && date.includes('-') ?
      new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) :
      date,
      ad,
      ch,
      nat,
      amt: ad * base + ch * Math.round(base * 0.5)
    }]
    );
  };

  const removeCart = (i) => setCart((c) => c.filter((_, j) => j !== i));

  const value = {
    route,
    param,
    go,
    user,
    login,
    logout,
    cart,
    addCart,
    removeCart,
    clearCart: () => setCart([]),
    toast,
    toastMsg
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}