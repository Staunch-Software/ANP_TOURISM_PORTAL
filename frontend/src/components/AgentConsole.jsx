import React, { useState } from 'react';
import API from '../api/client';
import { KeyRound, Copy, RefreshCw, CheckCircle2, Code2, Building2 } from 'lucide-react';

// RFP Page 27, "Booking by Ticket Aggregators": "Create a secure API that
// can be shared with approved Agents wishing to develop their own website
// or application for ticket bookings." This is that hand-off point — the
// agent's own dashboard view of their API key plus the exact call shape
// their engineering team needs to integrate against POST
// /agent/api/book-attraction (see backend/app/api/v1/agent.py).
export function AgentConsole({ user, onRequireLogin }) {
  const [apiKey, setApiKey] = useState(user?.api_key || null);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState(null);

  if (!user) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto my-12 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center justify-center mx-auto mb-4">
          <KeyRound className="w-7 h-7" />
        </div>
        <h3 className="font-serif text-lg font-black text-navy-800">Sign In to View Your Agent Console</h3>
        <button
          onClick={onRequireLogin}
          className="w-full mt-4 py-2.5 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-lg text-xs shadow-md"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (user.role !== 'AGENT') {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto my-12 shadow-sm">
        <h3 className="font-serif text-lg font-black text-navy-800">Restricted Access</h3>
        <p className="text-xs text-slate-500 mt-1">This console is only available to approved Ticket Aggregator accounts.</p>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    if (!window.confirm('Regenerating your key immediately invalidates the old one. Any live integration using it will stop working until updated. Continue?')) return;
    setRegenerating(true);
    setError(null);
    try {
      const res = await API.post('/auth/agent/regenerate-api-key');
      setApiKey(res.data.api_key);
      const stored = JSON.parse(localStorage.getItem('aniidco_user') || '{}');
      localStorage.setItem('aniidco_user', JSON.stringify({ ...stored, api_key: res.data.api_key }));
      setRevealed(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not regenerate API key');
    } finally {
      setRegenerating(false);
    }
  };

  const displayKey = revealed && apiKey ? apiKey : 'YOUR_API_KEY';

  const sampleAttractionRequest = `curl -X POST https://api.aniidco.gov.in/api/v1/agent/api/book-attraction \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${displayKey}" \\
  -d '{
    "slot_id": "<attraction-slot-id>",
    "nationality": "INDIAN",
    "passenger": {
      "name": "Ramesh Kumar",
      "age": 34,
      "gender": "MALE",
      "id_type": "AADHAAR",
      "id_number": "123456789012"
    }
  }'`;

  const sampleFerryRequest = `curl -X POST https://api.aniidco.gov.in/api/v1/agent/api/book-ferry-seat \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${displayKey}" \\
  -d '{
    "schedule_id": "<ferry-schedule-id>",
    "seat_number": "D1A",
    "passenger": {
      "name": "Sunita Devi",
      "age": 29,
      "gender": "FEMALE",
      "id_type": "AADHAAR",
      "id_number": "987654321098"
    }
  }'`;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-bold mb-2">
          <Building2 className="w-3.5 h-3.5" /> Approved Ticket Aggregator (RFP Page 27)
        </div>
        <h2 className="font-serif text-2xl font-black text-navy-800">Agent Console</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {user.business_name} — book directly through the portal above, or integrate the Sync API below into your own website or app.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">{error}</div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-serif text-base font-black text-navy-800 flex items-center gap-2">
          <KeyRound className="w-4.5 h-4.5 text-cyan-600" /> Your API Key
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-navy-800 overflow-x-auto whitespace-nowrap">
            {apiKey ? (revealed ? apiKey : '•'.repeat(48)) : 'No API key issued yet'}
          </div>
          {apiKey && (
            <>
              <button
                onClick={() => setRevealed((v) => !v)}
                className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-navy-800 font-bold text-xs rounded-lg whitespace-nowrap"
              >
                {revealed ? 'Hide' : 'Reveal'}
              </button>
              <button
                onClick={handleCopy}
                className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-navy-800 font-bold text-xs rounded-lg flex items-center gap-1.5 whitespace-nowrap"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </>
          )}
        </div>
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs rounded-lg flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} /> {regenerating ? 'Regenerating...' : 'Regenerate Key'}
        </button>
        <p className="text-[11px] text-slate-400">
          Treat this key like a password — anyone with it can create bookings billed to your agency. Regenerate immediately if it's ever exposed.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
        <h3 className="font-serif text-base font-black text-navy-800 flex items-center gap-2">
          <Code2 className="w-4.5 h-4.5 text-cyan-600" /> Sync API — Book an Attraction
        </h3>
        <p className="text-xs text-slate-500">
          A single call from your own backend issues the same tamper-proof, Ed25519-signed QR ticket a direct web booking gets. No cart or session needed — your system authenticates with the header below.
        </p>
        <pre className="bg-navy-900 text-cyan-100 text-[11px] leading-relaxed rounded-xl p-4 overflow-x-auto font-mono">{sampleAttractionRequest}</pre>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
        <h3 className="font-serif text-base font-black text-navy-800 flex items-center gap-2">
          <Code2 className="w-4.5 h-4.5 text-cyan-600" /> Sync API — Book a Ferry Seat
        </h3>
        <p className="text-xs text-slate-500">
          Same one-call pattern for inter-island ferry seats — find a schedule and seat number via the public <code className="font-mono bg-slate-100 px-1 rounded">GET /ferry/schedules</code> and <code className="font-mono bg-slate-100 px-1 rounded">GET /ferry/schedules/{'{'}id{'}'}/seat-map</code> endpoints first.
        </p>
        <pre className="bg-navy-900 text-cyan-100 text-[11px] leading-relaxed rounded-xl p-4 overflow-x-auto font-mono">{sampleFerryRequest}</pre>
        <p className="text-[11px] text-slate-400">
          A matching <code className="font-mono bg-slate-100 px-1 rounded">GET /agent/api/bookings</code> endpoint (same header) returns your full booking history — attractions and ferries together — for reconciliation against ANIIDCO's periodic settlement.
        </p>
      </div>
    </div>
  );
}
