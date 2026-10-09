/**
 * v0.53.0 R2 «Logbuch» (Noah ★a): a diary of ALL trips, newest first, in one flat list. Every trip
 * that happened and every uploaded ride on its own (rueckblick.js tripFacts), plus the entries of the
 * logbook that are not trips of the app (db.events: the old trips of the Excel and the logbook events).
 * One entry: { id, kind: 'trip' | 'ride' | 'event', date, end, year, title, domain, km, gainM, movingH,
 * rain, days, tmin, tmax, notes: [text], fact (the row of tripFacts), ev (the event) }.
 * Filter by year and area (logFilter). Pure, tested in tests/v0530.test.js.
 */
import { BIKEPACKING } from '../domains.js';
import { tripNotes } from '../notes.js';

/** The date of an event: its sortDate, else a full date or a year in date. */
const eventDate = (ev) => ev.sortDate || (/^\d{4}(-\d{2}-\d{2})?/.test(ev.date ?? '') ? (ev.date.length === 4 ? `${ev.date}-01-01` : ev.date.slice(0, 10)) : null);

/**
 * facts: tripFacts() rows; events: db.events; debriefs, notes: for the debrief's sentence and the
 * notes written on the way. The sentence for next time and the notes on the way are the trip's notes.
 */
export function logEntries({ facts = [], events = [], debriefs = [], notes = [] } = {}) {
  const dBy = Object.fromEntries(debriefs.map((d) => [d.tripId, d]));
  const trips = facts.map((f) => {
    const d = f.trip ? dBy[f.trip.id] ?? null : null;
    const own = [];
    const sentence = (d?.note ?? '').trim();
    if (sentence) own.push(sentence);
    if (f.trip) for (const n of tripNotes(d, notes, f.trip.id)) if (n.text && !own.includes(n.text)) own.push(n.text);
    for (const r of f.rides ?? []) if (r.note && !own.includes(r.note)) own.push(r.note);
    return {
      id: f.id,
      kind: f.kind,
      date: f.start,
      end: f.end,
      year: (f.start ?? '').slice(0, 4),
      title: f.title,
      domain: f.domain ?? BIKEPACKING,
      km: f.km,
      gainM: f.gainM,
      movingH: f.movingH,
      rain: f.rain,
      days: f.days,
      tmin: f.tmin,
      tmax: f.tmax,
      notes: own,
      fact: f,
      ev: null,
    };
  });
  const evs = events.map((ev) => {
    const date = eventDate(ev);
    return {
      id: `ev:${ev.id}`,
      kind: 'event',
      date,
      end: date,
      year: date ? date.slice(0, 4) : '',
      title: ev.name ?? '',
      // the logbook's events are bike trips (Excel, races, brevets)
      domain: BIKEPACKING,
      km: null,
      gainM: null,
      movingH: null,
      rain: { wet: null, days: [] },
      days: 1,
      tmin: null,
      tmax: null,
      notes: [ev.note].filter((x) => x && String(x).trim()),
      fact: null,
      ev,
    };
  });
  return [...trips, ...evs].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || a.title.localeCompare(b.title));
}

/** The years with entries, newest first. */
export const logYears = (entries) => [...new Set(entries.map((e) => e.year).filter(Boolean))].sort().reverse();
/** The areas with entries, bikepacking first. */
export const logAreas = (entries) => [...new Set(entries.map((e) => e.domain))].sort((a, b) => (a === BIKEPACKING ? -1 : b === BIKEPACKING ? 1 : a.localeCompare(b)));

/** year: 'all' or '2026'; area: 'all' or an area key; q: words in the title or the notes. */
export function logFilter(entries, { year = 'all', area = 'all', q = '' } = {}) {
  const words = String(q).toLowerCase().trim().split(/\s+/).filter(Boolean);
  return entries.filter((e) => {
    if (year !== 'all' && e.year !== year) return false;
    if (area !== 'all' && e.domain !== area) return false;
    if (!words.length) return true;
    const ev = e.ev ?? {};
    const hay = [e.title, ...e.notes, ev.type, ev.result, ev.learnings, ev.bike, ev.dateText, e.fact?.bike, ...(e.fact?.learnings ?? []).map((l) => l.rule)].filter(Boolean).join(' ').toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}
