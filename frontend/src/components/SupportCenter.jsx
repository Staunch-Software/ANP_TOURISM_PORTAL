import React, { useState, useEffect, useRef } from 'react';
import API from '../api/client';
import {
  LifeBuoy, RefreshCw, Send, Ticket, CreditCard, ScanLine, MessageSquare, HelpCircle,
  ChevronDown, Lock, Timer, Headphones, SearchCheck, CheckCircle2, Info, MessagesSquare, Pencil, FileText,
} from 'lucide-react';

const CATEGORY_OPTIONS = [
  { value: 'BOOKING', label: 'Booking Issue', icon: Ticket },
  { value: 'PAYMENT', label: 'Payment / Refund', icon: CreditCard },
  { value: 'TICKET_VALIDATION', label: 'Ticket / Gate Validation', icon: ScanLine },
  { value: 'SERVICE_QUALITY', label: 'Service Quality', icon: MessageSquare },
  { value: 'OTHER', label: 'Other', icon: HelpCircle },
];
const CATEGORY_LABEL = Object.fromEntries(CATEGORY_OPTIONS.map((o) => [o.value, o]));

const STATUS_STYLE = {
  OPEN: 'bg-cyan-50 text-cyan-800 border-cyan-200',
  ACKNOWLEDGED: 'bg-amber-50 text-amber-700 border-amber-200',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CLOSED: 'bg-slate-100 text-slate-500 border-slate-200',
};

// The backend's real lifecycle, in order. The tracker only shows these.
const STATUS_ORDER = ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const STEPS = [
  { key: 'OPEN', label: 'Submitted', at: 'created_at' },
  { key: 'ACKNOWLEDGED', label: 'Acknowledged', at: 'acknowledged_at' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'RESOLVED', label: 'Resolved', at: 'resolved_at' },
  { key: 'CLOSED', label: 'Closed' },
];

const shortDate = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};
const fullDateTime = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
};

function StatusBadge({ status }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border whitespace-nowrap ${STATUS_STYLE[status] || STATUS_STYLE.OPEN}`}>
      ● {status.replace(/_/g, ' ')}
    </span>
  );
}

function StatusTracker({ g }) {
  const current = Math.max(0, STATUS_ORDER.indexOf(g.status));
  return (
    <ol className="flex items-start" aria-label="Complaint status">
      {STEPS.map((step, i) => {
        const reached = i <= current;
        const when = step.at ? shortDate(g[step.at]) : null;
        return (
          <li key={step.key} className="flex-1 min-w-0 relative text-center">
            {i > 0 && (
              <span className={`absolute top-[7px] right-1/2 w-full h-0.5 ${i <= current ? 'bg-cyan-600' : 'bg-slate-200'}`} aria-hidden="true" />
            )}
            <span className={`relative z-[1] mx-auto block w-3.5 h-3.5 rounded-full border-2 ${reached ? 'bg-cyan-600 border-cyan-600' : 'bg-white border-slate-300'}`} />
            <span className={`block mt-1 text-[10px] leading-tight ${reached ? 'font-bold text-navy-800' : 'text-slate-400'}`}>{step.label}</span>
            {when && reached && <span className="block text-[9px] text-slate-400">{when}</span>}
          </li>
        );
      })}
    </ol>
  );
}

function ComplaintCard({ g, expanded, onToggle }) {
  const cat = CATEGORY_LABEL[g.category];
  const CatIcon = cat?.icon || HelpCircle;
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-3 hover:border-cyan-300 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-cyan-800 flex items-center gap-1.5">
            <CatIcon className="w-3.5 h-3.5" /> {cat?.label || g.category}
          </p>
          <p className="font-mono text-xs font-bold text-navy-800 mt-0.5">{g.ticket_ref}</p>
          <p className="text-[10px] text-slate-500">Submitted {fullDateTime(g.created_at)}</p>
        </div>
        <StatusBadge status={g.status} />
      </div>

      <p className="mt-2 text-sm font-bold text-navy-800 leading-snug">{g.subject}</p>
      <p className={`text-xs text-slate-500 mt-0.5 ${expanded ? '' : 'line-clamp-2'}`}>{g.description}</p>

      <div className="mt-3 pt-2.5 border-t border-slate-100">
        <StatusTracker g={g} />
      </div>

      {expanded && (
        <div className="mt-3 space-y-2 text-xs">
          <dl className="grid grid-cols-2 gap-2">
            {g.related_booking_ref && (
              <div><dt className="text-[10px] uppercase text-slate-400 font-bold">Booking</dt><dd className="font-mono text-navy-800">{g.related_booking_ref}</dd></div>
            )}
            {g.priority && (
              <div><dt className="text-[10px] uppercase text-slate-400 font-bold">Priority</dt><dd className="text-navy-800">{g.priority}</dd></div>
            )}
            {g.escalation_level && (
              <div><dt className="text-[10px] uppercase text-slate-400 font-bold">Handled by</dt><dd className="text-navy-800">{String(g.escalation_level).replace(/_/g, ' ')}</dd></div>
            )}
          </dl>
          {g.resolution_notes && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
              <span className="text-[10px] font-bold text-emerald-700 uppercase">Response</span>
              <p className="text-xs text-navy-800 mt-0.5">{g.resolution_notes}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-2.5 flex items-center justify-between gap-2">
        {g.related_booking_ref && !expanded ? (
          <span className="text-[10px] font-mono text-slate-400 truncate">Booking: {g.related_booking_ref}</span>
        ) : <span />}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="px-3 py-1.5 rounded-lg bg-white border border-cyan-300 hover:bg-cyan-50 text-cyan-800 text-xs font-bold flex items-center gap-1"
        >
          {expanded ? 'Hide Details' : 'View Details'} <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </article>
  );
}

export function SupportCenter({ user, onRequireLogin }) {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [visibleCount, setVisibleCount] = useState(4);
  const subjectRef = useRef(null);

  const [category, setCategory] = useState('BOOKING');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [relatedBookingRef, setRelatedBookingRef] = useState('');

  useEffect(() => {
    if (user) fetchGrievances();
  }, [user]);

  // Complaint status changes when staff act on it, so quietly re-read the list
  // every 30s and when the tab regains focus.
  useEffect(() => {
    if (!user) return undefined;
    const refresh = () => {
      if (document.visibilityState === 'visible') fetchGrievances(true);
    };
    const timer = setInterval(refresh, 30000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [user]);

  const fetchGrievances = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await API.get('/grievances/my');
      setGrievances(res.data);
    } catch (err) {
      console.error('Failed to load grievances', err);
      if (!silent) setGrievances([]);
    } finally {
      if (!silent) setLoading(false);
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

  const field = 'w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-navy-800 placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 focus:outline-none transition';
  const label = 'block text-xs font-bold text-navy-800 mb-1';
  const shown = grievances.slice(0, visibleCount);

  return (
    <div className="max-w-6xl mx-auto space-y-3.5">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-lg flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center justify-center shrink-0"><LifeBuoy className="w-5 h-5" /></span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-cyan-800 uppercase tracking-wider">Grievance Redressal</p>
          <h2 className="font-serif text-2xl font-black text-navy-800 leading-tight">Support Center</h2>
          <p className="text-xs text-slate-500">Every complaint is logged and tracked through resolution — you can check its status at any time.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-3.5 items-start">
        {/* Submit Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center justify-center"><Pencil className="w-4 h-4" /></span>
            <div>
              <h3 className="font-serif text-lg font-black text-navy-800 leading-tight">Raise a Complaint</h3>
              <p className="text-[11px] text-slate-500">Tell us what happened and we&apos;ll help you resolve it.</p>
            </div>
          </div>

          <div>
            <span className={label}>Category</span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5" role="radiogroup" aria-label="Category">
              {CATEGORY_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = category === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setCategory(opt.value)}
                    className={`px-1.5 py-2 rounded-lg text-[11px] font-bold border flex flex-col items-center justify-center gap-1 text-center leading-tight transition-colors min-h-[58px] ${
                      active
                        ? 'bg-cyan-700 text-white border-cyan-700 shadow'
                        : 'bg-white text-navy-800 border-slate-200 hover:border-cyan-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" /> {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="support-subject" className={label}>Subject</label>
              <input
                id="support-subject"
                ref={subjectRef}
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Briefly describe your issue"
                maxLength={150}
                required
                className={field}
              />
            </div>
            <div>
              <label htmlFor="support-ref" className={label}>
                Related Booking Reference <span className="ml-1 px-1.5 py-0.5 rounded bg-slate-100 text-[9px] font-semibold text-slate-500 align-middle">Optional</span>
              </label>
              <input
                id="support-ref"
                type="text"
                value={relatedBookingRef}
                onChange={(e) => setRelatedBookingRef(e.target.value)}
                placeholder="e.g. AN-2026-ORD-91821"
                className={`${field} font-mono`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="support-desc" className={label}>Describe your issue</label>
            <textarea
              id="support-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What happened, where, and when?"
              required
              className={`${field} resize-y`}
            />
            <p className="mt-1 text-[11px] text-slate-500 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 mt-px shrink-0 text-slate-400" />
              Please include your booking ID, date, location and any relevant details to help us resolve your complaint faster.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-6 py-2.5 bg-cyan-700 hover:bg-cyan-600 hover:-translate-y-px active:translate-y-0 text-white font-bold rounded-lg text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            <Send className="w-4 h-4" /> {submitting ? 'Submitting...' : 'Submit Complaint'}
          </button>
        </form>

        {/* My Complaints */}
        <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center justify-center"><FileText className="w-4 h-4" /></span>
              <div>
                <h3 className="font-serif text-lg font-black text-navy-800 leading-tight">
                  My Complaints {grievances.length > 0 && <span className="font-sans text-sm font-semibold text-slate-500">({grievances.length})</span>}
                </h3>
                <p className="text-[11px] text-slate-500">Track the status of complaints you&apos;ve submitted.</p>
              </div>
            </div>
            <button
              onClick={() => fetchGrievances()}
              disabled={loading}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-navy-800 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          {loading && grievances.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">Loading...</div>
          ) : grievances.length === 0 ? (
            <div className="text-center py-8 rounded-xl border border-dashed border-slate-200 bg-slate-50/60">
              <MessagesSquare className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
              <p className="text-sm font-bold text-navy-800">No Complaints Yet</p>
              <p className="text-xs text-slate-500 mt-0.5 mb-3">You haven&apos;t submitted any complaints.</p>
              <button
                type="button"
                onClick={() => subjectRef.current?.focus()}
                className="px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-lg text-xs shadow"
              >
                Raise a Complaint
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 lg:max-h-[560px] lg:overflow-y-auto lg:pr-1">
              {shown.map((g) => (
                <ComplaintCard
                  key={g.id}
                  g={g}
                  expanded={expandedId === g.id}
                  onToggle={() => setExpandedId(expandedId === g.id ? null : g.id)}
                />
              ))}
              {grievances.length > visibleCount && (
                <button
                  type="button"
                  onClick={() => setVisibleCount((n) => n + 4)}
                  className="w-full py-2 rounded-lg bg-white border border-cyan-300 hover:bg-cyan-50 text-cyan-800 text-xs font-bold"
                >
                  Show more ({grievances.length - visibleCount} remaining)
                </button>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Trust bar */}
      <section className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Lock, title: 'Secure & Confidential', sub: 'Your information is safe with us' },
          { icon: Timer, title: 'Quick Resolution', sub: 'We aim to resolve your complaint faster' },
          { icon: Headphones, title: 'Dedicated Support', sub: 'Our team is here to help you' },
          { icon: SearchCheck, title: 'Track Your Complaints', sub: 'Check status anytime, anywhere' },
        ].map(({ icon: Icon, title, sub }) => (
          <div key={title} className="flex items-center gap-3">
            <Icon className="w-6 h-6 text-cyan-700 shrink-0" />
            <div>
              <p className="text-sm font-bold text-navy-800 leading-tight">{title}</p>
              <p className="text-xs text-slate-500">{sub}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
