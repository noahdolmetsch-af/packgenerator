/**
 * Pausieren und Auto-Pause (Noah 20.10.2026 «Hinweis … dass man die Tour pausieren kann … dass die Zeit
 * dann auch steht, wie lange man unterwegs war»; 17:53 «bei auto-pause soll der benutzer die
 * geschwindigkeit beim pausieren festlegen können bsp: <4km/h»).
 *
 * Pure: the live map calls autoPauseStep() every tick with the speed now; it says when to pause or go
 * on. The recorder (spur/recorder.svelte.js) keeps the pauses. Tested in tests/live-pause.test.js.
 */
import { pausedS } from './live-lib.js';

export const AUTO_KMH = 4; // the default limit
export const AUTO_MIN_KMH = 1;
export const AUTO_MAX_KMH = 15;
export const AUTO_PAUSE_S = 10; // this long below the limit → pause
export const AUTO_GO_S = 3; // this long above the limit (+1 km/h) → go on
export const HINT_S = 60; // standing this long without a pause → the hint «Pause stops the time»
export const TAIL_MAX_S = 120; // the riding time counts on between two kept points at most this long

/** The limit made safe (1 to 15 km/h, steps of 0.5). */
export function autoKmhOf(v) {
  const n = Number(String(v ?? '').replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return AUTO_KMH;
  return Math.min(AUTO_MAX_KMH, Math.max(AUTO_MIN_KMH, Math.round(n * 2) / 2));
}

/** The speed in km/h: the GPS speed when it has one, else from the last two fixes (null without). */
export function speedKmh(fix, prev) {
  if (!fix) return null;
  if (Number.isFinite(fix.speed) && fix.speed >= 0) return fix.speed * 3.6;
  if (!prev || !(fix.at > prev.at)) return null;
  const rad = Math.PI / 180;
  const h = Math.sin(((fix.lat - prev.lat) * rad) / 2) ** 2 + Math.cos(prev.lat * rad) * Math.cos(fix.lat * rad) * Math.sin(((fix.lon - prev.lon) * rad) / 2) ** 2;
  const m = 2 * 6371000 * Math.asin(Math.sqrt(h));
  return (m / ((fix.at - prev.at) / 1000)) * 3.6;
}

/**
 * One tick of the auto-pause. st: { below: ms since below the limit or null, above: ms since above or null }.
 * paused / auto: the recording's state (only an auto-pause goes on by itself, never your own «Pause»).
 * → { st, act: 'pause' | 'resume' | null }
 */
export function autoPauseStep(st = {}, { kmh, now = Date.now(), limit = AUTO_KMH, paused = false, auto = false } = {}) {
  if (!Number.isFinite(kmh)) return { st: { below: null, above: null }, act: null };
  if (!paused) {
    if (kmh < limit) {
      const below = st.below ?? now;
      return now - below >= AUTO_PAUSE_S * 1000 ? { st: { below: null, above: null }, act: 'pause' } : { st: { below, above: null }, act: null };
    }
    return { st: { below: null, above: null }, act: null };
  }
  if (!auto) return { st: { below: null, above: null }, act: null };
  if (kmh >= limit + 1) {
    const above = st.above ?? now;
    return now - above >= AUTO_GO_S * 1000 ? { st: { below: null, above: null }, act: 'resume' } : { st: { below: null, above }, act: null };
  }
  return { st: { below: null, above: null }, act: null };
}

/**
 * The riding time now: the time of the kept points (pauses() movingS) plus the time since the last kept
 * point (at most TAIL_MAX_S, without the pauses), so the clock runs every second and stands in a pause.
 */
export function movingNow({ movingS = 0, lastAt = 0, now = Date.now(), paused = false, breaks = [] } = {}) {
  if (paused || !lastAt || now <= lastAt) return movingS;
  const tail = (now - lastAt) / 1000 - pausedS(lastAt, now, breaks);
  return Math.round(movingS + Math.min(TAIL_MAX_S, Math.max(0, tail)));
}

/** The whole time since the start (with pauses and stops), in seconds. */
export const totalNow = (startAt, now = Date.now()) => (startAt > 0 && now > startAt ? Math.round((now - startAt) / 1000) : 0);

/** The time in the pauses so far, in seconds (the open one up to now). */
export const pausedNow = (breaks = [], now = Date.now()) => Math.round(pausedS(0, now, breaks));
