/**
 * Paket S «Reise-Spur» (Noah 19.10.2026 «1a und b möglich 2a 3a 4a 5a»): the track of a tour, day by day.
 *
 * Where the line comes from (answer 1a + 1b):
 * - Strava (Garmin uploads to Strava): the activity's line (summary_polyline, activities.line);
 * - an uploaded GPX ride (rides.line);
 * - the app's own recording (tracks, kind 'rec'), only while the screen is on.
 * The Strava/GPX line wins: a recording whose time overlaps a Strava/GPX ride of that day is kept
 * but not drawn, and its gaps count as filled. A recording without one shows its gaps («Lücke»).
 *
 * «Hier bin ich» (tracks, kind 'place'): a place by tap, with an optional text and photo.
 * Notes of the trip (notes.tripId) show on the day they were written; on the map where the note
 * says it was written, else where the line was at that time (an estimate), else only in the list.
 * Photos stay on the device (answer 3a): nothing here sends them anywhere.
 *
 * Pure, tested in tests/spur.test.js.
 */
import { decodePolyline, lineKm, pointAlong } from './polyline.js';
import { stravaName } from '../stravanames.js';

/** Recording: a point every 30 s or 50 m (whatever comes first), a fix worse than 100 m is skipped. */
export const REC_EVERY_S = 30;
export const REC_EVERY_M = 50;
export const REC_MAX_ACC_M = 100;
/** No point for this long while recording = a gap (screen off, app closed, no GPS). */
export const GAP_S = 180;

const dayAdd = (day, n) => {
  const [y, m, d] = day.split('-').map(Number);
  const x = new Date(Date.UTC(y, m - 1, d + n));
  return x.toISOString().slice(0, 10);
};
/** The calendar day of a moment in Europe/Zurich. */
export const zurichDay = (ms) => new Date(ms).toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
/** «10:12» in Europe/Zurich. */
export const zurichTime = (ms) => new Date(ms).toLocaleTimeString('de-CH', { timeZone: 'Europe/Zurich', hour: '2-digit', minute: '2-digit' });

/** The days of a trip: from startDate, trip.days long, plus days that carry data of the trip. */
export function tripDays(trip, extra = []) {
  const set = new Set();
  if (trip?.startDate) {
    const n = Math.max(1, Math.min(120, Number(trip.days) || 1));
    for (let i = 0; i < n; i++) set.add(dayAdd(trip.startDate, i));
  }
  for (const d of extra) if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) set.add(d);
  return [...set].sort();
}

/**
 * Should the recorder keep this fix? prev: the last kept point { lat, lon, at (ms) } or null;
 * pos: { lat, lon, acc (m), at (ms) }.
 */
export function keepFix(prev, pos, { everyS = REC_EVERY_S, everyM = REC_EVERY_M, maxAcc = REC_MAX_ACC_M } = {}) {
  if (!pos || !Number.isFinite(pos.lat) || !Number.isFinite(pos.lon)) return false;
  if (Number.isFinite(pos.acc) && pos.acc > maxAcc) return false;
  if (!prev) return true;
  const dt = (pos.at - prev.at) / 1000;
  if (dt <= 0) return false;
  if (dt >= everyS) return true;
  const toR = Math.PI / 180;
  const dy = (pos.lat - prev.lat) * 111_320;
  const dx = (pos.lon - prev.lon) * 111_320 * Math.cos(prev.lat * toR);
  return Math.hypot(dx, dy) >= everyM;
}

/**
 * The gaps of a recording: [{ from, to }] (ms) where two points lie more than GAP_S apart.
 * rec: { startAt, pts: [[lat, lon, sec since startAt], …] }.
 */
export function gapsOf(rec, gapS = GAP_S) {
  const out = [];
  const pts = rec?.pts ?? [];
  for (let n = 1; n < pts.length; n++) {
    if (pts[n][2] - pts[n - 1][2] > gapS) out.push({ from: rec.startAt + pts[n - 1][2] * 1000, to: rec.startAt + pts[n][2] * 1000 });
  }
  return out;
}

/** The parts of a recording between its gaps, each a line [[lat, lon], …] with at least 2 points. */
export function recParts(rec, gapS = GAP_S) {
  const parts = [];
  let cur = [];
  const pts = rec?.pts ?? [];
  for (let n = 0; n < pts.length; n++) {
    if (n && pts[n][2] - pts[n - 1][2] > gapS) {
      parts.push(cur);
      cur = [];
    }
    cur.push([pts[n][0], pts[n][1]]);
  }
  parts.push(cur);
  return parts.filter((p) => p.length >= 2);
}

/** Time window [from, to] in ms of a Strava activity or a GPX ride, or null. */
function windowOf(x) {
  if (x.src === 'strava') {
    const s = Date.parse(x.start ?? '');
    if (!Number.isFinite(s)) return null;
    return [s, s + (Number(x.elapsedS) || Number(x.movingS) || 0) * 1000];
  }
  const s = Date.parse(x.startAt ?? '');
  if (!Number.isFinite(s)) return null;
  return [s, s + (Number(x.totalH) || 0) * 3_600_000];
}

const overlaps = (a, b) => !!a && !!b && a[0] < b[1] && b[0] < a[1];

/** Where the line of a day was at a moment: [lat, lon] (estimate from the time), or null. */
export function placeAt(day, ms) {
  if (!Number.isFinite(ms)) return null;
  for (const l of day.lines) {
    if (l.hidden || !l.win || l.pts.length < 2) continue;
    const [a, b] = l.win;
    if (ms >= a && ms <= b && b > a) {
      if (l.times) {
        let best = 0;
        for (let n = 1; n < l.times.length; n++) if (Math.abs(l.times[n] - ms) < Math.abs(l.times[best] - ms)) best = n;
        return l.pts[best];
      }
      return pointAlong(l.pts, (ms - a) / (b - a));
    }
  }
  return null;
}

/** The place a note or a «Hier bin ich» names itself: [lat, lon] or null. */
function ownPlace(x) {
  const p = x?.place && typeof x.place === 'object' ? x.place : x;
  const lat = Number(p?.lat);
  const lon = Number(p?.lon ?? p?.lng);
  return Number.isFinite(lat) && Number.isFinite(lon) && (lat || lon) ? [lat, lon] : null;
}

/**
 * The whole track of a trip.
 * acts: the trip's Strava activities (training.js activitiesForTrip), each may carry `line`;
 * rides: GPX rides (rides table); tracks: the app's recordings and places; notes: the trip's notes.
 * → { days: [{ day, n, km, lines, gaps, places, notes, sources }], km, hasLine, withPhoto }
 *   lines: [{ id, src: 'strava'|'gpx'|'rec', name, pts, km, win, times?, hidden }]
 *   gaps:  [{ from, to, filled }] (ms), places/notes: [{ …, pos, guessed }]
 */
export function tourSpur(trip, { acts = [], rides = [], tracks = [], notes = [] } = {}) {
  const tripRides = rides.filter((r) => r?.tripId === trip?.id);
  const recs = tracks.filter((x) => x?.kind === 'rec' && x.tripId === trip?.id);
  const places = tracks.filter((x) => x?.kind === 'place' && x.tripId === trip?.id);
  const tripNotes = notes.filter((x) => x?.tripId === trip?.id);
  const noteDay = (x) => x.day ?? (x.at ? zurichDay(Date.parse(x.at)) : null);
  const days = tripDays(trip, [...acts.map((a) => a.day), ...tripRides.map((r) => r.date), ...recs.map((r) => r.day), ...places.map((p) => p.day ?? zurichDay(Date.parse(p.at))), ...tripNotes.map(noteDay)]);

  const out = days.map((day, n) => {
    const lines = [];
    for (const a of acts.filter((x) => x.day === day)) {
      const pts = decodePolyline(a.line);
      lines.push({ id: `a-${a.id}`, src: 'strava', name: stravaName(a.name || ''), pts, km: Number(a.km) || lineKm(pts), win: windowOf({ ...a, src: 'strava' }), hidden: false, noLine: !pts.length });
    }
    for (const r of tripRides.filter((x) => x.date === day)) {
      const pts = Array.isArray(r.line) ? r.line.filter((p) => Array.isArray(p) && p.length >= 2) : [];
      lines.push({ id: `r-${r.id}`, src: 'gpx', name: r.name || '', pts, km: Number(r.km) || lineKm(pts), win: windowOf({ ...r, src: 'gpx' }), hidden: false, noLine: !pts.length });
    }
    const ext = lines.filter((l) => !l.noLine);
    const gaps = [];
    for (const r of recs.filter((x) => x.day === day)) {
      const win = [r.startAt, r.endAt ?? r.startAt + (r.pts?.at(-1)?.[2] ?? 0) * 1000];
      // the Strava/GPX line wins (answer 1b): a ride of that day at the same time, or of that day without a time
      const covered = ext.some((l) => (l.win ? overlaps(l.win, win) : true));
      const recGaps = gapsOf(r);
      for (const g of recGaps) gaps.push({ ...g, filled: covered });
      const parts = recParts(r);
      parts.forEach((pts, i) => {
        lines.push({ id: `t-${r.id}-${i}`, src: 'rec', name: '', pts, km: lineKm(pts), win, hidden: covered });
      });
      // the times of the points, for placeAt (one line per part, so only for a recording without gaps)
      if (parts.length === 1 && !covered) {
        const l = lines.at(-1);
        l.times = (r.pts ?? []).map((p) => r.startAt + p[2] * 1000);
      }
    }
    const d = { day, n: n + 1, lines, gaps };
    d.places = places
      .filter((p) => (p.day ?? zurichDay(Date.parse(p.at))) === day)
      .map((p) => ({ ...p, pos: ownPlace(p), guessed: false }))
      .sort((a, b) => String(a.at).localeCompare(String(b.at)));
    d.notes = tripNotes
      .filter((x) => noteDay(x) === day)
      .map((x) => {
        const own = ownPlace(x);
        const pos = own ?? placeAt(d, Date.parse(x.at));
        return { ...x, pos, guessed: !own && !!pos };
      })
      .sort((a, b) => String(a.at).localeCompare(String(b.at)));
    d.km = Math.round(lines.filter((l) => !l.hidden).reduce((s, l) => s + (l.km || 0), 0) * 10) / 10;
    d.sources = [...new Set(lines.filter((l) => !l.hidden && (l.pts.length || l.km)).map((l) => l.src))];
    d.noLine = lines.filter((l) => l.noLine).length;
    return d;
  });
  const shown = out.flatMap((d) => d.lines.filter((l) => !l.hidden && l.pts.length >= 2));
  return {
    days: out,
    km: Math.round(out.reduce((s, d) => s + d.km, 0) * 10) / 10,
    hasLine: shown.length > 0,
    withPhoto: out.reduce((s, d) => s + d.places.filter((p) => p.photo).length + d.notes.filter((x) => x.photo).length, 0),
    missingLines: out.reduce((s, d) => s + d.noLine, 0),
  };
}

/** All lines of a tour that show (for the map and the book). */
export const shownLines = (spur) => (spur?.days ?? []).flatMap((d) => d.lines.filter((l) => !l.hidden && l.pts.length >= 2).map((l) => ({ ...l, day: d.day, n: d.n })));

/** Everything on the map that is a point: places, notes with a place, start and end. */
export function mapPoints(spur) {
  const pts = [];
  for (const d of spur?.days ?? []) {
    for (const p of d.places) if (p.pos) pts.push({ id: p.id, kind: 'place', pos: p.pos, day: d.day, n: d.n, text: p.text ?? '', photo: p.photo ?? null, at: p.at });
    for (const x of d.notes) if (x.pos) pts.push({ id: x.id, kind: x.photo ? 'photo' : 'note', pos: x.pos, day: d.day, n: d.n, text: x.text ?? '', photo: x.photo ?? null, at: x.at, guessed: x.guessed });
  }
  return pts;
}
