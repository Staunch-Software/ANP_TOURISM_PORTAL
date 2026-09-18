import React, { useState, useEffect } from 'react';
import API from '../api/client';
import {
  ShoppingBag, X, Trash2, Clock, ShieldCheck,
  CreditCard, QrCode, ArrowRight, CheckCircle2, Building, Ship, Landmark
} from 'lucide-react';

const ITEM_TYPE_ICON = { FERRY: Ship, ATTRACTION: Landmark };

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

  useEffect(() => {
    if (isOpen) {
      fetchCart();
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

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await API.get('/cart');
      setCart(res.data);
      setCountdown(res.data.expires_in_seconds || 0);
    } catch (err) {
      setCart(null);
    } finally {
      setLoading(false);
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
    } catch (err) {
      alert(err.response?.data?.detail || "Checkout failed. Your session may have expired.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    setPaying(true);
    try {
      await API.post('/payments/confirm', {
        order_ref: activeOrder.order_ref,
        payment_method: paymentMethod,
        mock_success: true
      });

      setPaymentSuccess(true);
      if (onCartUpdated) onCartUpdated();

      setTimeout(() => {
        setPaymentSuccess(false);
        setActiveOrder(null);
        onClose();
        if (onOrderConfirmed) onOrderConfirmed();
      }, 2000);
    } catch (err) {
      alert(err.response?.data?.detail || "Payment processing failed");
    } finally {
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
                  <span className="text-sm font-black text-navy-800">
                    ₹{item.price.toLocaleString('en-IN')}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-navy-800 pr-2">{item.title}</h4>
                <p className="text-xs font-mono text-cyan-700">{item.slot_or_seat}</p>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Passenger: <strong className="text-slate-700">{item.passenger_name}</strong></span>
                  <span className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded text-slate-500 border border-slate-200">
                    {item.id_type}: •••• {item.id_number.slice(-4)}
                  </span>
                </div>
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
                    onClick={() => setActiveOrder(null)}
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

                {/* Payment Method Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl mb-4 text-xs font-bold">
                  <button
                    onClick={() => setPaymentMethod('UPI')}
                    className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'UPI' ? 'bg-navy-800 text-white shadow' : 'text-slate-500 hover:text-navy-800'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" /> Instant UPI QR
                  </button>
                  <button
                    onClick={() => setPaymentMethod('CARD')}
                    className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'CARD' ? 'bg-navy-800 text-white shadow' : 'text-slate-500 hover:text-navy-800'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" /> Cards
                  </button>
                  <button
                    onClick={() => setPaymentMethod('NETBANKING')}
                    className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'NETBANKING' ? 'bg-navy-800 text-white shadow' : 'text-slate-500 hover:text-navy-800'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5" /> Net Banking
                  </button>
                </div>

                {/* Payment Method Content */}
                {paymentMethod === 'UPI' && (
                  <div className="text-center py-3 space-y-3">
                    <div className="w-44 h-44 bg-white p-3 rounded-2xl mx-auto shadow-inner flex flex-col items-center justify-center border-4 border-slate-100">
                      <div className="w-full h-full bg-navy-800 rounded-lg flex flex-col items-center justify-center p-2 text-white text-center">
                        <QrCode className="w-20 h-20 text-cyan-300" />
                        <span className="text-[10px] font-mono text-slate-300 mt-1">Scan via any UPI App</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500">GPay • PhonePe • Paytm • BHIM</p>
                  </div>
                )}

                {paymentMethod === 'CARD' && (
                  <div className="space-y-3 py-2">
                    <input
                      type="text"
                      placeholder="Card Number (4532 •••• •••• ••••)"
                      defaultValue="4532 8812 9012 3341"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800 font-mono"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="MM / YY"
                        defaultValue="12/28"
                        className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800 font-mono"
                      />
                      <input
                        type="password"
                        placeholder="CVV"
                        defaultValue="921"
                        maxLength="3"
                        className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800 font-mono"
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'NETBANKING' && (
                  <div className="py-2 space-y-2">
                    {['State Bank of India (SBI)', 'HDFC Bank', 'ICICI Bank', 'Axis Bank'].map((bank, i) => (
                      <label key={bank} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-navy-800 cursor-pointer hover:border-cyan-400">
                        <input type="radio" name="bank" defaultChecked={i === 0} className="text-cyan-600" />
                        <span>{bank}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Confirm Payment Button */}
                <button
                  type="button"
                  disabled={paying}
                  onClick={handleConfirmPayment}
                  className="w-full py-3 mt-4 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs shadow-md flex items-center justify-center gap-2 transition-all"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {paying ? 'Verifying with Bank...' : `Pay ₹${activeOrder.net_payable.toLocaleString('en-IN')} & Issue Passes`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
