import React, { useState, useEffect } from 'react';
import API from '../api/client';
import { Wallet, PlusCircle, RefreshCcw, ShieldAlert } from 'lucide-react';
import { TransactionHistory, WalletInfoBar } from './wallet/WalletParts';

const TOPUP_PRESETS = [500, 1000, 2000, 5000];

export function MyWallet({ user, onRequireLogin }) {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [topupAmount, setTopupAmount] = useState('500');
  const [topupLoading, setTopupLoading] = useState(false);
  const [txnFilter, setTxnFilter] = useState('ALL');
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    if (user) fetchWallet();
  }, [user]);

  // Balance and history are live (refunds, payments and top-ups can land at any
  // time), so quietly re-read them every 30s and when the tab regains focus.
  useEffect(() => {
    if (!user) return undefined;
    const refresh = () => {
      if (document.visibilityState === 'visible') fetchWallet(true);
    };
    const timer = setInterval(refresh, 30000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [user]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, []);

  const fetchWallet = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await API.get('/wallet/transactions');
      setWallet({ balance: res.data.balance, status: res.data.status });
      setTransactions(res.data.transactions);
    } catch (err) {
      console.error('Failed to load wallet', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleTopup = async () => {
    const amount = parseFloat(topupAmount);
    if (!amount || amount <= 0) {
      alert('Enter a valid top-up amount');
      return;
    }

    setTopupLoading(true);
    try {
      const res = await API.post('/wallet/topup/create-order', { amount });
      const rzpData = res.data;

      const options = {
        key: rzpData.key_id,
        amount: rzpData.amount * 100,
        currency: 'INR',
        name: 'Andaman Tourism e-Wallet',
        description: 'Wallet Top-up',
        order_id: rzpData.order_id,
        handler: async function (response) {
          try {
            await API.post('/wallet/topup/confirm', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount,
            });
            fetchWallet();
          } catch (err) {
            alert(err.response?.data?.detail || 'Top-up confirmation failed');
          } finally {
            setTopupLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setTopupLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        alert('Payment failed: ' + response.error.description);
        setTopupLoading(false);
      });
      rzp.open();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to initiate top-up');
      setTopupLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-24 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
          <Wallet className="w-7 h-7" />
        </div>
        <p className="text-sm font-bold text-navy-800">Sign in to view your wallet</p>
        <button
          onClick={onRequireLogin}
          className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-sm shadow-md"
        >
          Login / Sign Up
        </button>
      </div>
    );
  }

  const isSuspended = wallet && wallet.status === 'SUSPENDED';
  const filteredTxns = txnFilter === 'ALL' ? transactions : transactions.filter((t) => t.txn_type === txnFilter);

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-2xl bg-white border border-cyan-200 text-cyan-700 flex items-center justify-center shadow-sm">
            <Wallet className="w-6 h-6" />
          </span>
          <div>
            <h2 className="font-serif text-3xl font-black text-navy-800 leading-tight">My Wallet</h2>
            <p className="text-sm text-slate-500">Pre-loaded balance for faster checkout across attractions &amp; ferries</p>
          </div>
        </div>
        <button
          onClick={() => fetchWallet()}
          className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-navy-800 flex items-center gap-2 shadow-sm transition-colors"
          title="Refresh"
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Balance
        </button>
      </div>

      {/* Balance Card */}
      <div className="rounded-2xl p-6 sm:p-7 text-white shadow-lg relative overflow-hidden bg-gradient-to-br from-navy-800 via-navy-700 to-cyan-800">
        <div className="absolute -right-10 -top-12 w-56 h-56 rounded-full bg-cyan-400/10"></div>
        <div className="absolute right-16 -bottom-16 w-48 h-48 rounded-full bg-cyan-300/10"></div>
        <Wallet className="absolute right-8 top-1/2 -translate-y-1/2 w-16 h-16 text-white/20 hidden sm:block" />
        <div className="relative">
          <span className="text-xs uppercase tracking-widest text-cyan-200 font-semibold">Available Balance</span>
          <div className="font-serif text-4xl sm:text-5xl font-black mt-1">
            ₹{(wallet?.balance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          {isSuspended && (
            <div className="mt-3 flex items-center gap-2 text-amber-300 text-xs font-bold bg-amber-900/30 border border-amber-500/40 rounded-lg px-3 py-2 w-fit">
              <ShieldAlert className="w-4 h-4" />
              This wallet is currently suspended
            </div>
          )}
        </div>
      </div>

      {/* Top-up */}
      {!isSuspended && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <PlusCircle className="w-5 h-5 text-cyan-700" />
            <h3 className="text-base font-bold text-navy-800">Add Money</h3>
            <span className="text-xs text-slate-500">Add funds to your wallet for quick and hassle-free bookings.</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {TOPUP_PRESETS.map((amt) => (
              <button
                key={amt}
                onClick={() => setTopupAmount(String(amt))}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-colors ${
                  String(amt) === topupAmount
                    ? 'bg-cyan-700 text-white border-cyan-700 shadow'
                    : 'bg-white text-navy-800 border-slate-300 hover:border-cyan-400'
                }`}
              >
                ₹{amt.toLocaleString('en-IN')}
              </button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center bg-white border border-slate-300 rounded-xl px-4 focus-within:border-cyan-500">
              <span className="text-slate-400 text-base mr-2">₹</span>
              <input
                type="number"
                min="1"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
                className="w-full py-3 text-base font-mono outline-none bg-transparent"
              />
            </div>
            <button
              disabled={topupLoading}
              onClick={handleTopup}
              className="px-8 py-3 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-xl text-sm shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <Wallet className="w-4 h-4" /> {topupLoading ? 'Processing...' : 'Add Money'}
            </button>
          </div>
        </div>
      )}

      <TransactionHistory
        loading={loading}
        transactions={filteredTxns}
        totalCount={transactions.length}
        filter={txnFilter}
        setFilter={(f) => { setTxnFilter(f); setVisibleCount(10); }}
        visibleCount={visibleCount}
        onShowMore={() => setVisibleCount((n) => n + 10)}
      />

      <WalletInfoBar />
    </div>
  );
}
