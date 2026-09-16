/**
 * Mock API layer. Swap these for real fetch() calls to the government
 * e-ticketing backend without touching any component.
 */
import { ATTR, FERRIES, BOOKINGS, SLOTS, VISITORS, NOTIFS } from './data';

const delay = (data, ms = 400) =>
new Promise((resolve) => setTimeout(() => resolve(data), ms));

export const api = {
  listAttractions: (cat = 'All') =>
  delay(cat === 'All' ? ATTR : ATTR.filter((a) => a.cat === cat)),
  getAttraction: (id) =>
  delay(ATTR.find((a) => a.id === id)),
  getSlots: (seed) => delay(SLOTS(seed)),
  listFerries: () => delay(FERRIES),
  listBookings: () => delay(BOOKINGS),
  listVisitors: () => delay(VISITORS),
  listNotifications: () => delay(NOTIFS),
  sendOtp: (mobile) => delay({ ok: true, mobile, otp: '4 8 2 1' }),
  verifyOtp: (otp) => delay({ ok: otp.length === 4 }),
  pay: (amount) => delay({ ok: true, txn: 'TXN' + Date.now(), amount })
};