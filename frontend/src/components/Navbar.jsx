import React, { useEffect, useRef, useState } from 'react';
import {
  ShieldCheck, ShoppingBag, LogOut, LogIn, Anchor, Waves, Menu, X, Wallet,
  Home, Landmark, Ship, Ticket, LifeBuoy, Users, ChevronDown, Accessibility, Languages
} from 'lucide-react';

// Tourist top-nav: one data-driven list so desktop and the phone drawer match.
const TOURIST_TABS = [
  { key: 'ATTRACTIONS', label: 'Home', icon: Home },
  { key: 'ATTRACTIONS_LIST', label: 'Attractions', icon: Landmark, tab: 'ATTRACTIONS' },
  { key: 'FERRY', label: 'Ferries', icon: Ship },
  { key: 'PASSES', label: 'My Passes', icon: Ticket },
  { key: 'WALLET', label: 'My Wallet', icon: Wallet },
  { key: 'SUPPORT', label: 'Support', icon: LifeBuoy },
  { key: 'GROUP_BOOKINGS', label: 'Group Booking', icon: Users },
];

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
  onOpenCart,
  adminSidebarOpen,
  onToggleAdminSidebar,
  vendorSidebarOpen,
  onToggleVendorSidebar
}) {
  const [accessibleMode, setAccessibleMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const headerRef = useRef(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header || !('ResizeObserver' in window)) return;

    const updateHeaderHeight = () => {
      document.documentElement.style.setProperty('--portal-header-height', `${header.getBoundingClientRect().height}px`);
    };
    updateHeaderHeight();
    const observer = new ResizeObserver(updateHeaderHeight);
    observer.observe(header);
    window.addEventListener('resize', updateHeaderHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeaderHeight);
      document.documentElement.style.removeProperty('--portal-header-height');
    };
  }, [user, activeTab, accessibleMode]);

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
  const hasDashboardSidebar = (user?.role === 'ADMIN' && activeTab === 'ADMIN') || (user?.role === 'VENDOR' && activeTab === 'VENDOR');
  const isDashboardSidebarOpen = activeTab === 'ADMIN' ? adminSidebarOpen : vendorSidebarOpen;
  const toggleDashboardSidebar = activeTab === 'ADMIN' ? onToggleAdminSidebar : onToggleVendorSidebar;
  const homeTab = isStaffUser ? (staffTabs[0]?.key || 'ADMIN') : 'ATTRACTIONS';
  const displayName = user?.full_name || user?.name || 'Visitor';

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 border-b-[3px] border-cyan-600 shadow-lg"
      style={{
        backgroundImage: 'linear-gradient(180deg, #082640 0%, #051a30 100%)'
      }}
    >
      {/* Main Nav Strip */}
      <div className={`portal-header-row w-full px-4 sm:px-5 lg:px-6 h-[72px] flex items-center justify-between gap-3 lg:gap-5 ${!isStaffUser ? 'portal-header-tourist' : ''}`}>
        <button
          onClick={() => hasDashboardSidebar ? toggleDashboardSidebar() : setIsMobileMenuOpen((v) => !v)}
          className="portal-header-menu lg:hidden p-2.5 rounded-lg text-white hover:bg-navy-700 transition-colors shrink-0"
          aria-label={(hasDashboardSidebar ? isDashboardSidebarOpen : isMobileMenuOpen) ? 'Close menu' : 'Open menu'}
          aria-expanded={hasDashboardSidebar ? isDashboardSidebarOpen : isMobileMenuOpen}
          aria-controls={hasDashboardSidebar ? `${activeTab.toLowerCase()}-dashboard-sidebar` : undefined}
        >
          {(hasDashboardSidebar ? isDashboardSidebarOpen : isMobileMenuOpen) ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div
          className="portal-header-brand flex items-center gap-3 cursor-pointer group shrink-0"
          onClick={() => { setActiveTab(homeTab); setIsMobileMenuOpen(false); }}
        >
          <img src="/images/govt-seal.png" alt="Emblem" className="w-11 h-11 object-contain bg-white rounded-lg p-1 shadow-md shrink-0" />
          <div className="min-w-0">
            <div className="hidden sm:block text-[11px] text-slate-300 leading-tight whitespace-nowrap">Andaman &amp; Nicobar Administration</div>
            <div className="brand-title font-sans font-extrabold text-base sm:text-xl tracking-tight text-white leading-tight whitespace-nowrap">ANIIDCO Tourism Portal</div>
            <span className="brand-subtitle text-[10px] text-cyan-200 tracking-wider uppercase font-semibold hidden sm:block whitespace-nowrap">
              Official Single-Window Ticketing
            </span>
          </div>
        </div>

        {/* Center Nav Links — tourist-only; a signed-in staff user navigates
            via each dashboard's own persistent sidebar at desktop width, and
            via the mobile drawer below on small screens. */}
        {!isStaffUser && (
          <nav className="hidden lg:flex items-center gap-1">
            {TOURIST_TABS.map((t) => {
              const Icon = t.icon;
              const isActive = t.key === 'ATTRACTIONS_LIST' ? false : activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => {
                    setActiveTab(t.tab || t.key);
                    if (t.key === 'ATTRACTIONS_LIST') {
                      setTimeout(() => document.getElementById('popular-attractions')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
                    }
                  }}
                  className={`px-2 xl:px-3 py-2 rounded-lg text-[13px] xl:text-sm font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                    isActive ? 'bg-cyan-700 text-white shadow-md' : 'text-slate-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" /> {t.label}
                </button>
              );
            })}
            {user?.role === 'AGENT' && (
              <button
                onClick={() => setActiveTab('AGENT_CONSOLE')}
                className={`portal-nav-button px-3 py-2 rounded-lg text-sm font-bold whitespace-nowrap ${
                  activeTab === 'AGENT_CONSOLE'
                    ? 'is-current text-white shadow-md'
                    : 'text-cyan-200'
                }`}
              >
                <span>Agent Console</span>
              </button>
            )}
          </nav>
        )}

        {/* Right Section: Cart + Account */}
        <div className="portal-header-actions flex items-center gap-3 shrink-0">
          {!isStaffUser && (
            <button
              onClick={onOpenCart}
              aria-label="Trip Cart"
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
            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={accountMenuOpen}
                className="flex items-center gap-2.5 bg-navy-700/70 hover:bg-navy-700 border border-navy-600 pl-1.5 pr-2.5 py-1.5 rounded-full transition-colors"
              >
                <span className="portal-account-badge w-8 h-8 rounded-full bg-white text-navy-800 flex items-center justify-center font-extrabold text-xs">
                  {ROLE_BADGE[user.role] || (displayName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'TR')}
                </span>
                <span className="hidden xl:block text-left leading-tight">
                  <span className="block text-xs font-bold text-white max-w-28 truncate">{displayName}</span>
                  <span className="block text-[10px] text-emerald-300 font-medium">Verified Visitor</span>
                </span>
                <ChevronDown className="w-4 h-4 text-slate-300" />
              </button>
              {accountMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setAccountMenuOpen(false)} />
                  <div role="menu" className="absolute right-0 top-12 z-50 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 text-sm font-semibold text-navy-800">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="font-bold truncate">{displayName}</p>
                      <p className="text-[11px] text-emerald-600">Verified Visitor</p>
                    </div>
                    <button type="button" role="menuitem" onClick={() => { toggleAccessibleMode(); setAccountMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2">
                      <Accessibility className="w-4 h-4 text-cyan-700" /> Screen Reader mode
                    </button>
                    <button type="button" role="menuitem" onClick={() => { alert('हिन्दी इंटरफ़ेस जल्द उपलब्ध होगा (Hindi interface coming soon).'); setAccountMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2">
                      <Languages className="w-4 h-4 text-cyan-700" /> हिन्दी
                    </button>
                    <button type="button" role="menuitem" onClick={() => { setAccountMenuOpen(false); onLogout(); }} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 border-t border-slate-100">
                      <LogOut className="w-4 h-4" /> Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            // Straight into the tourist login (Google Sign-In front and
            // center) — no dropdown to pick through first. Staff and new
            // service providers get their own way in from inside the
            // modal itself instead of competing for space here.
            <button
              onClick={() => onOpenLogin('VISITOR')}
              aria-label="Login / Sign Up"
              className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-sm shadow-md transition-all whitespace-nowrap flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span className="portal-login-label">Login / Sign Up</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu — the center nav above is `hidden lg:flex`, so this is
          the only way to reach Attractions/Ferries/Passes (or a staff
          user's own portals) on a phone or narrow tablet. */}
      {isMobileMenuOpen && !hasDashboardSidebar && (
        <div className="lg:hidden border-t border-navy-700 bg-navy-800">
          <nav className="px-4 py-3 space-y-1">
            {!isStaffUser && (
              <>
                {TOURIST_TABS.filter((t) => t.key !== 'ATTRACTIONS_LIST').map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.key}
                      onClick={() => { setActiveTab(t.key); setIsMobileMenuOpen(false); requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })); }}
                      className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold flex items-center gap-2.5 transition-colors ${
                        activeTab === t.key ? 'bg-cyan-700 text-white' : 'text-slate-200 hover:bg-navy-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" /> {t.label}
                    </button>
                  );
                })}
                {user?.role === 'AGENT' && (
                  <button
                    onClick={() => { setActiveTab('AGENT_CONSOLE'); setIsMobileMenuOpen(false); }}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                      activeTab === 'AGENT_CONSOLE' ? 'bg-cyan-700 text-white' : 'text-cyan-200 hover:bg-navy-700'
                    }`}
                  >
                    Agent Console
                  </button>
                )}
              </>
            )}

            {isStaffUser && staffTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); setIsMobileMenuOpen(false); }}
                  className={`portal-nav-button w-full text-left px-4 py-3 rounded-lg text-sm font-bold flex items-center gap-2.5 ${
                    isActive ? 'bg-cyan-600 text-white' : 'text-cyan-200 hover:bg-navy-700'
                  }`}
                >
                  <span className="flex items-center gap-2.5"><Icon className="w-4 h-4" /> {tab.label}</span>
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
          <div className="md:hidden border-t border-navy-700 px-4 py-4 space-y-3">
            {!isStaffUser && (
              <button
                onClick={() => { onOpenCart(); setIsMobileMenuOpen(false); }}
                className="w-full px-4 py-3 border border-navy-600 rounded-lg text-sm font-bold flex items-center justify-center gap-2 text-white"
              >
                <ShoppingBag className="w-4 h-4 text-cyan-300" />
                Trip Cart
                {cartCount > 0 && <span className="px-1.5 py-0.5 rounded-full bg-cyan-600 text-white text-[11px] font-extrabold leading-none">{cartCount}</span>}
              </button>
            )}
            {user ? (
              <div className="flex items-center gap-3 bg-navy-700 border border-navy-600 px-3 py-2.5 rounded-lg">
                <div className="w-8 h-8 rounded-md bg-cyan-600/20 text-cyan-300 border border-cyan-600/40 flex items-center justify-center font-bold text-xs shrink-0">
                  {ROLE_BADGE[user.role] || 'TR'}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="text-xs font-bold text-white leading-tight break-words">{displayName}</div>
                  <div className="text-[10px] text-emerald-400 font-medium">Verified Visitor</div>
                </div>
                <button onClick={() => { onLogout(); setIsMobileMenuOpen(false); }} title="Log Out" aria-label="Log Out" className="text-slate-300 hover:text-red-400 p-1.5 rounded-lg hover:bg-navy-600 transition-colors shrink-0">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { onOpenLogin('VISITOR'); setIsMobileMenuOpen(false); }}
                className="w-full px-5 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-sm shadow-md flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Login / Sign Up
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}