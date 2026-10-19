/**
 * Termine buchen (mockups BU1–BU5, Noah 14.10.2026 21:31 «BU1–BU5 freigegeben»): the rules of an
 * offer that people book themselves, without the app and without an account. Pure functions; the
 * storage and Stripe calls live in api/booking.js.
 *
 * - An offer (Tennis-Lektion, geführte Tour, Velo-Service, eigenes) has types (Einzel, Gruppe …) with
 *   places and a price, and slots (a start time in Zurich time, one type each).
 * - Noah owns an offer through an owner key: the server keeps only its hash.
 * - Bookings are fixed at once (answer 1a). Payment per offer (2b): on site or online (Stripe, test
 *   mode only). People cancel up to cancelHours before; the owner any time (4 a und b).
 * - Names and contacts of the people who book live only in the storage (Upstash), never in the repo.
 */

export const KINDS = ['tennis', 'tour', 'service', 'own'];
export const PAYS = ['site', 'online'];
export const MAX_TYPES = 4;
export const MAX_SLOTS = 200;
export const MAX_BOOKINGS = 500;
/** Bookings of slots older than this are deleted when the owner looks (privacy). */
export const KEEP_DAYS = 60;

const TEXT = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max) : '');
const INT = (v, lo, hi) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= lo && n <= hi ? n : null;
};
export const AT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
export const ID = /^[a-z]{2,8}-[a-z0-9]{6,12}$/;
const SLOT_ID = /^[a-z0-9]{4,16}$/;
const TYPE_KEY = /^[a-z]{1,8}$/;

/**
 * An offer from the app → the clean offer, or { error }. Only the fields below survive; prices are
 * in Rappen (whole numbers), times as «YYYY-MM-DDTHH:MM» in Zurich time.
 */
export function cleanOffer(input) {
  const o = input && typeof input === 'object' ? input : {};
  const kind = KINDS.includes(o.kind) ? o.kind : null;
  const title = TEXT(o.title, 60);
  const pay = PAYS.includes(o.pay) ? o.pay : null;
  const minutes = INT(o.minutes, 0, 60 * 24 * 14);
  const cancelHours = INT(o.cancelHours ?? 24, 0, 24 * 14);
  if (!kind || !title || !pay || minutes == null || cancelHours == null) return { error: 'bad_offer' };
  const types = [];
  for (const x of Array.isArray(o.types) ? o.types.slice(0, MAX_TYPES + 1) : []) {
    const key = typeof x?.key === 'string' && TYPE_KEY.test(x.key) ? x.key : null;
    const label = TEXT(x?.label, 30);
    const places = INT(x?.places, 1, 50);
    const price = INT(x?.price ?? 0, 0, 1_000_000);
    if (!key || !label || places == null || price == null || types.some((y) => y.key === key)) return { error: 'bad_offer' };
    types.push({ key, label, places, price });
  }
  if (!types.length || types.length > MAX_TYPES) return { error: 'bad_offer' };
  const slots = [];
  for (const s of Array.isArray(o.slots) ? o.slots.slice(0, MAX_SLOTS + 1) : []) {
    const id = typeof s?.id === 'string' && SLOT_ID.test(s.id) ? s.id : null;
    const at = typeof s?.at === 'string' && validAt(s.at) ? s.at : null;
    const type = types.find((y) => y.key === s?.type)?.key ?? null;
    if (!id || !at || !type || slots.some((y) => y.id === id)) return { error: 'bad_offer' };
    slots.push({ id, at, type });
  }
  if (slots.length > MAX_SLOTS) return { error: 'too_many_slots' };
  slots.sort((a, b) => a.at.localeCompare(b.at));
  return { offer: { kind, title, place: TEXT(o.place, 60), minutes, pay, cancelHours, types, slots } };
}

export function validAt(at) {
  const m = AT.exec(at);
  if (!m) return false;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d, h, mi));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d && h < 24 && mi < 60;
}

/** Minutes Zurich is ahead of UTC at this moment (60 in winter, 120 in summer). */
function zurichOffset(ms) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Zurich', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
      .formatToParts(new Date(ms))
      .map((x) => [x.type, x.value]),
  );
  return (Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - ms) / 60000;
}

/** «2026-10-21T18:00» (Zurich) → epoch milliseconds. */
export function zurichMs(at) {
  const [y, mo, d, h, mi] = AT.exec(at).slice(1).map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  let ms = guess - zurichOffset(guess) * 60000;
  ms = guess - zurichOffset(ms) * 60000;
  return ms;
}

export const slotOf = (offer, slotId) => offer?.slots?.find((s) => s.id === slotId) ?? null;
export const typeOf = (offer, slot) => offer?.types?.find((t) => t.key === slot?.type) ?? null;

/** What everybody may see of an offer: no owner, no names; future slots with their free places. */
export function publicOffer(offer, booked = {}, now = Date.now()) {
  return {
    id: offer.id,
    kind: offer.kind,
    title: offer.title,
    place: offer.place,
    minutes: offer.minutes,
    pay: offer.pay,
    cancelHours: offer.cancelHours,
    types: offer.types.map((t) => ({ key: t.key, label: t.label, places: t.places, price: t.price })),
    slots: offer.slots
      .filter((s) => zurichMs(s.at) > now)
      .map((s) => {
        const places = typeOf(offer, s)?.places ?? 0;
        return { id: s.id, at: s.at, type: s.type, places, free: Math.max(0, places - (Number(booked[s.id]) || 0)) };
      }),
  };
}

/** Name and contact of a booking → { name, contact } or { error }. */
export function cleanPerson(input) {
  const name = TEXT(input?.name, 60);
  const contact = TEXT(input?.contact, 80);
  if (name.length < 2 || contact.length < 3) return { error: 'bad_person' };
  return { name, contact };
}

/** May the person who booked still cancel? (up to cancelHours before the start) */
export const canCancel = (offer, slot, now = Date.now()) => !!slot && zurichMs(slot.at) - offer.cancelHours * 3600_000 > now;

/** May this slot be booked now? (in the future, at least one place) */
export const bookable = (slot, now = Date.now()) => !!slot && zurichMs(slot.at) > now;

/** Is this booking old enough to forget? */
export const stale = (offer, booking, now = Date.now()) => {
  const s = slotOf(offer, booking.slot);
  const at = s ? zurichMs(s.at) : Number(booking.slotMs) || 0;
  return at < now - KEEP_DAYS * 86400_000;
};

/** The Stripe Checkout form for an online booking (one place, the type's price). */
export function bookingForm(offer, slot, type, { successUrl, cancelUrl, pend, currency = 'chf' }) {
  return new URLSearchParams({
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    'metadata[kind]': 'booking',
    'metadata[offer]': offer.id,
    'metadata[pend]': pend,
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': currency,
    'line_items[0][price_data][unit_amount]': String(type.price),
    'line_items[0][price_data][product_data][name]': `${offer.title} (${slot.at.replace('T', ' ')}, ${type.label})`,
  });
}
