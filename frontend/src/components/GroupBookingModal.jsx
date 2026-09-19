import React, { useState, useEffect } from 'react';
import API from '../api/client';
import {
  Users2, Building2, MapPin, Calendar, Download, Upload, CheckCircle2,
  AlertCircle, ArrowRight, ArrowLeft
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8010/api/v1';

const ORG_TYPES = [
  { value: 'SCHOOL', label: 'School' },
  { value: 'COLLEGE', label: 'College / University' },
  { value: 'CORPORATE', label: 'Corporate' },
  { value: 'TOUR_OPERATOR', label: 'Tour Operator' },
  { value: 'GOVT_DELEGATION', label: 'Government Delegation' },
];

// Minimal CSV parser matching the columns in our own downloadable template —
// deliberately simple (no quoted-comma support) since the template we hand
// out never needs quoted fields.
function parseRosterCsv(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length < 2) return [];
  const rows = lines.slice(1); // skip header
  return rows.map((line) => {
    const [full_name, age, gender, nationality, id_type, id_number] = line.split(',').map((c) => c.trim());
    return {
      full_name: full_name || '',
      age: parseInt(age, 10) || 0,
      gender: (gender || 'MALE').toUpperCase(),
      nationality: (nationality || 'INDIAN').toUpperCase(),
      id_type: (id_type || 'AADHAAR').toUpperCase(),
      id_number: id_number || '',
    };
  }).filter((m) => m.full_name);
}

export function GroupBookingModal({ isOpen, onClose, user, onRequireLogin }) {
  const [step, setStep] = useState('DETAILS'); // DETAILS -> SLOT -> ROSTER -> REVIEW -> DONE
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Step 1: Organization & Group Details
  const [organizationType, setOrganizationType] = useState('SCHOOL');
  const [organizationName, setOrganizationName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [indianCount, setIndianCount] = useState(10);
  const [foreignCount, setForeignCount] = useState(0);

  // Step 2: Attraction + Date + Slot
  const [attractions, setAttractions] = useState([]);
  const [selectedAttractionId, setSelectedAttractionId] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');

  // Step 3: Roster
  const [roster, setRoster] = useState([]);
  const [rosterFileName, setRosterFileName] = useState('');

  const [submittedRef, setSubmittedRef] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setStep('DETAILS');
      setError(null);
      setOrganizationType('SCHOOL');
      setOrganizationName('');
      setContactPerson('');
      setContactPhone('');
      setContactEmail('');
      setIndianCount(10);
      setForeignCount(0);
      setSelectedAttractionId('');
      setVisitDate(new Date().toISOString().split('T')[0]);
      setSlots([]);
      setSelectedSlotId('');
      setRoster([]);
      setRosterFileName('');
      setSubmittedRef(null);
      fetchAttractions();
    }
  }, [isOpen]);

  const fetchAttractions = async () => {
    try {
      const res = await API.get('/attractions');
      setAttractions(res.data);
      if (res.data.length > 0) setSelectedAttractionId(res.data[0].id);
    } catch (err) {
      console.error('Failed to load attractions', err);
    }
  };

  const fetchSlots = async (attractionId, date) => {
    if (!attractionId || !date) return;
    try {
      const res = await API.get(`/attractions/${attractionId}/slots?target_date=${date}`);
      setSlots(res.data);
      setSelectedSlotId(res.data.length > 0 ? res.data[0].slot_id : '');
    } catch (err) {
      setSlots([]);
    }
  };

  if (!isOpen) return null;

  const totalHeadcount = (parseInt(indianCount, 10) || 0) + (parseInt(foreignCount, 10) || 0);

  const handleContinueFromDetails = (e) => {
    e.preventDefault();
    if (!user) {
      onRequireLogin();
      return;
    }
    if (totalHeadcount <= 0) {
      setError('Total traveler count must be greater than zero.');
      return;
    }
    setError(null);
    fetchSlots(selectedAttractionId, visitDate);
    setStep('SLOT');
  };

  const handleContinueFromSlot = (e) => {
    e.preventDefault();
    if (!selectedSlotId) {
      setError('Please select an available time slot.');
      return;
    }
    setError(null);
    setStep('ROSTER');
  };

  const handleRosterFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setRosterFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const parsed = parseRosterCsv(evt.target.result);
      setRoster(parsed);
    };
    reader.readAsText(file);
  };

  const handleContinueFromRoster = (e) => {
    e.preventDefault();
    if (roster.length !== totalHeadcount) {
      setError(`Roster has ${roster.length} member(s) but you specified ${totalHeadcount} traveler(s). They must match exactly.`);
      return;
    }
    setError(null);
    setStep('REVIEW');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.post('/group-bookings/request', {
        organization_name: organizationName,
        organization_type: organizationType,
        contact_person: contactPerson,
        contact_phone: contactPhone,
        contact_email: contactEmail,
        attraction_slot_id: selectedSlotId,
        indian_travelers_count: parseInt(indianCount, 10) || 0,
        foreign_travelers_count: parseInt(foreignCount, 10) || 0,
        roster,
      });
      setSubmittedRef(res.data.request_ref);
      setStep('DONE');
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not submit group booking request');
    } finally {
      setLoading(false);
    }
  };

  const selectedAttraction = attractions.find((a) => a.id === selectedAttractionId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/70 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="relative h-16 bg-navy-800 flex items-center px-6 gap-3">
          <Users2 className="w-6 h-6 text-cyan-300" />
          <div>
            <div className="text-sm font-bold text-white">Group / Institutional Booking</div>
            <div className="text-[10px] text-slate-300">Schools, Colleges, Corporates & Tour Operators (RFP Page 26)</div>
          </div>
        </div>
        <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white p-1">✕</button>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 'DETAILS' && (
            <form onSubmit={handleContinueFromDetails} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-cyan-600" /> Organization / Group Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sunrise Public School"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Organization Type</label>
                <select
                  value={organizationType}
                  onChange={(e) => setOrganizationType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800"
                >
                  {ORG_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Contact Person"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800"
                  required
                />
                <input
                  type="tel"
                  maxLength="10"
                  placeholder="Contact Phone"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, ''))}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800"
                  required
                />
                <input
                  type="email"
                  placeholder="Contact Email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Indian Travelers</label>
                  <input
                    type="number"
                    min="0"
                    value={indianCount}
                    onChange={(e) => setIndianCount(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Foreign Travelers</label>
                  <input
                    type="number"
                    min="0"
                    value={foreignCount}
                    onChange={(e) => setForeignCount(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800 font-mono"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500">Total travelers: <strong className="text-navy-800">{totalHeadcount}</strong></p>

              <button type="submit" className="w-full py-2.5 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-lg text-sm shadow-md flex items-center justify-center gap-2">
                Next: Choose Attraction &amp; Slot <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {step === 'SLOT' && (
            <form onSubmit={handleContinueFromSlot} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-cyan-600" /> Attraction
                </label>
                <select
                  value={selectedAttractionId}
                  onChange={(e) => { setSelectedAttractionId(e.target.value); fetchSlots(e.target.value, visitDate); }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800"
                >
                  {attractions.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-cyan-600" /> Visit Date
                </label>
                <input
                  type="date"
                  value={visitDate}
                  onChange={(e) => { setVisitDate(e.target.value); fetchSlots(selectedAttractionId, e.target.value); }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Time Slot</label>
                {slots.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3">No slots available for this date.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((s) => (
                      <button
                        type="button"
                        key={s.slot_id}
                        onClick={() => setSelectedSlotId(s.slot_id)}
                        className={`p-2 rounded-lg border text-left text-xs transition-all ${
                          selectedSlotId === s.slot_id ? 'bg-cyan-50 border-cyan-500 text-cyan-800' : 'bg-white border-slate-200 text-slate-600 hover:border-cyan-300'
                        }`}
                      >
                        <div className="font-mono font-bold">{s.start_time}-{s.end_time}</div>
                        <div className="text-[10px] text-slate-500">{s.available_seats} seats free</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => setStep('DETAILS')} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-navy-800 font-bold rounded-lg text-sm flex items-center gap-1.5">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button type="submit" className="flex-1 py-2.5 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-lg text-sm shadow-md flex items-center justify-center gap-2">
                  Next: Upload Roster <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {step === 'ROSTER' && (
            <form onSubmit={handleContinueFromRoster} className="space-y-4">
              <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 text-xs text-cyan-800 space-y-2">
                <p>1. Download the roster template, fill in all <strong>{totalHeadcount}</strong> traveler(s), then upload it below.</p>
                <a
                  href={`${API_BASE_URL}/group-bookings/template`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-cyan-300 rounded-lg font-bold text-cyan-700 hover:bg-cyan-100"
                >
                  <Download className="w-3.5 h-3.5" /> Download Roster Template (CSV)
                </a>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5 text-cyan-600" /> Upload Completed Roster
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleRosterFile}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-cyan-50 file:text-cyan-700 file:font-bold file:text-xs"
                />
                {rosterFileName && <p className="text-[11px] text-slate-500 mt-1">Loaded: {rosterFileName} ({roster.length} traveler(s) parsed)</p>}
              </div>

              {roster.length > 0 && (
                <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50 text-slate-500 font-mono uppercase sticky top-0">
                      <tr>
                        <th className="p-2">Name</th>
                        <th className="p-2">Age/Gender</th>
                        <th className="p-2">Nationality</th>
                        <th className="p-2">ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {roster.map((m, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-bold text-navy-800">{m.full_name}</td>
                          <td className="p-2 text-slate-600">{m.age} / {m.gender}</td>
                          <td className="p-2 text-slate-600">{m.nationality}</td>
                          <td className="p-2 font-mono text-slate-500">{m.id_type}: {m.id_number}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex gap-2">
                <button type="button" onClick={() => setStep('SLOT')} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-navy-800 font-bold rounded-lg text-sm flex items-center gap-1.5">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button type="submit" disabled={roster.length === 0} className="flex-1 py-2.5 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-lg text-sm shadow-md flex items-center justify-center gap-2 disabled:opacity-50">
                  Next: Review &amp; Submit <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {step === 'REVIEW' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-1.5">
                <div className="flex justify-between"><span className="text-slate-500">Organization:</span><strong className="text-navy-800">{organizationName} ({organizationType.replace('_', ' ')})</strong></div>
                <div className="flex justify-between"><span className="text-slate-500">Contact:</span><strong className="text-navy-800">{contactPerson} · {contactPhone}</strong></div>
                <div className="flex justify-between"><span className="text-slate-500">Attraction:</span><strong className="text-navy-800">{selectedAttraction?.title}</strong></div>
                <div className="flex justify-between"><span className="text-slate-500">Date / Slot:</span><strong className="text-navy-800">{visitDate} · {slots.find((s) => s.slot_id === selectedSlotId)?.start_time}-{slots.find((s) => s.slot_id === selectedSlotId)?.end_time}</strong></div>
                <div className="flex justify-between"><span className="text-slate-500">Headcount:</span><strong className="text-navy-800">{totalHeadcount} ({indianCount} Indian / {foreignCount} Foreign)</strong></div>
                <div className="flex justify-between"><span className="text-slate-500">Roster:</span><strong className="text-navy-800">{roster.length} traveler(s) uploaded</strong></div>
              </div>

              <p className="text-[11px] text-slate-500">
                This request will be sent to ANIIDCO for review. Once approved, you'll receive an order reference to complete payment.
              </p>

              <div className="flex gap-2">
                <button type="button" onClick={() => setStep('ROSTER')} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-navy-800 font-bold rounded-lg text-sm flex items-center gap-1.5">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSubmit}
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-sm shadow-md disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Group Booking Request'}
                </button>
              </div>
            </div>
          )}

          {step === 'DONE' && (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="font-serif text-lg font-black text-navy-800">Request Submitted</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Your tracking reference is below. ANIIDCO will review your roster and notify you once approved for payment.
              </p>
              <p className="font-mono text-sm font-black text-cyan-700 bg-cyan-50 border border-cyan-200 inline-block px-4 py-2 rounded-lg">
                {submittedRef}
              </p>
              <div>
                <button onClick={onClose} className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-navy-800 font-bold rounded-lg text-xs">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
