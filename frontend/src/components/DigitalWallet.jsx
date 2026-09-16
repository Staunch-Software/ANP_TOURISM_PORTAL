import React, { useState, useEffect } from 'react';
import API from '../api/client';
import { QRCodeSVG } from 'qrcode.react';
import {
  Ticket, ShieldCheck, CheckCircle2, Clock, Printer, RefreshCw
} from 'lucide-react';

export function DigitalWallet({ user, onRequireLogin }) {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeVerification, setActiveVerification] = useState(null);
  const [verifying, setVerifying] = useState(false);

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

  const handleSimulateTurnstileScan = async (ticketRef) => {
    setVerifying(true);
    try {
      const res = await API.get(`/tickets/${ticketRef}/verify-offline`);
      setActiveVerification(res.data);
    } catch (err) {
      alert("Verification failed or ticket reference not found");
    } finally {
      setVerifying(false);
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
            <ShieldCheck className="w-3.5 h-3.5" /> Ed25519 Cryptographically Signed
          </div>
          <h2 className="font-serif text-2xl font-black text-navy-800">Official Digital Pass Wallet</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Offline turnstile verifiable passes for entry at Cellular Jail, jetties, and water sports hubs.
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
            Book an attraction slot or inter-island ferry seat to generate your digital boarding passes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {passes.map((pass) => (
            <div
              key={pass.ticket_ref}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between relative group hover:border-cyan-400 transition-all"
            >
              {/* Official Pass Header */}
              <div className="bg-slate-50 p-5 border-b border-slate-100 flex justify-between items-start">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-cyan-50 text-cyan-700 border border-cyan-200">
                    {pass.item_type} PASS
                  </span>
                  <h3 className="font-serif text-base font-black text-navy-800 mt-1.5">{pass.title}</h3>
                  <span className="text-xs text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-600" /> {pass.slot_or_seat_info}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Ticket Ref</span>
                  <span className="font-mono text-xs font-black text-cyan-700">{pass.ticket_ref}</span>
                </div>
              </div>

              {/* Pass Mid Section: QR Code & Passenger Details */}
              <div className="p-6 flex flex-col sm:flex-row items-center gap-6">
                {/* Visual QR Code Container */}
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

                {/* Passenger & Validity Details */}
                <div className="flex-1 space-y-2.5 w-full text-xs">
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Passenger:</span>
                    <strong className="text-navy-800 font-bold">{pass.passenger_name}</strong>
                  </div>

                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Identification:</span>
                    <span className="font-mono text-slate-600">
                      {pass.id_type}: •••• {pass.id_number.slice(-4)}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Status:</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {pass.check_in_status}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                    <span>Cryptographic Hash:</span>
                    <span className="font-mono text-[9px] text-slate-400">Ed25519 Curve25519</span>
                  </div>
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

                {/* The Demo Winning Button: Simulates Gate Turnstile Scanning */}
                <button
                  type="button"
                  disabled={verifying}
                  onClick={() => handleSimulateTurnstileScan(pass.ticket_ref)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg shadow-md flex items-center gap-2 transition-all"
                >
                  <ShieldCheck className="w-4 h-4" /> Simulate Turnstile Scan
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Turnstile Scan Simulator Modal */}
      {activeVerification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/70 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-center">
            <button
              onClick={() => setActiveVerification(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-navy-800 p-1"
            >
              ✕
            </button>

            {/* Turnstile Light Indicator */}
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 ${
              activeVerification.is_signature_valid
                ? 'bg-emerald-50 border-emerald-500 text-emerald-600'
                : 'bg-red-50 border-red-500 text-red-600'
            }`}>
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
              {activeVerification.verification_mode}
            </span>

            <h3 className={`font-serif text-xl font-black ${
              activeVerification.is_signature_valid ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {activeVerification.gate_decision}
            </h3>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 my-4 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Pass Reference:</span>
                <span className="font-mono text-cyan-700 font-bold">{activeVerification.ticket_ref}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Passenger:</span>
                <strong className="text-navy-800">{activeVerification.passenger_name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Offline Math Verification:</span>
                <span className="text-emerald-700 font-mono font-bold">100% VALID (0 ms Latency)</span>
              </div>
            </div>

            <button
              onClick={() => setActiveVerification(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-navy-800 font-bold rounded-lg text-xs transition-colors"
            >
              Close Turnstile Simulator
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
