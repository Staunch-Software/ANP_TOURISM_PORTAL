import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from './api/client';
import { Navbar } from './components/Navbar';
import {
  ConnectedIslandsPage,
  ConnectedIslandsPreview,
  HeritageSitesPage,
  HeritageSitesPreview,
} from './components/HeritageSites';
import { LoginModal } from './components/LoginModal';
import { AttractionsExplorer } from './components/AttractionsExplorer';
import { FerrySearch } from './components/FerrySearch';
import { CartDrawer } from './components/CartDrawer';
import { DigitalWallet } from './components/DigitalWallet';
import { MyWallet } from './components/MyWallet';
import { AgentConsole } from './components/AgentConsole';
import { AdminDashboard } from './components/AdminDashboard';
import { OperatorDashboard } from './components/OperatorDashboard';
import { VendorDashboard } from './components/VendorDashboard';
import { OperatorRegisterModal } from './components/OperatorRegisterModal';
import { GroupBookingModal } from './components/GroupBookingModal';
import { MyGroupBookings } from './components/MyGroupBookings';
import { SupportCenter } from './components/SupportCenter';
import { AIChatWidget } from './components/AIChatWidget';
import {
  Waves, ArrowUpRight, Users2, MapPin, Search, ShieldCheck,
  Landmark, Clock3, Ship
} from 'lucide-react';

// Editorial hero carousel — every image here is a verified, real Andaman
// & Nicobar location (checked individually against known landmarks before
// use, since this is a government portal and a misattributed photo would
// be a real credibility problem, not just a cosmetic one).
const HERO_SLIDES = [
  { img: '/images/home-hero-bird.jpg', caption: 'Birdlife of the Andaman Islands' },
  { img: '/images/home-hero-beach.jpg', caption: 'Beaches of the Andaman Islands' },
  { img: '/images/home-hero-nature.jpg', caption: 'Nature of the Andaman Islands' },
  { img: '/images/home-hero-scuba.jpg', caption: 'Scuba diving in the Andaman Islands' },
  { img: '/images/neil-island-natural-bridge.jpg', caption: 'Natural Bridge, Neil Island' },
];

// Staff/service-provider dashboards are operational tools, not tourist
// storefronts — RFP 344 treats Tourists and Service Providers/Admin as
// separate user types, so once logged in as one, the tourist booking
// funnel (hero carousel, quick search, island gallery) has no reason to
// show at all: it would just be clutter competing with their real task.
const STAFF_ROLES = ['ADMIN', 'OPERATOR', 'VENDOR'];
const STAFF_TABS = ['ADMIN', 'OPERATOR', 'VENDOR'];
const PAGE_TABS = ['ATTRACTIONS', 'FERRY', 'PASSES', 'SUPPORT', 'GROUP_BOOKINGS', 'AGENT_CONSOLE', ...STAFF_TABS];
// The Agent Console isn't a staff dashboard (an Agent keeps the normal
// tourist <main> wrapper so they can still book for clients), but it's
// also not a tourist landing page — the marketing hero/search/footer
// above and below it would just be clutter for someone here to check an
// API key, not plan a trip.
const HIDE_TOURIST_CHROME_TABS = [...STAFF_TABS, 'AGENT_CONSOLE'];

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
  const location = useLocation();
  const navigate = useNavigate();
  const isHeritageSitesPage = location.pathname.replace(/\/+$/, '') === '/heritage-sites';
  const isConnectedIslandsPage = location.pathname.replace(/\/+$/, '') === '/connected-islands';
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginContext, setLoginContext] = useState('VISITOR');
  const [isOperatorRegisterOpen, setIsOperatorRegisterOpen] = useState(false);
  const [isGroupBookingOpen, setIsGroupBookingOpen] = useState(false);
  const [activeTab, setActiveTabState] = useState(() => {
    const requestedTab = new URLSearchParams(window.location.search).get('page');
    return PAGE_TABS.includes(requestedTab) ? requestedTab : 'ATTRACTIONS';
  });
  const [cartCount, setCartCount] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminSidebarOpen, setIsAdminSidebarOpen] = useState(false);
  const [isVendorSidebarOpen, setIsVendorSidebarOpen] = useState(false);
  const [heroSlide, setHeroSlide] = useState(0);
  const [focusRequest, setFocusRequest] = useState(null);
  const [quickSearchType, setQuickSearchType] = useState('ATTRACTIONS');
  const [quickSearchIsland, setQuickSearchIsland] = useState('ALL');
  const [quickSearchDate, setQuickSearchDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const root = document.querySelector('[data-portal-page]');
    const selector = [
      '.portal-trust-item',
      '.portal-heritage-site-card',
      '[data-portal-page="ATTRACTIONS"] .bg-slate-100 .grid > button',
      '#attractions-section > div > :not(.fixed)',
      '#attractions-section .space-y-4 > .bg-white',
      '#attractions-section .grid > .bg-white',
      '.portal-dashboard-sidebar ~ div > :not(.fixed)',
      '.portal-dashboard-sidebar ~ div > .grid > .bg-white',
      '.portal-footer-content > div',
    ].join(', ');
    const observed = new WeakSet();
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        target.classList.toggle('scroll-reveal-visible', isIntersecting);
      });
    }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });

    const updateVisibility = (element) => {
      const bounds = element.getBoundingClientRect();
      element.classList.toggle('scroll-reveal-visible', bounds.bottom > 0 && bounds.top < window.innerHeight - 24);
    };

    const watch = (element) => {
      if (element.matches(selector) && !observed.has(element)) {
        observed.add(element);
        updateVisibility(element);
        element.classList.add('scroll-reveal');
        revealObserver.observe(element);
      }
      element.querySelectorAll(selector).forEach((match) => {
        if (!observed.has(match)) {
          observed.add(match);
          updateVisibility(match);
          match.classList.add('scroll-reveal');
          revealObserver.observe(match);
        }
      });
    };

    let scrollTimer;
    const onScroll = () => {
      if (scrollTimer) return;
      scrollTimer = window.setTimeout(() => {
        scrollTimer = null;
        root.querySelectorAll('.scroll-reveal').forEach(updateVisibility);
      }, 60);
    };

    watch(root);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    document.addEventListener('visibilitychange', onScroll);
    const changes = new MutationObserver((records) => {
      records.forEach(({ addedNodes }) => {
        addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) watch(node);
        });
      });
    });
    changes.observe(root, { childList: true, subtree: true });
    return () => {
      changes.disconnect();
      revealObserver.disconnect();
      window.clearTimeout(scrollTimer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      document.removeEventListener('visibilitychange', onScroll);
    };
  }, []);

  const setActiveTab = (tab) => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    setActiveTabState(tab);
    setIsAdminSidebarOpen(false);
    setIsVendorSidebarOpen(false);
    if (tab !== 'ATTRACTIONS') setFocusRequest(null);
    if (!PAGE_TABS.includes(tab)) return;

    const url = new URL(window.location.href);
    if (tab === 'ATTRACTIONS') url.searchParams.delete('page');
    else url.searchParams.set('page', tab);

    const nextLocation = `${url.pathname}${url.search}${url.hash}`;
    if (location.pathname !== '/') {
      navigate({ pathname: '/', search: url.search, hash: url.hash });
      return;
    }
    const currentLocation = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (nextLocation !== currentLocation) {
      window.history.pushState({ page: tab }, '', nextLocation);
    }
  };

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname, activeTab]);

  useEffect(() => {
    const syncPageFromUrl = () => {
      const requestedTab = new URLSearchParams(window.location.search).get('page');
      setActiveTabState(PAGE_TABS.includes(requestedTab) ? requestedTab : 'ATTRACTIONS');
    };

    window.addEventListener('popstate', syncPageFromUrl);
    return () => window.removeEventListener('popstate', syncPageFromUrl);
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem('aniidco_user');
    const token = localStorage.getItem('aniidco_token');
    if (savedUser && token) {
      const parsedUser = JSON.parse(savedUser);
      setCurrentUser(parsedUser);
      if (STAFF_ROLES.includes(parsedUser.role)) {
        setActiveTab(parsedUser.role);
      }
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
    setIsAdminSidebarOpen(false);
    setIsVendorSidebarOpen(false);
    // Without this, the next person to sign in on this browser (a
    // different role entirely) inherits whatever tab the last session
    // left active -- e.g. a Tourist landing on the Admin dashboard's
    // "Restricted Access" screen right after an Admin logs out.
    setActiveTab('ATTRACTIONS');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-cyan-600 selection:text-white" data-portal-page={activeTab}>
      <Navbar
        user={currentUser}
        onOpenLogin={openLogin}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
        adminSidebarOpen={isAdminSidebarOpen}
        onToggleAdminSidebar={() => setIsAdminSidebarOpen((open) => !open)}
        vendorSidebarOpen={isVendorSidebarOpen}
        onToggleVendorSidebar={() => setIsVendorSidebarOpen((open) => !open)}
      />

      {!isHeritageSitesPage && !isConnectedIslandsPage && activeTab === 'ATTRACTIONS' && (
      <div className="italic">
      {/* Hero Section — editorial rotating carousel of real Andaman locations */}
      <section className="relative min-h-[420px] flex items-center justify-center overflow-hidden bg-navy-800">
        {HERO_SLIDES.map((slide, idx) => (
          <div
            key={slide.img}
            className={`absolute inset-0 bg-cover bg-center ease-in-out ${
              idx === heroSlide ? 'opacity-75' : 'opacity-0'
            }`}
            style={{
              backgroundImage: `url('${slide.img}')`,
              transform: idx === heroSlide ? 'scale(1.06)' : 'scale(1)',
              transitionProperty: 'opacity, transform',
              transitionDuration: '1500ms, 6500ms',
            }}
          ></div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-navy-900/45 via-navy-900/65 to-navy-900/90"></div>

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

        <div className="relative z-10 max-w-4xl mx-auto px-4 py-14 text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/25 text-cyan-200 text-[11px] font-bold tracking-wide">
            <Waves className="w-3.5 h-3.5" />
            <span>An Official Government of India Initiative</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
            Explore the Andamans. <span className="text-cyan-300">Book It All Here.</span>
          </h1>

          <p className="text-slate-200 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Monument entry, dive slots and inter-island ferry seats — one verified single-window booking, one tamper-proof digital pass for every gate.
          </p>
        </div>
      </section>

      {/* Floating search card, Wanderly-style pill fields, straddling the
          hero/trust-strip boundary */}
      <div className="relative z-20 max-w-2xl mx-auto px-4 -mt-8">
        <form
          onSubmit={handleQuickSearch}
          className="bg-white rounded-2xl shadow-xl border border-slate-200 p-2"
        >
          <div className="flex bg-slate-100 rounded-xl p-1 mb-3 w-fit">
            <button
              type="button"
              onClick={() => setQuickSearchType('ATTRACTIONS')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                quickSearchType === 'ATTRACTIONS' ? 'bg-navy-800 text-white' : 'text-slate-500'
              }`}
            >
              Attractions
            </button>
            <button
              type="button"
              onClick={() => setQuickSearchType('FERRY')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                quickSearchType === 'FERRY' ? 'bg-navy-800 text-white' : 'text-slate-500'
              }`}
            >
              Ferry
            </button>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2 rounded-xl border border-slate-200 md:border-0">
              <MapPin className="w-4 h-4 text-cyan-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">Where to?</label>
                {quickSearchType === 'ATTRACTIONS' ? (
                  <select
                    value={quickSearchIsland}
                    onChange={(e) => setQuickSearchIsland(e.target.value)}
                    className="w-full text-sm text-navy-800 font-semibold focus:outline-none bg-transparent -ml-0.5"
                  >
                    <option value="ALL">Any Destination</option>
                    <option value="PORT_BLAIR">Port Blair</option>
                    <option value="HAVELOCK">Havelock (Swaraj Dweep)</option>
                    <option value="NEIL">Neil (Shaheed Dweep)</option>
                  </select>
                ) : (
                  <span className="block text-sm text-slate-500">Choose your route next</span>
                )}
              </div>
            </div>

            <div className="hidden md:block w-px self-stretch bg-slate-200"></div>

            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl border border-slate-200 md:border-0">
              <Clock3 className="w-4 h-4 text-cyan-600 shrink-0" />
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">Date</label>
                <input
                  type="date"
                  value={quickSearchDate}
                  onChange={(e) => setQuickSearchDate(e.target.value)}
                  className="text-sm text-navy-800 font-semibold font-mono focus:outline-none bg-transparent"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-3 md:py-0 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-xl text-sm shadow-md transition-all whitespace-nowrap flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" /> Search
            </button>
          </div>
        </form>
      </div>

      {/* Trust strip */}
      <div className="portal-trust-strip mt-3 border-b border-cyan-100">
        <div className="portal-trust-grid w-full px-0 py-5 grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-0">
          <div className="portal-trust-item">
            <HeritageSitesPreview />
          </div>
          <div className="portal-trust-item">
            <ConnectedIslandsPreview />
          </div>
          {[
            { Icon: Landmark, value: '100%', label: 'Tamper-Proof Digital Passes' },
            { Icon: Clock3, value: '24×7', label: 'Booking Availability' },
          ].map(({ Icon, value, label }) => (
            <div key={label} className="portal-trust-item flex items-center gap-2.5">
              <div className="portal-trust-icon w-10 h-10 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-100 flex items-center justify-center shrink-0">
                <Icon className="w-4.5 h-4.5" />
              </div>
              <span className="portal-trust-copy">
                <strong>{value}</strong>
                <span>{label}</span>
              </span>
            </div>
          ))}
        </div>
      </div>


      {/* Discover the Islands — editorial gallery of real Andaman landmarks */}
      <div className="portal-explore-band bg-slate-100 py-10 border-b border-slate-200">
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
                  className="absolute inset-0 w-full h-full object-cover brightness-110 group-hover:scale-110 transition-transform duration-700"
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
      </div>
      )}

      {/* Main Content Area — each staff dashboard owns its own full-height
          sidebar shell (DashboardSidebar) with Gate Scanner folded in as a
          section, instead of a separate outer portal-switcher stacked on
          top of the dashboard's own section nav. */}
      {isHeritageSitesPage ? (
        <HeritageSitesPage />
      ) : isConnectedIslandsPage ? (
        <ConnectedIslandsPage />
      ) : STAFF_TABS.includes(activeTab) ? (
        <div className="flex-1 flex w-full">
          {activeTab === 'ADMIN' && (
            <AdminDashboard user={currentUser} onLogout={handleLogout} isSidebarOpen={isAdminSidebarOpen} onCloseSidebar={() => setIsAdminSidebarOpen(false)} />
          )}

          {activeTab === 'OPERATOR' && (
            <OperatorDashboard user={currentUser} onLogout={handleLogout} />
          )}

          {activeTab === 'VENDOR' && (
            <VendorDashboard user={currentUser} onLogout={handleLogout} isSidebarOpen={isVendorSidebarOpen} onCloseSidebar={() => setIsVendorSidebarOpen(false)} />
          )}
        </div>
      ) : (
        <main id="attractions-section" className={`flex-1 max-w-7xl w-full mx-auto px-4 py-10 ${activeTab === 'ATTRACTIONS' ? 'italic' : ''}`}>
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

          {activeTab === 'WALLET' && (
            <MyWallet
              user={currentUser}
              onRequireLogin={() => openLogin('VISITOR')}
            />
          )}

          {activeTab === 'AGENT_CONSOLE' && (
            <AgentConsole
              user={currentUser}
              onRequireLogin={() => openLogin('VISITOR')}
            />
          )}

          {activeTab === 'SUPPORT' && (
            <SupportCenter
              user={currentUser}
              onRequireLogin={() => openLogin('VISITOR')}
            />
          )}

          {activeTab === 'GROUP_BOOKINGS' && (
            <MyGroupBookings
              user={currentUser}
              onRequireLogin={() => openLogin('VISITOR')}
              onOpenGroupBooking={() => setIsGroupBookingOpen(true)}
              onViewPasses={() => setActiveTab('PASSES')}
            />
          )}
        </main>
      )}

      {/* Staff dashboards are a fixed-sidebar app shell (DashboardSidebar),
          not a page with a footer below it — showing the tourist footer
          here would just scroll the sidebar out of view without anything
          useful replacing it. */}
      {!HIDE_TOURIST_CHROME_TABS.includes(activeTab) && (
        <footer
          className={`portal-footer text-slate-100 py-8 px-4 mt-auto ${activeTab === 'ATTRACTIONS' && !isHeritageSitesPage && !isConnectedIslandsPage ? 'italic' : ''}`}
          style={{
            backgroundImage: "linear-gradient(90deg, rgba(4, 22, 38, 0.9) 0%, rgba(5, 29, 48, 0.76) 48%, rgba(5, 35, 52, 0.4) 100%), url('/images/footer-coconut-beach.jpg')",
            backgroundPosition: '58% 64%',
            backgroundSize: 'cover'
          }}
        >
          <div className="portal-footer-content max-w-7xl mx-auto flex flex-wrap justify-between gap-6">
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
              {currentUser && (
                <button
                  onClick={() => setActiveTab('GROUP_BOOKINGS')}
                  className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2 block mt-1"
                >
                  Track My Group Booking Requests
                </button>
              )}
            </div>
          </div>
          <div className="portal-footer-content max-w-7xl mx-auto border-t border-white/30 mt-4 pt-3 text-[10.5px] text-slate-200">
            © 2026 Andaman &amp; Nicobar Administration. All rights reserved. Content owned and maintained by ANIIDCO.
          </div>
        </footer>
      )}

      <LoginModal
        isOpen={isLoginOpen}
        loginContext={loginContext}
        onSwitchContext={setLoginContext}
        onOpenOperatorRegister={() => { setIsLoginOpen(false); setIsOperatorRegisterOpen(true); }}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(userData) => {
          setCurrentUser(userData);
          refreshCartCount();
          if (userData.role === 'ADMIN') setActiveTab('ADMIN');
          else if (userData.role === 'OPERATOR') setActiveTab('OPERATOR');
          else if (userData.role === 'VENDOR') setActiveTab('VENDOR');
          else if (userData.role === 'AGENT') setActiveTab('AGENT_CONSOLE');
          // A Tourist (or any other role) always lands on the booking
          // funnel, never on whatever tab a previous session left behind.
          else setActiveTab('ATTRACTIONS');
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
        onViewMyBookings={() => { setIsGroupBookingOpen(false); setActiveTab('GROUP_BOOKINGS'); }}
      />

      <AIChatWidget user={currentUser} />
    </div>
  );
}