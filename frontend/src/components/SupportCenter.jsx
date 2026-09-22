import React, { useState, useEffect } from 'react';
import API from '../api/client';
import {
  LifeBuoy, RefreshCw, Send, Ticket, CreditCard, ScanLine, MessageSquare, HelpCircle
} from 'lucide-react';

const CATEGORY_OPTIONS = [
  { value: 'BOOKING', label: 'Booking Issue', icon: Ticket },
  { value: 'PAYMENT', label: 'Payment / Refund', icon: CreditCard },
  { value: 'TICKET_VALIDATION', label: 'Ticket / Gate Validation', icon: ScanLine },
  { value: 'SERVICE_QUALITY', label: 'Service Quality', icon: MessageSquare },
  { value: 'OTHER', label: 'Other', icon: HelpCircle },
];

const STATUS_STYLE = {
  OPEN: 'bg-slate-100 text-slate-600 border-slate-200',
  ACKNOWLEDGED: 'bg-amber-50 text-amber-700 border-amber-200',
  IN_PROGRESS: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CLOSED: 'bg-slate-100 text-slate-500 border-slate-200',
};

export function SupportCenter({ user, onRequireLogin }) {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [category, setCategory] = useState('BOOKING');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [relatedBookingRef, setRelatedBookingRef] = useState('');

  useEffect(() => {
    if (user) fetchGrievances();
  }, [user]);

  const fetchGrievances = async () => {
    setLoading(true);
    try {
      const res = await API.get('/grievances/my');
      setGrievances(res.data);
    } catch (err) {
      console.error('Failed to load grievances', err);
      setGrievances([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      await API.post('/grievances', {
        category,
        subject: subject.trim(),
        description: description.trim(),
        related_booking_ref: relatedBookingRef.trim() || null,
      });
      setSubject('');
      setDescription('');
      setRelatedBookingRef('');
      fetchGrievances();
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not submit your complaint');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto my-12 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center justify-center mx-auto mb-4">
          <LifeBuoy className="w-7 h-7" />
        </div>
        <h3 className="font-serif text-lg font-black text-navy-800">Sign In to Contact Support</h3>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          Raise a complaint about a booking, payment, or gate entry, and track its resolution here.
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
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-bold mb-2">
          <LifeBuoy className="w-3.5 h-3.5" /> Grievance Redressal
        </div>
        <h2 className="font-serif text-2xl font-black text-navy-800">Support Center</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Every complaint is logged and tracked through resolution — you can check its status below at any time.
        </p>
      </div>

      {/* Submit Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-serif text-base font-bold text-navy-800">Raise a Complaint</h3>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Category</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {CATEGORY_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setCategory(opt.value)}
                  className={`px-2 py-2.5 rounded-lg text-[11px] font-bold border flex flex-col items-center gap-1 transition-colors ${
                    category === opt.value
                      ? 'bg-cyan-700 text-white border-cyan-700'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-cyan-400'
                  }`}
                >
                  <Icon className="w-4 h-4" /> {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Brief summary of the issue"
            maxLength={150}
            required
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
            Related Booking Reference <span className="font-normal normal-case text-slate-400">(optional)</span>
          </label>
          <input
            type="text"
            value={relatedBookingRef}
            onChange={(e) => setRelatedBookingRef(e.target.value)}
            placeholder="e.g. AN-2026-ORD-28949"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="What happened, where, and when?"
            required
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2.5 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-lg text-xs shadow-md flex items-center gap-2 disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" /> {submitting ? 'Submitting...' : 'Submit Complaint'}
        </button>
      </form>

      {/* My Complaints List */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-base font-bold text-navy-800">My Complaints</h3>
          <button
            onClick={fetchGrievances}
            disabled={loading}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-[11px] font-bold text-navy-800 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10 text-slate-400 text-xs">Loading...</div>
        ) : grievances.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">No complaints filed yet.</div>
        ) : (
          <div className="space-y-2.5">
            {grievances.map((g) => (
              <div key={g.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono text-[10px] text-cyan-700 font-bold">{g.ticket_ref}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${STATUS_STYLE[g.status] || STATUS_STYLE.OPEN}`}>
                    {g.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{new Date(g.created_at).toLocaleString('en-IN')}</span>
                </div>
                <p className="text-xs font-bold text-navy-800">{g.subject}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{g.description}</p>
                {g.related_booking_ref && (
                  <p className="text-[10px] font-mono text-slate-400 mt-1">Booking: {g.related_booking_ref}</p>
                )}
                {g.resolution_notes && (
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Response</span>
                    <p className="text-[11px] text-navy-800 mt-0.5">{g.resolution_notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
