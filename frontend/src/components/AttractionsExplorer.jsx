import React, { useState, useEffect } from 'react';
import API from '../api/client';
import * as Select from '@radix-ui/react-select';
import {
  MapPin, Users, ArrowRight, Calendar, ChevronDown, Landmark, Sparkles, Waves, SearchX, X, Clock, Timer, Trees, Mountain, Filter
} from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';

export const ATTRACTION_IMAGES = {
  "Cellular Jail National Memorial": "/images/cellular-jail.jpg",
  "Cellular Jail Light & Sound Show": "/images/cellular-jail-corridor.jpg",
  "Ross Island (Netaji Subhash Chandra Bose Dweep)": "/images/ross-island-church-ruins.jpg",
  "Elephant Beach Scuba Diving & Sea Walk": "/images/scuba-diving.jpg",
  "North Bay Coral Glass-Bottom Safari": "/images/north-bay-glassboat.jpg",
};

// Small per-category variations so the cards don't all read the same.
const CATEGORY_STYLE = {
  MONUMENT: { icon: Landmark, label: 'Monument', badge: 'bg-amber-50 text-amber-800', bar: 'bg-amber-400' },
  LIGHT_SOUND: { icon: Sparkles, label: 'Light & Sound Show', badge: 'bg-indigo-50 text-indigo-700', bar: 'bg-indigo-400' },
  WATER_SPORT: { icon: Waves, label: 'Water Sport', badge: 'bg-cyan-50 text-cyan-800', bar: 'bg-cyan-500' },
  NATURE: { icon: Trees, label: 'Nature', badge: 'bg-emerald-50 text-emerald-700', bar: 'bg-emerald-400' },
  ADVENTURE: { icon: Mountain, label: 'Adventure', badge: 'bg-orange-50 text-orange-700', bar: 'bg-orange-400' },
};
const FALLBACK_CATEGORY = { badge: 'bg-slate-100 text-slate-700', bar: 'bg-slate-400' };

export const ISLAND_LABELS = {
  PORT_BLAIR: 'Port Blair',
  HAVELOCK: 'Havelock (Swaraj Dweep)',
  NEIL: 'Neil (Shaheed Dweep)',
};

export const FALLBACK_IMAGE = "/images/hero-lagoon.jpg";

// "16:00" -> "4:00 PM"
const formatClock = (hhmm) => {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
};

// 150 -> "2 hr 30 min", 60 -> "1 hr", 45 -> "45 min"
const formatDuration = (minutes) => {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h ? `${h} hr` : '', m ? `${m} min` : ''].filter(Boolean).join(' ');
};

// RFP p.24: attraction opening/closing hours and estimated exploration time.
// Renders nothing for attractions that don't have them yet.
function AttractionFacts({ item, className = '' }) {
  const hours = item.opening_time && item.closing_time
    ? `${formatClock(item.opening_time)} – ${formatClock(item.closing_time)}`
    : '';
  const duration = formatDuration(item.estimated_exploration_minutes);
  if (!hours && !duration) return null;

  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 ${className}`}>
      {hours && (
        <span className="flex items-center gap-1" title="Opening hours">
          <Clock className="w-3.5 h-3.5 text-cyan-600" /> {hours}
        </span>
      )}
      {duration && (
        <span className="flex items-center gap-1" title="Estimated time to explore">
          <Timer className="w-3.5 h-3.5 text-cyan-600" /> ~{duration}
        </span>
      )}
    </div>
  );
}

export function AttractionsExplorer({ onAddToCart, onRequireLogin, user, focusRequest }) {
  const [attractions, setAttractions] = useState([]);
  const [selectedIsland, setSelectedIsland] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [nationality, setNationality] = useState('INDIAN');
  const [selectedAttraction, setSelectedAttraction] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [passengerName, setPassengerName] = useState('');
  const [passengerAge, setPassengerAge] = useState('');
  const [passengerGender, setPassengerGender] = useState('MALE');
  const [passengerId, setPassengerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // RFP p.25: the list of visitor names is pre-filled from the tourist's
  // booking history; they confirm who is coming, add new people, or untick
  // anyone. pickedAges: ticked visitors (key -> their editable age).
  // cartItems: what is already in the cart, so nobody is added to the same
  // slot twice.
  const [savedVisitors, setSavedVisitors] = useState([]);
  const [pickedAges, setPickedAges] = useState({});
  const [cartItems, setCartItems] = useState([]);
  const selectedVisitDate = new Date(`${selectedDate}T00:00:00`);

  useEffect(() => {
    fetchAttractions();
  }, [selectedIsland]);

  // Deep-link from the homepage "Discover the Islands" cards: jump to the
  // right island filter and, if a specific attraction is named, open its
  // slot-booking drawer directly instead of leaving the user to find it.
  useEffect(() => {
    if (!focusRequest) return;
    if (focusRequest.date) setSelectedDate(focusRequest.date);
    if (focusRequest.island && focusRequest.island !== selectedIsland) {
      setSelectedIsland(focusRequest.island);
      return;
    }
    if (focusRequest.attractionTitle) {
      const match = attractions.find((a) => a.title === focusRequest.attractionTitle);
      if (match) openSlotDrawer(match);
    }
  }, [focusRequest, selectedIsland, attractions]);

  const fetchAttractions = async () => {
    setLoading(true);
    try {
      const url = selectedIsland === 'ALL' ? '/attractions' : `/attractions?island=${selectedIsland}`;
      const res = await API.get(url);
      setAttractions(res.data);
    } catch (err) {
      console.error("Failed to load attractions", err);
    } finally {
      setLoading(false);
    }
  };

  const openSlotDrawer = async (item) => {
    setSelectedAttraction(item);
    setSelectedSlot(null);
    setIsCalendarOpen(false);
    try {
      const res = await API.get(`/attractions/${item.id}/slots?target_date=${selectedDate}`);
      setAvailableSlots(res.data);
    } catch (err) {
      alert("Failed to load slots for this date");
    }
  };

  const handleDateChange = async (newDate) => {
    setSelectedDate(newDate);
    setSelectedSlot(null);
    if (selectedAttraction) {
      try {
        const res = await API.get(`/attractions/${selectedAttraction.id}/slots?target_date=${newDate}`);
        setAvailableSlots(res.data);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const visitorKey = (v) => `${v.id_type}:${v.id_number}`;

  useEffect(() => {
    setPickedAges({});
    if (!selectedAttraction || !user) {
      setSavedVisitors([]);
      setCartItems([]);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const [vis, cart] = await Promise.all([API.get('/cart/saved-visitors'), API.get('/cart')]);
        if (!cancelled) {
          setSavedVisitors(vis.data);
          setCartItems(cart.data.items || []);
        }
      } catch (err) {
        if (!cancelled) {
          setSavedVisitors([]);
          setCartItems([]);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [selectedAttraction, user]);

  const togglePicked = (v) => {
    const key = visitorKey(v);
    setPickedAges((cur) => {
      const next = { ...cur };
      if (key in next) delete next[key];
      else next[key] = v.age == null ? '' : String(v.age);
      return next;
    });
  };

  const isInCart = (v) =>
    !!selectedSlot &&
    cartItems.some(
      (i) => i.slot_id === selectedSlot.slot_id && (i.id_number || '').toUpperCase() === v.id_number.toUpperCase()
    );

  const handleConfirmAddToCart = async (e) => {
    e.preventDefault();
    if (!user) {
      onRequireLogin();
      return;
    }
    if (!selectedSlot) {
      alert("Please select a time slot");
      return;
    }

    // Age decides whether a visitor counts toward the 6-adult or the
    // 12-child limit per booking (RFP p.25), so it has to be real.
    const validAge = (value) => {
      const age = parseInt(value, 10);
      return Number.isNaN(age) || age < 0 || age > 120 ? null : age;
    };

    const passengers = [];
    for (const v of savedVisitors) {
      const key = visitorKey(v);
      if (!(key in pickedAges) || isInCart(v)) continue;
      const age = validAge(pickedAges[key]);
      if (age === null) {
        alert(`Please enter a valid age (0-120) for ${v.name}`);
        return;
      }
      passengers.push({
        name: v.name, age, gender: v.gender || 'MALE',
        id_type: v.id_type, id_number: v.id_number, nationality: v.nationality,
      });
    }

    // A new visitor is added when the fields are filled, or when nobody was
    // ticked (the original single-visitor flow).
    const newFilled = !!(passengerName.trim() || passengerId.trim() || passengerAge !== '');
    if (newFilled || passengers.length === 0) {
      const age = validAge(passengerAge);
      if (age === null) {
        alert("Please enter the visitor's age (0-120)");
        return;
      }
      passengers.push({
        name: passengerName.trim() || (user.full_name || "Valued Tourist"),
        age,
        gender: passengerGender,
        id_type: nationality === 'INDIAN' ? "AADHAAR" : "PASSPORT",
        id_number: passengerId.trim(),
        nationality,
      });
    }

    setBookingLoading(true);
    try {
      await API.post('/cart/add-attractions', { slot_id: selectedSlot.slot_id, passengers });
      alert(`Added ${passengers.length} ticket${passengers.length > 1 ? 's' : ''} for ${selectedAttraction.title} to your trip cart!`);
      setSelectedAttraction(null);
      if (onAddToCart) onAddToCart();
    } catch (err) {
      alert(err.response?.data?.detail || "Could not reserve slot");
    } finally {
      setBookingLoading(false);
    }
  };

  // The new-visitor fields are mandatory only when nobody is ticked, or once
  // the tourist starts filling them in.
  const pickedKeys = savedVisitors.filter((v) => visitorKey(v) in pickedAges && !isInCart(v));
  const newFilled = !!(passengerName.trim() || passengerId.trim() || passengerAge !== '');
  const newRequired = pickedKeys.length === 0 || newFilled;
  const ticketCount = pickedKeys.length + (newRequired ? 1 : 0);
  // Rough total shown before adding to the cart (5% GST as the cart applies it).
  const priceFor = (nat) => Number(nat === 'FOREIGN' ? selectedAttraction?.foreign_price_inr : selectedAttraction?.base_price_inr) || 0;
  const estimatedTotal = (pickedKeys.reduce((sum, v) => sum + priceFor(v.nationality), 0) + (newRequired ? priceFor(nationality) : 0)) * 1.05;

  const typeOptions = Array.from(new Set(attractions.map((a) => a.category))).filter(Boolean);
  const visibleAttractions = selectedType === 'ALL' ? attractions : attractions.filter((a) => a.category === selectedType);
  const typeLabel = (c) => CATEGORY_STYLE[c]?.label || c.replace(/_/g, ' ');
  const todayIso = new Date().toISOString().split('T')[0];

  return (
    <div id="popular-attractions" className="space-y-5 scroll-mt-24">
      {/* Island & Filter Header */}
      <div className="flex flex-col gap-3 bg-white p-3.5 rounded-2xl border border-cyan-100 shadow-md">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        {/* Island Pills */}
        <div className="flex flex-wrap items-center gap-2 xl:flex-nowrap xl:overflow-x-auto xl:pb-0">
          {[
            { id: 'ALL', label: 'All Destinations' },
            { id: 'PORT_BLAIR', label: 'Port Blair' },
            { id: 'HAVELOCK', label: 'Havelock (Swaraj Dweep)' },
            { id: 'NEIL', label: 'Neil (Shaheed Dweep)' }
          ].map((isl) => (
            <button
              key={isl.id}
              onClick={() => { setSelectedIsland(isl.id); setSelectedType('ALL'); }}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedIsland === isl.id
                  ? 'bg-cyan-700 text-white shadow-sm'
                  : 'bg-cyan-50/70 text-slate-600 hover:text-navy-800 hover:bg-cyan-100'
              }`}
            >
              {isl.label}
            </button>
          ))}
        </div>

        {/* Nationality Toggle */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-lg border border-slate-200 self-end xl:self-auto">
          <span className="text-[11px] font-semibold text-slate-500 px-2">Pricing:</span>
          <button
            onClick={() => setNationality('INDIAN')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
              nationality === 'INDIAN' ? 'bg-cyan-700 text-white' : 'text-slate-500 hover:text-navy-800'
            }`}
          >
            Indian Citizen (₹)
          </button>
          <button
            onClick={() => setNationality('FOREIGN')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
              nationality === 'FOREIGN' ? 'bg-cyan-700 text-white' : 'text-slate-500 hover:text-navy-800'
            }`}
          >
            Foreign National ($)
          </button>
        </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <Filter className="w-3.5 h-3.5 text-cyan-600" /> Attraction Type
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-navy-800 focus:border-cyan-500 focus:outline-none"
            >
              <option value="ALL">All Types</option>
              {typeOptions.map((c) => <option key={c} value={c}>{typeLabel(c)}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-cyan-600" /> Visit Date
            <input
              type="date"
              min={todayIso}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold font-mono text-navy-800 focus:border-cyan-500 focus:outline-none"
            />
          </label>
          <span className="ml-auto text-[11px] text-slate-500">
            {visibleAttractions.length} experience{visibleAttractions.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {loading && (
        <div className="text-center text-slate-400 text-sm py-10">Loading live availability…</div>
      )}

      {/* Honest empty state — e.g. Neil Island has no bookable attraction listed yet */}
      {!loading && visibleAttractions.length === 0 && (
        <div className="text-center py-16 bg-white border border-dashed border-slate-300 rounded-2xl">
          <SearchX className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <h3 className="font-serif text-base font-bold text-navy-800">No attractions listed here yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {ISLAND_LABELS[selectedIsland] || 'This destination'} doesn't have a bookable attraction on the portal yet — check back soon, or browse other destinations.
          </p>
        </div>
      )}

      {/* Grid of Attractions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {visibleAttractions.map((item) => {
          const img = item.image_url || ATTRACTION_IMAGES[item.title] || FALLBACK_IMAGE;
          const displayPrice = nationality === 'INDIAN' ? item.base_price_inr : item.foreign_price_inr;
          const categoryMeta = { ...FALLBACK_CATEGORY, icon: Landmark, label: item.category.replace(/_/g, ' '), ...(CATEGORY_STYLE[item.category] || {}) };
          const CategoryIcon = categoryMeta.icon;

          return (
            <div
              key={item.id}
              className="bg-white border border-slate-200 hover:border-cyan-400 rounded-3xl overflow-hidden transition-all duration-300 hover:!-translate-y-1.5 hover:shadow-[0_18px_40px_-12px_rgba(0,137,168,0.35)] group flex flex-col"
            >
              <span className={`h-1 w-full ${categoryMeta.bar}`} aria-hidden="true" />
              <div className="relative h-44 overflow-hidden">
                <img
                  src={img}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-900/70 via-transparent to-transparent"></div>
                <span className={`absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-1 ${categoryMeta.badge}`}>
                  <CategoryIcon className="w-3 h-3" /> {categoryMeta.label}
                </span>
                <span className="absolute bottom-2.5 left-3 text-[11px] font-semibold text-white flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {ISLAND_LABELS[item.island] || item.island.replace('_', ' ')}
                </span>
              </div>

              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-serif text-[15px] font-bold text-navy-800 leading-snug line-clamp-1 group-hover:text-cyan-700 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {item.description || 'Official time-slotted entry with secure turnstile scan and instant digital pass.'}
                </p>
                <AttractionFacts item={item} className="mt-2" />

                <div className="mt-auto pt-3 flex items-center justify-between">
                  <div className="leading-tight">
                    <span className="text-[10px] text-slate-400 font-semibold block">Entry from</span>
                    <span className="text-lg font-black text-navy-800">₹{displayPrice.toLocaleString('en-IN')}</span>
                    <span className="text-xs text-slate-400"> / pax</span>
                  </div>

                  <button
                    onClick={() => openSlotDrawer(item)}
                    className="px-4 py-2 bg-cyan-700 group-hover:bg-navy-800 hover:!bg-cyan-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm group-hover:shadow-md transition-all"
                  >
                    Book Slot <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Slot Drawer Modal */}
      {selectedAttraction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/70 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl p-5 shadow-2xl relative max-h-[92vh] max-h-[92dvh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider">Select Time Slot</span>
                <h3 className="font-serif text-lg font-black text-navy-800">{selectedAttraction.title}</h3>
                <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-600" /> {selectedAttraction.island}
                </span>
                <AttractionFacts item={selectedAttraction} className="mt-1.5" />
              </div>
              <button
                onClick={() => setSelectedAttraction(null)}
                className="text-slate-400 hover:text-navy-800 p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 items-start">
            <div>
            {/* Date Picker */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-600" /> Select Visit Date:
              </label>
              <button
                type="button"
                aria-expanded={isCalendarOpen}
                aria-controls="attraction-date-calendar"
                onClick={() => setIsCalendarOpen((open) => !open)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-navy-800 font-mono text-left flex items-center justify-between focus:border-cyan-500 focus:outline-none"
              >
                {selectedVisitDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                <Calendar className="w-4 h-4 text-cyan-700" />
              </button>
              {isCalendarOpen && (
                <div id="attraction-date-calendar" className="slot-booking-calendar-panel" role="group" aria-label="Visit date calendar">
                  <button type="button" className="slot-booking-calendar-close" aria-label="Close calendar" onClick={() => setIsCalendarOpen(false)}>
                    <X className="w-4 h-4" />
                  </button>
                  <DayPicker
                    mode="single"
                    selected={selectedVisitDate}
                    defaultMonth={selectedVisitDate}
                    onSelect={(date) => {
                      if (!date) return;
                      const newDate = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
                      setIsCalendarOpen(false);
                      handleDateChange(newDate);
                    }}
                    className="slot-booking-calendar"
                  />
                </div>
              )}
            </div>

            {/* Available Slots */}
            <div className="mb-5">
              <span className="block text-xs font-semibold text-slate-600 mb-2">Available Hourly Slots:</span>
              <div className="lg:hidden">
                <Select.Root
                  value={selectedSlot ? String(selectedSlot.slot_id) : ''}
                  onValueChange={(value) => setSelectedSlot(availableSlots.find((slot) => String(slot.slot_id) === value) || null)}
                  disabled={availableSlots.length === 0}
                >
                  <Select.Trigger className="slot-booking-select-trigger" aria-label="Available Hourly Slots">
                    <Select.Value placeholder={availableSlots.length ? 'Select a time slot' : 'No slots available'} />
                    <Select.Icon><ChevronDown className="w-4 h-4" /></Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content position="popper" sideOffset={4} collisionPadding={16} className="slot-booking-select-content">
                      <Select.Viewport className="slot-booking-select-viewport">
                        {availableSlots.map((slot) => (
                          <Select.Item key={slot.slot_id} value={String(slot.slot_id)} disabled={slot.available_seats <= 0} className="slot-booking-select-item">
                            <Select.ItemText>{slot.start_time} - {slot.end_time} ({slot.is_closed ? 'Closed' : `${slot.available_seats} seats left`})</Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>
              <div className="hidden lg:grid grid-cols-3 gap-2.5">
                {availableSlots.map((slot) => {
                  const isSelected = selectedSlot?.slot_id === slot.slot_id;
                  const isAvailable = slot.available_seats > 0;

                  return (
                    <button
                      key={slot.slot_id}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        !isAvailable
                          ? 'bg-slate-50 border-slate-200 text-slate-300 opacity-70 cursor-not-allowed'
                          : isSelected
                          ? 'bg-cyan-50 border-cyan-500 text-cyan-800 ring-2 ring-cyan-500/30'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-cyan-400'
                      }`}
                    >
                      <div className="text-xs font-mono font-bold">{slot.start_time} - {slot.end_time}</div>
                      {slot.is_closed ? (
                        <div className="text-[10px] mt-1 font-bold text-amber-600">Closed</div>
                      ) : (
                        <>
                          <div className="h-1 rounded-full bg-slate-200 mt-1.5 overflow-hidden">
                            <div
                              className={`h-1 rounded-full ${slot.available_seats <= slot.total_capacity * 0.1 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(100, Math.round((100 * (slot.total_capacity - slot.available_seats)) / Math.max(1, slot.total_capacity)))}%` }}
                            />
                          </div>
                          <div className={`text-[10px] mt-1 flex items-center gap-1 ${slot.available_seats <= slot.total_capacity * 0.1 ? 'text-amber-600 font-bold' : 'text-emerald-600'}`}>
                            <Users className="w-3 h-3" /> {slot.available_seats <= slot.total_capacity * 0.1 && slot.available_seats > 0 ? `Filling fast · ${slot.available_seats} left` : `${slot.available_seats} seats left`}
                          </div>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            </div>

            {/* Passenger Quick Form (right column on desktop) */}
            <form onSubmit={handleConfirmAddToCart} className="space-y-3 lg:border-l lg:border-slate-100 lg:pl-6">
              {savedVisitors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-600">
                    Who is visiting? <span className="font-normal text-slate-400">(from your earlier bookings)</span>
                  </h4>
                  <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                    {savedVisitors.map((v) => {
                      const key = visitorKey(v);
                      const inCart = isInCart(v);
                      const picked = key in pickedAges && !inCart;
                      return (
                        <label
                          key={key}
                          className={`flex items-center gap-2.5 px-3 py-2 text-xs ${inCart ? 'opacity-50' : 'cursor-pointer hover:bg-slate-50'}`}
                        >
                          <input type="checkbox" checked={picked} disabled={inCart} onChange={() => togglePicked(v)} />
                          <span className="flex-1 min-w-0">
                            <span className="font-bold text-navy-800 block truncate">{v.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {v.id_type.replace('_', ' ')} •••• {v.id_number.slice(-4)} · {v.nationality === 'FOREIGN' ? 'Foreign' : 'Indian'}
                              {inCart ? ' · already in your cart for this slot' : ''}
                            </span>
                          </span>
                          {picked && (
                            <span className="flex items-center gap-1 text-[10px] text-slate-500">
                              Age
                              <input
                                type="number"
                                min="0"
                                max="120"
                                required
                                value={pickedAges[key]}
                                onChange={(e) => setPickedAges((cur) => ({ ...cur, [key]: e.target.value }))}
                                aria-label={`Age of ${v.name}`}
                                className="w-14 px-1.5 py-1 border border-slate-300 rounded text-xs text-navy-800"
                              />
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <h4 className="text-xs font-bold text-slate-600">
                {savedVisitors.length > 0
                  ? <>Add a new visitor <span className="font-normal text-slate-400">(optional)</span></>
                  : 'Lead Passenger Details (For Turnstile Entry):'}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Full Name as on ID"
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800"
                  required={newRequired}
                />
                <input
                  type="text"
                  placeholder={nationality === 'INDIAN' ? "Aadhaar / Voter ID" : "Passport Number"}
                  value={passengerId}
                  onChange={(e) => setPassengerId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800"
                  required={newRequired}
                />
                <input
                  type="number"
                  min="0"
                  max="120"
                  placeholder="Age"
                  value={passengerAge}
                  onChange={(e) => setPassengerAge(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800"
                  required={newRequired}
                />
                <select
                  value={passengerGender}
                  onChange={(e) => setPassengerGender(e.target.value)}
                  aria-label="Gender"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="flex items-end justify-between pt-3 border-t border-slate-100">
                <div className="leading-tight">
                  <span className="text-[11px] text-slate-500 block">{ticketCount} ticket{ticketCount === 1 ? '' : 's'} · incl. 5% GST</span>
                  <span className="text-xl font-black text-navy-800">₹{estimatedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
              <button
                type="submit"
                disabled={bookingLoading}
                className="w-full py-3 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2"
              >
                {bookingLoading
                  ? 'Holding your seats...'
                  : ticketCount > 1 ? `Confirm & Add ${ticketCount} Tickets to Trip Cart` : 'Confirm & Add to Trip Cart'}
              </button>
            </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}