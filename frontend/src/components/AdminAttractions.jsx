import React, { useState, useEffect } from 'react';
import API from '../api/client';
import { Landmark, Plus, RefreshCw, Pencil, Clock, CalendarOff, Trash2, X, Power } from 'lucide-react';

// RFP p.30 (Administrative User): authorize new attractions into the booking
// engine (title, description, images, pricing, time slots, capacities),
// activate/deactivate an attraction on a particular day or within time
// intervals, and deactivate time slots.

const ISLANDS = [
  { value: 'PORT_BLAIR', label: 'Port Blair' },
  { value: 'HAVELOCK', label: 'Havelock (Swaraj Dweep)' },
  { value: 'NEIL', label: 'Neil (Shaheed Dweep)' },
];
const CATEGORIES = [
  { value: 'MONUMENT', label: 'Monument' },
  { value: 'LIGHT_SOUND', label: 'Light & Sound Show' },
  { value: 'WATER_SPORT', label: 'Water Sport' },
];

const EMPTY_FORM = {
  title: '', island: 'PORT_BLAIR', category: 'MONUMENT',
  base_price_inr: '', foreign_price_inr: '', express_price_inr: '', express_price_foreign_inr: '',
  description: '', image_url: '', estimated_exploration_minutes: '', opening_time: '', closing_time: '',
};
const EMPTY_SLOT = { start_time: '09:00', end_time: '10:00', capacity: 50 };

const inputCls = 'w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-navy-800 focus:border-cyan-500 focus:outline-none';
const labelCls = 'block text-[11px] font-bold text-slate-600 mb-1';

function Modal({ title, subtitle, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 backdrop-blur-sm p-4">
      <div className={`bg-white border border-slate-200 rounded-2xl w-full ${wide ? 'max-w-3xl' : 'max-w-2xl'} max-h-[90vh] overflow-y-auto p-6 shadow-2xl`}>
        <div className="flex justify-between items-start pb-3 border-b border-slate-100 mb-4">
          <div>
            {subtitle && <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-widest">{subtitle}</span>}
            <h3 className="font-serif text-base font-extrabold text-navy-800">{title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-navy-800 p-1" aria-label="Close"><X className="w-4 h-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function NoteBanner({ note, onDismiss }) {
  if (!note) return null;
  const cls = { ok: 'bg-emerald-50 border-emerald-200 text-emerald-800', warn: 'bg-amber-50 border-amber-200 text-amber-800' }[note.type] || 'bg-slate-50 border-slate-200 text-slate-700';
  return (
    <div className={`mb-3 px-3 py-2 border rounded-lg text-xs flex justify-between gap-3 ${cls}`}>
      <span>{note.text}</span>
      <button onClick={onDismiss} aria-label="Dismiss"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
}

function ErrorBanner({ message }) {
  if (!message) return null;
  return <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">{message}</div>;
}

// A new row starts where the previous one ends and runs an hour, so adding a
// slot never creates an accidental duplicate of the row above.
function nextSlot(rows) {
  const last = rows[rows.length - 1];
  if (!last || !/^\d{2}:\d{2}$/.test(last.end_time || '')) return { ...EMPTY_SLOT };
  const [h, m] = last.end_time.split(':').map(Number);
  const pad = (n) => String(n).padStart(2, '0');
  return { start_time: last.end_time, end_time: `${pad(Math.min(h + 1, 23))}:${pad(m)}`, capacity: last.capacity };
}

function SlotTimesEditor({ rows, setRows }) {
  const update = (i, field, value) => setRows(rows.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
          <div>
            {i === 0 && <label className={labelCls}>Start</label>}
            <input type="time" value={r.start_time} onChange={(e) => update(i, 'start_time', e.target.value)} className={inputCls} />
          </div>
          <div>
            {i === 0 && <label className={labelCls}>End</label>}
            <input type="time" value={r.end_time} onChange={(e) => update(i, 'end_time', e.target.value)} className={inputCls} />
          </div>
          <div>
            {i === 0 && <label className={labelCls}>Capacity</label>}
            <input type="number" min="1" value={r.capacity} onChange={(e) => update(i, 'capacity', e.target.value)} className={inputCls} />
          </div>
          <button
            type="button"
            onClick={() => setRows(rows.filter((_, idx) => idx !== i))}
            disabled={rows.length === 1}
            className="p-2 text-slate-400 hover:text-red-600 disabled:opacity-30"
            title="Remove slot"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setRows([...rows, nextSlot(rows)])}
        className="text-[11px] font-bold text-cyan-700 hover:underline flex items-center gap-1"
      >
        <Plus className="w-3.5 h-3.5" /> Add another slot
      </button>
    </div>
  );
}

const toNumberOrUndefined = (v) => (v === '' || v === null || v === undefined ? undefined : Number(v));
const cleanSlots = (rows) => rows.map((r) => ({ start_time: r.start_time, end_time: r.end_time, capacity: Number(r.capacity) }));

export function AdminAttractions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  const [formFor, setFormFor] = useState(null); // 'new' | attraction
  const [form, setForm] = useState(EMPTY_FORM);
  const [formSlots, setFormSlots] = useState([{ ...EMPTY_SLOT }]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const [slotsFor, setSlotsFor] = useState(null);
  const [slotRows, setSlotRows] = useState([]);
  const [closuresFor, setClosuresFor] = useState(null);
  const [closureForm, setClosureForm] = useState({ start_date: '', end_date: '', wholeDay: true, start_time: '09:00', end_time: '12:00', reason: '' });
  const [modalError, setModalError] = useState(null);
  const [modalNote, setModalNote] = useState(null);
  const [cancelBusy, setCancelBusy] = useState(null); // closure id being cancelled

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/attractions');
      setItems(res.data);
      // keep an open modal's attraction fresh
      setClosuresFor((cur) => (cur ? res.data.find((a) => a.id === cur.id) || null : cur));
    } catch (err) {
      setNotice({ type: 'error', text: err.response?.data?.detail || 'Failed to load attractions' });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY_FORM); setFormSlots([{ ...EMPTY_SLOT }]); setFormError(null); setFormFor('new'); };
  const openEdit = (a) => {
    setForm({
      title: a.title, island: a.island, category: a.category,
      base_price_inr: a.base_price_inr, foreign_price_inr: a.foreign_price_inr,
      express_price_inr: a.express_price_inr ?? '', express_price_foreign_inr: a.express_price_foreign_inr ?? '',
      description: a.description || '', image_url: a.image_url || '',
      estimated_exploration_minutes: a.estimated_exploration_minutes ?? '',
      opening_time: a.opening_time || '', closing_time: a.closing_time || '',
    });
    setFormError(null);
    setFormFor(a);
  };

  const buildPayload = () => ({
    title: form.title.trim(), island: form.island, category: form.category,
    base_price_inr: toNumberOrUndefined(form.base_price_inr),
    foreign_price_inr: toNumberOrUndefined(form.foreign_price_inr),
    express_price_inr: toNumberOrUndefined(form.express_price_inr),
    express_price_foreign_inr: toNumberOrUndefined(form.express_price_foreign_inr),
    description: form.description.trim() || undefined,
    image_url: form.image_url.trim() || undefined,
    estimated_exploration_minutes: toNumberOrUndefined(form.estimated_exploration_minutes),
    opening_time: form.opening_time || undefined,
    closing_time: form.closing_time || undefined,
  });

  const saveForm = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      if (formFor === 'new') {
        await API.post('/admin/attractions', { ...buildPayload(), slot_times: cleanSlots(formSlots) });
        setNotice({ type: 'ok', text: `"${form.title.trim()}" added. Its slots are now bookable.` });
      } else {
        await API.patch(`/admin/attractions/${formFor.id}`, buildPayload());
        setNotice({ type: 'ok', text: `"${form.title.trim()}" updated.` });
      }
      setFormFor(null);
      load();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setFormError(typeof detail === 'string' ? detail : 'Could not save. Please check the fields.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (a) => {
    const next = !a.is_active;
    const verb = next ? 'activate' : 'deactivate';
    if (!window.confirm(`${next ? 'Activate' : 'Deactivate'} "${a.title}"? ${next ? 'It will become bookable again.' : 'Tourists will no longer see or book it. Existing tickets are not affected.'}`)) return;
    try {
      await API.patch(`/admin/attractions/${a.id}`, { is_active: next });
      setNotice({ type: 'ok', text: `"${a.title}" ${next ? 'activated' : 'deactivated'}.` });
      load();
    } catch (err) {
      setNotice({ type: 'error', text: err.response?.data?.detail || `Failed to ${verb}` });
    }
  };

  const openSlots = (a) => {
    setSlotRows(a.slot_times.length ? a.slot_times.map((s) => ({ ...s })) : [{ ...EMPTY_SLOT }]);
    setModalError(null);
    setSlotsFor(a);
  };
  const saveSlots = async () => {
    setSaving(true);
    setModalError(null);
    try {
      await API.put(`/admin/attractions/${slotsFor.id}/slot-times`, { slot_times: cleanSlots(slotRows) });
      setNotice({ type: 'ok', text: `Slot times for "${slotsFor.title}" updated.` });
      setSlotsFor(null);
      load();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setModalError(typeof detail === 'string' ? detail : 'Could not save slot times.');
    } finally {
      setSaving(false);
    }
  };

  const openClosures = (a) => {
    const today = new Date().toISOString().split('T')[0];
    setClosureForm({ start_date: today, end_date: today, wholeDay: true, start_time: '09:00', end_time: '12:00', reason: '' });
    setModalError(null);
    setModalNote(null);
    setClosuresFor(a);
  };
  const addClosure = async (e) => {
    e.preventDefault();
    setSaving(true);
    setModalError(null);
    try {
      const body = {
        start_date: closureForm.start_date, end_date: closureForm.end_date, reason: closureForm.reason,
        ...(closureForm.wholeDay ? {} : { start_time: closureForm.start_time, end_time: closureForm.end_time }),
      };
      const res = await API.post(`/admin/attractions/${closuresFor.id}/closures`, body);
      const { slots_closed, booked_seats_in_range } = res.data;
      setModalNote({
        type: booked_seats_in_range > 0 ? 'warn' : 'ok',
        text: `${slots_closed} slot(s) closed to new bookings.` +
          (booked_seats_in_range > 0 ? ` ${booked_seats_in_range} seat(s) were already booked in that range. Use "Cancel & refund bookings" on the closure below to cancel and refund them, or leave them as they are.` : ''),
      });
      setClosureForm((f) => ({ ...f, reason: '' }));
      load();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setModalError(typeof detail === 'string' ? detail : 'Could not create the closure.');
    } finally {
      setSaving(false);
    }
  };
  const removeClosure = async (c) => {
    if (!window.confirm('Remove this closure? Its slots will reopen for booking.')) return;
    try {
      const res = await API.delete(`/admin/attractions/${closuresFor.id}/closures/${c.id}`);
      setModalNote({ type: 'ok', text: `Closure removed — ${res.data.slots_reopened} slot(s) reopened.` });
      load();
    } catch (err) {
      setModalError(err.response?.data?.detail || 'Could not remove the closure.');
    }
  };

  // Cancel + refund + notify the visitors who already hold tickets in a
  // closure's slots. Previews first so the admin sees exactly what happens.
  const cancelClosureBookings = async (c) => {
    setModalError(null);
    setCancelBusy(c.id);
    try {
      const base = `/admin/attractions/${closuresFor.id}/closures/${c.id}`;
      const { data: pv } = await API.get(`${base}/affected-bookings`);
      if (pv.tickets_affected === 0) {
        setModalNote({ type: 'ok', text: 'There are no unused tickets to cancel for this closure.' });
        return;
      }
      const ok = window.confirm(
        `Cancel ${pv.tickets_affected} ticket(s) in ${pv.orders_affected} booking(s) and refund ₹${pv.total_refund_inr.toLocaleString('en-IN')}?

` +
        `Each visitor is notified by email/WhatsApp with this reason: "${c.reason}".
` +
        `Tickets already checked in are not touched. If a booking also has other attractions, only this one is cancelled.`
      );
      if (!ok) return;
      const { data } = await API.post(`${base}/cancel-bookings`, { reason: c.reason });
      setModalNote({
        type: data.refunds_failed > 0 ? 'warn' : 'ok',
        text: `${data.tickets_affected} ticket(s) cancelled in ${data.orders_affected} booking(s); ₹${data.total_refund_inr.toLocaleString('en-IN')} refunded. Visitors have been notified.` +
          (data.refunds_failed > 0 ? ` ${data.refunds_failed} refund(s) could not be processed automatically — retry them under Cancellations & Refunds.` : ''),
      });
    } catch (err) {
      setModalError(err.response?.data?.detail || 'Could not cancel the bookings.');
    } finally {
      setCancelBusy(null);
    }
  };

  const noticeCls = { ok: 'bg-emerald-50 border-emerald-200 text-emerald-800', warn: 'bg-amber-50 border-amber-200 text-amber-800', error: 'bg-red-50 border-red-200 text-red-700' };
  const closureWhen = (c) => `${c.start_date === c.end_date ? c.start_date : `${c.start_date} → ${c.end_date}`}${c.start_time ? `, ${c.start_time}–${c.end_time}` : ', all day'}`;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-700">Booking Engine Catalogue</span>
          <h3 className="font-serif text-base font-black text-navy-800 flex items-center gap-2">
            <Landmark className="w-4 h-4 text-cyan-600" /> Attractions &amp; Availability
          </h3>
          <p className="text-xs text-slate-500">Add attractions, edit details, set slot times, and close an attraction or slot for a day or time window.</p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <button onClick={load} disabled={loading} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-bold text-navy-800 flex items-center gap-2">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={openNew} className="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 rounded-lg text-xs font-bold text-white flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Attraction
          </button>
        </div>
      </div>

      {notice && (
        <div className={`px-3 py-2 border rounded-lg text-xs flex justify-between gap-3 ${noticeCls[notice.type]}`}>
          <span>{notice.text}</span>
          <button onClick={() => setNotice(null)} aria-label="Dismiss"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-xs">Loading attractions...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3">Attraction</th>
                <th className="p-3">Price (Indian / Foreign)</th>
                <th className="p-3">Hours &amp; Slots</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {items.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50 align-top">
                  <td className="p-3">
                    <div className="flex items-start gap-3">
                      {a.image_url ? (
                        <img src={a.image_url} alt="" className="w-12 h-12 rounded-lg object-cover bg-slate-100 shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-100 shrink-0" />
                      )}
                      <div>
                        <div className="font-bold text-navy-800">{a.title}</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wide">
                          {(ISLANDS.find((i) => i.value === a.island) || {}).label || a.island} · {(CATEGORIES.find((c) => c.value === a.category) || {}).label || a.category}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 font-mono">₹{a.base_price_inr.toLocaleString('en-IN')} / ₹{a.foreign_price_inr.toLocaleString('en-IN')}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1 text-slate-600"><Clock className="w-3 h-3 text-cyan-600" /> {a.opening_time || '—'} – {a.closing_time || '—'}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{a.slot_times.length} slot time(s) · {a.slot_times.reduce((n, s) => n + s.capacity, 0)} seats/day</div>
                  </td>
                  <td className="p-3">
                    {a.is_active
                      ? <span className="text-emerald-700 font-bold text-[11px]">● Active</span>
                      : <span className="text-red-600 font-bold text-[11px]">● Deactivated</span>}
                    {a.closures.length > 0 && <div className="text-[10px] text-amber-700 mt-0.5">{a.closures.length} closure(s)</div>}
                  </td>
                  <td className="p-3 text-right whitespace-nowrap space-x-1.5">
                    <button onClick={() => openEdit(a)} className="px-2.5 py-1 rounded-lg text-[11px] font-medium border bg-slate-50 hover:bg-slate-100 border-slate-200 inline-flex items-center gap-1"><Pencil className="w-3 h-3" /> Edit</button>
                    <button onClick={() => openSlots(a)} className="px-2.5 py-1 rounded-lg text-[11px] font-medium border bg-slate-50 hover:bg-slate-100 border-slate-200 inline-flex items-center gap-1"><Clock className="w-3 h-3" /> Slots</button>
                    <button onClick={() => openClosures(a)} className="px-2.5 py-1 rounded-lg text-[11px] font-medium border bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200 inline-flex items-center gap-1"><CalendarOff className="w-3 h-3" /> Close dates</button>
                    <button
                      onClick={() => toggleActive(a)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border inline-flex items-center gap-1 ${a.is_active ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'}`}
                    >
                      <Power className="w-3 h-3" /> {a.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / edit */}
      {formFor && (
        <Modal title={formFor === 'new' ? 'Add Attraction' : `Edit ${formFor.title}`} subtitle="Attraction details" onClose={() => setFormFor(null)}>
          <form onSubmit={saveForm} className="space-y-4">
            <ErrorBanner message={formError} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-3"><label className={labelCls}>Title *</label><input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
              <div><label className={labelCls}>Island *</label><select className={inputCls} value={form.island} onChange={(e) => setForm({ ...form, island: e.target.value })}>{ISLANDS.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}</select></div>
              <div><label className={labelCls}>Category *</label><select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
              <div><label className={labelCls}>Exploration time (min)</label><input type="number" min="1" className={inputCls} value={form.estimated_exploration_minutes} onChange={(e) => setForm({ ...form, estimated_exploration_minutes: e.target.value })} /></div>
              <div><label className={labelCls}>Indian price (₹) *</label><input type="number" min="0" step="0.01" className={inputCls} value={form.base_price_inr} onChange={(e) => setForm({ ...form, base_price_inr: e.target.value })} required /></div>
              <div><label className={labelCls}>Foreign price (₹) *</label><input type="number" min="0" step="0.01" className={inputCls} value={form.foreign_price_inr} onChange={(e) => setForm({ ...form, foreign_price_inr: e.target.value })} required /></div>
              <div />
              <div><label className={labelCls}>Express price, Indian (₹)</label><input type="number" min="0" step="0.01" className={inputCls} value={form.express_price_inr} onChange={(e) => setForm({ ...form, express_price_inr: e.target.value })} /></div>
              <div><label className={labelCls}>Express price, foreign (₹)</label><input type="number" min="0" step="0.01" className={inputCls} value={form.express_price_foreign_inr} onChange={(e) => setForm({ ...form, express_price_foreign_inr: e.target.value })} /></div>
              <div />
              <div><label className={labelCls}>Opening time</label><input type="time" className={inputCls} value={form.opening_time} onChange={(e) => setForm({ ...form, opening_time: e.target.value })} /></div>
              <div><label className={labelCls}>Closing time</label><input type="time" className={inputCls} value={form.closing_time} onChange={(e) => setForm({ ...form, closing_time: e.target.value })} /></div>
              <div className="text-[10px] text-slate-400 self-end pb-2">Leave blank to use the first/last slot.</div>
              <div className="sm:col-span-3"><label className={labelCls}>Description</label><textarea rows="3" className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="sm:col-span-3">
                <label className={labelCls}>Image URL or path</label>
                <input className={inputCls} placeholder="/images/cellular-jail.jpg or https://…" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
              </div>
            </div>
            {formFor === 'new' && (
              <div>
                <label className={labelCls}>Daily time slots &amp; capacity *</label>
                <SlotTimesEditor rows={formSlots} setRows={setFormSlots} />
                <p className="text-[10px] text-slate-400 mt-1.5">These repeat every day. Slots are created for the next 14 days immediately.</p>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setFormFor(null)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-bold rounded-lg disabled:opacity-60">{saving ? 'Saving...' : formFor === 'new' ? 'Add Attraction' : 'Save Changes'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Slot pattern */}
      {slotsFor && (
        <Modal title={`Slot times — ${slotsFor.title}`} subtitle="Daily pattern" onClose={() => setSlotsFor(null)}>
          <ErrorBanner message={modalError} />
          <SlotTimesEditor rows={slotRows} setRows={setSlotRows} />
          <p className="text-[10px] text-slate-400 mt-3">
            Changes apply to newly generated days; existing dated slots keep their own capacity (adjust those under Crowd &amp; Capacity).
            A removed slot time stops being generated and its upcoming slots with no bookings are closed.
          </p>
          <div className="flex justify-end gap-2 pt-3 mt-3 border-t border-slate-100">
            <button onClick={() => setSlotsFor(null)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button onClick={saveSlots} disabled={saving} className="px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-bold rounded-lg disabled:opacity-60">{saving ? 'Saving...' : 'Save Slot Times'}</button>
          </div>
        </Modal>
      )}

      {/* Closures */}
      {closuresFor && (
        <Modal title={`Close dates — ${closuresFor.title}`} subtitle="Maintenance / closures" onClose={() => setClosuresFor(null)} wide>
          <ErrorBanner message={modalError} />
          <NoteBanner note={modalNote} onDismiss={() => setModalNote(null)} />
          <form onSubmit={addClosure} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div><label className={labelCls}>From</label><input type="date" className={inputCls} value={closureForm.start_date} onChange={(e) => setClosureForm({ ...closureForm, start_date: e.target.value })} required /></div>
            <div><label className={labelCls}>To</label><input type="date" className={inputCls} value={closureForm.end_date} min={closureForm.start_date} onChange={(e) => setClosureForm({ ...closureForm, end_date: e.target.value })} required /></div>
            <label className="sm:col-span-2 flex items-center gap-2 text-xs font-bold text-slate-600 pb-2">
              <input type="checkbox" checked={closureForm.wholeDay} onChange={(e) => setClosureForm({ ...closureForm, wholeDay: e.target.checked })} /> Whole day(s)
            </label>
            {!closureForm.wholeDay && (
              <>
                <div><label className={labelCls}>From time</label><input type="time" className={inputCls} value={closureForm.start_time} onChange={(e) => setClosureForm({ ...closureForm, start_time: e.target.value })} /></div>
                <div><label className={labelCls}>To time</label><input type="time" className={inputCls} value={closureForm.end_time} onChange={(e) => setClosureForm({ ...closureForm, end_time: e.target.value })} /></div>
                <div className="sm:col-span-2" />
              </>
            )}
            <div className="sm:col-span-3"><label className={labelCls}>Reason * <span className="font-normal text-slate-400">(shown to visitors if their bookings are cancelled)</span></label><input className={inputCls} placeholder="e.g. Jetty maintenance" value={closureForm.reason} onChange={(e) => setClosureForm({ ...closureForm, reason: e.target.value })} required /></div>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg disabled:opacity-60">{saving ? 'Closing...' : 'Close for bookings'}</button>
          </form>
          <p className="text-[10px] text-slate-400 mt-2">New bookings are blocked for the covered slots. Tickets already sold stay valid unless you choose "Cancel & refund bookings" on the closure. Give at least 24 hours' notice (RFP p.30).</p>

          <h4 className="text-xs font-bold text-navy-800 mt-5 mb-2">Active closures</h4>
          {closuresFor.closures.length === 0 ? (
            <div className="text-xs text-slate-400 py-4 text-center bg-slate-50 rounded-lg">No closures.</div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
              {closuresFor.closures.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs">
                  <div>
                    <div className="font-bold text-navy-800 font-mono">{closureWhen(c)}</div>
                    <div className="text-slate-500">{c.reason}</div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => cancelClosureBookings(c)}
                      disabled={cancelBusy === c.id}
                      title="Cancel tickets already sold for these slots, refund the visitors and notify them"
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium border bg-red-50 hover:bg-red-100 text-red-700 border-red-200 whitespace-nowrap disabled:opacity-60"
                    >
                      {cancelBusy === c.id ? 'Checking...' : 'Cancel & refund bookings'}
                    </button>
                    <button onClick={() => removeClosure(c)} className="px-2.5 py-1 rounded-lg text-[11px] font-medium border bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 whitespace-nowrap">Remove &amp; reopen</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
