import React, { useState, useEffect } from 'react';
import API from './api/client';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { AttractionsExplorer } from './components/AttractionsExplorer';
import { FerrySearch } from './components/FerrySearch';
import { CartDrawer } from './components/CartDrawer';
import { DigitalWallet } from './components/DigitalWallet';
import { AdminDashboard } from './components/AdminDashboard';
import { OperatorDashboard } from './components/OperatorDashboard';
import { VendorDashboard } from './components/VendorDashboard';
import { StaffGateScanner } from './components/StaffGateScanner';
import { OperatorRegisterModal } from './components/OperatorRegisterModal';
import { GroupBookingModal } from './components/GroupBookingModal';
import { Waves, ArrowUpRight, Users2 } from 'lucide-react';

// Editorial hero carousel — every image here is a verified, real Andaman
// & Nicobar location (checked individually against known landmarks before
// use, since this is a government portal and a misattributed photo would
// be a real credibility problem, not just a cosmetic one).
const HERO_SLIDES = [
  { img: '/images/hero-lagoon.jpg', caption: 'Radhanagar Beach, Havelock Island (Swaraj Dweep)' },
  { img: '/images/ross-island-church-ruins.jpg', caption: "St. Paul's Church Ruins, Ross Island" },
  { img: '/images/neil-island-natural-bridge.jpg', caption: 'Natural Rock Bridge (Howrah Bridge), Neil Island' },
  { img: '/images/cellular-jail.jpg', caption: 'Cellular Jail National Memorial, Port Blair' },
];

const DISCOVER_CARDS = [
  {
    img: '/images/ross-island-church-ruins.jpg',
    title: 'Ross Island',
    subtitle: 'Netaji Subhash Chandra Bose Dweep',
    blurb: 'Colonial-era ruins reclaimed by banyan roots, roaming spotted deer, and the old British administrative capital of the islands.',
    island: 'PORT_BLAIR',
    attractionTitle: 'Ross Island (Netaji Subhash Chandra Bose Dweep)',
  },
  {
    img: '/images/neil-island-natural-bridge.jpg',
    title: 'Neil Island',
    subtitle: 'Shaheed Dweep',
    blurb: "A limestone sea arch carved by centuries of tide, best seen at low tide against the Bay of Bengal's turquoise water.",
    island: 'NEIL',
    attractionTitle: null, // no bookable attraction listed for Neil Island yet — filtering the grid to it is the honest behavior
  },
  {
    img: '/images/cellular-jail-corridor.jpg',
    title: 'Cellular Jail',
    subtitle: 'Port Blair — National Memorial',
    blurb: "The 'Kaala Pani' colonial prison that held India's freedom fighters — now a memorial with a nightly Light & Sound Show.",
    island: 'PORT_BLAIR',
    attractionTitle: 'Cellular Jail National Memorial',
  },
];

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginContext, setLoginContext] = useState('VISITOR');
  const [isOperatorRegisterOpen, setIsOperatorRegisterOpen] = useState(false);
  const [isGroupBookingOpen, setIsGroupBookingOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('ATTRACTIONS');
  const [cartCount, setCartCount] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [heroSlide, setHeroSlide] = useState(0);
  const [focusRequest, setFocusRequest] = useState(null);
  const [quickSearchType, setQuickSearchType] = useState('ATTRACTIONS');
  const [quickSearchIsland, setQuickSearchIsland] = useState('ALL');
  const [quickSearchDate, setQuickSearchDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const savedUser = localStorage.getItem('aniidco_user');
    const token = localStorage.getItem('aniidco_token');
    if (savedUser && token) {
      setCurrentUser(JSON.parse(savedUser));
    }
    refreshCartCount();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlide((i) => (i + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const refreshCartCount = async () => {
    try {
      const res = await API.get('/cart');
      setCartCount(res.data.items?.length || 0);
    } catch (err) {
      // Cart might be empty or unauthenticated
    }
  };

  const openLogin = (context = 'VISITOR') => {
    setLoginContext(context);
    setIsLoginOpen(true);
  };

  const scrollToBrowseSection = () => {
    requestAnimationFrame(() => {
      document.getElementById('attractions-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleQuickSearch = (e) => {
    e.preventDefault();
    if (quickSearchType === 'FERRY') {
      setActiveTab('FERRY');
    } else {
      setActiveTab('ATTRACTIONS');
      setFocusRequest({
        token: Date.now(),
        island: quickSearchIsland === 'ALL' ? null : quickSearchIsland,
        attractionTitle: null,
        date: quickSearchDate,
      });
    }
    scrollToBrowseSection();
  };

  const handleDiscoverCardClick = (card) => {
    setActiveTab('ATTRACTIONS');
    setFocusRequest({ token: Date.now(), island: card.island, attractionTitle: card.attractionTitle });
    scrollToBrowseSection();
  };

  const handleLogout = () => {
    localStorage.removeItem('aniidco_token');
    localStorage.removeItem('aniidco_user');
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-cyan-600 selection:text-white">
      <Navbar
        user={currentUser}
        onOpenLogin={openLogin}
        onOpenOperatorRegister={() => setIsOperatorRegisterOpen(true)}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Hero Section — editorial rotating carousel of real Andaman locations */}
      <section className="relative min-h-[480px] flex items-center justify-center overflow-hidden bg-navy-800">
        {HERO_SLIDES.map((slide, idx) => (
          <div
            key={slide.img}
            className={`absolute inset-0 bg-cover bg-center ease-in-out ${
              idx === heroSlide ? 'opacity-60' : 'opacity-0'
            }`}
            style={{
              backgroundImage: `url('${slide.img}')`,
              transform: idx === heroSlide ? 'scale(1.06)' : 'scale(1)',
              transitionProperty: 'opacity, transform',
              transitionDuration: '1500ms, 6500ms',
            }}
          ></div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-navy-900/60 via-navy-900/80 to-navy-900"></div>

        {/* Slide caption + dots */}
        <div className="absolute bottom-5 left-0 right-0 z-10 flex flex-col items-center gap-3">
          <span className="text-[11px] text-cyan-200/90 font-semibold tracking-wide">
            {HERO_SLIDES[heroSlide].caption}
          </span>
          <div className="flex items-center gap-1.5">
            {HERO_SLIDES.map((slide, idx) => (
              <button
                key={slide.img}
                onClick={() => setHeroSlide(idx)}
                aria-label={`Show slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  idx === heroSlide ? 'w-6 bg-cyan-400' : 'w-1.5 bg-white/40 hover:bg-white/60'
                }`}
              ></button>
            ))}
          </div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/25 text-cyan-200 text-[11px] font-bold tracking-wide">
            <Waves className="w-3.5 h-3.5" />
            <span>An Official Government of India Initiative</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
            Book Monument Entry, Dive Slots &amp; Ferry Seats — All in One Place
          </h1>

          <p className="text-slate-200 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Verified single-window reservations for the Andaman &amp; Nicobar Islands. Every booking issues a tamper-proof digital pass for turnstile entry.
          </p>

          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setActiveTab('ATTRACTIONS')}
              className={`px-6 py-3 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'ATTRACTIONS'
                  ? 'bg-white text-navy-800 shadow-lg'
                  : 'bg-white/10 text-white border border-white/30 hover:bg-white/20'
              }`}
            >
              Browse Attractions
            </button>

            <button
              onClick={() => setActiveTab('FERRY')}
              className={`px-6 py-3 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'FERRY'
                  ? 'bg-white text-navy-800 shadow-lg'
                  : 'bg-white/10 text-white border border-white/30 hover:bg-white/20'
              }`}
            >
              Book a Ferry
            </button>
          </div>
        </div>
      </section>

      {/* Floating quick-search card, straddling the hero/trust-strip boundary */}
      <div className="relative z-20 max-w-4xl mx-auto px-4 -mt-8">
        <form
          onSubmit={handleQuickSearch}
          className="bg-white rounded-2xl shadow-xl border border-slate-200 p-3 flex flex-col md:flex-row items-stretch md:items-center gap-2"
        >
          <div className="flex bg-slate-100 rounded-lg p-1 shrink-0">
            <button
              type="button"
              onClick={() => setQuickSearchType('ATTRACTIONS')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                quickSearchType === 'ATTRACTIONS' ? 'bg-navy-800 text-white' : 'text-slate-500'
              }`}
            >
              Attractions
            </button>
            <button
              type="button"
              onClick={() => setQuickSearchType('FERRY')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                quickSearchType === 'FERRY' ? 'bg-navy-800 text-white' : 'text-slate-500'
              }`}
            >
              Ferry
            </button>
          </div>

          {quickSearchType === 'ATTRACTIONS' && (
            <select
              value={quickSearchIsland}
              onChange={(e) => setQuickSearchIsland(e.target.value)}
              className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-navy-800 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">Any Destination</option>
              <option value="PORT_BLAIR">Port Blair</option>
              <option value="HAVELOCK">Havelock (Swaraj Dweep)</option>
              <option value="NEIL">Neil (Shaheed Dweep)</option>
            </select>
          )}

          {quickSearchType === 'FERRY' && (
            <div className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500">
              Choose your route on the next screen
            </div>
          )}

          <input
            type="date"
            value={quickSearchDate}
            onChange={(e) => setQuickSearchDate(e.target.value)}
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-navy-800 font-mono focus:outline-none focus:border-cyan-500"
          />

          <button
            type="submit"
            className="px-6 py-2.5 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-lg text-sm shadow-md transition-all whitespace-nowrap"
          >
            Search
          </button>
        </form>
      </div>

      {/* Trust strip */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            ['9', 'Heritage & Nature Sites'],
            ['3', 'Islands Connected'],
            ['100%', 'Digital, Tamper-Proof Passes'],
            ['24×7', 'Booking Availability'],
          ].map(([n, l]) => (
            <div key={l}>
              <div className="font-serif font-black text-xl text-navy-800">{n}</div>
              <div className="text-[11px] font-semibold text-slate-500">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Discover the Islands — editorial gallery of real Andaman landmarks */}
      <div className="bg-slate-100 py-10 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-5">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-700">Explore</span>
              <h2 className="font-serif text-xl md:text-2xl font-black text-navy-800">Discover the Islands</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {DISCOVER_CARDS.map((card) => (
              <button
                key={card.title}
                onClick={() => handleDiscoverCardClick(card)}
                className="relative h-64 rounded-2xl overflow-hidden group text-left shadow-sm hover:shadow-xl hover:ring-2 hover:ring-cyan-500/60 transition-all cursor-pointer"
              >
                <img
                  src={card.img}
                  alt={card.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-900/95 via-navy-900/30 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4 space-y-1">
                  <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider">{card.subtitle}</span>
                  <h3 className="font-serif text-lg font-black text-white flex items-center gap-1.5">
                    {card.title}
                    <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">{card.blurb}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main id="attractions-section" className="flex-1 max-w-7xl w-full mx-auto px-4 py-10">
        {activeTab === 'ATTRACTIONS' && (
          <div className="mb-5 bg-cyan-50 border border-cyan-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white text-cyan-700 border border-cyan-200 flex items-center justify-center shrink-0">
                <Users2 className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-sm font-bold text-navy-800">Booking for a school, college, or large group?</p>
                <p className="text-[11px] text-slate-500">Submit a roster-based group application for ANIIDCO approval — schools, colleges, corporates & tour operators.</p>
              </div>
            </div>
            <button
              onClick={() => setIsGroupBookingOpen(true)}
              className="px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-lg text-xs shadow-md whitespace-nowrap"
            >
              Start Group Booking
            </button>
          </div>
        )}

        {activeTab === 'ATTRACTIONS' && (
          <AttractionsExplorer
            onAddToCart={refreshCartCount}
            onRequireLogin={() => openLogin('VISITOR')}
            user={currentUser}
            focusRequest={focusRequest}
          />
        )}

        {activeTab === 'FERRY' && (
          <FerrySearch
            onAddToCart={refreshCartCount}
            onRequireLogin={() => openLogin('VISITOR')}
            user={currentUser}
          />
        )}

        {activeTab === 'PASSES' && (
          <DigitalWallet
            user={currentUser}
            onRequireLogin={() => openLogin('VISITOR')}
          />
        )}

        {activeTab === 'ADMIN' && (
          <AdminDashboard user={currentUser} />
        )}

        {activeTab === 'OPERATOR' && (
          <OperatorDashboard user={currentUser} />
        )}

        {activeTab === 'VENDOR' && (
          <VendorDashboard user={currentUser} />
        )}

        {activeTab === 'SCANNER' && (
          <StaffGateScanner user={currentUser} />
        )}
      </main>

      <footer className="bg-navy-900 text-slate-400 py-8 px-4 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between gap-6">
          <div className="max-w-sm">
            <div className="font-serif font-bold text-sm text-white mb-1.5">ANIIDCO Tourism &amp; Ferry Portal</div>
            <p className="text-[11.5px] leading-relaxed">An official service of the Andaman &amp; Nicobar Islands Integrated Development Corporation Ltd.</p>
          </div>
          <div className="text-[11.5px] leading-loose">
            <div className="text-slate-300 font-bold text-xs mb-1">Support</div>
            <div>Helpline: 1800-345-0000</div>
            <div>grievance@aniidco.gov.in</div>
          </div>
          <div className="text-[11.5px] leading-loose">
            <div className="text-slate-300 font-bold text-xs mb-1">For Businesses</div>
            <button
              onClick={() => setIsOperatorRegisterOpen(true)}
              className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2 block"
            >
              Partner with ANIIDCO — Register as an Operator
            </button>
            <button
              onClick={() => setIsGroupBookingOpen(true)}
              className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2 block mt-1"
            >
              Group / Institutional Booking (Schools, Colleges, Tours)
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-navy-700 mt-4 pt-3 text-[10.5px] text-slate-500">
          © 2026 Andaman &amp; Nicobar Administration. All rights reserved. Content owned and maintained by ANIIDCO.
        </div>
      </footer>

      <LoginModal
        isOpen={isLoginOpen}
        loginContext={loginContext}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(userData) => {
          setCurrentUser(userData);
          refreshCartCount();
        }}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCartUpdated={refreshCartCount}
        onOrderConfirmed={() => {
          refreshCartCount();
          setActiveTab('PASSES');
        }}
      />

      <OperatorRegisterModal
        isOpen={isOperatorRegisterOpen}
        onClose={() => setIsOperatorRegisterOpen(false)}
      />

      <GroupBookingModal
        isOpen={isGroupBookingOpen}
        onClose={() => setIsGroupBookingOpen(false)}
        user={currentUser}
        onRequireLogin={() => { setIsGroupBookingOpen(false); openLogin('VISITOR'); }}
      />
    </div>
  );
}
