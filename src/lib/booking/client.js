/**
 * Termine buchen (BU1–BU5): the calls to /api/booking (api/booking.js) and where the app keeps
 * Noah's offers. The owner key of each offer stays on this device and in the backup (settings
 * «bookingOffers»); the names of the people who book are only fetched, never stored here.
 */
export const BOOKING_URL = 'https://packgen-three.vercel.app/api/booking';
/** settings: [{ id, owner, offer }] (offer: the last saved version, with slots). */
export const OFFERS_KEY = 'bookingOffers';
/** settings: ids of the bookings Noah has already seen (the note on Heute). */
export const SEEN_KEY = 'bookingSeen';

async function call(path, init = {}, doFetch = fetch) {
  let res;
  try {
    res = await doFetch(`${BOOKING_URL}${path}`, init);
  } catch {
    return { ok: false, code: 'offline' };
  }
  const body = await res.json().catch(() => ({}));
  return res.ok ? { ok: true, ...body } : { ok: false, code: body.code ?? 'server_error' };
}
const post = (step, body, owner) => ({ method: 'POST', headers: { 'Content-Type': 'application/json', ...(owner ? { Authorization: `Bearer ${owner}` } : {}) }, body: JSON.stringify(body) });
const auth = (owner) => ({ headers: { Authorization: `Bearer ${owner}` } });
const q = encodeURIComponent;

/* ---------- the owner (the app) ---------- */
export const createOffer = (offer, doFetch) => call('?step=create', post('create', { offer }), doFetch);
export const saveOffer = (id, owner, offer, doFetch) => call('?step=save', post('save', { id, offer }, owner), doFetch);
export const ownerBookings = (id, owner, doFetch) => call(`?step=bookings&id=${q(id)}`, auth(owner), doFetch);
export const ownerCancel = (id, owner, b, doFetch) => call('?step=cancel', post('cancel', { id, b }, owner), doFetch);
export const cancelSlot = (id, owner, slot, doFetch) => call('?step=cancelSlot', post('cancelSlot', { id, slot }, owner), doFetch);

/* ---------- the people who book (the booking page) ---------- */
export const loadOffer = (id, doFetch) => call(`?step=offer&id=${q(id)}`, {}, doFetch);
export const book = (data, doFetch) => call('?step=book', post('book', data), doFetch);
export const confirmPaid = (sessionId, doFetch) => call(`?step=confirm&session_id=${q(sessionId)}`, {}, doFetch);
export const myBooking = (id, b, key, doFetch) => call(`?step=mine&id=${q(id)}&b=${q(b)}&key=${q(key)}`, {}, doFetch);
export const cancelMine = (id, b, key, doFetch) => call('?step=cancel', post('cancel', { id, b, key }), doFetch);

/** The error codes of the server → an English sentence (through t()). */
export const ERRORS = {
  offline: 'No connection. Try again when you are online.',
  storage_not_set_up: 'Bookings are not set up on the server yet.',
  pay_not_set_up: 'Online payment is not set up yet.',
  slot_full: 'This time is fully booked.',
  slot_gone: 'This time cannot be booked any more.',
  bad_person: 'Please enter your name and a phone number or e-mail.',
  too_late: 'It is too late to cancel online. Please get in touch directly.',
  not_found: 'This offer or booking does not exist (any more).',
  unauthorized: 'This device does not own the offer.',
  too_many: 'Too many at once. Try again later.',
  places_taken: 'More people booked this time than the new number of places.',
  bad_offer: 'The offer is not complete yet.',
};
export const errorText = (code) => ERRORS[code] ?? 'Something went wrong. Try again later.';

/** The bookings of all offers on this device (for the note on Heute): [{ id, title, bookings }]; offline → []. */
export async function allBookings(offers = [], doFetch = fetch) {
  const out = [];
  for (const o of offers) {
    const r = await ownerBookings(o.id, o.owner, doFetch);
    if (r.ok) out.push({ id: o.id, title: o.offer?.title ?? '', bookings: r.bookings });
  }
  return out;
}
