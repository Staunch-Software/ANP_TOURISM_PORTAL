import React, { useState, useEffect } from 'react';
import API from '../api/client';
import {
  Waves, Users, DollarSign, Clock,
  CheckCircle2, RefreshCw, Layers, FileSpreadsheet, MapPin
} from 'lucide-react';

export function VendorDashboard({ user }) {
  const [attractions, setAttractions] = useState([]);
  const [selectedAttractionId, setSelectedAttractionId] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [manifest, setManifest] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [settlementPending, setSettlementPending] = useState(false);
  const [settlementSuccess, setSettlementSuccess] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchAttractions();
    fetchRevenueSummary();
  }, []);

  const fetchAttractions = async () => {
    setLoading(true);
    try {
      const res = await API.get('/attractions');
      const list = res.data || [];
      setAttractions(list);
      if (list.length > 0) {
        handleSelectAttraction(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load attractions', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueSummary = async () => {
    try {
      const res = await API.get('/vendor/revenue-summary');
      setRevenue(res.data);
    } catch (err) {
      console.error('Failed to load vendor revenue summary', err);
    }
  };

  const fetchSlots = async (attractionId) => {
    try {
      const res = await API.get(`/attractions/${attractionId}/slots?target_date=${today}`);
      const slotList = res.data || [];
      setSlots(slotList);
      if (slotList.length > 0) {
        handleSelectSlot(slotList[0].slot_id);
      } else {
        setSelectedSlotId('');
        setManifest(null);
      }
    } catch (err) {
      setSlots([]);
    }
  };

  const fetchManifest = async (slotId) => {
    try {
      const res = await API.get(`/vendor/manifest/${slotId}`);
      setManifest(res.data);
    } catch (err) {
      setManifest(null);
    }
  };

  const handleSelectAttraction = (attractionId) => {
    setSelectedAttractionId(attractionId);
    fetchSlots(attractionId);
  };

  const handleSelectSlot = (slotId) => {
    setSelectedSlotId(slotId);
    fetchManifest(slotId);
  };

  const handleRefresh = () => {
    fetchAttractions();
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

  if (!user || (user.role !== 'VENDOR' && user.role !== 'ADMIN')) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto my-12 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto mb-4">
          <Waves className="w-7 h-7" />
        </div>
        <h3 className="font-serif text-lg font-black text-navy-800">Restricted Access</h3>
        <p className="text-xs text-slate-500 mt-1">
          This dashboard requires Activity Vendor or Administrator privileges.
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
            <Waves className="w-3.5 h-3.5" /> Service Provider Portal (RFP Clause 7.2.1-II)
          </div>
          <h2 className="font-serif text-2xl font-black text-navy-800">Activity Vendor Dashboard</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Water sports &amp; monument operations: slot occupancy, visitor rosters, and settlement requests.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-bold text-navy-800 flex items-center gap-2 self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Activity Data
        </button>
      </div>

      {/* 2. Top Vendor Metrics (real, computed from confirmed bookings today) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
            <span>Today's Gross Bookings</span>
            <div className="p-2 bg-cyan-50 text-cyan-700 rounded-lg"><DollarSign className="w-4 h-4" /></div>
          </div>
          <div className="font-serif text-2xl font-black text-navy-800 font-mono">
            ₹{(revenue?.today_gross_activity_revenue_inr ?? 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Confirmed activity &amp; monument tickets</p>
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
            <span>Visitors Booked Today</span>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg"><Users className="w-4 h-4" /></div>
          </div>
          <div className="font-serif text-2xl font-black text-navy-800 font-mono">
            {revenue?.total_visitors_today ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">{revenue?.active_attractions_today ?? 0} activity/activities live today</p>
        </div>
      </div>

      {/* 3. Attraction Picker & Slot Occupancy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Attraction & Slot Picker */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-serif text-base font-black text-navy-800 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-600" /> Your Activities Today
          </h3>

          {attractions.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No attractions found.</p>
          ) : (
            <div className="space-y-3">
              {attractions.map((a) => (
                <div
                  key={a.id}
                  onClick={() => handleSelectAttraction(a.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedAttractionId === a.id
                      ? 'bg-cyan-50 border-cyan-400 shadow-sm'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <strong className="text-sm font-black text-navy-800">{a.title}</strong>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                      {a.category}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2 font-mono">{a.island.replace('_', ' ')}</div>
                </div>
              ))}
            </div>
          )}

          {selectedAttractionId && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-600" /> Today's Slots
              </h4>
              {slots.length === 0 ? (
                <p className="text-xs text-slate-400 py-3">No slots scheduled today for this activity.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {slots.map((s) => (
                    <button
                      key={s.slot_id}
                      onClick={() => handleSelectSlot(s.slot_id)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                        selectedSlotId === s.slot_id
                          ? 'bg-cyan-700 text-white border-cyan-700'
                          : 'bg-white text-navy-800 border-slate-200 hover:border-cyan-400'
                      }`}
                    >
                      {s.start_time}–{s.end_time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Slot Occupancy + Visitor Manifest */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-700">
                Slot Occupancy
              </span>
              <h3 className="font-serif text-lg font-black text-navy-800">
                {manifest ? `${manifest.attraction_title} · ${manifest.start_time}–${manifest.end_time}` : 'Select a Slot'}
              </h3>
            </div>

            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-navy-800 text-xs font-bold rounded-lg flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Print Visitor Roster
            </button>
          </div>

          {(() => {
            const selectedSlot = slots.find((s) => s.slot_id === selectedSlotId);
            if (!selectedSlot) {
              return (
                <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                  Select an activity slot to view occupancy.
                </div>
              );
            }
            const pct = selectedSlot.total_capacity > 0
              ? Math.round((selectedSlot.booked_count / selectedSlot.total_capacity) * 100)
              : 0;
            return (
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2 max-w-sm">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Slot Capacity</span>
                <div className="flex justify-between text-xs pt-1 font-mono">
                  <span className="text-slate-500">Occupancy:</span>
                  <span className={`font-bold ${pct >= 100 ? 'text-red-600' : pct >= 80 ? 'text-amber-600' : 'text-cyan-700'}`}>
                    {pct}% ({selectedSlot.booked_count}/{selectedSlot.total_capacity})
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-cyan-600'}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  ></div>
                </div>
                {pct >= 100 && <span className="text-[10px] text-red-600 font-bold block pt-1">SLOT FULL</span>}
              </div>
            );
          })()}

          {/* Visitor Roster */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-cyan-600" /> Manifest Check-in Status
            </h4>

            {!manifest || manifest.manifest.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                No booked visitors for this slot yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Visitor</th>
                      <th className="p-2.5">Age/Gender</th>
                      <th className="p-2.5">Govt ID</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {manifest.manifest.map((p) => (
                      <tr key={p.ticket_ref} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono font-bold text-cyan-700">{p.serial_no}</td>
                        <td className="p-2.5 font-semibold text-navy-800">{p.passenger_name}</td>
                        <td className="p-2.5 text-slate-500">{p.age ?? '—'} / {p.gender ?? '—'}</td>
                        <td className="p-2.5 font-mono text-slate-500">{p.id_type}: {p.id_masked_number}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.check_in_status === 'CHECKED_IN'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
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
    </div>
  );
}
