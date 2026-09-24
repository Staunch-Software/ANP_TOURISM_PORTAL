import React, { useState, useEffect } from 'react';
import API from '../api/client';
import { QRCodeSVG } from 'qrcode.react';
import {
  Ticket, ShieldCheck, CheckCircle2, XCircle, Printer, RefreshCw, Ship, Landmark, Sparkles, CalendarClock
} from 'lucide-react';

const ITEM_TYPE_ICON = { FERRY: Ship, ATTRACTION: Landmark };

export function DigitalWallet({ user, onRequireLogin }) {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeVerification, setActiveVerification] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [upgrading, setUpgrading] = useState(null); // ticket_ref currently being upgraded
  const [rescheduleTicket, setRescheduleTicket] = useState(null); // entitlement being rescheduled
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [rescheduleSlotId, setRescheduleSlotId] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleLoadingSlots, setRescheduleLoadingSlots] = useState(false);
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPasses();
    }
  }, [user]);

  const fetchPasses = async () => {
    setLoading(true);
    try {
      const res = await API.get('/tickets/my-passes');
      setPasses(res.data);
    } catch (err) {
      console.error("Failed to load passes", err);
      setPasses([]);
    } finally {
      setLoading(false);
    }
  };

  
  const handleCancelBooking = async (bookingRef) => {
    if (!window.confirm("Are you sure you want to cancel this booking? A 50% penalty will be deducted from your refund.")) return;
    try {
      const res = await API.post(`/tickets/${bookingRef}/cancel`);
      alert(res.data.message);
      fetchPasses();
    } catch (err) {
      alert(err.response?.data?.detail || "Cancellation failed");
    }
  };

  const handleSimulateTurnstileScan = async (passRef) => {
    setVerifying(true);
    try {
      const res = await API.get(`/tickets/${passRef}/verify-offline`);
      setActiveVerification(res.data);
    } catch (err) {
      alert("Verification failed or pass reference not found");
    } finally {
      setVerifying(false);
    }
  };

  const handleUpgradeToExpress = async (ticketRef) => {
    if (!window.confirm("Upgrade this ticket to Express? You will be charged the price difference immediately.")) return;
    setUpgrading(ticketRef);
    try {
      const res = await API.post(`/tickets/${ticketRef}/upgrade-to-express`);
      alert(res.data.message);
      fetchPasses();
    } catch (err) {
      alert(err.response?.data?.detail || "Upgrade failed");
    } finally {
      setUpgrading(null);
    }
  };

  const openRescheduleModal = (ent) => {
    setRescheduleTicket(ent);
    setRescheduleDate('');
    setRescheduleSlots([]);
    setRescheduleSlotId('');
    setRescheduleReason('');
  };

  const loadRescheduleSlots = async (dateStr) => {
    setRescheduleDate(dateStr);
    setRescheduleSlotId('');
    setRescheduleSlots([]);
    if (!dateStr || !rescheduleTicket) return;
    setRescheduleLoadingSlots(true);
    try {
      const res = await API.get(`/tickets/${rescheduleTicket.ticket_ref}/reschedule-options`, { params: { date: dateStr } });
      setRescheduleSlots(res.data);
    } catch (err) {
      alert(err.response?.data?.detail || "Could not load slots for that date");
    } finally {
      setRescheduleLoadingSlots(false);
    }
  };

  const submitRescheduleRequest = async () => {
    if (!rescheduleSlotId) return alert("Pick a time slot first");
    if (!rescheduleReason.trim()) return alert("Please give a reason for the reschedule");
    setRescheduleSubmitting(true);
    try {
      await API.post(`/tickets/${rescheduleTicket.ticket_ref}/reschedule-request`, {
        requested_slot_id: rescheduleSlotId,
        reason: rescheduleReason.trim(),
      });
      alert("Reschedule request submitted. A staff member will review it shortly.");
      setRescheduleTicket(null);
    } catch (err) {
      alert(err.response?.data?.detail || "Could not submit reschedule request");
    } finally {
      setRescheduleSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto my-12 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center justify-center mx-auto mb-4">
          <Ticket className="w-7 h-7" />
        </div>
        <h3 className="font-serif text-lg font-black text-navy-800">Sign In to View Passes</h3>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          Access your digital wallet to view confirmed boarding passes and turnstile QR tokens.
        </p>
        <button
          onClick={onRequireLogin}
          className="w-full py-2.5 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-lg text-xs shadow-md"
        >
          Sign In (2FA OTP)
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Ed25519 Cryptographically Signed Â· Unified QR per Order
          </div>
          <h2 className="font-serif text-2xl font-black text-navy-800">Official Digital Pass Wallet</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            One QR code per booking covers every attraction and ferry seat in that order â€” each gate checks off only its own entry.
          </p>
        </div>

        <button
          onClick={fetchPasses}
          disabled={loading}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-bold text-navy-800 flex items-center gap-2 transition-all self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Wallet
        </button>
      </div>

      {/* Passes List */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 text-xs">Loading confirmed passes...</div>
      ) : passes.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
          <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="font-serif text-base font-bold text-navy-800">No active passes found</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Book an attraction slot or inter-island ferry seat to generate your digital boarding pass.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {passes.map((pass) => (
            <div
              key={pass.booking_ref}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between relative group hover:border-cyan-400 transition-all"
            >
              {/* Official Pass Header */}
              <div className="bg-slate-50 p-5 border-b border-slate-100 flex justify-between items-start">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-cyan-50 text-cyan-700 border border-cyan-200 w-fit block">
                    UNIFIED BOARDING PASS
                  </span>
                  <h3 className="font-serif text-base font-black text-navy-800 mt-1.5">{pass.lead_passenger_name}</h3>
                  <span className="text-xs text-slate-500 font-mono">{pass.entitlements.length} entitlement(s) Â· Order {pass.order_ref}</span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Pass Ref</span>
                  <span className="font-mono text-xs font-black text-cyan-700">{pass.booking_ref}</span>
                </div>
              </div>

              {/* Pass Mid Section: One QR Code covering the whole order */}
              <div className="p-6 flex flex-col sm:flex-row items-center gap-6">
                <div className="bg-white p-3 rounded-2xl shadow-inner border-2 border-slate-200 flex-shrink-0">
                  <QRCodeSVG
                    value={pass.qr_token}
                    size={130}
                    level="M"
                    includeMargin={false}
                  />
                  <span className="text-[9px] font-mono text-navy-800 font-bold block text-center mt-1">
                    OFFLINE VERIFIABLE
                  </span>
                </div>

                {/* Entitlements bundled under this one signed pass */}
                <div className="flex-1 space-y-2 w-full">
                  {pass.entitlements.map((ent) => {
                    const TypeIcon = ITEM_TYPE_ICON[ent.item_type] || Ticket;
                    const isCheckedIn = ent.check_in_status === 'CHECKED_IN';
                    const canModify = ent.item_type === 'ATTRACTION' && ent.check_in_status === 'ISSUED';
                    const isExpress = ent.ticket_tier === 'EXPRESS';
                    return (
                      <div key={ent.ticket_ref} className="border-b border-slate-100 pb-2 last:border-0 last:pb-0 space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <TypeIcon className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                            <div className="min-w-0">
                              <p className="font-bold text-navy-800 truncate flex items-center gap-1.5">
                                {ent.title}
                                {isExpress && (
                                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                                    Express
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-slate-500 font-mono truncate">{ent.slot_or_seat_info} Â· {ent.passenger_name}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                            isCheckedIn ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {ent.check_in_status}
                          </span>
                        </div>

                        {canModify && (
                          <div className="flex items-center gap-2 pl-5.5 ml-0.5">
                            {!isExpress && (
                              <button
                                type="button"
                                disabled={upgrading === ent.ticket_ref}
                                onClick={() => handleUpgradeToExpress(ent.ticket_ref)}
                                className="px-2 py-1 rounded-md bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-[10px] font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
                              >
                                <Sparkles className="w-3 h-3" /> {upgrading === ent.ticket_ref ? 'Upgrading...' : 'Upgrade to Express'}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openRescheduleModal(ent)}
                              className="px-2 py-1 rounded-md bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-700 text-[10px] font-bold flex items-center gap-1 transition-colors"
                            >
                              <CalendarClock className="w-3 h-3" /> Request Reschedule
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Bottom Bar */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Pass
                </button>

                <button
                  type="button"
                  onClick={() => handleCancelBooking(pass.booking_ref)}
                  className="px-3 py-2 rounded-lg bg-white border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" /> Cancel Booking
                </button>


                {/* Self-service preview: read-only, does not check anyone in â€” only staff can do that */}
                <button
                  type="button"
                  disabled={verifying}
                  onClick={() => handleSimulateTurnstileScan(pass.booking_ref)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg shadow-md flex items-center gap-2 transition-all"
                >
                  <ShieldCheck className="w-4 h-4" /> Simulate Turnstile Scan
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Turnstile Scan Simulator Modal â€” read-only signature + status preview */}
      {activeVerification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/70 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-center">
            <button
              onClick={() => setActiveVerification(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-navy-800 p-1"
            >
              âœ•
            </button>

            {/* Signature Indicator */}
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 ${
              activeVerification.is_signature_valid
                ? 'bg-emerald-50 border-emerald-500 text-emerald-600'
                : 'bg-red-50 border-red-500 text-red-600'
            }`}>
              {activeVerification.is_signature_valid ? <CheckCircle2 className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
            </div>

            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
              {activeVerification.verification_mode}
            </span>

            <h3 className={`font-serif text-xl font-black ${activeVerification.is_signature_valid ? 'text-emerald-600' : 'text-red-600'}`}>
              {activeVerification.is_signature_valid ? 'SIGNATURE VALID' : 'INVALID / TAMPERED'}
            </h3>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 my-4 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Pass Reference:</span>
                <span className="font-mono text-cyan-700 font-bold">{activeVerification.booking_ref}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Lead Passenger:</span>
                <strong className="text-navy-800">{activeVerification.lead_passenger_name}</strong>
              </div>
              <div className="pt-2 border-t border-slate-200 space-y-1.5">
                {activeVerification.entitlements.map((ent) => (
                  <div key={ent.ticket_ref} className="flex justify-between">
                    <span className="text-slate-500 truncate pr-2">{ent.title}</span>
                    <span className={`font-bold shrink-0 ${ent.check_in_status === 'CHECKED_IN' ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {ent.check_in_status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[10px] text-slate-400 mb-3">
              This is a read-only preview. Actual entry check-in is performed by gate staff.
            </p>

            <button
              onClick={() => setActiveVerification(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-navy-800 font-bold rounded-lg text-xs transition-colors"
            >
              Close Turnstile Simulator
            </button>
          </div>
        </div>
      )}

      {/* Reschedule Request Modal â€” RFP p.28: submits a request, does NOT
          change the ticket immediately; staff must approve it. */}
      {rescheduleTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/70 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setRescheduleTicket(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-navy-800 p-1"
            >
              âœ•
            </button>

            <div className="w-14 h-14 rounded-2xl bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center justify-center mb-4">
              <CalendarClock className="w-7 h-7" />
            </div>
            <h3 className="font-serif text-lg font-black text-navy-800">Request Time Slot Reschedule</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              {rescheduleTicket.title} â€” currently {rescheduleTicket.slot_or_seat_info}. Submitted for staff review; the ticket won't change until approved.
            </p>

            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">New Date</label>
            <input
              type="date"
              value={rescheduleDate}
              onChange={(e) => loadRescheduleSlots(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-3"
            />

            {rescheduleLoadingSlots ? (
              <p className="text-xs text-slate-400 mb-3">Loading available slots...</p>
            ) : rescheduleDate && rescheduleSlots.length === 0 ? (
              <p className="text-xs text-slate-400 mb-3">No slots found for this date.</p>
            ) : rescheduleSlots.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 mb-3">
                {rescheduleSlots.map((s) => (
                  <button
                    key={s.slot_id}
                    type="button"
                    disabled={!s.is_available}
                    onClick={() => setRescheduleSlotId(s.slot_id)}
                    className={`px-2 py-2 rounded-lg text-xs font-bold border transition-colors ${
                      rescheduleSlotId === s.slot_id
                        ? 'bg-cyan-700 text-white border-cyan-700'
                        : s.is_available
                        ? 'bg-white text-navy-800 border-slate-200 hover:border-cyan-400'
                        : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                    }`}
                  >
                    {s.start_time} - {s.end_time}
                    {!s.is_available && <span className="block text-[9px] font-normal">Full / current slot</span>}
                  </button>
                ))}
              </div>
            ) : null}

            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Reason</label>
            <textarea
              value={rescheduleReason}
              onChange={(e) => setRescheduleReason(e.target.value)}
              rows={2}
              placeholder="e.g. Family emergency, changed travel dates..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-4"
            />

            <button
              type="button"
              disabled={rescheduleSubmitting}
              onClick={submitRescheduleRequest}
              className="w-full py-2.5 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-lg text-xs shadow-md disabled:opacity-50"
            >
              {rescheduleSubmitting ? 'Submitting...' : 'Submit Reschedule Request'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
