import React, { useState, useEffect } from 'react';
import API from '../api/client';
import { Wallet, PlusCircle, ArrowUpRight, ArrowDownLeft, RefreshCcw, ShieldAlert } from 'lucide-react';

const TXN_LABEL = {
  TOPUP: 'Wallet Top-up',
  DEBIT_PURCHASE: 'Booking Payment',
  CREDIT_REFUND: 'Refund Credit',
  ADMIN_ADJUSTMENT: 'Admin Adjustment',
};

const TXN_IS_CREDIT = { TOPUP: true, CREDIT_REFUND: true, DEBIT_PURCHASE: false, ADMIN_ADJUSTMENT: null };

const TOPUP_PRESETS = [500, 1000, 2000, 5000];

export function MyWallet({ user, onRequireLogin }) {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [topupAmount, setTopupAmount] = useState('500');
  const [topupLoading, setTopupLoading] = useState(false);

  useEffect(() => {
    if (user) fetchWallet();
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

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const res = await API.get('/wallet/transactions');
      setWallet({ balance: res.data.balance, status: res.data.status });
      setTransactions(res.data.transactions);
    } catch (err) {
      console.error('Failed to load wallet', err);
    } finally {
      setLoading(false);
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

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl font-black text-navy-800">My Wallet</h2>
          <p className="text-xs text-slate-500">Pre-loaded balance for faster checkout across attractions &amp; ferries</p>
        </div>
        <button
          onClick={fetchWallet}
          className="p-2 rounded-lg text-slate-400 hover:text-navy-800 hover:bg-slate-100 transition-colors"
          title="Refresh"
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Balance Card */}
      <div className="bg-navy-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-cyan-600/20"></div>
        <div className="relative">
          <span className="text-[11px] uppercase tracking-wider text-cyan-200 font-semibold">Available Balance</span>
          <div className="font-serif text-3xl font-black mt-1 font-mono">
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
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-navy-800 flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-cyan-700" /> Add Money
          </h3>
          <div className="flex flex-wrap gap-2">
            {TOPUP_PRESETS.map((amt) => (
              <button
                key={amt}
                onClick={() => setTopupAmount(String(amt))}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  String(amt) === topupAmount
                    ? 'bg-cyan-700 text-white border-cyan-700'
                    : 'bg-white text-slate-600 border-slate-300 hover:border-cyan-400'
                }`}
              >
                ₹{amt}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center bg-white border border-slate-300 rounded-lg px-3">
              <span className="text-slate-400 text-sm mr-1">₹</span>
              <input
                type="number"
                min="1"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
                className="w-full py-2.5 text-sm font-mono outline-none"
              />
            </div>
            <button
              disabled={topupLoading}
              onClick={handleTopup}
              className="px-5 py-2.5 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-lg text-xs shadow-md disabled:opacity-60"
            >
              {topupLoading ? 'Processing...' : 'Add Money'}
            </button>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-navy-800">Transaction History</h3>
        {loading ? (
          <div className="text-center py-10 text-slate-400 text-xs">Loading...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs bg-slate-50 border border-slate-200 rounded-xl">
            No transactions yet
          </div>
        ) : (
          <div className="divide-y divide-slate-100 bg-white border border-slate-200 rounded-2xl overflow-hidden">
            {transactions.map((t, idx) => {
              const isCredit = TXN_IS_CREDIT[t.txn_type];
              const Icon = isCredit === false ? ArrowUpRight : ArrowDownLeft;
              return (
                <div key={idx} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isCredit === false ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-navy-800">
                        {TXN_LABEL[t.txn_type] || t.txn_type}
                      </div>
                      <div className="text-[10px] text-slate-500">{t.description}</div>
                      <div className="text-[10px] text-slate-400">{new Date(t.created_at).toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-mono font-black ${isCredit === false ? 'text-red-600' : 'text-emerald-600'}`}>
                      {isCredit === false ? '-' : '+'}₹{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Bal: ₹{t.balance_after.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
