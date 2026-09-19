import React, { useState } from 'react';
import {
  ShieldCheck, ShoppingBag, LogOut, Anchor, Waves, Menu, X
} from 'lucide-react';

// RFP 344: Admin/Regulatory Authority is a distinct user type from Service
// Providers. Each role now has exactly one destination — Gate Scanner is a
// section inside that dashboard's own sidebar (not a separate portal to
// switch into), and Admin oversees Ferry/Vendor operations through Admin
// MIS's own sections rather than opening their live operational dashboards.
export const STAFF_TAB_DEFS = [
  { key: 'ADMIN', label: 'Admin MIS', icon: ShieldCheck, roles: ['ADMIN'] },
  { key: 'OPERATOR', label: 'Ferry Operator', icon: Anchor, roles: ['OPERATOR'] },
  { key: 'VENDOR', label: 'Activity Vendor', icon: Waves, roles: ['VENDOR'] },
];

export const ROLE_BADGE = { ADMIN: 'ADM', OPERATOR: 'OPR', VENDOR: 'VND' };

export const isStaffRole = (role) => ['ADMIN', 'OPERATOR', 'VENDOR'].includes(role);

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleAccessibleMode = () => {
    const next = !accessibleMode;
    setAccessibleMode(next);
    document.documentElement.classList.toggle('accessible-mode', next);
  };

  const staffTabs = STAFF_TAB_DEFS.filter((tab) => user?.role && tab.roles.includes(user.role));
  // A signed-in Service Provider / Admin has no tourist booking journey to
  // resume — RFP 344 treats them as a distinct user type, so their nav
  // shows only their own dedicated portal, never Attractions/Ferries/Passes.
  // At desktop width their portal navigation lives in the persistent
  // each dashboard's own sidebar (DashboardSidebar) instead of this top bar.
  const isStaffUser = isStaffRole(user?.role);
  const homeTab = isStaffUser ? (staffTabs[0]?.key || 'ADMIN') : 'ATTRACTIONS';

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
        {/* Brand — min-w-0 + truncate so this shrinks instead of forcing
            the header into horizontal overflow on narrow phones, where it
            has to share the row with the hamburger/cart/account buttons. */}
        <div
          className="flex items-center gap-3 cursor-pointer group min-w-0"
          onClick={() => { setActiveTab(homeTab); setIsMobileMenuOpen(false); }}
        >
          <img src="/images/govt-seal.png" alt="Emblem" className="w-11 h-11 object-contain bg-white rounded-lg p-1 shadow-md shrink-0" />
          <div className="min-w-0">
            <div className="font-serif font-black text-base sm:text-xl tracking-tight text-white leading-tight truncate">ANIIDCO Tourism &amp; Ferry Portal</div>
            <span className="text-[10px] text-cyan-200 tracking-wider uppercase font-semibold hidden sm:block truncate">
              Official Single-Window Ticketing · A&amp;N Islands
            </span>
          </div>
        </div>

        {/* Center Nav Links — tourist-only; a signed-in staff user navigates
            via each dashboard's own persistent sidebar at desktop width, and
            via the mobile drawer below on small screens. */}
        {!isStaffUser && (
          <nav className="hidden md:flex items-center gap-1 bg-navy-700/60 p-1.5 rounded-xl">
            <button
              onClick={() => setActiveTab('ATTRACTIONS')}
              className={`px-5 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === 'ATTRACTIONS'
                  ? 'bg-cyan-700 text-white shadow-md'
                  : 'text-slate-200 hover:text-white hover:bg-navy-600'
              }`}
            >
              Attractions
            </button>

            <button
              onClick={() => setActiveTab('FERRY')}
              className={`px-5 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === 'FERRY'
                  ? 'bg-cyan-700 text-white shadow-md'
                  : 'text-slate-200 hover:text-white hover:bg-navy-600'
              }`}
            >
              Ferries
            </button>

            <button
              onClick={() => setActiveTab('PASSES')}
              className={`px-5 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === 'PASSES'
                  ? 'bg-cyan-700 text-white shadow-md'
                  : 'text-slate-200 hover:text-white hover:bg-navy-600'
              }`}
            >
              My Passes
            </button>
          </nav>
        )}

        {/* Right Section: Cart + Account */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsMobileMenuOpen((v) => !v)}
            className="md:hidden p-2.5 rounded-lg text-white hover:bg-navy-700 transition-colors"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {!isStaffUser && (
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
          )}

          {user ? (
            <div className="flex items-center gap-3 bg-navy-700 border border-navy-600 px-3 py-1.5 rounded-lg">
              <div className="w-8 h-8 rounded-md bg-cyan-600/20 text-cyan-300 border border-cyan-600/40 flex items-center justify-center font-bold text-xs">
                {ROLE_BADGE[user.role] || 'TR'}
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
            // Straight into the tourist login (Google Sign-In front and
            // center) — no dropdown to pick through first. Staff and new
            // service providers get their own way in from inside the
            // modal itself instead of competing for space here.
            <button
              onClick={() => onOpenLogin('VISITOR')}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-sm shadow-md transition-all whitespace-nowrap"
            >
              Login / Sign Up
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu — the center nav above is `hidden md:flex`, so this is
          the only way to reach Attractions/Ferries/Passes (or a staff
          user's own portals) on a phone or narrow tablet. */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-navy-700 bg-navy-800">
          <nav className="px-4 py-3 space-y-1">
            {!isStaffUser && (
              <>
                <button
                  onClick={() => { setActiveTab('ATTRACTIONS'); setIsMobileMenuOpen(false); }}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                    activeTab === 'ATTRACTIONS' ? 'bg-cyan-700 text-white' : 'text-slate-200 hover:bg-navy-700'
                  }`}
                >
                  Attractions
                </button>
                <button
                  onClick={() => { setActiveTab('FERRY'); setIsMobileMenuOpen(false); }}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                    activeTab === 'FERRY' ? 'bg-cyan-700 text-white' : 'text-slate-200 hover:bg-navy-700'
                  }`}
                >
                  Ferries
                </button>
                <button
                  onClick={() => { setActiveTab('PASSES'); setIsMobileMenuOpen(false); }}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                    activeTab === 'PASSES' ? 'bg-cyan-700 text-white' : 'text-slate-200 hover:bg-navy-700'
                  }`}
                >
                  My Passes
                </button>
              </>
            )}

            {isStaffUser && staffTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); setIsMobileMenuOpen(false); }}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold flex items-center gap-2.5 transition-all ${
                    isActive ? 'bg-amber-700 text-white' : 'text-amber-400 hover:bg-navy-700'
                  }`}
                >
                  <Icon className="w-4 h-4" /> {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="border-t border-navy-700 px-4 py-3 flex items-center gap-5 text-xs text-slate-300">
            <button
              onClick={toggleAccessibleMode}
              className="underline underline-offset-2 hover:text-white transition-colors"
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

          <div className="border-t border-navy-700 px-4 py-4 space-y-3">
            {!isStaffUser && (
              <button
                onClick={() => { onOpenCart(); setIsMobileMenuOpen(false); }}
                className="w-full relative px-4 py-3 bg-transparent border border-navy-600 rounded-lg text-sm font-bold flex items-center justify-center gap-2 text-white"
              >
                <ShoppingBag className="w-4 h-4 text-cyan-300" />
                Trip Cart
                {cartCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-cyan-600 text-white text-[11px] font-extrabold leading-none">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {user ? (
              <div className="flex items-center justify-between gap-3 bg-navy-700 border border-navy-600 px-3 py-2.5 rounded-lg">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-cyan-600/20 text-cyan-300 border border-cyan-600/40 flex items-center justify-center font-bold text-xs shrink-0">
                    {ROLE_BADGE[user.role] || 'TR'}
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-white leading-tight">{user.phone_number}</div>
                    <div className="text-[10px] text-emerald-400 font-medium">Verified Visitor</div>
                  </div>
                </div>
                <button
                  onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
                  title="Log Out"
                  className="text-slate-300 hover:text-red-400 p-1.5 rounded-lg hover:bg-navy-600 transition-colors shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { onOpenLogin('VISITOR'); setIsMobileMenuOpen(false); }}
                className="w-full px-5 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-sm shadow-md"
              >
                Login / Sign Up
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
