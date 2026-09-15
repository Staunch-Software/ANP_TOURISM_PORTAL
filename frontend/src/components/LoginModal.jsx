import React, { useState } from 'react';
import API from '../api/client';
import { ShieldCheck, Phone, KeyRound, X, AlertCircle } from 'lucide-react';

export function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [phoneNumber, setPhoneNumber] = useState('9999999999');
  const [otp, setOtp] = useState('123456');
  const [step, setStep] = useState('PHONE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setError(null);
    setStep('OTP');
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await API.post('/auth/verify-otp', {
        phone_number: phoneNumber,
        otp: otp,
      });

      localStorage.setItem('aniidco_token', res.data.access_token);

      const profileRes = await API.get('/auth/me');
      localStorage.setItem('aniidco_user', JSON.stringify(profileRes.data));

      onLoginSuccess(profileRes.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please check OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/70 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
        {/* Government banner strip with official seal */}
        <div
          className="relative h-20 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/hero-lagoon.jpg')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-navy-900/95 via-navy-800/90 to-navy-900/95" />
          <div className="relative h-full flex items-center gap-3 px-6">
            <img
              src="/images/govt-seal.png"
              alt="Andaman & Nicobar Administration Seal"
              className="w-12 h-12 object-contain bg-white rounded-full p-1 shadow-lg"
            />
            <div>
              <div className="text-xs font-bold text-white tracking-wide">GOVERNMENT OF INDIA</div>
              <div className="text-[10px] text-slate-300">Andaman &amp; Nicobar Administration</div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-navy-800">Visitor Authentication (2FA)</h3>
              <p className="text-xs text-slate-500">Strict Single-Session Concurrency (RFP 7.1.12)</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 'PHONE' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Mobile Number</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-mono">+91</span>
                  <input
                    type="tel"
                    maxLength="10"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter 10-digit number"
                    className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-navy-800 focus:outline-none focus:border-cyan-500 font-mono"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-cyan-700 hover:bg-cyan-600 font-bold rounded-lg text-sm text-white shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" /> Send OTP
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-600">Enter 6-Digit OTP</label>
                  <button
                    type="button"
                    onClick={() => setStep('PHONE')}
                    className="text-[11px] text-cyan-700 hover:underline"
                  >
                    Change number
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    maxLength="6"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-navy-800 tracking-widest font-mono text-center focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">For demo evaluation, default OTP is <strong className="text-cyan-700">123456</strong>.</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 font-bold rounded-lg text-sm text-white shadow-md transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Verifying...' : 'Confirm & Log In'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
