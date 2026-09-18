import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck, ShoppingBag, LogOut, Anchor, Waves, ScanLine, Landmark,
  ChevronDown, User, Building2
} from 'lucide-react';

const STAFF_TAB_DEFS = [
  { key: 'ADMIN', label: 'Admin MIS', icon: ShieldCheck, roles: ['ADMIN'] },
  { key: 'OPERATOR', label: 'Ferry Operator', icon: Anchor, roles: ['OPERATOR', 'ADMIN'] },
  { key: 'VENDOR', label: 'Activity Vendor', icon: Waves, roles: ['VENDOR', 'ADMIN'] },
  { key: 'SCANNER', label: 'Gate Scanner', icon: ScanLine, roles: ['OPERATOR', 'VENDOR', 'ADMIN'] },
];

const ROLE_BADGE = { ADMIN: 'ADM', OPERATOR: 'OPR', VENDOR: 'VND' };

// RFP Section 344: "There shall be 4 types of users for the system —
// Tourists, Service Providers, Agency, Admin/Regulatory Authority."
// Each collects different registration details, so login/sign-up is one
// entry point that routes to the right flow rather than separate buttons
// per type competing for navbar space.
const LOGIN_MENU_ITEMS = [
  {
    key: 'VISITOR',
    icon: User,
    label: 'Visitor / Tourist Login',
    description: 'Book attractions, ferries & manage your digital passes',
  },
  {
    key: 'STAFF',
    icon: Landmark,
    label: 'Service Provider / Staff Login',
    description: 'For approved Ferry Operators, Activity Vendors & Administrators',
  },
  {
    key: 'REGISTER_PROVIDER',
    icon: Building2,
    label: 'Become a Service Provider',
    description: 'Register your ferry or water sports business for ANIIDCO approval',
  },
];

export function Navbar({
  user,
  onOpenLogin,
  onOpenOperatorRegister,
  onLogout,
  activeTab,
  setActiveTab,
  cartCount,
  onOpenCart
}) {
  const [accessibleMode, setAccessibleMode] = useState(false);
  const [isStaffMenuOpen, setIsStaffMenuOpen] = useState(false);
  const [isLoginMenuOpen, setIsLoginMenuOpen] = useState(false);
  const staffMenuRef = useRef(null);
  const loginMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (staffMenuRef.current && !staffMenuRef.current.contains(e.target)) {
        setIsStaffMenuOpen(false);
      }
      if (loginMenuRef.current && !loginMenuRef.current.contains(e.target)) {
        setIsLoginMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLoginMenuSelect = (key) => {
    setIsLoginMenuOpen(false);
    if (key === 'REGISTER_PROVIDER') {
      onOpenOperatorRegister();
    } else {
      onOpenLogin(key);
    }
  };

  const toggleAccessibleMode = () => {
    const next = !accessibleMode;
    setAccessibleMode(next);
    document.documentElement.classList.toggle('accessible-mode', next);
  };

  const staffTabs = STAFF_TAB_DEFS.filter((tab) => user?.role && tab.roles.includes(user.role));
  const isStaffTabActive = staffTabs.some((tab) => tab.key === activeTab);

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

          {/* Staff/Admin tabs collapse into a single dropdown so the bar
              stays a fixed width no matter how many portals a role (esp.
              ADMIN, which qualifies for all of them) has access to. */}
          {staffTabs.length > 0 && (
            <div className="relative" ref={staffMenuRef}>
              <button
                onClick={() => setIsStaffMenuOpen((v) => !v)}
                className={`px-5 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isStaffTabActive
                    ? 'bg-amber-700 text-white shadow-md'
                    : 'text-amber-400 hover:text-amber-300 hover:bg-navy-600'
                }`}
              >
                <Landmark className="w-4 h-4" /> Staff Portal
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isStaffMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isStaffMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden py-1.5 z-50">
                  {staffTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => {
                          setActiveTab(tab.key);
                          setIsStaffMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-semibold flex items-center gap-2.5 transition-colors ${
                          isActive ? 'bg-cyan-50 text-cyan-700' : 'text-navy-800 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-4 h-4" /> {tab.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
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
            <div className="relative" ref={loginMenuRef}>
              <button
                onClick={() => setIsLoginMenuOpen((v) => !v)}
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-sm shadow-md transition-all flex items-center gap-1.5 whitespace-nowrap"
              >
                Login / Sign Up
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isLoginMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLoginMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden py-1.5 z-50">
                  {LOGIN_MENU_ITEMS.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.key}
                        onClick={() => handleLoginMenuSelect(item.key)}
                        className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors ${
                          idx > 0 ? 'border-t border-slate-100' : ''
                        }`}
                      >
                        <div className="w-9 h-9 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-100 flex items-center justify-center shrink-0 mt-0.5">
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-navy-800">{item.label}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{item.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
