/**
 * «Kursblick» Vergleich (Bauplan K11): up to five titles on one chart, every line starting at 100 on the same day, so
 * a share at 40 francs and an index at 14 000 points can be read against each other. Pure; tested in tests/kurse-vergleich.test.js.
 * A series is [[day, close], …] ascending; days are calendar days (never milliseconds). Only numbers, no advice.
 */
import { backBy, closeOnOrBefore } from './rechnen.js';

export const MAX_LINIEN = 5;

/**
 * Each series rebased to 100 over the period `spec` counted back from the latest last day of all of them.
 * reihen: [{ id, points }]. → { start, ende, linien: [{ id, points: [[day, value], …], von, kurz, aenderung }] }
 * A series that starts after `start` begins at its own first day (`kurz: true`, «Data since …»); `von` is the day the
 * line starts at 100; `aenderung` the change in percent at the end. A series with fewer than two points is left out.
 */
export function aufHundert(reihen, spec) {
  const gueltig = (reihen ?? []).filter((r) => r?.points?.length >= 2);
  if (!gueltig.length) return { start: '', ende: '', linien: [] };
  const ende = gueltig.reduce((m, r) => (r.points[r.points.length - 1][0] > m ? r.points[r.points.length - 1][0] : m), '');
  const start = backBy(ende, spec);
  const linien = gueltig.map((r) => {
    const base = closeOnOrBefore(r.points, start) ?? r.points[0];
    const kurz = r.points[0][0] > start;
    const points = r.points.filter((p) => p[0] >= base[0]).map(([day, v]) => [day, Math.round((v / base[1]) * 1e6) / 1e4]);
    const last = points[points.length - 1][1];
    return { id: r.id, points, von: base[0], kurz, aenderung: Math.round((last - 100) * 100) / 100 };
  });
  return { start, ende, linien };
}

/** Add or take away one title in the choice; at most MAX_LINIEN, a new one beyond that is not taken. → { wahl, voll }. */
export function umschalten(wahl, id) {
  if (wahl.includes(id)) return { wahl: wahl.filter((x) => x !== id), voll: false };
  if (wahl.length >= MAX_LINIEN) return { wahl, voll: true };
  return { wahl: [...wahl, id], voll: false };
}

/**
 * The lines of aufHundert() on one shared row of days for a chart: every day any line has a close, at most `max` of
 * them (evenly picked, the last always kept). A line has a value from its own first day on (the last close on or before
 * the day, so a share is flat over a coin's weekend) and none before. → { days, v: { id: [value|null, …] } }.
 */
export function raster(linien, max = 240) {
  const all = [...new Set(linien.flatMap((l) => l.points.map((p) => p[0])))].sort();
  let days = all;
  if (all.length > max) {
    const keep = new Set();
    for (let i = 0; i < max; i++) keep.add(Math.round((i * (all.length - 1)) / (max - 1)));
    days = all.filter((_, i) => keep.has(i));
  }
  const v = {};
  for (const l of linien) {
    let k = -1;
    v[l.id] = days.map((d) => {
      while (k + 1 < l.points.length && l.points[k + 1][0] <= d) k++;
      return k < 0 ? null : l.points[k][1];
    });
  }
  return { days, v };
}
