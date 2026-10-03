import React from 'react';
import {
  Ship, Calendar, Clock, MapPin, Armchair, ArrowLeftRight, ArrowRight, Search, Heart,
  Snowflake, UtensilsCrossed, Luggage, Bath, Star, Info, BadgeCheck, Ticket, ShieldCheck, CalendarClock,
  ArrowDownUp, Zap, Check, Wifi, Users
} from 'lucide-react';

const PORT_SHORT_NAME = { PORT_BLAIR: 'Port Blair', HAVELOCK: 'Havelock', NEIL: 'Neil' };
const PORT_LONG_NAME = {
  PORT_BLAIR: 'Port Blair (Phoenix Bay)',
  HAVELOCK: 'Havelock (Swaraj Dweep)',
  NEIL: 'Neil (Shaheed Dweep)',
};

// Icons for amenity labels. The labels themselves come from the vessel record
// in the database (Vessel.amenities); only the icon is picked here.
const AMENITY_ICONS = [
  [/air|a\/c|ac\b/i, Snowflake],
  [/seat|recline/i, Armchair],
  [/snack|cafe|food|meal|canteen/i, UtensilsCrossed],
  [/rest ?room|toilet|washroom/i, Bath],
  [/luggage|baggage/i, Luggage],
  [/wi-?fi/i, Wifi],
];
const amenityIcon = (label) => (AMENITY_ICONS.find(([re]) => re.test(label)) || [null, Check])[1];

const formatDuration = (mins) => {
  if (mins == null) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h ? `${h} hr${h > 1 ? 's' : ''}` : ''}${h && m ? ' ' : ''}${m ? `${m} mins` : ''}`;
};

function formatTime12(t) {
  const m = /^(\d{1,2}):(\d{2})/.exec(t || '');
  if (!m) return t;
  const h = parseInt(m[1], 10);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, '0')}:${m[2]} ${h >= 12 ? 'PM' : 'AM'}`;
}

/* ------------------------------------------------------------------ */
export function HeroBanner() {
  return (
    <section
      className="relative h-44 sm:h-56 flex items-center overflow-hidden bg-navy-800"
      style={{
        backgroundImage: "linear-gradient(90deg, rgba(5,26,48,0.82) 0%, rgba(5,26,48,0.45) 45%, rgba(5,26,48,0.05) 100%), url('/images/ferry-catamaran.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center 47%',
      }}
    >
      <div className="max-w-7xl w-full mx-auto px-4 pb-10">
        <p className="text-[11px] font-bold tracking-[0.2em] text-cyan-200 uppercase">Ferry Booking</p>
        <h1 className="font-serif text-3xl sm:text-5xl font-black text-white leading-tight">Explore Islands by Sea</h1>
        <p className="text-sm sm:text-base text-slate-100 mt-1">
          Safe <span className="mx-2 opacity-60">|</span> Comfortable <span className="mx-2 opacity-60">|</span> Scenic Journeys
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
export function FerryRouteSearch({
  ports, sourcePort, setSourcePort, destinationPort, setDestinationPort,
  travelDate, setTravelDate, onSwap, onSubmit, loading,
}) {
  const field = 'w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-navy-800 focus:border-cyan-500 focus:outline-none';
  const label = 'text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5';
  return (
    <form
      onSubmit={onSubmit}
      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-lg grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_auto_1fr_220px_auto] gap-4 items-end"
    >
      <div>
        <label className={label}><MapPin className="w-3.5 h-3.5 text-cyan-600" /> Origin Port</label>
        <select value={sourcePort} onChange={(e) => setSourcePort(e.target.value)} className={field}>
          {ports.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <button
        type="button"
        onClick={onSwap}
        title="Swap origin & destination"
        className="hidden lg:flex w-10 h-10 items-center justify-center rounded-full bg-slate-50 hover:bg-cyan-50 text-slate-600 hover:text-cyan-700 border border-slate-200 transition-colors mb-0.5"
      >
        <ArrowLeftRight className="w-4 h-4" />
      </button>

      <div>
        <label className={label}><MapPin className="w-3.5 h-3.5 text-cyan-600" /> Destination Port</label>
        <select value={destinationPort} onChange={(e) => setDestinationPort(e.target.value)} className={field}>
          {ports.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div>
        <label className={label}><Calendar className="w-3.5 h-3.5 text-cyan-600" /> Departure Date</label>
        <input type="date" value={travelDate} onChange={(e) => setTravelDate(e.target.value)} className={`${field} font-mono`} />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full lg:w-auto px-7 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold rounded-xl text-sm shadow-md transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
      >
        <Search className="w-4 h-4" /> {loading ? 'Checking...' : 'Find Sailings'}
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
export function AmenityBadge({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
      <Icon className="w-3.5 h-3.5 text-cyan-700" /> {label}
    </span>
  );
}

export function FareCard({ cabin }) {
  const low = cabin.available_seats <= 5;
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-left">
      <span className="text-xs text-slate-500 font-semibold capitalize block">{cabin.cabin_class.toLowerCase()}</span>
      <span className="text-xl font-black text-navy-800 leading-tight block">₹{cabin.starting_price_inr.toLocaleString('en-IN')}</span>
      <span className={`text-xs font-semibold ${low ? 'text-amber-600' : 'text-emerald-600'}`}>
        {cabin.available_seats} seats left
      </span>
    </div>
  );
}

export function SailingCard({ trip, badge, isFavorite, onToggleFavorite, onSelect }) {
  const route = `${PORT_LONG_NAME[trip.source_port] || trip.source_port} → ${PORT_LONG_NAME[trip.destination_port] || trip.destination_port}`;
  const duration = formatDuration(trip.duration_minutes);

  return (
    <article className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm hover:shadow-md hover:border-cyan-300 transition-all grid grid-cols-1 lg:grid-cols-[300px_1fr_auto] gap-5">
      <div className="relative h-44 lg:h-full min-h-[150px] rounded-xl overflow-hidden bg-gradient-to-br from-navy-700 to-cyan-700">
        {trip.vessel_image_url ? (
          <img src={trip.vessel_image_url} alt={trip.vessel_name} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        ) : (
          <Ship className="absolute inset-0 m-auto w-12 h-12 text-white/40" />
        )}
        {badge && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/95 text-xs font-bold text-navy-800 flex items-center gap-1 shadow">
            {badge.icon === 'star' ? <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" /> : <BadgeCheck className="w-3.5 h-3.5 text-cyan-700" />}
            {badge.label}
          </span>
        )}
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? `Remove ${trip.vessel_name} from favourites` : `Add ${trip.vessel_name} to favourites`}
          title={isFavorite ? 'Remove from favourites' : 'Add to favourites'}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-navy-900/70 hover:bg-navy-900 text-white flex items-center justify-center transition-colors"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
        </button>
      </div>

      <div className="min-w-0 py-1">
        <h4 className="font-serif text-xl font-black text-navy-800 leading-tight">{trip.vessel_name}</h4>
        <p className="text-sm text-slate-500">{trip.operator_name}</p>

        <div className="mt-3 flex flex-wrap items-start gap-x-6 gap-y-3">
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-cyan-700 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-navy-800">{formatTime12(trip.departure_time)} <span className="font-semibold text-slate-600">Departure</span></p>
              <p className="text-[11px] text-slate-500">{route}</p>
            </div>
          </div>
          {trip.arrival_time && (
            <div className="flex items-start gap-2 lg:border-l lg:border-slate-200 lg:pl-6">
              <Clock className="w-4 h-4 text-cyan-700 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-navy-800">{formatTime12(trip.arrival_time)} <span className="font-semibold text-slate-600">Arrival</span></p>
                {duration && <p className="text-[11px] text-slate-500">Travel time: ~ {duration}</p>}
              </div>
            </div>
          )}
        </div>

        {trip.amenities?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {trip.amenities.map((label) => <AmenityBadge key={label} icon={amenityIcon(label)} label={label} />)}
          </div>
        )}
      </div>

      <div className="flex flex-col justify-between gap-3 lg:w-[420px]">
        <div className="grid grid-cols-3 gap-2.5">
          {trip.cabins.map((c) => <FareCard key={c.cabin_class} cabin={c} />)}
        </div>
        <button
          type="button"
          onClick={onSelect}
          className="w-full px-5 py-3 bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md transition-colors"
        >
          <Armchair className="w-4 h-4" /> Select Cabin Seats <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
const totalSeats = (t) => t.cabins.reduce((n, c) => n + c.available_seats, 0);
const cheapest = (t) => Math.min(...t.cabins.map((c) => c.starting_price_inr));

export function SailingList({
  trips, travelDate, sort, setSort, onSelect, children,
  favorites, onToggleFavorite, favoritesOnly, setFavoritesOnly, lastUpdated,
}) {
  const earliest = [...trips].sort((a, b) => (a.departure_time || '').localeCompare(b.departure_time || ''))[0];
  const mostSeats = trips.reduce((best, t) => (!best || totalSeats(t) > totalSeats(best) ? t : best), null);

  const visible = trips
    .filter((t) => !favoritesOnly || favorites.has(t.vessel_id))
    .sort((a, b) => {
      if (sort === 'price') return cheapest(a) - cheapest(b);
      if (sort === 'seats') return totalSeats(b) - totalSeats(a);
      return (a.departure_time || '').localeCompare(b.departure_time || '');
    });

  const prettyDate = (() => {
    const d = new Date(`${travelDate}T00:00:00`);
    return Number.isNaN(d.getTime()) ? travelDate : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  })();

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-serif text-2xl font-black text-navy-800 flex items-center gap-3">
          <span className="w-11 h-11 rounded-full bg-white border border-cyan-200 text-cyan-700 flex items-center justify-center shadow-sm"><Ship className="w-5 h-5" /></span>
          Available Sailings for {prettyDate}
        </h3>
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <button
            type="button"
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            aria-pressed={favoritesOnly}
            className={`px-3 py-2 rounded-xl border text-sm font-semibold flex items-center gap-1.5 transition-colors ${
              favoritesOnly ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Heart className={`w-4 h-4 ${favoritesOnly ? 'fill-red-500 text-red-500' : ''}`} /> Favourites
          </button>
          <label className="flex items-center gap-2 font-semibold">
            <ArrowDownUp className="w-4 h-4 text-slate-500" /> Sort by
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-navy-800">
              <option value="time">Departure Time (Earliest)</option>
              <option value="price">Price (Lowest)</option>
              <option value="seats">Seats Available (Most)</option>
            </select>
          </label>
        </div>
      </div>

      <p className="text-xs text-slate-500 text-right -mt-2">
        {visible.length} of {trips.length} vessel(s) · Prices are per passenger
        {lastUpdated && <> · Live seats, updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</>}
      </p>

      {children}

      {favoritesOnly && trips.length > 0 && visible.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-500">
          None of these sailings are on your favourite vessels. Tap the heart on a ferry to save it.
        </div>
      )}

      {visible.map((trip) => {
        let badge = null;
        if (trips.length > 1) {
          if (trip.schedule_id === earliest?.schedule_id) badge = { label: 'Earliest', icon: 'star' };
          else if (trip.schedule_id === mostSeats?.schedule_id) badge = { label: 'Most seats', icon: 'check' };
        }
        return (
          <SailingCard
            key={trip.schedule_id}
            trip={trip}
            badge={badge}
            isFavorite={favorites.has(trip.vessel_id)}
            onToggleFavorite={() => onToggleFavorite(trip)}
            onSelect={() => onSelect(trip)}
          />
        );
      })}
    </section>
  );
}

/* ------------------------------------------------------------------ */
export function ImportantInformation() {
  const items = [
    { icon: Ticket, title: 'Carry valid ID proof', sub: 'Required during boarding' },
    { icon: CalendarClock, title: 'Reach 60 mins early', sub: 'For smooth boarding process' },
    { icon: ShieldCheck, title: 'Follow safety guidelines', sub: 'As per administration rules' },
    { icon: Zap, title: 'Schedules are subject to change', sub: 'Due to weather conditions' },
  ];
  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row lg:items-center gap-4">
      <div className="flex items-center gap-3 lg:pr-6 lg:border-r lg:border-slate-200">
        <span className="w-9 h-9 rounded-full bg-cyan-700 text-white flex items-center justify-center"><Info className="w-5 h-5" /></span>
        <h4 className="font-bold text-navy-800 whitespace-nowrap">Important Information</h4>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
        {items.map(({ icon: Icon, title, sub }) => (
          <div key={title} className="flex items-center gap-3">
            <Icon className="w-6 h-6 text-cyan-700 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-navy-800 leading-tight">{title}</p>
              <p className="text-xs text-slate-500">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
