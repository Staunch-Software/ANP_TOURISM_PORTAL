import React, { useState } from 'react';
import API from '../api/client';
import { ScanLine, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';

export function StaffGateScanner({ user }) {
  const [ticketRef, setTicketRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { ok: bool, data or message }

  const isStaff = user && ['OPERATOR', 'VENDOR', 'ADMIN'].includes(user.role);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!ticketRef.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await API.post('/tickets/staff/check-in', { ticket_ref: ticketRef.trim().toUpperCase() });
      setResult({ ok: true, data: res.data });
    } catch (err) {
      setResult({ ok: false, message: err.response?.data?.detail || 'Verification failed.' });
    } finally {
      setLoading(false);
      setTicketRef('');
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
          <ScanLine className="w-3.5 h-3.5" /> Gate &amp; Turnstile Staff Console (RFP Page 28–29)
        </div>
        <h2 className="font-serif text-2xl font-black text-navy-800">Ticket Verification</h2>
        <p className="text-xs text-slate-500">
          Enter the passenger/visitor's Ticket Reference to validate their Ed25519-signed pass and record entry.
        </p>
      </div>

      <form onSubmit={handleScan} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <label className="block text-xs font-semibold text-slate-600">Ticket Reference</label>
        <input
          type="text"
          autoFocus
          value={ticketRef}
          onChange={(e) => setTicketRef(e.target.value)}
          placeholder="AN-2026-TKT-XXXXXX"
          className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-base font-mono text-center tracking-wider text-navy-800 uppercase"
        />
        <button
          type="submit"
          disabled={loading || !ticketRef.trim()}
          className="w-full py-3 bg-navy-800 hover:bg-navy-700 text-white font-bold rounded-lg text-sm shadow-md disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Scan / Verify Ticket'}
        </button>
      </form>

      {result && result.ok && (
        <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-8 text-center space-y-2 shadow-lg">
          <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto" />
          <h3 className="font-serif text-xl font-black text-emerald-700">ENTRY GRANTED</h3>
          <p className="text-sm font-bold text-navy-800">{result.data.passenger_name}</p>
          <p className="text-xs text-slate-600 font-mono">{result.data.ticket_ref}</p>
          <p className="text-xs text-slate-500">{result.data.item_type} · {result.data.slot_or_seat_info}</p>
        </div>
      )}

      {result && !result.ok && (
        <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-8 text-center space-y-2 shadow-lg">
          <XCircle className="w-14 h-14 text-red-600 mx-auto" />
          <h3 className="font-serif text-xl font-black text-red-700">ACCESS DENIED</h3>
          <p className="text-xs text-red-700 font-semibold">{result.message}</p>
        </div>
      )}
    </div>
  );
}
