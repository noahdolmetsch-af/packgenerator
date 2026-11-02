/**
 * Fahrt-Protokoll (Noah 01.11.2026 «4a»): what the recording of a ride saw, so a wrong time or distance can be
 * understood afterwards: the GPS points, the gaps between them, restarts, and when the app was hidden or
 * the screen lock was lost. Pure; the recorder keeps row.log = [[ms, code]] (spur/recorder.svelte.js).
 * Tested in tests/ridelog.test.js.
 */
import { distKm } from './live-lib.js';

export const GAP_S = 60; // no point for this long is a gap
export const LOG_CODES = ['s', 'c', 'h', 'v', 'L1', 'L0', 'Lx'];

/** The gaps between kept points: [{ at, s, m }] (start ms, seconds, metres between the two points). */
export function gapsOf(pts = [], startAt = 0, minS = GAP_S) {
  const out = [];
  for (let i = 1; i < pts.length; i++) {
    const s = pts[i][2] - pts[i - 1][2];
    if (s >= minS) out.push({ at: startAt + pts[i - 1][2] * 1000, s, m: Math.round(distKm({ lat: pts[i - 1][0], lon: pts[i - 1][1] }, { lat: pts[i][0], lon: pts[i][1] }) * 1000) });
  }
  return out;
}

/** The facts of a recording row (open or closed). */
export function rideLog(row, { minS = GAP_S } = {}) {
  const pts = row?.pts ?? [];
  const startAt = row?.startAt ?? 0;
  const events = (row?.log ?? []).filter((e) => LOG_CODES.includes(e?.[1]));
  const gaps = gapsOf(pts, startAt, minS);
  return {
    points: pts.length,
    startAt,
    firstAt: pts.length ? startAt + pts[0][2] * 1000 : null,
    lastAt: pts.length ? startAt + pts.at(-1)[2] * 1000 : null,
    km: Math.round((row?.km ?? 0) * 100) / 100,
    gaps,
    gapS: gaps.reduce((a, g) => a + g.s, 0),
    events,
    restarts: events.filter((e) => e[1] === 'c').length,
    hidden: events.filter((e) => e[1] === 'h').length,
    lockLost: events.filter((e) => e[1] === 'L0' || e[1] === 'Lx').length,
    pauses: (row?.breaks ?? []).length,
  };
}

const hms = (ms, tz = 'Europe/Zurich') => new Date(ms).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: tz });

/**
 * The text to send: one line per fact. L: the labels (already through t()); no names, only times and numbers.
 */
export function rideLogText(log, L, { tz = 'Europe/Zurich' } = {}) {
  const lines = [
    `${L.points}: ${log.points}`,
    `${L.km}: ${log.km}`,
    ...(log.firstAt ? [`${L.first}: ${hms(log.firstAt, tz)}`, `${L.last}: ${hms(log.lastAt, tz)}`] : []),
    `${L.gaps}: ${log.gaps.length} (${Math.round(log.gapS / 60)} min)`,
    ...log.gaps.map((g) => `  ${hms(g.at, tz)} ${Math.round(g.s / 60 * 10) / 10} min, ${g.m} m`),
    `${L.restarts}: ${log.restarts}`,
    `${L.hidden}: ${log.hidden}`,
    `${L.lockLost}: ${log.lockLost}`,
    `${L.pauses}: ${log.pauses}`,
    ...log.events.slice(-60).map((e) => `  ${hms(e[0], tz)} ${L.codes[e[1]] ?? e[1]}`),
  ];
  return lines.join('\n');
}
