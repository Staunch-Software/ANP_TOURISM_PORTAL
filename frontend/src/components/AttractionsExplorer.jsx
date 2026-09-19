import React, { useState, useEffect } from 'react';
import API from '../api/client';
import {
  MapPin, Users, ArrowRight, Calendar, Landmark, Sparkles, Waves, SearchX
} from 'lucide-react';

export const ATTRACTION_IMAGES = {
  "Cellular Jail National Memorial": "/images/cellular-jail.jpg",
  "Cellular Jail Light & Sound Show": "/images/cellular-jail-corridor.jpg",
  "Ross Island (Netaji Subhash Chandra Bose Dweep)": "/images/ross-island-church-ruins.jpg",
  "Elephant Beach Scuba Diving & Sea Walk": "/images/scuba-diving.jpg",
  "North Bay Coral Glass-Bottom Safari": "/images/north-bay-glassboat.jpg",
};

const CATEGORY_STYLE = {
  MONUMENT: { icon: Landmark, label: 'Monument' },
  LIGHT_SOUND: { icon: Sparkles, label: 'Light & Sound Show' },
  WATER_SPORT: { icon: Waves, label: 'Water Sport' },
};

export const ISLAND_LABELS = {
  PORT_BLAIR: 'Port Blair',
  HAVELOCK: 'Havelock (Swaraj Dweep)',
  NEIL: 'Neil (Shaheed Dweep)',
};

export const FALLBACK_IMAGE = "/images/hero-lagoon.jpg";

export function AttractionsExplorer({ onAddToCart, onRequireLogin, user, focusRequest }) {
  const [attractions, setAttractions] = useState([]);
  const [selectedIsland, setSelectedIsland] = useState('ALL');
  const [nationality, setNationality] = useState('INDIAN');
  const [selectedAttraction, setSelectedAttraction] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [passengerName, setPassengerName] = useState('');
  const [passengerAge, setPassengerAge] = useState('28');
  const [passengerId, setPassengerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

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
    try {
      const res = await API.get(`/attractions/${item.id}/slots?target_date=${selectedDate}`);
      setAvailableSlots(res.data);
    } catch (err) {
      alert("Failed to load slots for this date");
    }
  };

  const handleDateChange = async (newDate) => {
    setSelectedDate(newDate);
    if (selectedAttraction) {
      try {
        const res = await API.get(`/attractions/${selectedAttraction.id}/slots?target_date=${newDate}`);
        setAvailableSlots(res.data);
      } catch (err) {
        console.error(err);
      }
    }
  };

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

    setBookingLoading(true);
    try {
      await API.post('/cart/add-attraction', {
        slot_id: selectedSlot.slot_id,
        nationality: nationality,
        passenger: {
          name: passengerName || (user.full_name || "Valued Tourist"),
          age: parseInt(passengerAge) || 25,
          gender: "MALE",
          id_type: nationality === 'INDIAN' ? "AADHAAR" : "PASSPORT",
          id_number: passengerId
        }
      });

      alert(`Added ${selectedAttraction.title} to your trip cart!`);
      setSelectedAttraction(null);
      if (onAddToCart) onAddToCart();
    } catch (err) {
      alert(err.response?.data?.detail || "Could not reserve slot");
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Island & Filter Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
        {/* Island Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'ALL', label: 'All Destinations' },
            { id: 'PORT_BLAIR', label: 'Port Blair' },
            { id: 'HAVELOCK', label: 'Havelock (Swaraj Dweep)' },
            { id: 'NEIL', label: 'Neil (Shaheed Dweep)' }
          ].map((isl) => (
            <button
              key={isl.id}
              onClick={() => setSelectedIsland(isl.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                selectedIsland === isl.id
                  ? 'bg-navy-800 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-500 hover:text-navy-800 hover:bg-slate-200'
              }`}
            >
              {isl.label}
            </button>
          ))}
        </div>

        {/* Nationality Toggle */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-lg border border-slate-200 self-end md:self-auto">
          <span className="text-[11px] font-semibold text-slate-500 px-2">Pricing:</span>
          <button
            onClick={() => setNationality('INDIAN')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
              nationality === 'INDIAN' ? 'bg-navy-800 text-white' : 'text-slate-500 hover:text-navy-800'
            }`}
          >
            Indian Citizen (₹)
          </button>
          <button
            onClick={() => setNationality('FOREIGN')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
              nationality === 'FOREIGN' ? 'bg-navy-800 text-white' : 'text-slate-500 hover:text-navy-800'
            }`}
          >
            Foreign National ($)
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center text-slate-400 text-sm py-10">Loading live availability…</div>
      )}

      {/* Honest empty state — e.g. Neil Island has no bookable attraction listed yet */}
      {!loading && attractions.length === 0 && (
        <div className="text-center py-16 bg-white border border-dashed border-slate-300 rounded-2xl">
          <SearchX className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <h3 className="font-serif text-base font-bold text-navy-800">No attractions listed here yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {ISLAND_LABELS[selectedIsland] || 'This destination'} doesn't have a bookable attraction on the portal yet — check back soon, or browse other destinations.
          </p>
        </div>
      )}

      {/* Grid of Attractions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {attractions.map((item) => {
          const img = ATTRACTION_IMAGES[item.title] || FALLBACK_IMAGE;
          const displayPrice = nationality === 'INDIAN' ? item.base_price_inr : item.foreign_price_inr;
          const categoryMeta = CATEGORY_STYLE[item.category] || { icon: Landmark, label: item.category.replace('_', ' ') };
          const CategoryIcon = categoryMeta.icon;

          return (
            <div
              key={item.id}
              className="bg-white border border-slate-200 hover:border-cyan-500/60 rounded-2xl overflow-hidden shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg group flex flex-col justify-between"
            >
              <div>
                {/* Visual Image Banner */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={img}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>

                  {/* Category Pill */}
                  <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-navy-900/85 backdrop-blur-md text-cyan-200 flex items-center gap-1.5">
                    <CategoryIcon className="w-3 h-3" /> {categoryMeta.label}
                  </span>
                </div>

                {/* Body Content */}
                <div className="p-5">
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-cyan-600" /> {ISLAND_LABELS[item.island] || item.island.replace('_', ' ')}
                  </span>
                  <h3 className="font-serif text-base font-bold text-navy-800 group-hover:text-cyan-700 transition-colors line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
                    Official time-slotted entry with secure turnstile scan and instant digital pass.
                  </p>

                  <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Entry Fee</span>
                      <span className="font-serif text-lg font-black text-navy-800">
                        ₹{displayPrice.toLocaleString('en-IN')}
                        <span className="font-sans text-xs font-normal text-slate-400"> / pax</span>
                      </span>
                    </div>

                    <button
                      onClick={() => openSlotDrawer(item)}
                      className="px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all group-hover:gap-2"
                    >
                      Book Slot <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Slot Drawer Modal */}
      {selectedAttraction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/70 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider">Select Time Slot</span>
                <h3 className="font-serif text-lg font-black text-navy-800">{selectedAttraction.title}</h3>
                <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-600" /> {selectedAttraction.island}
                </span>
              </div>
              <button
                onClick={() => setSelectedAttraction(null)}
                className="text-slate-400 hover:text-navy-800 p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Date Picker */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-600" /> Select Visit Date:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-navy-800 font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {/* Available Slots Grid */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-600 mb-2">Available Hourly Slots:</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
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
                      <div className="text-xs font-mono font-bold flex items-center justify-between">
                        <span>{slot.start_time} - {slot.end_time}</span>
                      </div>
                      <div className="text-[10px] mt-1 flex items-center gap-1 text-emerald-600">
                        <Users className="w-3 h-3" /> {slot.available_seats} seats left
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Passenger Quick Form */}
            <form onSubmit={handleConfirmAddToCart} className="space-y-3 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-600">Lead Passenger Details (For Turnstile Entry):</h4>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Full Name as on ID"
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800"
                  required
                />
                <input
                  type="text"
                  placeholder={nationality === 'INDIAN' ? "Aadhaar / Voter ID" : "Passport Number"}
                  value={passengerId}
                  onChange={(e) => setPassengerId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={bookingLoading}
                className="w-full py-3 mt-2 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2"
              >
                {bookingLoading ? 'Holding Slot in Redis...' : 'Confirm & Add to Trip Cart'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
