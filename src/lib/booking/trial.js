/**
 * Probestunde (Noah 04.11.2026 «10a»: pro Angebot, einmal pro Person; 07.11.2026 «flyer zuerst, dann probestunde»;
 * 08.11.2026 «ja»): an offer can have a kind «Trial lesson» next to its other kinds. It is an ordinary kind of the
 * offer (own name, places and price, times of that kind are opened like any other), only its key is «trial». The
 * server needs nothing new: it keeps the kind as it keeps every kind. «Once per person» is a hint for Noah, never a
 * lock: when a person who already had (or has booked) a trial lesson of this offer asks for another one, the
 * request and the booking say so and the answer text offers a normal lesson. Pure functions.
 */
import { holdsPlace } from './model.js';

export const TRIAL_KEY = 'trial';
/** The server allows this many kinds per offer (api/_lib/booking.js MAX_TYPES). */
export const MAX_KINDS = 4;

export const isTrial = (type) => type?.key === TRIAL_KEY;
export const trialKind = (offer) => (offer?.types ?? []).find(isTrial) ?? null;
export const hasTrial = (offer) => !!trialKind(offer);
/** Can this offer get a trial kind? (not yet, and the server's limit of kinds is not reached) */
export const canAddTrial = (offer) => !hasTrial(offer) && (offer?.types ?? []).length < MAX_KINDS;

/** Half the price of the first other kind, to 50 Rappen (Noah: «Schnupperstunde halber Preis»). */
export function trialPrice(offer) {
  const first = (offer?.types ?? []).find((x) => !isTrial(x));
  return Math.round((first?.price ?? 0) / 2 / 50) * 50;
}

/** The offer with a trial kind (one place, half price), or as it was when it has one or has no room for one. tr: the translator. */
export function withTrial(offer, tr = (s) => s) {
  if (!canAddTrial(offer)) return offer;
  return { ...offer, types: [...offer.types, { key: TRIAL_KEY, label: tr('Trial lesson'), places: 1, price: trialPrice(offer) }] };
}

/** How many of the times of this offer are of the trial kind. */
export const trialSlots = (offer) => (offer?.slots ?? []).filter((s) => s.type === TRIAL_KEY);

/** The offer without its trial kind; the times of that kind become times of the first other kind (nothing is lost). */
export function withoutTrial(offer) {
  if (!hasTrial(offer)) return offer;
  const types = offer.types.filter((x) => !isTrial(x));
  if (!types.length) return offer;
  return { ...offer, types, slots: (offer.slots ?? []).map((s) => (s.type === TRIAL_KEY ? { ...s, type: types[0].key } : s)) };
}

/** Is this booking for a time of the trial kind? */
export function isTrialBooking(offer, booking) {
  const slot = (offer?.slots ?? []).find((s) => s.id === booking?.slot);
  return slot?.type === TRIAL_KEY;
}

const norm = (name) => String(name ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
const mailOrDigits = (c) => {
  const s = String(c ?? '').trim().toLowerCase();
  return /@/.test(s) ? s : s.replace(/[^\d]/g, '');
};
/** The same person: the same name, or the same e-mail or phone number (when there is one). */
export function samePerson(a, b) {
  if (norm(a?.name) && norm(a.name) === norm(b?.name)) return true;
  const x = mailOrDigits(a?.contact);
  return x.length >= 6 && x === mailOrDigits(b?.contact);
}

/**
 * The other trial lesson of the same person in this offer, or null: the earliest booking of that person that holds a
 * place on a time of the trial kind. For a request (it holds no place yet) every such booking counts; for a booking
 * that holds a place only an earlier one counts, so two bookings do not point at each other.
 */
export function earlierTrial(offer, bookings = [], booking) {
  if (!booking || !isTrialBooking(offer, booking)) return null;
  const open = !holdsPlace(booking);
  const found = bookings
    .filter((x) => x.id !== booking.id && holdsPlace(x) && isTrialBooking(offer, x) && samePerson(x, booking))
    .filter((x) => open || String(x.at) < String(booking.at) || (x.at === booking.at && String(x.id) < String(booking.id)))
    .sort((a, b) => String(a.at).localeCompare(String(b.at)));
  return found[0] ?? null;
}
