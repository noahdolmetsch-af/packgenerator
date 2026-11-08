/**
 * «Tour-Stand» (Entwurf «Tour von A bis Z», Noah 07.11.2026 «1a», Schritt 0): where a tour stands as a path of four
 * phases (Planen, Vorbereiten, Unterwegs, Danach) with a few rows each. Pure rule, no screen yet: the page «Tour-Pfad»
 * and the card «Meine Tour» on Today (next steps) only read the result, so the rule lives in one place.
 *
 *   tourStand(trip, ctx) → { phase, n, total, phases: [{ key, state, done, total, rows }], next }
 *
 * phase: 'planen' | 'vorbereiten' | 'unterwegs' | 'danach' | 'fertig' (debrief saved) | 'ausgefallen' (not riding) | null
 * (no trip). It comes from the DATE and from what is done, like phase.js tripPhase: during and after follow the
 * dates; before the start the tour is in «Planen» until its rows are done or the packing days begin.
 * n, total: «Schritt n von 4» (a number from the four phases; 0 for 'ausgefallen').
 * Phase state: 'done' (all its counted rows done), 'past' (earlier, but rows open), 'now', 'next'.
 * Row: { key, phase, state, href, hint, facts }.
 *   state: 'done' | 'part' (begun) | 'open' | 'warn' (a note, not a verdict) | 'later' (its time has not come)
 *   hint: true for a row that only notes something («Körper und Tour»); it is not counted and is never «next»
 *   facts: the numbers the page will put into words (packed, total, km …); no texts here
 * next: the first row of the current phase that is 'open' or 'part' (the one main button), or null.
 *
 * ctx (everything the rule cannot read from the trip; null means «no data», never «fine»):
 *   today          YYYY-MM-DD (localDay())
 *   debriefDone    the debrief of the trip is saved
 *   packDays       days before the start from which the tour counts as «Vorbereiten» (default PACK_DAYS)
 *   hidden         row keys the user took away (rows can be hidden, they then neither show nor count)
 *   form           'good' | 'ok' | 'low' | null — how the body is doing
 *   longestKm      the longest single ride so far (km) or null
 *   careDue        bike care points due before or on the trip (number) or null
 *   travelChosen   choices with the state «chosen» for this tour (travel.choices) or null
 *   fuelPlan       a fuel plan exists for this tour (true / false) or null
 *   ridden         a ride (upload or Strava) is matched to the tour (true / false) or null
 * Tested in tests/tourstand.test.js.
 */
import { tripPhase, packedAll, daysFrom, PACK_DAYS } from '../phase.js';
import { hasBike } from '../domains.js';
import { readyDone } from '../trips.js';
import { stageDays, ownStages } from '../stages.js';
import { tabHref } from '../tabs.js';

/** The four phases in order. */
export const PHASES = ['planen', 'vorbereiten', 'unterwegs', 'danach'];

const has = (v) => v != null && v !== '';
const hasRoute = (r) => !!(r?.km || r?.line?.length > 1 || r?.komoot);
const kmOf = (trip) => Number(trip?.route?.km) || 0;

/** The rows of every phase for a trip. Rows that make no sense for it (no bike, a day ride) are not there. */
function rowsOf(trip, c) {
  const bike = hasBike(trip);
  const entries = trip.entries ?? [];
  const packed = entries.filter((e) => e.packed).length;
  const ready = trip.ready ?? [];
  const readyN = ready.filter((r) => readyDone(r, trip)).length;
  const days = stageDays(trip);
  const perDay = kmOf(trip) && days ? kmOf(trip) / days : 0;
  const untilStart = trip.startDate ? daysFrom(c.today, trip.startDate) : null;
  const R = (phase, key, state, href, facts = {}, hint = false) => ({ key, phase, state, href, hint, facts });
  const rows = [];

  // Planen (A1 to A5)
  rows.push(R('planen', 'ziel', trip.startDate && has(trip.title) ? 'done' : 'open', '#/pack', { date: trip.startDate ?? null, days }));
  if (bike) rows.push(R('planen', 'route', hasRoute(trip.route) ? 'done' : 'open', '#/pack', { km: kmOf(trip) || null }));
  rows.push(R('planen', 'wetter', trip.wx?.min != null || trip.wx?.max != null ? 'done' : 'open', '#/pack'));
  const travel = trip.arrival || c.travelChosen > 0;
  rows.push(R('planen', 'anreise', travel ? 'done' : 'open', '#/pack', { arrival: trip.arrival ?? null, chosen: c.travelChosen ?? null }));
  if (days > 1) rows.push(R('planen', 'etappen', ownStages(trip) ? 'done' : hasRoute(trip.route) ? 'part' : 'open', '#/pack', { days }));
  rows.push(R('planen', 'verpflegung', c.fuelPlan === true ? 'done' : 'open', '#/trips/fuel'));

  // Vorbereiten (B1 to B4)
  rows.push(R('vorbereiten', 'koerper', c.form === 'good' || c.form === 'ok' ? 'done' : c.form === 'low' ? 'warn' : 'open', '#/flow/form', { form: c.form ?? null }));
  if (perDay && c.longestKm > 0) {
    rows.push(R('vorbereiten', 'koerper-tour', perDay > c.longestKm ? 'warn' : 'done', '#/flow/form', { perDay: Math.round(perDay), longestKm: Math.round(c.longestKm), days }, true));
  }
  if (bike) rows.push(R('vorbereiten', 'velo', c.careDue == null ? 'open' : c.careDue > 0 ? 'warn' : 'done', '#/bikes?tab=care', { careDue: c.careDue ?? null }));
  rows.push(R('vorbereiten', 'packen', !entries.length ? 'open' : packedAll(trip) ? 'done' : packed ? 'part' : 'open', tabHref('pack', trip), { packed, total: entries.length }));
  if (ready.length) {
    const soon = untilStart != null && untilStart > 1; // «Letzte 24 Stunden» opens the day before
    rows.push(R('vorbereiten', 'letzte24', readyN === ready.length ? 'done' : soon ? 'later' : readyN ? 'part' : 'open', tabHref('pack', trip), { done: readyN, total: ready.length }));
  }

  // Unterwegs (C1, C5)
  const gone = Object.keys(trip.goDays ?? {}).length > 0;
  if (bike) rows.push(R('unterwegs', 'losfahren', gone || trip.finished ? 'done' : 'open', tabHref('ride', trip)));
  rows.push(R('unterwegs', 'ankommen', trip.finished ? 'done' : 'open', tabHref('ride', trip)));

  // Danach (D2, D3)
  rows.push(R('danach', 'rueckblick', c.debriefDone ? 'done' : 'open', tabHref('debrief', trip)));
  if (c.ridden != null) rows.push(R('danach', 'fahrt', c.ridden ? 'done' : 'open', '#/debrief/ride'));
  return rows.filter((r) => !c.hidden?.includes(r.key));
}

/** The counted rows of a phase (hints are not counted). */
const counted = (rows) => rows.filter((r) => !r.hint);

/**
 * Where a tour stands. A trip that is not riding gets no rows. Without a start date it is in «Planen».
 * See the head of the file for the shape.
 */
export function tourStand(trip, ctx = {}) {
  if (!trip) return { phase: null, n: 0, total: PHASES.length, phases: [], next: null };
  const c = { packDays: PACK_DAYS, hidden: [], ...ctx };
  if (!c.today) throw new Error('tourStand needs ctx.today');
  const tp = tripPhase(trip, c.today, { debriefDone: !!c.debriefDone });
  if (tp === 'skipped') return { phase: 'ausgefallen', n: 0, total: PHASES.length, phases: [], next: null };

  const rows = rowsOf(trip, c);
  const of = (key) => rows.filter((r) => r.phase === key);
  const planDone = counted(of('planen')).every((r) => r.state === 'done');
  const started = trip.startDate ? daysFrom(c.today, trip.startDate) <= c.packDays : false;
  const begunPacking = (trip.entries ?? []).some((e) => e.packed) || !!trip.packedAt;

  let phase;
  if (tp === 'done') phase = 'fertig';
  else if (tp === 'after') phase = 'danach';
  else if (tp === 'during') phase = trip.finished ? 'danach' : 'unterwegs';
  else phase = planDone || started || begunPacking ? 'vorbereiten' : 'planen';

  const at = PHASES.indexOf(phase);
  const phases = PHASES.map((key, i) => {
    const rs = of(key);
    const cs = counted(rs);
    const done = cs.filter((r) => r.state === 'done').length;
    const allDone = cs.length > 0 && done === cs.length;
    const state = phase === 'fertig' ? 'done' : i === at ? 'now' : i > at ? 'next' : allDone ? 'done' : 'past';
    return { key, state, done, total: cs.length, rows: rs };
  });
  const now = phases.find((p) => p.state === 'now');
  const next = now?.rows.find((r) => !r.hint && (r.state === 'open' || r.state === 'part')) ?? null;
  return { phase, n: phase === 'fertig' ? PHASES.length : at + 1, total: PHASES.length, phases, next };
}
