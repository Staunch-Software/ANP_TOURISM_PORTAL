import React, { useState, useEffect } from 'react';
import API from '../api/client';
import {
  ShieldCheck, TrendingUp, Users, DollarSign, Download,
  Ship, CloudRain, CheckCircle2, FileSpreadsheet, RefreshCw
} from 'lucide-react';

export function AdminDashboard({ user }) {
  const [revenueData, setRevenueData] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [manifestData, setManifestData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [manifestLoading, setManifestLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    fetchMISData();
    fetchSchedules();
  }, []);

  const fetchMISData = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/revenue-mis');
      setRevenueData(res.data);
    } catch (err) {
      console.error("Failed to fetch revenue MIS", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await API.get(`/ferry/schedules?source_port=PORT_BLAIR&destination_port=HAVELOCK&travel_date=${today}`);
      setSchedules(res.data);
      if (res.data.length > 0) {
        setSelectedScheduleId(res.data[0].schedule_id);
        fetchManifest(res.data[0].schedule_id);
      }
    } catch (err) {
      console.error("Failed to load schedules", err);
    }
  };

  const fetchManifest = async (scheduleId) => {
    if (!scheduleId) return;
    setManifestLoading(true);
    try {
      const res = await API.get(`/admin/manifest/${scheduleId}`);
      setManifestData(res.data);
    } catch (err) {
      setManifestData(null);
    } finally {
      setManifestLoading(false);
    }
  };

  const handleScheduleChange = (e) => {
    const id = e.target.value;
    setSelectedScheduleId(id);
    fetchManifest(id);
  };

  const handleDownloadCSV = () => {
    if (!selectedScheduleId) return;
    const downloadUrl = `http://localhost:8000/api/v1/admin/manifest/${selectedScheduleId}/export-csv`;
    window.open(downloadUrl, '_blank');
  };

  const handleEmergencyHalt = async () => {
    if (!selectedScheduleId) return;
    if (!window.confirm("CONFIRM EMERGENCY WEATHER HALT: This will cancel the selected ferry departure and trigger 100% automated refunds.")) return;

    try {
      const res = await API.post('/admin/emergency-throttle', {
        schedule_id: selectedScheduleId,
        action: 'CANCEL_WEATHER',
        reason: 'IMD Squally Monsoon Warning (Force 6 Gale)'
      });

      setActionMessage({
        type: 'SUCCESS',
        text: res.data.message
      });
      fetchSchedules();
    } catch (err) {
      alert("Failed to issue emergency throttle");
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto my-12 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h3 className="font-serif text-lg font-black text-navy-800">Restricted Access</h3>
        <p className="text-xs text-slate-500 mt-1">
          This dashboard requires Administrator or Directorate of Tourism privileges.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Administrative Directorate View
          </div>
          <h2 className="font-serif text-2xl font-black text-navy-800">Government MIS &amp; Harbor Oversight</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time financial reconciliation, Port Management Board (PMB) passenger manifests, and weather controls.
          </p>
        </div>

        <button
          onClick={fetchMISData}
          disabled={loading}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-bold text-navy-800 flex items-center gap-2 transition-all self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Metrics
        </button>
      </div>

      {actionMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-800">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
            <span>Treasury Revenue</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl font-black text-navy-800 font-mono">
            ₹{revenueData ? revenueData.total_revenue_inr.toLocaleString('en-IN') : '0.00'}
          </div>
          <p className="text-[11px] text-emerald-700 font-medium">Reconciled via Bank Gateway</p>
        </div>

        {/* Total Tickets Issued */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
            <span>Confirmed Passes</span>
            <div className="p-2 bg-cyan-50 text-cyan-700 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl font-black text-navy-800 font-mono">
            {revenueData ? revenueData.total_tickets_issued : 0}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Turnstile-ready Ed25519 tokens</p>
        </div>

        {/* Monument Share */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
            <span>Heritage &amp; Monuments</span>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl font-black text-navy-800 font-mono">
            ₹{revenueData ? revenueData.monument_revenue_inr.toLocaleString('en-IN') : '0.00'}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Cellular Jail &amp; Museums</p>
        </div>

        {/* Ferry Share */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
            <span>Ferry Operations</span>
            <div className="p-2 bg-teal-50 text-teal-700 rounded-lg">
              <Ship className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl font-black text-navy-800 font-mono">
            ₹{revenueData ? revenueData.ferry_revenue_inr.toLocaleString('en-IN') : '0.00'}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Inter-island catamarans</p>
        </div>
      </div>

      {/* 3. Harbor Passenger Manifest Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-700">
              Port Management Board (PMB) Clearance
            </span>
            <h3 className="font-serif text-lg font-black text-navy-800 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-cyan-600" /> Maritime Passenger Manifest
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Mandatory vessel manifest required by Harbor Marine Police prior to casting off.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Voyage Dropdown */}
            <select
              value={selectedScheduleId}
              onChange={handleScheduleChange}
              className="px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-navy-800 focus:border-cyan-500 focus:outline-none"
            >
              {schedules.map((s) => (
                <option key={s.schedule_id} value={s.schedule_id}>
                  {s.vessel_name} ({s.departure_time} - {s.source_port} → {s.destination_port})
                </option>
              ))}
            </select>

            {/* One-Click Official CSV Export */}
            <button
              type="button"
              onClick={handleDownloadCSV}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg flex items-center gap-2 shadow-md transition-all"
            >
              <Download className="w-4 h-4" /> Download PMB CSV
            </button>

            {/* Emergency Weather Halt Button */}
            <button
              type="button"
              onClick={handleEmergencyHalt}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs rounded-lg flex items-center gap-2 transition-colors"
              title="Cancel voyage due to IMD Cyclone Warning"
            >
              <CloudRain className="w-4 h-4" /> Emergency Weather Halt
            </button>
          </div>
        </div>

        {/* Manifest Table */}
        {manifestLoading ? (
          <div className="text-center py-12 text-slate-400 text-xs">Loading passenger manifest...</div>
        ) : !manifestData || manifestData.manifest.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No passengers booked on this voyage yet. Book seats in the Ferries tab to populate the manifest.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">S.No</th>
                  <th className="p-3">Seat</th>
                  <th className="p-3">Cabin</th>
                  <th className="p-3">Passenger Name</th>
                  <th className="p-3">Age/Sex</th>
                  <th className="p-3">Govt ID</th>
                  <th className="p-3">Ticket Ref</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {manifestData.manifest.map((p) => (
                  <tr key={p.ticket_ref} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono text-slate-400">{p.serial_no}</td>
                    <td className="p-3 font-mono font-bold text-cyan-700">{p.seat_number}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                        {p.cabin_class}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-navy-800">{p.passenger_name}</td>
                    <td className="p-3 text-slate-500">{p.age} / {p.gender}</td>
                    <td className="p-3 font-mono text-slate-500">{p.id_type}: {p.id_masked_number}</td>
                    <td className="p-3 font-mono text-cyan-700">{p.ticket_ref}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
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
  );
}
