import React, { useState } from 'react';
import API from '../api/client';
import { ScanLine, CheckCircle2, XCircle, ShieldAlert, Search, Ship, Landmark } from 'lucide-react';

const ITEM_TYPE_ICON = { FERRY: Ship, ATTRACTION: Landmark };

export function StaffGateScanner({ user }) {
  const [passRef, setPassRef] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState(null);
  const [pass, setPass] = useState(null); // { pass_ref, lead_passenger_name, is_signature_valid, entitlements }

  const [checkInLoading, setCheckInLoading] = useState(null); // order_item_id currently in flight
  const [result, setResult] = useState(null); // { ok: bool, data or message, order_item_id }

  const isStaff = user && ['OPERATOR', 'VENDOR', 'ADMIN'].includes(user.role);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!passRef.trim()) return;
    setLookupLoading(true);
    setLookupError(null);
    setResult(null);
    setPass(null);
    try {
      const res = await API.get(`/tickets/${passRef.trim().toUpperCase()}/verify-offline`);
      setPass(res.data);
    } catch (err) {
      setLookupError(err.response?.data?.detail || 'Pass reference not found.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleCheckIn = async (entitlement) => {
    setCheckInLoading(entitlement.ticket_ref);
    setResult(null);
    try {
      const res = await API.post('/tickets/staff/check-in', {
        ticket_ref: entitlement.ticket_ref,
      });
      setResult({ ok: true, data: res.data, ticket_ref: entitlement.ticket_ref });
      // Refresh the local entitlement list from the response's authoritative sibling list
      setPass((prev) => ({ ...prev, entitlements: res.data.remaining_entitlements }));
    } catch (err) {
      setResult({
        ok: false,
        message: err.response?.data?.detail || 'Verification failed.',
        ticket_ref: entitlement.ticket_ref,
      });
    } finally {
      setCheckInLoading(null);
    }
  };

  if (!isStaff) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto my-12 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h3 className="font-serif text-lg font-black text-navy-800">Restricted Access</h3>
        <p className="text-xs text-slate-500 mt-1">
          This screen requires Ferry Operator, Activity Vendor, or Administrator privileges.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-bold">
          <ScanLine className="w-3.5 h-3.5" /> Gate &amp; Turnstile Staff Console (RFP Page 28–29 &amp; 49)
        </div>
        <h2 className="font-serif text-2xl font-black text-navy-800">Unified Pass Verification</h2>
        <p className="text-xs text-slate-500">
          Enter the Pass Reference to see every entitlement bundled in this Unified QR — then check in only the one relevant to your gate.
        </p>
      </div>

      <form onSubmit={handleLookup} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <label className="block text-xs font-semibold text-slate-600">Pass Reference</label>
        <input
          type="text"
          autoFocus
          value={passRef}
          onChange={(e) => setPassRef(e.target.value)}
          placeholder="AN-2026-PASS-XXXXXX"
          className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-base font-mono text-center tracking-wider text-navy-800 uppercase"
        />
        <button
          type="submit"
          disabled={lookupLoading || !passRef.trim()}
          className="w-full py-3 bg-navy-800 hover:bg-navy-700 text-white font-bold rounded-lg text-sm shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Search className="w-4 h-4" /> {lookupLoading ? 'Looking up...' : 'Scan / Look Up Pass'}
        </button>
      </form>

      {lookupError && (
        <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-6 text-center space-y-1.5 shadow-lg">
          <XCircle className="w-10 h-10 text-red-600 mx-auto" />
          <h3 className="font-serif text-base font-black text-red-700">PASS NOT FOUND</h3>
          <p className="text-xs text-red-700 font-semibold">{lookupError}</p>
        </div>
      )}

      {pass && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className={`p-4 flex items-center justify-between ${pass.is_signature_valid ? 'bg-emerald-50 border-b border-emerald-100' : 'bg-red-50 border-b border-red-100'}`}>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Pass Reference</span>
              <span className="font-mono text-sm font-black text-navy-800">{pass.booking_ref}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Signature</span>
              <span className={`text-xs font-bold ${pass.is_signature_valid ? 'text-emerald-700' : 'text-red-600'}`}>
                {pass.is_signature_valid ? 'VALID (Ed25519)' : 'INVALID / TAMPERED'}
              </span>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <p className="text-xs text-slate-500">
              Lead Passenger: <strong className="text-navy-800">{pass.lead_passenger_name}</strong> · {pass.entitlements.length} entitlement(s) in this pass
            </p>

            {pass.entitlements.map((ent) => {
              const Icon = ITEM_TYPE_ICON[ent.item_type] || Landmark;
              const entResult = result && result.ticket_ref === ent.ticket_ref ? result : null;
              const isCheckedIn = ent.check_in_status === 'CHECKED_IN';

              return (
                <div key={ent.ticket_ref} className="border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-100 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-navy-800 truncate">{ent.title}</p>
                        <p className="text-[11px] text-slate-500 font-mono truncate">{ent.slot_or_seat_info} · {ent.passenger_name}</p>
                      </div>
                    </div>

                    {isCheckedIn ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        CHECKED IN
                      </span>
                    ) : (
                      <button
                        onClick={() => handleCheckIn(ent)}
                        disabled={checkInLoading === ent.ticket_ref}
                        className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg shrink-0 disabled:opacity-50"
                      >
                        {checkInLoading === ent.ticket_ref ? 'Checking...' : 'Check In'}
                      </button>
                    )}
                  </div>

                  {entResult && (
                    <div className={`text-xs font-semibold rounded-lg px-3 py-2 flex items-center gap-2 ${
                      entResult.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {entResult.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                      {entResult.ok ? 'Entry granted.' : entResult.message}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
