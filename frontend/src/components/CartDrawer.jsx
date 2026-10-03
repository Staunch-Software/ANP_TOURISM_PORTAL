import React, { useState, useEffect } from 'react';
import API from '../api/client';
import {
  ShoppingBag, X, Trash2, Clock, ShieldCheck,
  CreditCard, QrCode, ArrowRight, CheckCircle2, Building, Ship, Landmark, Wallet, Plus
} from 'lucide-react';

const ITEM_TYPE_ICON = { FERRY: Ship, ATTRACTION: Landmark };

// Fields for the "+" (add another ticket for this slot) form. Indian visitors
// identify with Aadhaar / Voter ID, foreign nationals with a passport --
// the same rule the booking form uses.
const ID_TYPES = {
  INDIAN: [['AADHAAR', 'Aadhaar'], ['VOTER_ID', 'Voter ID']],
  FOREIGN: [['PASSPORT', 'Passport']],
};
const EMPTY_TICKET = { name: '', age: '', gender: 'MALE', nationality: 'INDIAN', id_type: 'AADHAAR', id_number: '' };
const ticketInputCls = 'w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800 focus:border-cyan-500 focus:outline-none';

export function CartDrawer({ isOpen, onClose, onCartUpdated, onOrderConfirmed }) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [countdown, setCountdown] = useState(null);

  // Payment Modal State
  const [activeOrder, setActiveOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paying, setPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [walletBalance, setWalletBalance] = useState(null);

  // "+" add-another-ticket form: which cart item it's open on, its fields,
  // and the last error from the server (slot full, headcount cap, ...).
  const [addingFor, setAddingFor] = useState(null);
  const [newTicket, setNewTicket] = useState(EMPTY_TICKET);
  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  // Visitors from earlier bookings, offered in the "+" form (RFP p.25).
  const [savedVisitors, setSavedVisitors] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchCart();
    } else {
      setAddingFor(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!countdown || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchCart();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // silent: refresh in place without swapping the list for the "Loading"
  // placeholder (used after adding a ticket so the drawer doesn't flicker).
  const fetchCart = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const res = await API.get('/cart');
      setCart(res.data);
      setCountdown(res.data.expires_in_seconds || 0);
    } catch (err) {
      setCart(null);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const toggleAddTicket = (item) => {
    if (addingFor === item.cart_item_id) {
      setAddingFor(null);
      return;
    }
    setNewTicket(EMPTY_TICKET);
    setAddError(null);
    setAddingFor(item.cart_item_id);
    API.get('/cart/saved-visitors')
      .then((res) => setSavedVisitors(res.data))
      .catch(() => setSavedVisitors([]));
  };

  const savedKey = (v) => `${v.id_type}:${v.id_number}`;

  const fillFromSaved = (key) => {
    const v = savedVisitors.find((x) => savedKey(x) === key);
    if (!v) return;
    setNewTicket({
      name: v.name,
      age: v.age == null ? '' : String(v.age),
      gender: v.gender || 'MALE',
      nationality: v.nationality,
      id_type: v.id_type,
      id_number: v.id_number,
    });
  };

  // Remove just this one ticket and release only its seat hold.
  const removeTicket = async (item) => {
    setRemovingId(item.cart_item_id);
    try {
      await API.delete(`/cart/items/${item.cart_item_id}`);
      if (addingFor === item.cart_item_id) setAddingFor(null);
      await fetchCart({ silent: true });
      if (onCartUpdated) onCartUpdated();
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not remove the ticket');
      await fetchCart({ silent: true });
    } finally {
      setRemovingId(null);
    }
  };

  const setTicketNationality = (nationality) =>
    setNewTicket((t) => ({ ...t, nationality, id_type: ID_TYPES[nationality][0][0] }));

  const submitAddTicket = async (e, item) => {
    e.preventDefault();
    const age = parseInt(newTicket.age, 10);
    if (Number.isNaN(age) || age < 0 || age > 120) {
      setAddError('Enter a valid age between 0 and 120.');
      return;
    }
    setAddBusy(true);
    setAddError(null);
    try {
      await API.post('/cart/add-attraction', {
        slot_id: item.slot_id,
        nationality: newTicket.nationality,
        passenger: {
          name: newTicket.name.trim(),
          age,
          gender: newTicket.gender,
          id_type: newTicket.id_type,
          id_number: newTicket.id_number.trim(),
        },
      });
      setAddingFor(null);
      await fetchCart({ silent: true });
      if (onCartUpdated) onCartUpdated();
    } catch (err) {
      setAddError(err.response?.data?.detail || 'Could not add the ticket. Please try again.');
    } finally {
      setAddBusy(false);
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm("Are you sure you want to empty your cart? All held seats and slots will be released.")) return;
    try {
      await API.delete('/cart/clear');
      fetchCart();
      if (onCartUpdated) onCartUpdated();
    } catch (err) {
      alert("Failed to clear cart");
    }
  };

  const handleProceedToCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const res = await API.post('/cart/checkout');
      setActiveOrder(res.data);
      try {
        const walletRes = await API.get('/wallet/me');
        setWalletBalance(walletRes.data.status === 'ACTIVE' ? walletRes.data.balance : null);
      } catch {
        setWalletBalance(null);
      }
    } catch (err) {
      alert(err.response?.data?.detail || "Checkout failed. Your session may have expired.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handlePayWithWallet = async () => {
    setPaying(true);
    try {
      await API.post('/wallet/pay', { order_ref: activeOrder.order_ref });
      setPaymentSuccess(true);
      if (onCartUpdated) onCartUpdated();

      setTimeout(() => {
        setPaymentSuccess(false);
        setActiveOrder(null);
        onClose();
        if (onOrderConfirmed) onOrderConfirmed();
      }, 3000);
    } catch (err) {
      alert(err.response?.data?.detail || "Wallet payment failed");
    } finally {
      setPaying(false);
    }
  };

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const launchRazorpay = async (method) => {
    setPaying(true);
    try {
      // Create Razorpay Order via Backend
      const res = await API.post('/payments/create-order', {
        order_ref: activeOrder.order_ref
      });
      const rzpData = res.data;

      const options = {
        key: rzpData.key_id,
        amount: rzpData.amount * 100, // paise
        currency: "INR", // STRICTLY INR FOR UPI
        name: "Andaman Tourism",
        description: `Order #${activeOrder.order_ref}`,
        order_id: rzpData.order_id,
        prefill: {
          method: method, // 'upi', 'card', 'netbanking'
          contact: "9999999999",
          email: "tourist@andaman.gov.in"
        },
        handler: async function (response) {
          try {
            await API.post('/payments/confirm', {
              order_ref: activeOrder.order_ref,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            setPaymentSuccess(true);
            if (onCartUpdated) onCartUpdated();
            
            setTimeout(() => {
              setPaymentSuccess(false);
              setActiveOrder(null);
              onClose();
              if (onOrderConfirmed) onOrderConfirmed();
            }, 3000);
          } catch (err) {
            alert(err.response?.data?.detail || "Payment verification failed");
          }
        },
        modal: {
          ondismiss: function() {
            setPaying(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
        alert("Payment failed: " + response.error.description);
        setPaying(false);
      });
      rzp.open();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to initialize payment");
      setPaying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-navy-900/60 backdrop-blur-sm flex justify-end">
      {/* Slide-over Drawer Panel */}
      <div className="w-full max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col h-full">

        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-extrabold text-navy-800">Your Trip Cart</h3>
              <p className="text-[11px] text-slate-500">Single-Window Unified Reservation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-navy-800 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lock Expiry Countdown Banner */}
        {countdown > 0 && cart?.items?.length > 0 && (
          <div className="bg-cyan-50 border-b border-cyan-100 px-5 py-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-cyan-800">
              <Clock className="w-4 h-4 text-cyan-600" />
              <span>Inventory Lock:</span>
            </div>
            <span className="font-mono font-black text-cyan-800 tracking-wider">
              {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')} min
            </span>
          </div>
        )}

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
          {loading ? (
            <div className="text-center py-16 text-slate-400 text-xs">Loading reserved items...</div>
          ) : !cart || cart.items.length === 0 ? (
            <div className="text-center py-20 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-navy-800">Your trip cart is empty</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Explore historical monuments, coral reef diving, or inter-island ferries to bundle tickets into one reservation.
              </p>
            </div>
          ) : (
            cart.items.map((item) => {
              const TypeIcon = ITEM_TYPE_ICON[item.item_type] || ShoppingBag;
              return (
              <div
                key={item.cart_item_id}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 relative group hover:border-cyan-300 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-white text-cyan-700 border border-cyan-200 flex items-center gap-1.5 w-fit">
                    <TypeIcon className="w-3 h-3" /> {item.item_type}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-navy-800">
                      ₹{item.price.toLocaleString('en-IN')}
                    </span>
                    {item.item_type === 'ATTRACTION' && item.slot_id && (
                      <button
                        type="button"
                        onClick={() => toggleAddTicket(item)}
                        aria-label={`Add another ticket for ${item.title}`}
                        aria-expanded={addingFor === item.cart_item_id}
                        title={addingFor === item.cart_item_id ? 'Cancel' : 'Add another ticket for this slot'}
                        className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                          addingFor === item.cart_item_id
                            ? 'bg-cyan-700 border-cyan-700 text-white'
                            : 'bg-white border-cyan-300 text-cyan-700 hover:bg-cyan-700 hover:text-white'
                        }`}
                      >
                        {addingFor === item.cart_item_id ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeTicket(item)}
                      disabled={removingId === item.cart_item_id}
                      aria-label={`Remove ${item.passenger_name}'s ticket for ${item.title}`}
                      title="Remove this ticket"
                      className="w-6 h-6 rounded-full border border-slate-200 bg-white text-slate-400 hover:bg-red-50 hover:border-red-300 hover:text-red-600 flex items-center justify-center transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-navy-800 pr-2">{item.title}</h4>
                <p className="text-xs font-mono text-cyan-700">{item.slot_or_seat}</p>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Passenger: <strong className="text-slate-700">{item.passenger_name}</strong></span>
                  <span className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded text-slate-500 border border-slate-200">
                    {item.id_type}: •••• {item.id_number.slice(-4)}
                  </span>
                </div>

                {addingFor === item.cart_item_id && (
                  <form
                    onSubmit={(e) => submitAddTicket(e, item)}
                    className="pt-3 mt-1 border-t border-dashed border-cyan-300 space-y-2.5"
                  >
                    <p className="text-[11px] font-bold text-slate-600">Another ticket for this same slot</p>

                    {addError && (
                      <div role="alert" className="px-2.5 py-1.5 bg-red-50 border border-red-200 text-red-700 text-[11px] rounded-lg">
                        {addError}
                      </div>
                    )}

                    {(() => {
                      // previous visitors who are not already holding a ticket for this slot
                      const options = savedVisitors.filter(
                        (v) => !cart.items.some((i) => i.slot_id === item.slot_id && (i.id_number || '').toUpperCase() === v.id_number.toUpperCase())
                      );
                      if (options.length === 0) return null;
                      return (
                        <select
                          value=""
                          onChange={(e) => fillFromSaved(e.target.value)}
                          aria-label="Fill from a previous visitor"
                          className={ticketInputCls}
                        >
                          <option value="">Fill from a previous visitor…</option>
                          {options.map((v) => (
                            <option key={savedKey(v)} value={savedKey(v)}>
                              {v.name} · {v.id_type.replace('_', ' ')} ••••{v.id_number.slice(-4)}
                            </option>
                          ))}
                        </select>
                      );
                    })()}

                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="Full name as on ID"
                      value={newTicket.name}
                      onChange={(e) => setNewTicket({ ...newTicket, name: e.target.value })}
                      className={ticketInputCls}
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        required
                        min="0"
                        max="120"
                        placeholder="Age"
                        value={newTicket.age}
                        onChange={(e) => setNewTicket({ ...newTicket, age: e.target.value })}
                        className={ticketInputCls}
                      />
                      <select
                        value={newTicket.gender}
                        onChange={(e) => setNewTicket({ ...newTicket, gender: e.target.value })}
                        className={ticketInputCls}
                        aria-label="Gender"
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    <div className="flex bg-white border border-slate-300 rounded-lg p-0.5 text-[11px] font-bold" role="group" aria-label="Nationality">
                      {['INDIAN', 'FOREIGN'].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setTicketNationality(n)}
                          className={`flex-1 py-1.5 rounded-md transition-colors ${
                            newTicket.nationality === n ? 'bg-navy-800 text-white' : 'text-slate-500 hover:text-navy-800'
                          }`}
                        >
                          {n === 'INDIAN' ? 'Indian citizen' : 'Foreign national'}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={newTicket.id_type}
                        onChange={(e) => setNewTicket({ ...newTicket, id_type: e.target.value })}
                        disabled={ID_TYPES[newTicket.nationality].length === 1}
                        className={ticketInputCls}
                        aria-label="ID type"
                      >
                        {ID_TYPES[newTicket.nationality].map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        required
                        placeholder={newTicket.id_type === 'PASSPORT' ? 'Passport number' : 'ID number'}
                        value={newTicket.id_number}
                        onChange={(e) => setNewTicket({ ...newTicket, id_number: e.target.value })}
                        className={ticketInputCls}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={addBusy}
                      className="w-full py-2 bg-cyan-700 hover:bg-cyan-600 disabled:opacity-60 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> {addBusy ? 'Adding...' : 'Add ticket'}
                    </button>
                  </form>
                )}
              </div>
              );
            })
          )}
        </div>

        {/* Footer & Checkout Area */}
        {cart && cart.items.length > 0 && (
          <div className="p-5 border-t border-slate-100 bg-slate-50 space-y-4">
            {/* Price Calculations */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal ({cart.items.length} item{cart.items.length > 1 ? 's' : ''})</span>
                <span className="font-mono">₹{cart.gross_amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>GST (5% Tourism Cess)</span>
                <span className="font-mono">₹{cart.gst_tax_amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-base font-black text-navy-800 pt-2 border-t border-slate-200">
                <span>Total Amount Payable</span>
                <span className="text-cyan-700 font-mono">₹{cart.net_payable.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClearCart}
                className="px-3 py-3 rounded-xl border border-slate-300 hover:bg-red-50 hover:border-red-300 text-slate-500 hover:text-red-600 transition-colors"
                title="Release all holds"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                disabled={checkoutLoading}
                onClick={handleProceedToCheckout}
                className="flex-1 py-3 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-xl text-xs shadow-md flex items-center justify-center gap-2 transition-all"
              >
                {checkoutLoading ? 'Preparing Order...' : 'Proceed to Payment'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Payment Gateway Modal */}
      {activeOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-navy-900/70 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">

            {paymentSuccess ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-xl font-black text-navy-800">Payment Confirmed!</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  A single tamper-proof Ed25519 Unified QR pass covering every item in this order has been generated.
                </p>
                <div className="font-mono text-xs text-cyan-700 font-bold">
                  Order Ref: {activeOrder.order_ref}
                </div>
              </div>
            ) : (
              <div>
                {/* Modal Header */}
                <div className="flex justify-between items-start pb-3 border-b border-slate-100 mb-4">
                  <div>
                    <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-widest">
                      Official Payment Gateway
                    </span>
                    <h3 className="font-serif text-base font-extrabold text-navy-800">
                      Order #{activeOrder.order_ref}
                    </h3>
                  </div>
                  <button
                    onClick={() => { setActiveOrder(null); setWalletBalance(null); }}
                    className="text-slate-400 hover:text-navy-800 p-1 text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                {/* Amount Display */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center mb-4">
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Net Payable</span>
                  <span className="font-serif text-2xl font-black text-cyan-700 font-mono">
                    ₹{activeOrder.net_payable.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Payment Method Action Buttons */}
                <div className="space-y-3 py-2 text-xs font-bold">
                  {walletBalance !== null && (
                    <button
                      disabled={paying || walletBalance < activeOrder.net_payable}
                      onClick={handlePayWithWallet}
                      className="w-full p-4 rounded-xl flex items-center justify-between border hover:border-emerald-500 hover:bg-emerald-50 transition-all text-navy-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:bg-transparent"
                    >
                      <div className="flex items-center gap-3">
                        <Wallet className="w-5 h-5 text-emerald-600" />
                        <div className="text-left">
                          <span className="text-sm block">Pay from Wallet</span>
                          <span className="text-[10px] font-normal text-slate-500">
                            Balance: ₹{walletBalance.toLocaleString('en-IN')}
                            {walletBalance < activeOrder.net_payable ? ' (insufficient)' : ''}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </button>
                  )}

                  <button
                    disabled={paying}
                    onClick={() => launchRazorpay('upi')}
                    className="w-full p-4 rounded-xl flex items-center justify-between border hover:border-cyan-500 hover:bg-cyan-50 transition-all text-navy-800"
                  >
                    <div className="flex items-center gap-3">
                      <QrCode className="w-5 h-5 text-cyan-600" />
                      <span className="text-sm">Pay via UPI (QR / Intent)</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    disabled={paying}
                    onClick={() => launchRazorpay('card')}
                    className="w-full p-4 rounded-xl flex items-center justify-between border hover:border-cyan-500 hover:bg-cyan-50 transition-all text-navy-800"
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-cyan-600" />
                      <span className="text-sm">Pay via Cards (Credit/Debit)</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    disabled={paying}
                    onClick={() => launchRazorpay('netbanking')}
                    className="w-full p-4 rounded-xl flex items-center justify-between border hover:border-cyan-500 hover:bg-cyan-50 transition-all text-navy-800"
                  >
                    <div className="flex items-center gap-3">
                      <Building className="w-5 h-5 text-cyan-600" />
                      <span className="text-sm">Pay via Netbanking</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

