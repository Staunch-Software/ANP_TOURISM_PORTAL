import React, { useState, useEffect } from 'react';
import API from '../api/client';
import { ShieldCheck, Landmark, Phone, KeyRound, User, Mail, Globe, ArrowRight, AlertCircle } from 'lucide-react';

// Purely a presentational split — both contexts hit the exact same
// /auth/verify-otp flow and the backend decides the real role from the
// phone number. This just tailors the copy/icon so a tourist never sees
// government-staff language and staff get an entry point that doesn't
// look like a generic "sign in" button.
const CONTEXT_COPY = {
  VISITOR: {
    icon: ShieldCheck,
    title: 'Visitor Authentication (2FA)',
    subtitle: 'Strict Single-Session Concurrency (RFP 7.1.12)',
  },
  STAFF: {
    icon: Landmark,
    title: 'Staff & Government Login',
    subtitle: 'Authorized Ferry Operators, Activity Vendors & Administrators only',
  },
};

export function LoginModal({ isOpen, onClose, onLoginSuccess, loginContext = 'VISITOR' }) {
  const [step, setStep] = useState('PHONE'); // PHONE -> OTP -> PROFILE
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Profile Fields (RFP Page 24)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [nationality, setNationality] = useState('INDIAN');
  const [stateOrCountry, setStateOrCountry] = useState('');

  // Reset to a fresh sign-in flow every time the modal is (re)opened —
  // otherwise it re-mounts hidden and remembers whatever step/error state
  // was left over from the previous session (e.g. reopens straight to OTP
  // after a prior successful login + logout).
  useEffect(() => {
    if (isOpen) {
      setStep('PHONE');
      setPhoneNumber('');
      setOtp('');
      setError(null);
      setFullName('');
      setEmail('');
      setNationality('INDIAN');
      setStateOrCountry('');
    }
  }, [isOpen]);

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

      // RFP Section 7.2.1-1: registration must capture full legal name,
      // email, nationality, and state/country before a booking can proceed.
      if (!profileRes.data.profile_complete) {
        setFullName(profileRes.data.full_name === 'Valued Tourist' ? '' : profileRes.data.full_name);
        setNationality(profileRes.data.nationality || 'INDIAN');
        setStep('PROFILE');
      } else {
        onLoginSuccess(profileRes.data);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please check OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await API.patch('/auth/me', {
        full_name: fullName,
        email: email,
        nationality: nationality,
        state_or_country: stateOrCountry,
      });

      localStorage.setItem('aniidco_user', JSON.stringify(res.data));
      onLoginSuccess(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save profile');
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
          ✕
        </button>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-xl">
              {(() => {
                const ContextIcon = CONTEXT_COPY[loginContext]?.icon || ShieldCheck;
                return <ContextIcon className="w-6 h-6" />;
              })()}
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-navy-800">
                {step === 'PROFILE' ? 'Complete Tourist Profile' : CONTEXT_COPY[loginContext]?.title}
              </h3>
              <p className="text-xs text-slate-500">
                {step === 'PROFILE'
                  ? 'Required for port clearance & turnstile pass issuance (RFP 7.2.1)'
                  : CONTEXT_COPY[loginContext]?.subtitle}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 'PHONE' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Mobile Number</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-mono">+91</span>
                  <input
                    type="tel"
                    maxLength="10"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
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
          )}

          {step === 'OTP' && (
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

          {/* STEP 3: Profile Completion (RFP Section 7.2.1-1) */}
          {step === 'PROFILE' && (
            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-cyan-600" /> Full Legal Name (As per Govt ID)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-cyan-600" /> Email ID (For E-Ticket Dispatch)
                </label>
                <input
                  type="email"
                  placeholder="rahul.sharma@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-cyan-600" /> Nationality
                  </label>
                  <select
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800"
                  >
                    <option value="INDIAN">Indian Citizen</option>
                    <option value="FOREIGN">Foreign National</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    State / Country
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Delhi or UK"
                    value={stateOrCountry}
                    onChange={(e) => setStateOrCountry(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 mt-2 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-lg text-sm shadow-md flex items-center justify-center gap-2"
              >
                {loading ? 'Saving...' : 'Complete Profile & Enter Portal'} <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
