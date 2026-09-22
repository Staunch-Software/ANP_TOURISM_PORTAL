import React, { useState, useEffect, useCallback } from 'react';
import API from '../api/client';
import {
  Users2, Building2, MapPin, Calendar, Clock3, CheckCircle2,
  XCircle, AlertCircle, Hourglass, CreditCard, ArrowRight,
  RefreshCw, FileText, Ticket,
} from 'lucide-react';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_META = {
  PENDING_APPROVAL: {
    label: 'Pending Approval',
    icon: Hourglass,
    pill: 'bg-amber-50 text-amber-700 border-amber-200',
    banner: 'bg-amber-50 border-amber-200 text-amber-800',
    bannerMsg:
      'Your group booking request has been submitted and is awaiting ANIIDCO review. You will be notified once a decision is made.',
  },
  APPROVED: {
    label: 'Approved',
    icon: CheckCircle2,
    pill: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    banner: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    bannerMsg:
      'Your group booking has been approved! Complete payment below to receive your digital passes.',
  },
  REJECTED: {
    label: 'Rejected',
    icon: XCircle,
    pill: 'bg-red-50 text-red-700 border-red-200',
    banner: 'bg-red-50 border-red-200 text-red-800',
    bannerMsg: 'Your request was not approved by ANIIDCO.',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: XCircle,
    pill: 'bg-slate-100 text-slate-500 border-slate-200',
    banner: 'bg-slate-50 border-slate-200 text-slate-600',
    bannerMsg:
      'This group booking has been cancelled. If a payment was made, a refund will be processed to the original payment method.',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const meta = STATUS_META[status] || STATUS_META.PENDING_APPROVAL;
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-bold ${meta.pill}`}
    >
      <Icon className="w-3 h-3" />
      {meta.label}
    </span>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className="text-[11px] font-bold text-navy-800 text-right max-w-[60%] truncate">
        {value}
      </span>
    </div>
  );
}

// ─── Payment button ───────────────────────────────────────────────────────────
function PayNowButton({ booking, onPaymentSuccess }) {
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState(null);

  const handlePay = async () => {
    if (!booking.order_ref) {
      setError('No payment reference found. Please contact ANIIDCO.');
      return;
    }
    setPaying(true);
    setError(null);
    try {
      // RFP Page 26 — payment is processed after admin approval.
      // This portal uses a mock payment gateway (no real bank integration
      // in the demo build). mock_success: true simulates a successful payment.
      await API.post('/payments/confirm', {
        order_ref: booking.order_ref,
        mock_success: true,
      });
      setPaid(true);
      onPaymentSuccess();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Payment failed. Please try again or contact ANIIDCO.'
      );
    } finally {
      setPaying(false);
    }
  };

  if (paid) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
        <CheckCircle2 className="w-4 h-4" /> Payment Successful — Passes issued!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-[11px] text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
        </p>
      )}
      <button
        onClick={handlePay}
        disabled={paying}
        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs shadow-sm disabled:opacity-60 transition-all"
      >
        <CreditCard className="w-3.5 h-3.5" />
        {paying ? 'Processing Payment…' : 'Pay Now & Get Passes'}
      </button>
    </div>
  );
}

// ─── Single booking card ──────────────────────────────────────────────────────
function BookingCard({ booking, onPaymentSuccess, onViewPasses }) {
  const meta = STATUS_META[booking.status] || STATUS_META.PENDING_APPROVAL;

  // An APPROVED booking whose order has been paid shows "View Passes" rather
  // than a "Pay Now" button. We infer payment from whether the backend has
  // already confirmed the order (it returns order_ref once approved; the
  // payment endpoint flips the order to CONFIRMED and issues tickets).
  // We use a local `paid` state that also gets set when PayNowButton succeeds.
  const [localPaid, setLocalPaid] = useState(false);
  const handlePaymentSuccess = () => {
    setLocalPaid(true);
    onPaymentSuccess();
  };

  const showPayNow =
    booking.status === 'APPROVED' && booking.order_ref && !localPaid;
  const showViewPasses = booking.status === 'APPROVED' && localPaid;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="bg-navy-800 px-5 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Users2 className="w-4 h-4 text-cyan-300 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-black text-white truncate">
              {booking.organization_name}
            </p>
            <p className="text-[10px] text-slate-400">
              {booking.organization_type?.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
        <StatusPill status={booking.status} />
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        {/* Status banner */}
        <div
          className={`p-3 rounded-xl border text-[11px] leading-relaxed flex items-start gap-2 ${meta.banner}`}
        >
          <meta.icon className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{meta.bannerMsg}</span>
        </div>

        {/* Admin notes for rejected/cancelled */}
        {(booking.status === 'REJECTED' || booking.status === 'CANCELLED') &&
          booking.admin_notes && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600">
              <span className="font-bold text-slate-700">ANIIDCO Note: </span>
              {booking.admin_notes}
            </div>
          )}

        {/* Details grid */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 space-y-0.5">
          <InfoRow
            label={
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3" /> Reference
              </span>
            }
            value={
              <span className="font-mono font-black text-cyan-700">
                {booking.request_ref}
              </span>
            }
          />
          <InfoRow
            label={
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Attraction
              </span>
            }
            value={booking.attraction_title}
          />
          <InfoRow
            label={
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Date
              </span>
            }
            value={booking.slot_date}
          />
          <InfoRow
            label={
              <span className="flex items-center gap-1">
                <Clock3 className="w-3 h-3" /> Slot
              </span>
            }
            value={`${booking.start_time} – ${booking.end_time}`}
          />
          <InfoRow
            label={
              <span className="flex items-center gap-1">
                <Users2 className="w-3 h-3" /> Headcount
              </span>
            }
            value={`${booking.total_headcount} total (${booking.indian_travelers_count} Indian / ${booking.foreign_travelers_count} Foreign)`}
          />
          <InfoRow
            label={
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3" /> Contact
              </span>
            }
            value={`${booking.contact_person} · ${booking.contact_phone}`}
          />
          {booking.order_ref && (
            <InfoRow
              label="Order Ref"
              value={
                <span className="font-mono text-navy-800">
                  {booking.order_ref}
                </span>
              }
            />
          )}
          <InfoRow
            label="Submitted On"
            value={new Date(booking.created_at).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          />
        </div>

        {/* Action zone */}
        {showPayNow && (
          <PayNowButton
            booking={booking}
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}

        {showViewPasses && (
          <button
            onClick={onViewPasses}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-lg text-xs shadow-sm transition-all"
          >
            <Ticket className="w-3.5 h-3.5" />
            View Digital Passes
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function MyGroupBookings({
  user,
  onRequireLogin,
  onOpenGroupBooking,
  onViewPasses,
}) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get('/group-bookings/my-requests');
      setBookings(res.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Could not load your group booking requests. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchBookings();
  }, [user, fetchBookings]);

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto my-12 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center justify-center mx-auto mb-4">
          <Users2 className="w-7 h-7" />
        </div>
        <h3 className="font-serif text-lg font-black text-navy-800">
          Sign In to View Your Requests
        </h3>
        <p className="text-xs text-slate-500 mt-1 mb-6 max-w-xs mx-auto">
          Log in to track your group booking submissions and manage approvals
          from ANIIDCO.
        </p>
        <button
          onClick={onRequireLogin}
          className="w-full py-2.5 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-lg text-xs shadow-md"
        >
          Sign In
        </button>
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin" />
        <span className="text-xs font-semibold">
          Loading your group bookings…
        </span>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-md mx-auto my-12">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
        <p className="text-sm font-bold text-red-700">{error}</p>
        <button
          onClick={fetchBookings}
          className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-lg text-xs"
        >
          Try Again
        </button>
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (bookings.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto my-12 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center justify-center mx-auto mb-4">
          <Users2 className="w-7 h-7" />
        </div>
        <h3 className="font-serif text-lg font-black text-navy-800">
          No Group Bookings Yet
        </h3>
        <p className="text-xs text-slate-500 mt-1 mb-6 max-w-xs mx-auto">
          You haven't submitted any group booking requests. Group bookings are
          available for schools, colleges, corporates, and tour operators.
        </p>
        <button
          onClick={onOpenGroupBooking}
          className="w-full py-2.5 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-lg text-xs shadow-md flex items-center justify-center gap-2"
        >
          <Users2 className="w-3.5 h-3.5" />
          Start a Group Booking
        </button>
      </div>
    );
  }

  // ── Full list ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-700">
            Group / Institutional
          </span>
          <h2 className="font-serif text-xl md:text-2xl font-black text-navy-800">
            My Group Booking Requests
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track the status of your group applications submitted to ANIIDCO.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchBookings}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenGroupBooking}
            className="px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-xl text-xs shadow-sm whitespace-nowrap"
          >
            + New Request
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Total Requests',
            value: bookings.length,
            color: 'text-navy-800',
          },
          {
            label: 'Pending Approval',
            value: bookings.filter((b) => b.status === 'PENDING_APPROVAL')
              .length,
            color: 'text-amber-600',
          },
          {
            label: 'Approved',
            value: bookings.filter((b) => b.status === 'APPROVED').length,
            color: 'text-emerald-600',
          },
          {
            label: 'Rejected / Cancelled',
            value: bookings.filter(
              (b) => b.status === 'REJECTED' || b.status === 'CANCELLED'
            ).length,
            color: 'text-red-500',
          },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm"
          >
            <div className={`text-xl font-black font-mono ${color}`}>
              {value}
            </div>
            <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {bookings.map((booking) => (
          <BookingCard
            key={booking.id}
            booking={booking}
            onPaymentSuccess={fetchBookings}
            onViewPasses={onViewPasses}
          />
        ))}
      </div>

      {/* RFP Page 26 Clause II note */}
      <p className="text-[10px] text-slate-400 text-center pb-4">
        Group booking requests are reviewed by ANIIDCO as per RFP Page 26,
        Clause III. Approved bookings require payment before digital passes are
        issued. For queries, contact{' '}
        <span className="font-bold">aniidco@gmail.com</span>.
      </p>
    </div>
  );
}
