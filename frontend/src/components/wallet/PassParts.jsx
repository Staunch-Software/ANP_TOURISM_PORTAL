import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Ship, Landmark, CalendarDays, Clock, Download, MoreVertical, XCircle, Info, BadgeCheck,
  IdCard, ShieldCheck, Search, ArrowDownUp, Ticket,
} from 'lucide-react';

const PORT_NAME = {
  PORT_BLAIR: 'Port Blair (Phoenix Bay)',
  HAVELOCK: 'Havelock (Swaraj Dweep)',
  NEIL: 'Neil (Shaheed Dweep)',
};
const ISLAND_NAME = { PORT_BLAIR: 'Port Blair', HAVELOCK: 'Havelock', NEIL: 'Neil' };

const pretty = (code) => ISLAND_NAME[code] || (code ? code.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '');

export const fmtDate = (iso) => {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const fmtTime = (hhmm) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm || '');
  if (!m) return null;
  const h = parseInt(m[1], 10);
  return `${String(h % 12 === 0 ? 12 : h % 12).padStart(2, '0')}:${m[2]} ${h >= 12 ? 'PM' : 'AM'}`;
};

export const fmtTimeRange = (ent) => {
  const a = fmtTime(ent.start_time);
  const b = fmtTime(ent.end_time);
  return a && b ? `${a} – ${b}` : a || null;
};

/* Date a pass is for: the earliest dated entitlement in the booking. */
const entStart = (ent) => (ent.travel_date ? new Date(`${ent.travel_date}T${ent.start_time || '00:00'}:00`) : null);
export const passStart = (pass) => {
  const dates = pass.entitlements.map(entStart).filter(Boolean);
  return dates.length ? new Date(Math.min(...dates.map((d) => d.getTime()))) : null;
};
const entEnd = (ent) => (ent.travel_date ? new Date(`${ent.travel_date}T${ent.end_time || ent.start_time || '23:59'}:00`) : null);

/* upcoming | used | expired | cancelled */
export const classifyPass = (pass, now = new Date()) => {
  if (pass.order_status === 'CANCELLED') return 'cancelled';
  if (pass.entitlements.length && pass.entitlements.every((e) => e.check_in_status === 'CHECKED_IN')) return 'used';
  const ends = pass.entitlements.map(entEnd).filter(Boolean);
  if (ends.length && ends.every((d) => d < now)) return 'expired';
  return 'upcoming';
};

const STATUS_CHIP = {
  upcoming: { label: 'UPCOMING', cls: 'bg-cyan-50 text-cyan-800 border-cyan-200', icon: Clock },
  used: { label: 'USED', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: BadgeCheck },
  expired: { label: 'EXPIRED', cls: 'bg-slate-100 text-slate-600 border-slate-200', icon: Clock },
  cancelled: { label: 'CANCELLED', cls: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
};

export function StatusChip({ status }) {
  const c = STATUS_CHIP[status];
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold tracking-wide border ${c.cls}`}>
      <Icon className="w-3.5 h-3.5" /> {c.label}
    </span>
  );
}

/* One entitlement, laid out from the backend's structured fields. */
export function TripLines({ ent, dim }) {
  const isFerry = ent.item_type === 'FERRY';
  const Icon = isFerry ? Ship : Landmark;
  const route = isFerry && ent.source_port && ent.destination_port
    ? `${PORT_NAME[ent.source_port] || pretty(ent.source_port)} → ${PORT_NAME[ent.destination_port] || pretty(ent.destination_port)}`
    : ent.location ? `${pretty(ent.location)}, Andaman` : null;
  const date = fmtDate(ent.travel_date);
  const time = fmtTimeRange(ent);
  return (
    <div className="flex items-start gap-2.5 min-w-0">
      <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${dim ? 'text-slate-400' : 'text-cyan-700'}`} />
      <div className="min-w-0">
        <p className="text-sm font-bold text-navy-800 leading-snug">{isFerry ? 'Ferry: ' : ''}{ent.title}</p>
        {route && <p className="text-xs text-slate-500">{route}</p>}
        {(date || time) && (
          <p className={`mt-1 text-sm font-semibold flex items-center gap-1.5 flex-wrap ${dim ? 'text-slate-500' : 'text-navy-800'}`}>
            <CalendarDays className="w-4 h-4 text-slate-400" />
            {date}
            {date && time && <span className="text-slate-300">|</span>}
            {time}
          </p>
        )}
        {isFerry && ent.seat_info && <p className="text-xs text-slate-500 mt-0.5">Seat {ent.seat_info}</p>}
      </div>
    </div>
  );
}

function CardImage({ ent }) {
  if (!ent?.image_url) return null;
  return (
    <img
      src={ent.image_url}
      alt={ent.title}
      loading="lazy"
      className="print-hide hidden sm:block xl:hidden 2xl:block w-[130px] h-[96px] object-cover rounded-xl border border-slate-200 shrink-0"
    />
  );
}

/* ------------------------------------------------------------------ */
export function PassCard({ pass, status, onZoom, onDetails, onPrint, menuOpen, onToggleMenu, menuItems }) {
  const cancelled = status === 'cancelled';
  const [first, ...rest] = pass.entitlements;
  const dim = cancelled || status === 'expired';

  return (
    <article data-pass-card={pass.booking_ref} className={`rounded-2xl border p-4 shadow-sm ${cancelled ? 'bg-red-50/50 border-red-200' : 'bg-white border-slate-200 hover:border-cyan-300 transition-colors'}`}>
      <div className="flex flex-col sm:flex-row gap-4">
        {/* QR */}
        <div className="shrink-0 w-[140px] sm:w-[112px] mx-auto sm:mx-0 flex flex-col items-center gap-2">
          {cancelled ? (
            <div className="w-full h-[150px] rounded-xl border-2 border-dashed border-red-200 bg-white/60 flex flex-col items-center justify-center text-center">
              <XCircle className="w-8 h-8 text-red-400 mb-1" />
              <span className="text-xs font-extrabold text-red-500">QR VOID</span>
              <span className="text-[10px] text-red-400 mt-0.5 px-1">Booking cancelled</span>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={onZoom}
                title="Tap to enlarge"
                className={`w-full bg-white rounded-xl border p-2 hover:border-cyan-400 transition-colors ${dim ? 'border-slate-200 opacity-60' : 'border-slate-200'}`}
              >
                <QRCodeSVG value={pass.qr_token} size={100} level="M" includeMargin={false} style={{ width: '100%', height: 'auto' }} />
                <span className="block text-[10px] text-slate-500 mt-1 text-center">Tap to enlarge</span>
              </button>
              {status === 'upcoming' && (
                <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold tracking-wide">
                  SCAN AT ENTRY
                </span>
              )}
            </>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <StatusChip status={status} />
              <h3 className="font-serif text-xl font-black text-navy-800 leading-tight mt-1.5 truncate">{pass.lead_passenger_name}</h3>
            </div>
            {cancelled && <RefundSummary pass={pass} />}
          </div>

          <div className="mt-2 space-y-2.5">
            {first && <TripLines ent={first} dim={dim} />}
            {rest.length > 0 && (
              <p className="text-xs text-slate-500 pl-7">
                + {rest.length} more in this booking: {rest.map((e) => e.title).filter((t, i, a) => a.indexOf(t) === i).join(', ')}
              </p>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Order <span className="font-mono">{pass.order_ref}</span></p>

          <div className="print-hide mt-auto pt-3 flex items-center justify-end gap-2 relative flex-wrap">
            <button
              type="button"
              onClick={onDetails}
              className="px-3.5 py-2 rounded-lg bg-white border border-cyan-300 hover:bg-cyan-50 text-cyan-800 text-xs font-bold transition-colors"
            >
              View Details
            </button>
            {!cancelled && (
              <button
                type="button"
                onClick={onPrint}
                className="px-3.5 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Download Pass
              </button>
            )}
            {menuItems.length > 0 && (
              <>
                <button
                  type="button"
                  aria-label="More actions"
                  onClick={onToggleMenu}
                  className="w-9 h-9 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 flex items-center justify-center"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 bottom-11 z-20 w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 text-xs font-semibold">
                    {menuItems.map((m) => (
                      <button
                        key={m.label}
                        type="button"
                        disabled={m.disabled}
                        onClick={m.onClick}
                        className={`w-full text-left px-3 py-2 flex items-center gap-2 disabled:opacity-50 ${m.danger ? 'text-red-600 hover:bg-red-50' : 'text-navy-800 hover:bg-slate-50'}`}
                      >
                        <m.icon className={`w-4 h-4 ${m.danger ? '' : 'text-cyan-700'}`} /> {m.label}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {!cancelled && <CardImage ent={first} />}
      </div>
    </article>
  );
}

function RefundSummary({ pass }) {
  const when = pass.cancelled_at ? new Date(pass.cancelled_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : null;
  if (pass.refund_status === 'PROCESSED') {
    return (
      <div className="text-right shrink-0">
        <p className="text-lg font-black text-red-600 leading-tight">₹{pass.refund_amount?.toFixed(2)}</p>
        <p className="text-[11px] text-slate-500">Refunded{when ? ` on ${when}` : ''}</p>
      </div>
    );
  }
  if (pass.refund_status === 'FAILED') {
    return <p className="text-[11px] text-red-700 font-semibold text-right max-w-[150px]">Refund pending — support has been notified</p>;
  }
  if (pass.refund_status === 'NOT_APPLICABLE') {
    return <p className="text-[11px] text-slate-500 text-right max-w-[150px]">No payment on record, no refund needed</p>;
  }
  return null;
}

/* ------------------------------------------------------------------ */
const FILTERS = [
  ['all', 'All Passes'],
  ['upcoming', 'Upcoming'],
  ['used', 'Used'],
  ['expired', 'Expired'],
  ['cancelled', 'Cancelled'],
];

export function PassFilterBar({ counts, filter, setFilter, query, setQuery, sort, setSort }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm flex flex-col lg:flex-row lg:items-center gap-3">
      <div className="flex flex-wrap gap-2">
        {FILTERS.filter(([key]) => key !== 'expired' || counts.expired > 0).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            aria-pressed={filter === key}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              filter === key ? 'bg-cyan-700 text-white shadow' : 'bg-slate-50 text-navy-800 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {label} ({counts[key]})
          </button>
        ))}
      </div>
      <div className="flex-1 flex flex-col sm:flex-row gap-3 lg:justify-end">
        <label className="relative flex-1 lg:max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by booking ID, attraction or ferry..."
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-navy-800 focus:border-cyan-500 focus:outline-none"
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          <ArrowDownUp className="w-4 h-4 text-slate-500" /> Sort by
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-navy-800">
            <option value="latest">Travel Date (Latest)</option>
            <option value="earliest">Travel Date (Earliest)</option>
          </select>
        </label>
      </div>
    </div>
  );
}

export function PassSection({ title, count, hint, icon: Icon, tone = 'cyan', children }) {
  const toneCls = tone === 'red' ? 'text-red-500 border-red-200' : tone === 'slate' ? 'text-slate-500 border-slate-300' : 'text-cyan-700 border-cyan-300';
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-serif text-xl font-black text-navy-800 flex items-center gap-2.5">
          <span className={`w-9 h-9 rounded-full bg-white border-2 flex items-center justify-center ${toneCls}`}><Icon className="w-5 h-5" /></span>
          {title} <span className="font-sans text-base font-semibold text-slate-500">({count})</span>
        </h3>
        {hint && <p className="hidden sm:block text-xs text-slate-500">{hint}</p>}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">{children}</div>
    </section>
  );
}

export function PassInfoBar() {
  const items = [
    { icon: ShieldCheck, title: 'Secure & Valid', sub: 'Cryptographically signed digital pass' },
    { icon: IdCard, title: 'Carry Valid ID Proof', sub: 'Required during boarding/entry' },
    { icon: Clock, title: 'Arrive on Time', sub: 'Reach 60 mins early for smooth boarding' },
    { icon: Info, title: 'Schedules Subject to Change', sub: 'Due to weather and operational conditions' },
  ];
  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map(({ icon: Icon, title, sub }) => (
        <div key={title} className="flex items-center gap-3">
          <Icon className="w-7 h-7 text-cyan-700 shrink-0" />
          <div>
            <p className="text-sm font-bold text-navy-800 leading-tight">{title}</p>
            <p className="text-xs text-slate-500">{sub}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

export { Ticket };
