/**
 * «Tourenpass mit Stempel» (Paket E, Idee 18): after the Rückblick of a trip the app offers a stamp (place, day)
 * for the tour pass; over time the stamps are a collection.
 *
 * One setting (PASS_KEY): { stamps: [{ id, tripId, place, date, km }], declined: [tripId] }.
 * - stamps: tripId is '' for an own stamp. Place, day and km can be changed, every stamp can be removed again.
 * - declined: trips whose offer the person turned down; they stay away from the offer (the page lists them again).
 * Nothing is stamped without a tap. Pure, tested in tests/tourenpass.test.js.
 */
import { tripEnd } from '../tripstate.js';

export const PASS_KEY = 'tourenpass';

const posKm = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Math.round(Number(v)) : null);

/** The stored value made whole. */
export function stateOf(v) {
  const o = v && typeof v === 'object' ? v : {};
  const stamps = (Array.isArray(o.stamps) ? o.stamps : [])
    .filter((s) => s && typeof s.id === 'string' && typeof s.place === 'string' && s.place.trim())
    .map((s) => ({ id: s.id, tripId: typeof s.tripId === 'string' ? s.tripId : '', place: s.place.trim(), date: typeof s.date === 'string' ? s.date : '', km: posKm(s.km) }));
  const declined = (Array.isArray(o.declined) ? o.declined : []).filter((k) => typeof k === 'string');
  return { stamps, declined };
}

/** What a trip would stamp: its title as place, its last day, its km (the ridden ones when known). */
export function proposal(trip, km = null) {
  return { place: String(trip?.title ?? '').trim(), date: tripEnd(trip) ?? trip?.startDate ?? '', km: posKm(km ?? trip?.route?.km) };
}

export const stampOfTrip = (state, tripId) => state.stamps.find((s) => s.tripId === tripId) ?? null;
export const isDeclined = (state, tripId) => state.declined.includes(tripId);

/** Trips whose Rückblick is saved and that carry no stamp yet (also the declined ones: `declined: true`), newest first. */
export function openTrips(trips = [], debriefs = [], state = stateOf(null)) {
  const rated = new Set(debriefs.filter((d) => d?.status === 'done').map((d) => d.tripId));
  return trips
    .filter((t) => t && !t.skipped && !t.archived && rated.has(t.id) && !stampOfTrip(state, t.id))
    .map((t) => ({ trip: t, declined: isDeclined(state, t.id), ...proposal(t) }))
    .filter((r) => r.place)
    .sort((a, b) => (b.date || '').localeCompare(a.date || '') || a.place.localeCompare(b.place));
}

/** A stamp for a trip (place, day and km as proposed, or as the person typed them). */
export function stamp(state, trip, patch = {}, id = `s-${trip.id}`) {
  if (stampOfTrip(state, trip.id)) return state;
  const p = proposal(trip);
  const place = String(patch.place ?? p.place).trim();
  if (!place) return state;
  return {
    stamps: [...state.stamps, { id, tripId: trip.id, place, date: patch.date ?? p.date, km: patch.km !== undefined ? posKm(patch.km) : p.km }],
    declined: state.declined.filter((k) => k !== trip.id),
  };
}

/** Several trips at once. */
export const stampAll = (state, rows) => rows.reduce((s, r) => stamp(s, r.trip), state);

/** An own stamp (a tour from before the app, a trip without a Rückblick). */
export function addOwn(state, { place, date, km }, id) {
  const nm = String(place ?? '').trim();
  if (!nm) return state;
  return { ...state, stamps: [...state.stamps, { id: id ?? `own-${Date.now().toString(36)}`, tripId: '', place: nm, date: date ?? '', km: posKm(km) }] };
}

/** Change place, day or km of a stamp; an empty place changes nothing. */
export function change(state, id, patch) {
  return {
    ...state,
    stamps: state.stamps.map((s) => {
      if (s.id !== id) return s;
      const nm = patch.place != null ? String(patch.place).trim() : s.place;
      return { ...s, place: nm || s.place, date: patch.date !== undefined ? patch.date : s.date, km: patch.km !== undefined ? posKm(patch.km) : s.km };
    }),
  };
}

export const remove = (state, id) => ({ ...state, stamps: state.stamps.filter((s) => s.id !== id) });
export const decline = (state, tripId) => (state.declined.includes(tripId) ? state : { ...state, declined: [...state.declined, tripId] });
export const resetDeclined = (state) => ({ ...state, declined: [] });

/** The stamps, newest first (without a day last). */
export const newestFirst = (list) => [...list].sort((a, b) => (b.date || '').localeCompare(a.date || '') || a.place.localeCompare(b.place));

/** A small turn for each stamp, -5…5 degrees, always the same for the same id (a hand-pressed look). */
export function turnOf(id) {
  let h = 0;
  for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return (h % 11) - 5;
}

/** The sum of the stamps: how many, how many km, the first and the last day. */
export function summary(stamps) {
  const days = stamps.map((s) => s.date).filter(Boolean).sort();
  return { n: stamps.length, km: stamps.reduce((a, s) => a + (s.km ?? 0), 0), first: days[0] ?? '', last: days[days.length - 1] ?? '' };
}
