import React, { useState, useEffect } from 'react';
import API from '../api/client';
import {
  Ship, Users, DollarSign, Clock,
  Printer, CheckCircle2, RefreshCw, Anchor, Layers, FileSpreadsheet,
  LayoutDashboard, ClipboardList
} from 'lucide-react';

const ROUTE_PAIRS = [
  ['PORT_BLAIR', 'HAVELOCK'],
  ['HAVELOCK', 'NEIL'],
  ['NEIL', 'PORT_BLAIR'],
];

const OPERATOR_SECTIONS = [
  { key: 'OVERVIEW', label: 'Revenue & Settlement', icon: LayoutDashboard },
  { key: 'FLEET', label: 'Vessel Manifest & Occupancy', icon: ClipboardList },
];

const CABIN_LABELS = {
  ECONOMY: { deck: 'Lower Deck', name: 'Economy Class' },
  DELUXE: { deck: 'Mid Deck', name: 'Deluxe Class' },
  ROYAL: { deck: 'Upper Bridge', name: 'Royal VIP Cabin' },
};

export function OperatorDashboard({ user }) {
  const [schedules, setSchedules] = useState([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [seatMap, setSeatMap] = useState([]);
  const [manifest, setManifest] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [settlementPending, setSettlementPending] = useState(false);
  const [settlementSuccess, setSettlementSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState('OVERVIEW');

  useEffect(() => {
    fetchFleetData();
    fetchRevenueSummary();
  }, []);

  const fetchFleetData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const results = await Promise.all(
        ROUTE_PAIRS.map(([src, dst]) =>
          API.get(`/ferry/schedules?source_port=${src}&destination_port=${dst}&travel_date=${today}`)
            .then((res) => res.data)
            .catch(() => [])
        )
      );
      const allSchedules = results.flat();
      setSchedules(allSchedules);

      if (allSchedules.length > 0) {
        handleSelectSchedule(allSchedules[0]);
      }
    } catch (err) {
      console.error("Failed to load fleet schedules", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueSummary = async () => {
    try {
      const res = await API.get('/operator/revenue-summary');
      setRevenue(res.data);
    } catch (err) {
      console.error("Failed to load revenue summary", err);
    }
  };

  const fetchSeatMap = async (scheduleId) => {
    try {
      const res = await API.get(`/ferry/schedules/${scheduleId}/seat-map`);
      setSeatMap(res.data);
    } catch (err) {
      setSeatMap([]);
    }
  };

  const fetchVesselManifest = async (scheduleId) => {
    try {
      const res = await API.get(`/admin/manifest/${scheduleId}`);
      setManifest(res.data);
    } catch (err) {
      setManifest(null);
    }
  };

  const handleSelectSchedule = (sched) => {
    setSelectedScheduleId(sched.schedule_id);
    setSelectedSchedule(sched);
    fetchSeatMap(sched.schedule_id);
    fetchVesselManifest(sched.schedule_id);
  };

  const handleRefresh = () => {
    fetchFleetData();
    fetchRevenueSummary();
  };

  const handleRequestSettlement = () => {
    setSettlementPending(true);
    setTimeout(() => {
      setSettlementPending(false);
      setSettlementSuccess(true);
      setTimeout(() => setSettlementSuccess(false), 5000);
    }, 1200);
  };

  // Live per-cabin occupancy computed from the real seat map
  const deckBreakdown = ['ECONOMY', 'DELUXE', 'ROYAL'].map((cls) => {
    const seatsInCabin = seatMap.filter((s) => s.cabin_class === cls);
    const total = seatsInCabin.length;
    const occupied = seatsInCabin.filter((s) => !s.is_available).length;
    const pricePerSeat = seatsInCabin[0]?.price_inr ?? 0;
    const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;
    return { cls, ...CABIN_LABELS[cls], total, occupied, pricePerSeat, pct };
  });

  if (!user || (user.role !== 'OPERATOR' && user.role !== 'ADMIN')) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto my-12 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto mb-4">
          <Anchor className="w-7 h-7" />
        </div>
        <h3 className="font-serif text-lg font-black text-navy-800">Restricted Access</h3>
        <p className="text-xs text-slate-500 mt-1">
          This dashboard requires Ferry Operator or Administrator privileges.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Header Strip */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-bold mb-2">
            <Anchor className="w-3.5 h-3.5" /> Service Provider Portal (RFP Clause 7.2.1-II)
          </div>
          <h2 className="font-serif text-2xl font-black text-navy-800">Ferry Operator Dashboard</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Fleet operations: voyage rosters, live deck occupancy, and settlement requests.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-bold text-navy-800 flex items-center gap-2 self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Fleet Data
        </button>
      </div>

      {/* Section Navigation (sidebar) + Content — one bordered shell instead
          of two separate floating cards, separating revenue/settlement from
          live vessel operations so the dashboard reads as two distinct jobs,
          not one long scroll. */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col lg:flex-row items-stretch">
        <aside className="shrink-0 lg:w-[240px] p-2.5 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50/60 rounded-t-2xl lg:rounded-l-2xl lg:rounded-tr-none flex lg:flex-col gap-0.5 overflow-x-auto lg:overflow-visible lg:sticky lg:top-24 lg:self-start">
          {OPERATOR_SECTIONS.map((section) => {
            const SectionIcon = section.icon;
            return (
              <button
                key={section.key}
                onClick={() => setActiveSection(section.key)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 whitespace-nowrap transition-all ${
                  activeSection === section.key
                    ? 'bg-navy-800 text-white shadow-sm'
                    : 'text-slate-500 hover:text-navy-800 hover:bg-white'
                }`}
              >
                <SectionIcon className="w-4 h-4 shrink-0" /> {section.label}
              </button>
            );
          })}
        </aside>

        <div className="flex-1 min-w-0 p-6 space-y-8">

      {activeSection === 'OVERVIEW' && (
      <>
      {/* 2. Top Operator Metrics (real, computed from confirmed bookings today) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
            <span>Today's Gross Bookings</span>
            <div className="p-2 bg-cyan-50 text-cyan-700 rounded-lg"><DollarSign className="w-4 h-4" /></div>
          </div>
          <div className="font-serif text-2xl font-black text-navy-800 font-mono">
            ₹{(revenue?.today_gross_ferry_revenue_inr ?? 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Confirmed ferry tickets, all vessels</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
            <span>ANIIDCO Platform Fee</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-lg"><Layers className="w-4 h-4" /></div>
          </div>
          <div className="font-serif text-2xl font-black text-amber-600 font-mono">
            -₹{(revenue?.aniidco_commission_inr ?? 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">{revenue?.commission_rate_pct ?? 5}% RFP Convenience Fee</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
            <span>Net Settlable Payout</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg"><CheckCircle2 className="w-4 h-4" /></div>
          </div>
          <div className="font-serif text-2xl font-black text-emerald-700 font-mono">
            ₹{(revenue?.net_payable_inr ?? 0).toLocaleString('en-IN')}
          </div>
          <button
            onClick={handleRequestSettlement}
            disabled={settlementPending || settlementSuccess || !revenue?.net_payable_inr}
            className="text-[11px] text-cyan-700 font-bold hover:underline flex items-center gap-1 mt-1 disabled:opacity-50 disabled:no-underline"
          >
            {settlementPending ? 'Processing Transfer (Simulated)...' : settlementSuccess ? '✓ Transfer Initiated' : 'Request Instant Settlement →'}
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
            <span>Passengers Booked Today</span>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg"><Users className="w-4 h-4" /></div>
          </div>
          <div className="font-serif text-2xl font-black text-navy-800 font-mono">
            {revenue?.total_passengers_today ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">{revenue?.active_vessels_today ?? 0} vessel(s) sailing today</p>
        </div>
      </div>
      </>
      )}

      {activeSection === 'FLEET' && (
      <>
      {/* 3. Vessel Schedule & Live Deck Occupancy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Schedule Picker */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-serif text-base font-black text-navy-800 flex items-center gap-2">
            <Ship className="w-4 h-4 text-cyan-600" /> Active Sailings Today
          </h3>

          {schedules.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No sailings scheduled for today.</p>
          ) : (
            <div className="space-y-3">
              {schedules.map((sched) => {
                const isSelected = selectedScheduleId === sched.schedule_id;
                return (
                  <div
                    key={sched.schedule_id}
                    onClick={() => handleSelectSchedule(sched)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-cyan-50 border-cyan-400 shadow-sm'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <strong className="text-sm font-black text-navy-800">{sched.vessel_name}</strong>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        sched.status === 'SCHEDULED' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {sched.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-cyan-600" /> {sched.departure_time} Dep.
                    </div>
                    <div className="text-[11px] text-slate-500 mt-2 flex justify-between border-t border-slate-200 pt-2 font-mono">
                      <span>{sched.source_port.replace('_', ' ')}</span>
                      <span>→</span>
                      <span>{sched.destination_port.replace('_', ' ')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Real-Time Cabin Deck Occupancy */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-700">
                Cabin Load Analysis
              </span>
              <h3 className="font-serif text-lg font-black text-navy-800">
                {selectedSchedule ? selectedSchedule.vessel_name : 'Select a Vessel'}
              </h3>
            </div>

            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-navy-800 text-xs font-bold rounded-lg flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Print Boarding Roster
            </button>
          </div>

          {/* 3-Deck Breakdown Cards (live from the real seat map) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {deckBreakdown.map((deck) => (
              <div key={deck.cls} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">{deck.deck}</span>
                <strong className="text-sm font-bold text-navy-800 block">{deck.name}</strong>
                <div className="flex justify-between text-xs pt-1 font-mono">
                  <span className="text-slate-500">Occupancy:</span>
                  <span className={`font-bold ${deck.pct >= 100 ? 'text-red-600' : deck.pct >= 80 ? 'text-amber-600' : 'text-cyan-700'}`}>
                    {deck.pct}% ({deck.occupied}/{deck.total})
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${deck.pct >= 100 ? 'bg-red-500' : deck.pct >= 80 ? 'bg-amber-500' : 'bg-cyan-600'}`}
                    style={{ width: `${deck.pct}%` }}
                  ></div>
                </div>
                {deck.pct >= 100 ? (
                  <span className="text-[10px] text-red-600 font-bold block pt-1">SOLD OUT</span>
                ) : (
                  <span className="text-[10px] text-slate-400 block pt-1">₹{deck.pricePerSeat.toLocaleString('en-IN')} / seat</span>
                )}
              </div>
            ))}
          </div>

          {/* Passenger Roster Preview */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-cyan-600" /> Manifest Check-in Status
            </h4>

            {!manifest || manifest.manifest.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                No checked-in passengers for this voyage yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Seat</th>
                      <th className="p-2.5">Passenger</th>
                      <th className="p-2.5">Class</th>
                      <th className="p-2.5">Govt ID</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {manifest.manifest.map((p) => (
                      <tr key={p.ticket_ref} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono font-bold text-cyan-700">{p.seat_number}</td>
                        <td className="p-2.5 font-semibold text-navy-800">{p.passenger_name}</td>
                        <td className="p-2.5 text-slate-500">{p.cabin_class}</td>
                        <td className="p-2.5 font-mono text-slate-500">{p.id_type}: {p.id_masked_number}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                            {p.check_in_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      </>
      )}

        </div>
      </div>
    </div>
  );
}
