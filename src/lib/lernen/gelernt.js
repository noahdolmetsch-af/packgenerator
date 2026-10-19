/**
 * Paket M «Aus Touren lernen», #38 «Sichtbar machen, was die App gelernt hat»: the Monatskarte (what the
 * app learned from you in one month, 3–6 short lines with numbers) and the Jahresbrief (your year in
 * plain words, from templates and numbers, no AI). Read from what the app already keeps:
 * - learnings (db.learnings, createdAt / import date: yearreview.js learnedOn)
 * - finished debriefs (doneAt; applied: the ticked suggestions «template:<id>», «optional:<itemId>»,
 *   «cold:<itemId>»; items: 'unused'; clothing: 'cold' | 'fit' | 'warm')
 * - your pace (settings «pace»: updatedAt, rides with their date; pace.js)
 * - the clothing border (settings «clothing.offset»; wardrobe.js clothingOffset)
 * - the trips and rides (review/rueckblick.js tripFacts).
 * Pure functions; the words are written by Gelernt.svelte. Tested in tests/gelernt.test.js.
 */
import { learnedOn, addMonths } from '../yearreview.js';
import { clothingOffset } from '../wardrobe.js';
import { paceOf, ruleOf, uniqueRides } from '../pace.js';
import { tripFacts } from '../review/rueckblick.js';
import { localDay } from '../localday.js';
import { noteLine } from './chronik.js';

const dayOf = (iso) => (iso ? localDay(new Date(iso)) : null);
const inMonth = (day, ym) => !!day && day.slice(0, 7) === ym;
const inYear = (day, y) => !!day && day.slice(0, 4) === String(y);
const done = (debriefs) => debriefs.filter((d) => d?.status === 'done');
const nameOf = (item) => item?.nameDe || item?.name || '';

/** The ticked suggestions of the debriefs finished in a period (test: day → true). */
function applied(debriefs, test) {
  const templates = new Set();
  const home = [];
  for (const d of done(debriefs)) {
    if (!test(dayOf(d.doneAt))) continue;
    for (const id of d.applied ?? []) {
      const [kind, key] = String(id).split(/:(.*)/s);
      if (kind === 'template' && key) templates.add(key);
      if ((kind === 'optional' || kind === 'cold') && key && !home.includes(key)) home.push(key);
    }
  }
  return { templates: [...templates], home };
}

/** The clothing border at the end of a day (only debriefs saved by then; a reset counts from its time). */
function offsetAt(debriefs, day, record) {
  const by = done(debriefs).filter((d) => (dayOf(d.doneAt) ?? '') <= day);
  const since = record?.resetAt && dayOf(record.resetAt) <= day ? record.resetAt : null;
  return clothingOffset(by, since);
}

/** The month before «YYYY-MM» and its last day. */
const lastDayBefore = (ym) => {
  const d = new Date(`${ym}-01T00:00:00Z`);
  d.setUTCDate(0);
  return d.toISOString().slice(0, 10);
};
const lastDayOf = (ym) => lastDayBefore(addMonths(`${ym}-01`, 1).slice(0, 7));

/**
 * The Monatskarte of «YYYY-MM»: { month, lines: [{ key, n, ...vars }], empty }. The keys, in order:
 * - trips   { n: trips done, km }               (always when a trip or ride was in the month)
 * - learnings { n }                              new learnings
 * - templates { n }                              templates changed by a debrief
 * - home    { n, names: [up to 2] }              things that stay at home now (not used)
 * - pace    { kmh, climbMh, n: rides this month } your pace learned from rides of this month
 * - clothing { from, to }                        the clothing border moved
 * At most 6 lines; a line only with a number above 0.
 */
export function monthCard({ month, trips = [], debriefs = [], rides = [], learnings = [], items = [], pace = null, offset = null, today = localDay() } = {}) {
  const ym = month ?? today.slice(0, 7);
  const lines = [];
  const facts = tripFacts({ trips, debriefs, rides, learnings, today }).filter((r) => inMonth(r.start, ym));
  const tripRows = facts.filter((r) => r.kind === 'trip');
  const km = facts.reduce((s, r) => s + (r.km ?? 0), 0);
  if (facts.length) lines.push({ key: 'trips', n: tripRows.length, rides: facts.length - tripRows.length, km: Math.round(km) });
  const newL = learnings.filter((l) => !l.archivedAt && inMonth(learnedOn(l), ym));
  if (newL.length) lines.push({ key: 'learnings', n: newL.length, first: newL[0]?.rule ?? '' });
  const a = applied(debriefs, (d) => inMonth(d, ym));
  if (a.templates.length) lines.push({ key: 'templates', n: a.templates.length });
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  if (a.home.length) lines.push({ key: 'home', n: a.home.length, names: a.home.map((id) => nameOf(byId[id])).filter(Boolean).slice(0, 2) });
  const paceRides = uniqueRides(pace?.rides ?? []).filter((r) => r.use !== false && inMonth(r.date, ym));
  const p = paceOf(pace);
  if (p.learned && (paceRides.length || inMonth(dayOf(pace?.updatedAt), ym))) {
    const r = ruleOf(p.learned);
    lines.push({ key: 'pace', kmh: r.kmh, climbMh: r.climbMh, n: paceRides.length, mine: p.mine });
  }
  const from = offsetAt(debriefs, lastDayBefore(ym), offset);
  const to = offsetAt(debriefs, lastDayOf(ym), offset);
  if (from !== to) lines.push({ key: 'clothing', from, to });
  return { month: ym, lines: lines.slice(0, 6), empty: !lines.length };
}

/** The months that have something to show, newest first («YYYY-MM»), up to today's month. */
export function monthsWithData({ trips = [], debriefs = [], rides = [], learnings = [], today = localDay() } = {}) {
  const set = new Set([today.slice(0, 7)]);
  for (const r of tripFacts({ trips, debriefs, rides, learnings, today })) if (r.start) set.add(r.start.slice(0, 7));
  for (const l of learnings) if (learnedOn(l)) set.add(learnedOn(l).slice(0, 7));
  for (const d of done(debriefs)) if (d.doneAt) set.add(dayOf(d.doneAt).slice(0, 7));
  return [...set].filter((m) => m <= today.slice(0, 7)).sort().reverse();
}

/**
 * How well a trip went, from its saved debrief: a rating (debrief.rating, 1–5) when there is one,
 * else the answers: as much as needed, bags fine, clothing fitted, weather as planned or warmer,
 * nothing missing, nothing broken (one point each). null without a saved debrief.
 */
export function tripScore(debrief) {
  if (debrief?.status !== 'done') return null;
  if (typeof debrief.rating === 'number' && debrief.rating > 0) return debrief.rating * 10;
  let s = 0;
  if (debrief.amount === 'right') s++;
  if (debrief.bags === 'fine') s++;
  if (debrief.clothing === 'fit') s++;
  if (debrief.weather === 'planned' || debrief.weather === 'warmer') s++;
  if (!(debrief.missing ?? []).length) s++;
  if (!Object.values(debrief.items ?? {}).includes('broken')) s++;
  return s;
}

/**
 * The Jahresbrief of a year: { year, empty, trips, rides, km, gainM, days, longest, learnings, less,
 * best, topMonth, firstLearning, homeN }.
 * longest: { title, km, id, href } · best: { title, id, href, note } · topMonth: { month, km } ·
 * less: [item names] that stay at home now (ticked in a debrief of the year) and the things not used most often.
 */
export function yearLetter({ year, trips = [], debriefs = [], rides = [], learnings = [], items = [], today = localDay() } = {}) {
  const y = String(year ?? today.slice(0, 4));
  const facts = tripFacts({ trips, debriefs, rides, learnings, today }).filter((r) => inYear(r.start, y));
  const tripRows = facts.filter((r) => r.kind === 'trip');
  const sum = (f) => facts.reduce((s, r) => s + (f(r) ?? 0), 0);
  const km = Math.round(sum((r) => r.km));
  const gainM = Math.round(sum((r) => r.gainM));
  const days = tripRows.reduce((s, r) => s + r.days, 0);
  const long = facts.filter((r) => r.km != null).sort((a, b) => b.km - a.km)[0] ?? null;
  const dBy = Object.fromEntries(debriefs.map((d) => [d.tripId, d]));
  const scored = tripRows.map((r) => ({ r, s: tripScore(dBy[r.id]) })).filter((x) => x.s != null).sort((a, b) => b.s - a.s || (b.r.km ?? 0) - (a.r.km ?? 0));
  const best = scored[0] ?? null;
  const byMonth = {};
  for (const r of facts) if (r.km) byMonth[r.start.slice(0, 7)] = (byMonth[r.start.slice(0, 7)] ?? 0) + r.km;
  const top = Object.entries(byMonth).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0] ?? null;
  const newL = learnings.filter((l) => !l.archivedAt && inYear(learnedOn(l), y));
  const a = applied(debriefs, (d) => inYear(d, y));
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  // the things not used most often on this year's trips (2 times or more)
  const yearIds = new Set(tripRows.map((r) => r.id));
  const unused = {};
  for (const d of done(debriefs)) if (yearIds.has(d.tripId)) for (const [id, st] of Object.entries(d.items ?? {})) if (st === 'unused') unused[id] = (unused[id] ?? 0) + 1;
  const often = Object.entries(unused).filter(([, n]) => n >= 2).sort((p, q) => q[1] - p[1]).map(([id]) => id);
  const less = [...new Set([...a.home, ...often])].map((id) => nameOf(byId[id])).filter(Boolean).slice(0, 3);
  return {
    year: y,
    empty: !facts.length && !newL.length,
    trips: tripRows.length,
    rides: facts.length - tripRows.length,
    km,
    gainM,
    days,
    longest: long ? { title: long.title, km: Math.round(long.km), id: long.id, href: long.href } : null,
    learnings: newL.length,
    firstLearning: newL.sort((p, q) => String(learnedOn(p)).localeCompare(String(learnedOn(q))))[0]?.rule ?? '',
    less,
    homeN: a.home.length,
    templatesN: a.templates.length,
    best: best && tripRows.length > 1 ? { title: best.r.title, id: best.r.id, href: best.r.href, note: noteLine(dBy[best.r.id]?.note) } : null,
    topMonth: top && Object.keys(byMonth).length > 1 ? { month: top[0], km: Math.round(top[1]) } : null,
  };
}

/** The years that have trips or rides, newest first (this year always). */
export function yearsWithData({ trips = [], debriefs = [], rides = [], today = localDay() } = {}) {
  const set = new Set([today.slice(0, 4)]);
  for (const r of tripFacts({ trips, debriefs, rides, today })) if (r.start) set.add(r.start.slice(0, 4));
  return [...set].sort().reverse();
}
