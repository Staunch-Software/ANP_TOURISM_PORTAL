import React, { useState } from 'react';
import axios from 'axios';
import { Building2, Phone, KeyRound, FileText, Mail, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8001/api/v1';

export function OperatorRegisterModal({ isOpen, onClose }) {
  const [step, setStep] = useState('PHONE'); // PHONE -> OTP -> BUSINESS -> DONE
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [businessName, setBusinessName] = useState('');
  const [gstin, setGstin] = useState('');
  const [tradeLicense, setTradeLicense] = useState('');
  const [serviceCategory, setServiceCategory] = useState('FERRY_OPERATOR');
  const [email, setEmail] = useState('');

  if (!isOpen) return null;

  const resetAndClose = () => {
    setStep('PHONE');
    setPhoneNumber('');
    setOtp('');
    setToken(null);
    setError(null);
    setBusinessName('');
    setGstin('');
    setTradeLicense('');
    setServiceCategory('FERRY_OPERATOR');
    setEmail('');
    onClose();
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
      // Uses a plain axios call (not the shared API client) so this
      // modal's own OTP-verified token can never be silently overwritten
      // by the shared client's interceptor, which always injects
      // whatever token is currently in localStorage for the main app
      // session — that could belong to a completely different account.
      const res = await axios.post(`${API_BASE_URL}/auth/verify-otp`, { phone_number: phoneNumber, otp });
      setToken(res.data.access_token);
      setStep('BUSINESS');
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please check OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await axios.post(
        `${API_BASE_URL}/auth/register-operator`,
        {
          business_name: businessName,
          gstin,
          trade_license_number: tradeLicense,
          service_category: serviceCategory,
          email,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStep('DONE');
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/70 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
        <div className="relative h-16 bg-navy-800 flex items-center px-6 gap-3">
          <Building2 className="w-6 h-6 text-cyan-300" />
          <div>
            <div className="text-sm font-bold text-white">Partner with ANIIDCO</div>
            <div className="text-[10px] text-slate-300">Ferry &amp; Water Sports Operator Registration (RFP 7.2.1)</div>
          </div>
        </div>

        <button
          onClick={resetAndClose}
          className="absolute top-4 right-4 text-white/80 hover:text-white p-1"
        >
          ✕
        </button>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 'PHONE' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <p className="text-xs text-slate-500">
                First, verify your contact number. You'll then submit your business details for ANIIDCO's review.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-cyan-600" /> Contact Mobile Number
                </label>
                <input
                  type="tel"
                  maxLength="10"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 10-digit number"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-navy-800 font-mono"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-lg text-sm shadow-md flex items-center justify-center gap-2"
              >
                Send OTP <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {step === 'OTP' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 mb-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-cyan-600" /> Enter 6-Digit OTP
                </label>
                <input
                  type="text"
                  maxLength="6"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-mono text-center tracking-widest text-navy-800"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1.5">For demo evaluation, default OTP is <strong className="text-cyan-700">123456</strong>.</p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-sm shadow-md"
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>
            </form>
          )}

          {step === 'BUSINESS' && (
            <form onSubmit={handleSubmitApplication} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-cyan-600" /> Business / Company Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Nautika Luxury Ferries Ltd."
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-cyan-600" /> GSTIN
                  </label>
                  <input
                    type="text"
                    placeholder="35AABCN1234F1Z8"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Trade License No.</label>
                  <input
                    type="text"
                    placeholder="ANI-TL-2026-88"
                    value={tradeLicense}
                    onChange={(e) => setTradeLicense(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Service Category</label>
                  <select
                    value={serviceCategory}
                    onChange={(e) => setServiceCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800"
                  >
                    <option value="FERRY_OPERATOR">Ferry Operator</option>
                    <option value="WATER_SPORTS">Water Sports Provider</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-cyan-600" /> Business Email
                  </label>
                  <input
                    type="email"
                    placeholder="ops@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 mt-2 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-lg text-sm shadow-md"
              >
                {loading ? 'Submitting...' : 'Submit for ANIIDCO Review'}
              </button>
            </form>
          )}

          {step === 'DONE' && (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="font-serif text-lg font-black text-navy-800">Application Submitted</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                ANIIDCO will review your documents and notify you by SMS/email once your account is approved.
              </p>
              <button
                onClick={resetAndClose}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-navy-800 font-bold rounded-lg text-xs"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
