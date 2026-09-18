import React, { useState, useEffect } from 'react';
import API from '../api/client';
import {
  ShieldCheck, Landmark, Phone, KeyRound, User, Mail, Globe, ArrowRight,
  AlertCircle, Lock,
} from 'lucide-react';

// Purely a presentational split — both contexts hit the exact same auth
// endpoints and the backend decides the real role from the phone number.
// This just tailors the copy/icon so a tourist never sees government-staff
// language and staff get an entry point that doesn't look like a generic
// "sign in" button.
const CONTEXT_COPY = {
  VISITOR: {
    icon: ShieldCheck,
    title: 'Visitor Login',
    subtitle: 'Strict Single-Session Concurrency (RFP 7.1.12)',
  },
  STAFF: {
    icon: Landmark,
    title: 'Staff & Government Login',
    subtitle: 'Authorized Ferry Operators, Activity Vendors & Administrators only',
  },
};

export function LoginModal({ isOpen, onClose, onLoginSuccess, loginContext = 'VISITOR' }) {
  // CREDENTIALS: phone + password (RFP 7.2.1-1 default subsequent login)
  // PHONE -> OTP: first-time registration, or the "Login with OTP" /
  //   "Forgot Password" fallback (otpIntent distinguishes the two)
  // SET_PASSWORD: shown once right after OTP if the account has no
  //   password yet, or whenever the OTP path was entered via "Forgot
  //   Password" (otpIntent === 'RESET')
  // PROFILE: RFP 7.2.1-1 mandatory profile fields, if still incomplete
  const [step, setStep] = useState('CREDENTIALS');
  const [otpIntent, setOtpIntent] = useState('REGISTER'); // 'REGISTER' | 'RESET'

  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Profile Fields (RFP Page 24)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [nationality, setNationality] = useState('INDIAN');
  const [stateOrCountry, setStateOrCountry] = useState('');

  // Reset to a fresh sign-in flow every time the modal is (re)opened —
  // otherwise it re-mounts hidden and remembers whatever step/error state
  // was left over from the previous session.
  useEffect(() => {
    if (isOpen) {
      setStep('CREDENTIALS');
      setOtpIntent('REGISTER');
      setPhoneNumber('');
      setPassword('');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
      setFullName('');
      setEmail('');
      setNationality('INDIAN');
      setStateOrCountry('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const afterAuthenticated = (profile) => {
    localStorage.setItem('aniidco_user', JSON.stringify(profile));

    if (otpIntent === 'RESET' || !profile.has_password) {
      setStep('SET_PASSWORD');
      return;
    }
    // RFP Section 7.2.1-1: registration must capture full legal name,
    // email, nationality, and state/country before a booking can proceed.
    if (!profile.profile_complete) {
      setFullName(profile.full_name === 'Valued Tourist' ? '' : profile.full_name);
      setNationality(profile.nationality || 'INDIAN');
      setStep('PROFILE');
      return;
    }
    onLoginSuccess(profile);
    onClose();
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await API.post('/auth/login-password', { phone_number: phoneNumber, password });
      localStorage.setItem('aniidco_token', res.data.access_token);
      const profileRes = await API.get('/auth/me');
      afterAuthenticated(profileRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid mobile number or password.');
    } finally {
      setLoading(false);
    }
  };

  const goToOtpFlow = (intent) => {
    setOtpIntent(intent);
    setError(null);
    setStep('PHONE');
  };

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
      afterAuthenticated(profileRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please check OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const endpoint = otpIntent === 'RESET' ? '/auth/reset-password' : '/auth/set-password';
      const res = await API.post(endpoint, { password: newPassword });
      localStorage.setItem('aniidco_user', JSON.stringify(res.data));

      if (!res.data.profile_complete) {
        setFullName(res.data.full_name === 'Valued Tourist' ? '' : res.data.full_name);
        setNationality(res.data.nationality || 'INDIAN');
        setStep('PROFILE');
      } else {
        onLoginSuccess(res.data);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not set password.');
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

  const headerTitle = {
    CREDENTIALS: CONTEXT_COPY[loginContext]?.title,
    PHONE: otpIntent === 'RESET' ? 'Reset Password' : 'Register / Login with OTP',
    OTP: otpIntent === 'RESET' ? 'Reset Password' : 'Register / Login with OTP',
    SET_PASSWORD: otpIntent === 'RESET' ? 'Set a New Password' : 'Create Your Password',
    PROFILE: 'Complete Tourist Profile',
  }[step];

  const headerSubtitle = {
    CREDENTIALS: CONTEXT_COPY[loginContext]?.subtitle,
    PHONE: 'Verified via One-Time Password (SMS)',
    OTP: 'Verified via One-Time Password (SMS)',
    SET_PASSWORD: 'RFP 7.2.1-1: no OTP needed for future logins once this is set',
    PROFILE: 'Required for port clearance & turnstile pass issuance (RFP 7.2.1)',
  }[step];

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
                const ContextIcon = step === 'CREDENTIALS' ? (CONTEXT_COPY[loginContext]?.icon || ShieldCheck) : Lock;
                return <ContextIcon className="w-6 h-6" />;
              })()}
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-navy-800">{headerTitle}</h3>
              <p className="text-xs text-slate-500">{headerSubtitle}</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Mobile Number + Password (RFP 7.2.1-1 default login) */}
          {step === 'CREDENTIALS' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
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

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-600">Password</label>
                  <button
                    type="button"
                    onClick={() => goToOtpFlow('RESET')}
                    className="text-[11px] text-cyan-700 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-navy-800 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-cyan-700 hover:bg-cyan-600 font-bold rounded-lg text-sm text-white shadow-md transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Signing in...' : 'Login'}
              </button>

              <p className="text-center text-[11px] text-slate-500">
                New here?{' '}
                <button type="button" onClick={() => goToOtpFlow('REGISTER')} className="text-cyan-700 font-semibold hover:underline">
                  Register / Login with OTP
                </button>
              </p>
            </form>
          )}

          {/* STEP 2a: Phone entry for the OTP path (registration or forgot-password) */}
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

              <button
                type="button"
                onClick={() => setStep('CREDENTIALS')}
                className="w-full text-center text-[11px] text-slate-500 hover:underline"
              >
                ← Back to Login
              </button>
            </form>
          )}

          {/* STEP 2b: OTP entry */}
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
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>
            </form>
          )}

          {/* STEP 3: Set/Reset Password (RFP 7.2.1-1) */}
          {step === 'SET_PASSWORD' && (
            <form onSubmit={handleSetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-navy-800 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-navy-800 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-lg text-sm shadow-md flex items-center justify-center gap-2"
              >
                {loading ? 'Saving...' : 'Save Password & Continue'} <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 4: Profile Completion (RFP Section 7.2.1-1) */}
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
