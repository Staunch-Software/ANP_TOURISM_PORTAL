import React, { useState, useEffect } from 'react';
import API from './api/client';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { AttractionsExplorer } from './components/AttractionsExplorer';
import { FerrySearch } from './components/FerrySearch';
import { CartDrawer } from './components/CartDrawer';
import { DigitalWallet } from './components/DigitalWallet';
import { AdminDashboard } from './components/AdminDashboard';
import { Waves } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('ATTRACTIONS');
  const [cartCount, setCartCount] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('aniidco_user');
    const token = localStorage.getItem('aniidco_token');
    if (savedUser && token) {
      setCurrentUser(JSON.parse(savedUser));
    }
    refreshCartCount();
  }, []);

  const refreshCartCount = async () => {
    try {
      const res = await API.get('/cart');
      setCartCount(res.data.items?.length || 0);
    } catch (err) {
      // Cart might be empty or unauthenticated
    }
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
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Hero Section */}
      <section className="relative min-h-[420px] flex items-center justify-center overflow-hidden bg-navy-800">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-55"
          style={{ backgroundImage: `url('/images/hero-lagoon.jpg')` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-navy-900/60 via-navy-900/80 to-navy-900"></div>

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

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-10">
        {activeTab === 'ATTRACTIONS' && (
          <AttractionsExplorer
            onAddToCart={refreshCartCount}
            onRequireLogin={() => setIsLoginOpen(true)}
            user={currentUser}
          />
        )}

        {activeTab === 'FERRY' && (
          <FerrySearch
            onAddToCart={refreshCartCount}
            onRequireLogin={() => setIsLoginOpen(true)}
            user={currentUser}
          />
        )}

        {activeTab === 'PASSES' && (
          <DigitalWallet
            user={currentUser}
            onRequireLogin={() => setIsLoginOpen(true)}
          />
        )}

        {activeTab === 'ADMIN' && (
          <AdminDashboard user={currentUser} />
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
        </div>
        <div className="max-w-7xl mx-auto border-t border-navy-700 mt-4 pt-3 text-[10.5px] text-slate-500">
          © 2026 Andaman &amp; Nicobar Administration. All rights reserved. Content owned and maintained by ANIIDCO.
        </div>
      </footer>

      <LoginModal
        isOpen={isLoginOpen}
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
    </div>
  );
}
