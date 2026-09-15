import React, { useState, useEffect } from 'react';
import API from '../api/client';
import { Ship, Calendar, Clock, MapPin, Armchair, AlertCircle } from 'lucide-react';

const PORTS = [
  { id: 'PORT_BLAIR', name: 'Port Blair (Phoenix Bay Jetty)' },
  { id: 'HAVELOCK', name: 'Havelock (Swaraj Dweep Jetty)' },
  { id: 'NEIL', name: 'Neil (Shaheed Dweep Jetty)' }
];

export function FerrySearch({ onAddToCart, onRequireLogin, user }) {
  const [sourcePort, setSourcePort] = useState('PORT_BLAIR');
  const [destinationPort, setDestinationPort] = useState('HAVELOCK');
  const [travelDate, setTravelDate] = useState(new Date().toISOString().split('T')[0]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Seat Selection Modal State
  const [activeSchedule, setActiveSchedule] = useState(null);
  const [seatMap, setSeatMap] = useState([]);
  const [selectedCabin, setSelectedCabin] = useState('DELUXE');
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [seatLoading, setSeatLoading] = useState(false);
  const [passengerName, setPassengerName] = useState('');
  const [passengerAge, setPassengerAge] = useState('29');
  const [passengerGender, setPassengerGender] = useState('MALE');
  const [passengerId, setPassengerId] = useState('9812-4412-8819');
  const [holdCountdown, setHoldCountdown] = useState(null);

  useEffect(() => {
    handleSearch();
  }, []);

  useEffect(() => {
    if (!holdCountdown || holdCountdown <= 0) return;
    const interval = setInterval(() => {
      setHoldCountdown((prev) => (prev > 1 ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(interval);
  }, [holdCountdown]);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (sourcePort === destinationPort) {
      alert("Source and Destination ports cannot be the same");
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const res = await API.get(
        `/ferry/schedules?source_port=${sourcePort}&destination_port=${destinationPort}&travel_date=${travelDate}`
      );
      setSchedules(res.data);
    } catch (err) {
      console.error(err);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
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

    setSeatLoading(true);
    try {
      await API.post('/cart/add-ferry', {
        schedule_id: activeSchedule.schedule_id,
        seat_number: selectedSeat.seat_number,
        passenger: {
          name: passengerName || (user.full_name || "Valued Tourist"),
          age: parseInt(passengerAge) || 28,
          gender: passengerGender,
          id_type: "AADHAAR",
          id_number: passengerId || "4812-9912-1011"
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
    <div className="space-y-8">
      {/* 1. Route Search Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Origin Port */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-600" /> Origin Port
            </label>
            <select
              value={sourcePort}
              onChange={(e) => setSourcePort(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-navy-800 focus:border-cyan-500 focus:outline-none"
            >
              {PORTS.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Destination Port */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-600" /> Destination Port
            </label>
            <select
              value={destinationPort}
              onChange={(e) => setDestinationPort(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-navy-800 focus:border-cyan-500 focus:outline-none"
            >
              {PORTS.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Travel Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-600" /> Departure Date
            </label>
            <input
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-navy-800 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Search Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-cyan-700 hover:bg-cyan-600 font-bold rounded-lg text-xs text-white shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Ship className="w-4 h-4" /> {loading ? 'Checking Sailings...' : 'Find Sailings'}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Schedule Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-base font-bold text-navy-800">
            Available Sailings for {travelDate}
          </h3>
          <span className="text-xs text-slate-500">
            {schedules.length} vessel(s) scheduled
          </span>
        </div>

        {schedules.length === 0 && searched && !loading && (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-navy-800">No departures scheduled on this route for the selected date.</p>
            <p className="text-xs text-slate-500 mt-1">Try another travel date or reverse route direction.</p>
          </div>
        )}

        {schedules.map((trip) => (
          <div
            key={trip.schedule_id}
            className="bg-white border border-slate-200 hover:border-cyan-400 rounded-2xl p-5 shadow-sm hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all"
          >
            {/* Vessel Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center justify-center font-bold">
                  <Ship className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif text-base font-extrabold text-navy-800">{trip.vessel_name}</h4>
                  <p className="text-xs text-slate-500">{trip.operator_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono pt-1">
                <span className="text-navy-800 font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-600" /> {trip.departure_time} Dep.
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500">
                  {trip.source_port.replace('_', ' ')} → {trip.destination_port.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Cabin Pricing Breakdown */}
            <div className="flex flex-wrap items-center gap-2">
              {trip.cabins.map((c) => (
                <div
                  key={c.cabin_class}
                  className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-left min-w-[100px]"
                >
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">{c.cabin_class}</span>
                  <span className="text-xs font-black text-navy-800">₹{c.starting_price_inr.toLocaleString('en-IN')}</span>
                  <span className={`text-[10px] block font-medium ${c.available_seats > 5 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {c.available_seats} left
                  </span>
                </div>
              ))}
            </div>

            {/* Action */}
            <div>
              <button
                onClick={() => openSeatMap(trip)}
                className="w-full md:w-auto px-5 py-2.5 bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <Armchair className="w-4 h-4" /> Select Cabin Seats
              </button>
            </div>
          </div>
        ))}
      </div>

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
                  {activeSchedule.source_port.replace('_', ' ')} → {activeSchedule.destination_port.replace('_', ' ')} • {activeSchedule.departure_time} hrs
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
                    type="text"
                    placeholder="Aadhaar / Passport No"
                    value={passengerId}
                    onChange={(e) => setPassengerId(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800"
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
