import React, { useState } from 'react';
import { ShieldCheck, ShoppingBag, LogOut, Anchor, Waves, ScanLine } from 'lucide-react';

export function Navbar({
  user,
  onOpenLogin,
  onLogout,
  activeTab,
  setActiveTab,
  cartCount,
  onOpenCart
}) {
  const [accessibleMode, setAccessibleMode] = useState(false);

  const toggleAccessibleMode = () => {
    const next = !accessibleMode;
    setAccessibleMode(next);
    document.documentElement.classList.toggle('accessible-mode', next);
  };

  return (
    <header className="sticky top-0 z-40 bg-navy-800 border-b-[3px] border-cyan-600 shadow-lg">
      {/* Government identity strip */}
      <div className="bg-navy-900 px-4 py-1.5 text-[11px] text-slate-300">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <span className="font-medium">भारत सरकार · Government of India &nbsp;|&nbsp; Andaman &amp; Nicobar Administration</span>
          <div className="hidden sm:flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Systems Operational
            </span>
            <span className="text-slate-600">|</span>
            <button
              onClick={toggleAccessibleMode}
              className="underline underline-offset-2 hover:text-white transition-colors"
              title="Toggle larger text & high-contrast mode"
            >
              Screen Reader
            </button>
            <button
              onClick={() => alert('हिन्दी इंटरफ़ेस जल्द उपलब्ध होगा (Hindi interface coming soon).')}
              className="underline underline-offset-2 hover:text-white transition-colors"
            >
              हिन्दी
            </button>
          </div>
        </div>
      </div>

      {/* Main Nav Strip */}
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-6">
        {/* Brand */}
        <div
          className="flex items-center gap-3 cursor-pointer group shrink-0"
          onClick={() => setActiveTab('ATTRACTIONS')}
        >
          <img src="/images/govt-seal.png" alt="Emblem" className="w-11 h-11 object-contain bg-white rounded-lg p-1 shadow-md" />
          <div>
            <div className="font-serif font-black text-xl tracking-tight text-white leading-tight">ANIIDCO Tourism &amp; Ferry Portal</div>
            <span className="text-[10px] text-cyan-200 tracking-wider uppercase font-semibold block">
              Official Single-Window Ticketing · A&amp;N Islands
            </span>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-1 bg-navy-700/60 p-1.5 rounded-xl">
          <button
            onClick={() => setActiveTab('ATTRACTIONS')}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'ATTRACTIONS'
                ? 'bg-cyan-700 text-white shadow-md'
                : 'text-slate-200 hover:text-white hover:bg-navy-600'
            }`}
          >
            Attractions
          </button>

          <button
            onClick={() => setActiveTab('FERRY')}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'FERRY'
                ? 'bg-cyan-700 text-white shadow-md'
                : 'text-slate-200 hover:text-white hover:bg-navy-600'
            }`}
          >
            Ferries
          </button>

          <button
            onClick={() => setActiveTab('PASSES')}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'PASSES'
                ? 'bg-cyan-700 text-white shadow-md'
                : 'text-slate-200 hover:text-white hover:bg-navy-600'
            }`}
          >
            My Passes
          </button>

          {user?.role === 'ADMIN' && (
            <button
              onClick={() => setActiveTab('ADMIN')}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'ADMIN'
                  ? 'bg-amber-700 text-white shadow-md'
                  : 'text-amber-400 hover:text-amber-300 hover:bg-navy-600'
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> Admin MIS
            </button>
          )}

          {(user?.role === 'OPERATOR' || user?.role === 'ADMIN') && (
            <button
              onClick={() => setActiveTab('OPERATOR')}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'OPERATOR'
                  ? 'bg-cyan-700 text-white shadow-md'
                  : 'text-cyan-300 hover:text-cyan-200 hover:bg-navy-600'
              }`}
            >
              <Anchor className="w-4 h-4" /> Ferry Operator
            </button>
          )}

          {(user?.role === 'VENDOR' || user?.role === 'ADMIN') && (
            <button
              onClick={() => setActiveTab('VENDOR')}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'VENDOR'
                  ? 'bg-cyan-700 text-white shadow-md'
                  : 'text-cyan-300 hover:text-cyan-200 hover:bg-navy-600'
              }`}
            >
              <Waves className="w-4 h-4" /> Activity Vendor
            </button>
          )}

          {(user?.role === 'OPERATOR' || user?.role === 'VENDOR' || user?.role === 'ADMIN') && (
            <button
              onClick={() => setActiveTab('SCANNER')}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'SCANNER'
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'text-emerald-400 hover:text-emerald-300 hover:bg-navy-600'
              }`}
            >
              <ScanLine className="w-4 h-4" /> Gate Scanner
            </button>
          )}
        </nav>

        {/* Right Section: Cart + Account */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenCart}
            className="relative px-4 py-2.5 bg-transparent hover:bg-navy-700 border border-navy-600 rounded-lg text-sm font-bold flex items-center gap-2 text-white transition-all"
          >
            <ShoppingBag className="w-4 h-4 text-cyan-300" />
            <span className="hidden sm:inline">Trip Cart</span>
            {cartCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-cyan-600 text-white text-[11px] font-extrabold leading-none">
                {cartCount}
              </span>
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-3 bg-navy-700 border border-navy-600 px-3 py-1.5 rounded-lg">
              <div className="w-8 h-8 rounded-md bg-cyan-600/20 text-cyan-300 border border-cyan-600/40 flex items-center justify-center font-bold text-xs">
                {user.role === 'ADMIN' ? 'ADM' : user.role === 'OPERATOR' ? 'OPR' : user.role === 'VENDOR' ? 'VND' : 'TR'}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-white leading-tight">{user.phone_number}</div>
                <div className="text-[10px] text-emerald-400 font-medium">Verified Visitor</div>
              </div>
              <button
                onClick={onLogout}
                title="Log Out"
                className="text-slate-300 hover:text-red-400 p-1.5 rounded-lg hover:bg-navy-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-sm shadow-md transition-all"
            >
              Sign In 
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
