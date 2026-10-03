import React, { useState, useEffect } from 'react';
import API from '../api/client';
import { Ship, Armchair, AlertCircle } from 'lucide-react';
import { FerryRouteSearch, SailingList, ImportantInformation } from './ferry/FerryParts';

const PORTS = [
  { id: 'PORT_BLAIR', name: 'Port Blair (Phoenix Bay Jetty)' },
  { id: 'HAVELOCK', name: 'Havelock (Swaraj Dweep Jetty)' },
  { id: 'NEIL', name: 'Neil (Shaheed Dweep Jetty)' }
];

const PORT_SHORT_NAME = {
  PORT_BLAIR: 'Port Blair',
  HAVELOCK: 'Havelock',
  NEIL: 'Neil',
};

export function FerrySearch({ onAddToCart, onRequireLogin, user }) {
  const [sourcePort, setSourcePort] = useState('PORT_BLAIR');
  const [destinationPort, setDestinationPort] = useState('HAVELOCK');
  const [travelDate, setTravelDate] = useState(new Date().toISOString().split('T')[0]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [sort, setSort] = useState('time');
  const [favorites, setFavorites] = useState(new Set());
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Seat Selection Modal State
  const [activeSchedule, setActiveSchedule] = useState(null);
  const [seatMap, setSeatMap] = useState([]);
  const [selectedCabin, setSelectedCabin] = useState('DELUXE');
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [seatLoading, setSeatLoading] = useState(false);
  const [passengerName, setPassengerName] = useState('');
  const [passengerAge, setPassengerAge] = useState('');
  const [passengerGender, setPassengerGender] = useState('MALE');
  const [passengerIdType, setPassengerIdType] = useState('AADHAAR');
  const [passengerId, setPassengerId] = useState('');
  // Previous visitors from the tourist's booking history (RFP p.25).
  const [savedVisitors, setSavedVisitors] = useState([]);
  const [holdCountdown, setHoldCountdown] = useState(null);

  useEffect(() => {
    handleSearch();
  }, []);

  useEffect(() => {
    if (!user) {
      setFavorites(new Set());
      return;
    }
    API.get('/ferry/favorites')
      .then((res) => setFavorites(new Set(res.data)))
      .catch(() => setFavorites(new Set()));
  }, [user]);

  // Seat availability is live (other tourists hold and book seats), so quietly
  // re-check the current search every 30 seconds and whenever the tab regains focus.
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible' && !activeSchedule) runSearch(true);
    };
    const timer = setInterval(refresh, 30000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [sourcePort, destinationPort, travelDate, activeSchedule]);

  const handleToggleFavorite = async (trip) => {
    if (!user) {
      onRequireLogin();
      return;
    }
    const id = trip.vessel_id;
    const wasFavorite = favorites.has(id);
    const apply = (on) => setFavorites((prev) => {
      const next = new Set(prev);
      if (on) next.add(id); else next.delete(id);
      return next;
    });
    apply(!wasFavorite); // optimistic
    try {
      if (wasFavorite) await API.delete(`/ferry/favorites/${id}`);
      else await API.put(`/ferry/favorites/${id}`);
    } catch (err) {
      apply(wasFavorite); // roll back
      alert(err.response?.data?.detail || 'Could not update your favourites. Please try again.');
    }
  };

  useEffect(() => {
    if (!activeSchedule || !user) {
      setSavedVisitors([]);
      return;
    }
    API.get('/cart/saved-visitors')
      .then((res) => setSavedVisitors(res.data))
      .catch(() => setSavedVisitors([]));
  }, [activeSchedule, user]);

  useEffect(() => {
    if (!holdCountdown || holdCountdown <= 0) return;
    const interval = setInterval(() => {
      setHoldCountdown((prev) => (prev > 1 ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(interval);
  }, [holdCountdown]);

  const handleSwapPorts = () => {
    setSourcePort(destinationPort);
    setDestinationPort(sourcePort);
  };

  const runSearch = async (silent = false) => {
    if (sourcePort === destinationPort) return;
    if (!silent) {
      setLoading(true);
      setSearched(true);
    }
    try {
      const res = await API.get(
        `/ferry/schedules?source_port=${sourcePort}&destination_port=${destinationPort}&travel_date=${travelDate}`
      );
      setSchedules(res.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      if (!silent) setSchedules([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (sourcePort === destinationPort) {
      alert("Source and Destination ports cannot be the same");
      return;
    }
    await runSearch(false);
  };

  const openSeatMap = async (sched) => {
    setActiveSchedule(sched);
    setSelectedSeat(null);
    setHoldCountdown(null);
    setSeatLoading(true);
    try {
      const phoneParam = user ? `?user_phone=${user.phone_number}` : '';
      const res = await API.get(`/ferry/schedules/${sched.schedule_id}/seat-map${phoneParam}`);
      setSeatMap(res.data);
    } catch (err) {
      alert("Could not load seat map for this voyage");
    } finally {
      setSeatLoading(false);
    }
  };

  const handleSelectSeat = async (seat) => {
    if (!user) {
      onRequireLogin();
      return;
    }
    if (!seat.is_available) {
      alert(`Seat ${seat.seat_number} is not available.`);
      return;
    }

    setSeatLoading(true);
    try {
      const res = await API.post(`/ferry/schedules/${activeSchedule.schedule_id}/hold-seat`, {
        seat_number: seat.seat_number
      });

      setSelectedSeat(seat);
      setHoldCountdown(res.data.expires_in_seconds || 600);

      const phoneParam = user ? `?user_phone=${user.phone_number}` : '';
      const updated = await API.get(`/ferry/schedules/${activeSchedule.schedule_id}/seat-map${phoneParam}`);
      setSeatMap(updated.data);
    } catch (err) {
      alert(err.response?.data?.detail || "This seat is already held by another passenger.");
    } finally {
      setSeatLoading(false);
    }
  };

  const handleConfirmFerryToCart = async (e) => {
    e.preventDefault();
    if (!selectedSeat) {
      alert("Please select a seat from the cabin layout");
      return;
    }

    // Age counts toward the 6-adult / 12-child limit per booking (RFP p.25),
    // so it has to be the real one.
    const age = parseInt(passengerAge, 10);
    if (Number.isNaN(age) || age < 0 || age > 120) {
      alert("Please enter the passenger's age (0-120)");
      return;
    }

    setSeatLoading(true);
    try {
      await API.post('/cart/add-ferry', {
        schedule_id: activeSchedule.schedule_id,
        seat_number: selectedSeat.seat_number,
        passenger: {
          name: passengerName.trim() || (user.full_name || "Valued Tourist"),
          age,
          gender: passengerGender,
          id_type: passengerIdType,
          id_number: passengerId.trim()
        }
      });

      alert(`Seat ${selectedSeat.seat_number} on ${activeSchedule.vessel_name} added to your trip cart!`);
      setActiveSchedule(null);
      if (onAddToCart) onAddToCart();
    } catch (err) {
      alert(err.response?.data?.detail || "Could not bundle seat into cart.");
    } finally {
      setSeatLoading(false);
    }
  };

  const fillFromSaved = (key) => {
    const v = savedVisitors.find((x) => `${x.id_type}:${x.id_number}` === key);
    if (!v) return;
    setPassengerName(v.name);
    setPassengerAge(v.age == null ? '' : String(v.age));
    setPassengerGender(v.gender || 'MALE');
    setPassengerIdType(v.id_type);
    setPassengerId(v.id_number);
  };

  function renderSeatButton(seat) {
    const isSelected = selectedSeat?.seat_number === seat.seat_number || seat.is_held_by_you;
    const isAvailable = seat.is_available;

    return (
      <button
        key={seat.seat_id}
        type="button"
        disabled={!isAvailable && !seat.is_held_by_you}
        onClick={() => handleSelectSeat(seat)}
        className={`w-10 h-10 rounded-lg font-mono text-xs font-bold flex flex-col items-center justify-center transition-all ${
          isSelected
            ? 'bg-emerald-500 text-white ring-2 ring-emerald-300 scale-105 shadow-md'
            : !isAvailable
            ? 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed line-through'
            : 'bg-white hover:bg-cyan-50 text-navy-800 border border-slate-300 hover:border-cyan-500'
        }`}
      >
        <span>{seat.seat_number}</span>
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <FerryRouteSearch
        ports={PORTS}
        sourcePort={sourcePort}
        setSourcePort={setSourcePort}
        destinationPort={destinationPort}
        setDestinationPort={setDestinationPort}
        travelDate={travelDate}
        setTravelDate={setTravelDate}
        onSwap={handleSwapPorts}
        onSubmit={handleSearch}
        loading={loading}
      />

      <SailingList
        trips={schedules}
        travelDate={travelDate}
        sort={sort}
        setSort={setSort}
        onSelect={openSeatMap}
        favorites={favorites}
        onToggleFavorite={handleToggleFavorite}
        favoritesOnly={favoritesOnly}
        setFavoritesOnly={setFavoritesOnly}
        lastUpdated={lastUpdated}
      >
        {schedules.length === 0 && searched && !loading && (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-navy-800">No departures scheduled on this route for the selected date.</p>
            <p className="text-xs text-slate-500 mt-1">Try another travel date or reverse route direction.</p>
          </div>
        )}
      </SailingList>

      <ImportantInformation />

      {/* 3. Visual 2D Aircraft-Style Cabin Seat Map Modal */}
      {activeSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/70 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-100 mb-4">
              <div>
                <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-widest">
                  Live Deck Inventory (10-Minute Lock)
                </span>
                <h3 className="font-serif text-lg font-black text-navy-800 flex items-center gap-2">
                  <Ship className="w-5 h-5 text-cyan-600" /> {activeSchedule.vessel_name}
                </h3>
                <p className="text-xs text-slate-500">
                  {PORT_SHORT_NAME[activeSchedule.source_port] || activeSchedule.source_port} → {PORT_SHORT_NAME[activeSchedule.destination_port] || activeSchedule.destination_port} • {activeSchedule.departure_time} hrs
                </p>
              </div>
              <button
                onClick={() => setActiveSchedule(null)}
                className="text-slate-400 hover:text-navy-800 p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Cabin Class Switcher */}
            <div className="flex items-center justify-between mb-4 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
              {['ECONOMY', 'DELUXE', 'ROYAL'].map((cls) => (
                <button
                  key={cls}
                  onClick={() => setSelectedCabin(cls)}
                  className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${
                    selectedCabin === cls
                      ? 'bg-navy-800 text-white shadow-sm'
                      : 'text-slate-500 hover:text-navy-800'
                  }`}
                >
                  {cls} Class
                </button>
              ))}
            </div>

            {/* Vessel Bow Direction */}
            <div className="text-center py-1.5 mb-4 text-[10px] tracking-widest text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              ▲ FORWARD BOW (SAILING DIRECTION) ▲
            </div>

            {/* 2D Aircraft-Style Cabin Grid */}
            <div className="py-2 space-y-2.5 max-w-sm mx-auto">
              {(() => {
                const cabinSeats = seatMap.filter((s) => s.cabin_class === selectedCabin);

                const rows = {};
                cabinSeats.forEach((s) => {
                  const rowNum = s.seat_number.slice(0, -1);
                  if (!rows[rowNum]) rows[rowNum] = [];
                  rows[rowNum].push(s);
                });

                return Object.entries(rows).map(([rowKey, seatsInRow]) => (
                  <div key={rowKey} className="flex items-center justify-center gap-2">
                    <div className="flex gap-2">
                      {seatsInRow.slice(0, 2).map((seat) => renderSeatButton(seat))}
                    </div>

                    <div className="w-10 text-center text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                      AISLE
                    </div>

                    <div className="flex gap-2">
                      {seatsInRow.slice(2, 4).map((seat) => renderSeatButton(seat))}
                    </div>
                  </div>
                ));
              })()}
            </div>

            {/* Legend & Lock Notice */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-white border border-slate-300 rounded"></span> Available
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-emerald-500 rounded"></span> Held by You
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-slate-200 rounded"></span> Booked
                </span>
              </div>

              {holdCountdown && (
                <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 font-mono font-bold">
                  Lock Expires: {Math.floor(holdCountdown / 60)}:{(holdCountdown % 60).toString().padStart(2, '0')}
                </span>
              )}
            </div>

            {/* Passenger Form (Shows when seat is selected) */}
            {selectedSeat && (
              <form onSubmit={handleConfirmFerryToCart} className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-navy-800">Selected Seat: {selectedSeat.seat_number}</span>
                    <span className="text-[11px] text-slate-500 block">{selectedSeat.cabin_class} Cabin • Upper/Lower Deck</span>
                  </div>
                  <span className="text-base font-black text-cyan-700">₹{selectedSeat.price_inr.toLocaleString('en-IN')}</span>
                </div>

                {savedVisitors.length > 0 && (
                  <select
                    value=""
                    onChange={(e) => fillFromSaved(e.target.value)}
                    aria-label="Fill from a previous visitor"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800"
                  >
                    <option value="">Fill from a previous visitor…</option>
                    {savedVisitors.map((v) => (
                      <option key={`${v.id_type}:${v.id_number}`} value={`${v.id_type}:${v.id_number}`}>
                        {v.name} · {v.id_type.replace('_', ' ')} ••••{v.id_number.slice(-4)}
                      </option>
                    ))}
                  </select>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Passenger Full Name"
                    value={passengerName}
                    onChange={(e) => setPassengerName(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800"
                    required
                  />
                  <input
                    type="number"
                    min="0"
                    max="120"
                    placeholder="Age"
                    value={passengerAge}
                    onChange={(e) => setPassengerAge(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800"
                    required
                  />
                  <select
                    value={passengerGender}
                    onChange={(e) => setPassengerGender(e.target.value)}
                    aria-label="Gender"
                    className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <select
                    value={passengerIdType}
                    onChange={(e) => setPassengerIdType(e.target.value)}
                    aria-label="ID type"
                    className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800"
                  >
                    <option value="AADHAAR">Aadhaar</option>
                    <option value="VOTER_ID">Voter ID</option>
                    <option value="PASSPORT">Passport</option>
                  </select>
                  <input
                    type="text"
                    placeholder={passengerIdType === 'PASSPORT' ? 'Passport number' : 'ID number'}
                    value={passengerId}
                    onChange={(e) => setPassengerId(e.target.value)}
                    className="col-span-2 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={seatLoading}
                  className="w-full py-3 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-lg text-xs shadow-md"
                >
                  {seatLoading ? 'Reserving...' : 'Confirm Passenger & Add Seat to Trip Cart'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}