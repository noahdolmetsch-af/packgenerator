/**
 * v0.67.0 «Übergänge 1» (Noah Ü1–Ü12 a, flow audit U001–U014): where a trip stands, by its DATE
 * (before / during / after) and not by the tab you look at. One place decides:
 * - the phase of a trip,
 * - the step of the four (Plan · Pack · On the way · Debrief) it is in now («Schritt 2 von 4»),
 * - the ONE main button of each trip page («Weiter zu …», «Fertig gepackt · zurück zu Touren», «Zur Startseite»),
 * - the addresses of the three interstitials (#/trip/<id>/packed | ended | debriefed),
 * - when the evening reminders show (from 18:00).
 * Pure functions (no database, no screen), tested in tests/phase.test.js.
 * Dates are YYYY-MM-DD in local time (localday.js); day sums are calendar days (UTC noon, no DST).
 */
import { isOver, tripEnd } from './debrief.js';
import { hasBike } from './domains.js';
import { tabsOf, tabHref } from './tabs.js';
import { own } from './ownlive.svelte.js';
import { DAY_CLOCK } from './dayclock.js';

/** The evening starts at 18:00 (Ü6a, U22b). */
export const EVENING_HOUR = DAY_CLOCK.evening; // v0.144.0 RE: the one day clock
/** Two days before the start a trip with a list is «Packen» on Today (as today.js); «Eigene Werte» packDays changes it. */
export const PACK_DAYS = 2;

/** Whole calendar days from a to b (both YYYY-MM-DD). */
export const daysFrom = (a, b) => Math.round((Date.UTC(...ymd(b)) - Date.UTC(...ymd(a))) / 864e5);
const ymd = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return [y, m - 1, d, 12];
};
/** a + n calendar days. */
export function addDays(iso, n) {
  const d = new Date(Date.UTC(...ymd(iso)));
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** A one-day trip (Ü5a: only «Tour beendet», with a short debrief). */
export const isDayTrip = (trip) => Math.max(1, Number(trip?.days) || 1) === 1;

/** Every item on the list is packed (an empty list is not packed: U014). */
export function packedAll(trip) {
  const es = trip?.entries ?? [];
  return es.length > 0 && es.every((e) => e.packed);
}

/**
 * The phase of a trip: 'before' | 'during' | 'after' (over, debrief open) | 'done' (debrief saved)
 * | 'skipped' (not riding). debriefDone: its debrief record is saved (status 'done').
 */
export function tripPhase(trip, today, { debriefDone = false } = {}) {
  if (!trip) return null;
  if (trip.skipped) return 'skipped';
  if (debriefDone || trip.status === 'done') return 'done';
  if (isOver(trip, today)) return 'after';
  if (trip.startDate && trip.startDate <= today) return 'during';
  return 'before';
}

/**
 * The step a trip is in now, one of tabsOf(trip): Today's «Weitermachen» and «Open the trip» lead
 * there (U007). Before the start: an empty list → plan; a list not packed → plan (or pack from two
 * days before, or once packing started); packed → the waiting state (On the way; without a bike Pack).
 */
export function currentStep(trip, today, opts = {}) {
  const phase = tripPhase(trip, today, opts);
  const bike = hasBike(trip);
  if (phase === 'after' || phase === 'done') return 'debrief';
  if (phase === 'during' && !packingDay(trip, today)) return bike ? 'ride' : 'pack';
  if (phase === 'skipped') return 'plan';
  const es = trip.entries ?? [];
  if (!es.length) return 'plan';
  if (packedAll(trip)) return bike ? 'ride' : 'pack';
  const soon = trip.startDate ? daysFrom(today, trip.startDate) <= own.v.packDays : false;
  return soon || es.some((e) => e.packed) ? 'pack' : 'plan';
}

/**
 * The start day before «Packen abschliessen» was tapped: the trip has begun by the date, but packing
 * is still its step (a day ride made this morning), and finishing it shows «Gepackt» (Ü4a). Packed,
 * a bike trip goes on to On the way (U009).
 */
export const packingDay = (trip, today) => trip?.startDate === today && !trip.packedAt;

/** «Schritt 2 von 4»: { key, n, total, href }. */
export function stepOf(trip, today, opts = {}) {
  const key = currentStep(trip, today, opts);
  const tabs = tabsOf(trip);
  return { key, n: tabs.indexOf(key) + 1, total: tabs.length, href: tabHref(key, trip) };
}

/** The address of a trip's interstitial (Ü3a: own address, so reload and back land right). */
export const betweenHref = (trip, kind) => `#/trip/${encodeURIComponent(trip?.id ?? trip)}/${kind}`;
// Paket B «Touren ohne Überraschung»: probe = «Generalprobe», heim = «Gut ankommen» (lib/probe)
export const BETWEEN = ['packed', 'ended', 'debriefed', 'probe', 'heim'];

/** #/trip/<id>/<kind> → { id, kind } or null. */
export function parseBetween(hash = '') {
  const m = /^#\/trip\/([^/?]+)\/(packed|ended|debriefed|probe|heim)(?:[?/].*)?$/.exec(hash || '');
  return m ? { id: decodeURIComponent(m[1]), kind: m[2] } : null;
}

/**
 * Klick-Rundgang 22.10.2026 H06: «Losfahren». The day of the trip a ride is on now (0-based; a nonstop
 * trip has one stage) and whether «Losfahren» was tapped for it: trip.goDays = { [day]: 'HH:MM' }.
 */
export const goDayOf = (trip, today) => (trip?.nonstop ? 0 : Math.max(0, Math.min(Math.max(1, Number(trip?.days) || 1) - 1, trip?.startDate ? daysFrom(trip.startDate, today) : 0)));
export const goneToday = (trip, today) => !!trip?.goDays?.[goDayOf(trip, today)];

/**
 * UI-Test 26.10.2026 T1: the start day of a trip that has not begun: not packed (things still open on the
 * list and «Packen abschliessen» not tapped), «Losfahren» not tapped, not ended. By the date it is under way, but everything still says
 * «Packen»: no «Letzter Abend», no «Rückblick heute», no debrief yet.
 */
export const notBegun = (trip, today) => packingDay(trip, today) && !packedAll(trip) && !goneToday(trip, today) && !trip.finished;

/**
 * The ONE main button of a trip page, by the phase (U008, U009, U013, U014): { kind, label, href? }.
 * label: the English key for t(). kind:
 *   'go'     a link to href
 *   'add'    Plan with an empty list: add gear (opens «Add material»)
 *   'finish' Pack: finish packing (asks when something is missing, then the interstitial)
 *   'packgo' Plan of a bike day ride: everything packed in one tap, then On the way
 *   'start'  On the way, the first day not started yet: «Losfahren» (sets the start time; H06)
 *   'last'   On the way, last day: «Letzten Tag abschliessen» (a day ride: «Tour abschliessen»)
 *   'end'    a trip without a bike under way, on Pack: end it (asks before its last day)
 *   null     no main button (On the way before the last day: «Tour beenden …» is a quiet link)
 * tab: 'plan' | 'pack' | 'ride' | 'debrief'.
 */
export function mainStep(trip, today, tab, opts = {}) {
  const phase = tripPhase(trip, today, opts);
  const bike = hasBike(trip);
  const home = { kind: 'go', label: 'To the start page', href: '#/' };
  const debrief = { kind: 'go', label: 'Continue to Debrief', href: tabHref('debrief', trip) };
  if (phase === 'skipped') return home;
  if (phase === 'done') return { kind: 'go', label: 'Back to Trips', href: '#/trips' };
  if (phase === 'after') return tab === 'debrief' ? { kind: 'save', label: 'Done|debrief' } : debrief;
  const es = trip.entries ?? [];
  if (phase === 'during' && (tab === 'ride' || !packingDay(trip, today))) {
    if (bike) {
      if (tab !== 'ride') return { kind: 'go', label: 'Continue to On the way', href: tabHref('ride', trip) };
      if (!trip.finished && goDayOf(trip, today) === 0 && !goneToday(trip, today)) return { kind: 'start', label: 'Start riding' };
      return today >= tripEnd(trip) ? { kind: 'last', label: isDayTrip(trip) ? 'Finish the trip' : 'Finish the last day' } : { kind: null };
    }
    if (tab === 'pack') return { kind: 'end', label: today >= tripEnd(trip) ? 'Finish the trip' : 'End the trip …' };
    return { kind: 'go', label: 'Continue to Pack', href: tabHref('pack', trip) };
  }
  // before the start
  if (!es.length) return tab === 'plan' ? { kind: 'add', label: 'Add material' } : { kind: 'go', label: 'Continue to Plan', href: tabHref('plan', trip) };
  if (packedAll(trip)) {
    // packed, «Packen abschliessen» not tapped yet: that is still the step of the Pack tab (it leads to
    // the interstitial «Gepackt» once, Ü4a); afterwards the waiting state, on the start day On the way
    if (tab === 'pack' && !trip.packedAt) return { kind: 'finish', label: 'Finish packing' };
    if (bike && trip.startDate === today && tab !== 'ride') return { kind: 'go', label: 'Continue to On the way', href: tabHref('ride', trip) };
    // Gesamttest 20.10.2026 B5 (Noah «4a»): the big button names the next step, not «Zur Startseite»: Plan goes on to
    // Pack; Pack, packed days ahead, is «Fertig gepackt» and says where it leads (back to the trip's card on Touren)
    if (tab === 'plan') return { kind: 'go', label: 'Continue to Pack', href: tabHref('pack', trip) };
    if (tab === 'pack') return { kind: 'go', label: 'Packed · back to Trips', href: '#/trips' };
    return home;
  }
  if (tab === 'pack') return { kind: 'finish', label: 'Finish packing' };
  // Klick-Rundgang 22.10.2026 H03: with nothing packed yet the one tap does the packing, so the button
  // says so («Alles einpacken, los») instead of claiming «Alles gepackt»
  if (tab === 'plan' && bike && isDayTrip(trip)) return { kind: 'packgo', label: es.some((e) => e.packed) ? "All packed, let's go" : "Pack everything, let's go" };
  return { kind: 'go', label: 'Continue to Pack', href: tabHref('pack', trip) };
}

/**
 * Where «Finish packing» leads: the interstitial «Gepackt», or for a day ride straight on (Ü5a).
 * Regeln der App A a (Noah 14.10.2026, mockup A1): a day trip without a bike stays on Pack (null);
 * Pack says «All packed» with a link to Today instead of jumping there.
 */
export function afterPacking(trip, today) {
  if (!isDayTrip(trip)) return betweenHref(trip, 'packed');
  return hasBike(trip) ? tabHref('ride', trip) : null;
}

/**
 * Ending a trip asks first (U004): before its last day, or on the last day while the day's riding is
 * still ahead (a day ride at 08:00). nowHM / endHM: «HH:MM» (endHM: the planned arrival, or null).
 */
export function endNeedsAsk(trip, today, nowHM, endHM = null) {
  const end = tripEnd(trip);
  if (!end || today < end) return true;
  return nowHM < (endHM ?? '14:00');
}

/** «Tour wieder öffnen» (U005): a trip ended early can be reopened until the next day. */
export const canReopen = (trip, today) => !!trip?.finished && trip.status !== 'done' && daysFrom(trip.finished, today) <= 1;

/**
 * The evening reminders (from 18:00):
 * - eve: the evening before the start of a trip (Ü6a, U21a: only when its reminder is on);
 * - lastEvening: the last day of a trip under way, not ended yet (U22b: «Tour beendet» shows once).
 */
export function eveningBefore(trip, today, hour) {
  if (!trip?.startDate || trip.skipped || trip.remindEve === false) return false;
  return hour >= EVENING_HOUR && addDays(today, 1) === trip.startDate;
}
export function lastEvening(trip, today, hour, opts = {}) {
  if (!trip?.startDate || hour < EVENING_HOUR || notBegun(trip, today)) return false;
  return tripPhase(trip, today, opts) === 'during' && tripEnd(trip) === today;
}
