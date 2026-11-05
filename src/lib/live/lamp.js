/**
 * «Licht» (Noah 02.11.2026, Vorschlag 4): does the bike lamp last through the dark part of the ride that is still
 * ahead? You tell the app how long the lamp burns on a full charge and what is left; the app counts the minutes of
 * darkness between now and the finish (or the next 10 hours without a finish). Pure; nothing is stored here.
 *   → { state: 'day' | 'ok' | 'tight' | 'short', darkH, haveH, untilAt, from }
 *   day: no darkness ahead; ok: the lamp lasts with a quarter spare; tight: it lasts barely; short: it does not.
 */
import { lightLeft } from './live-lib.js';

export const LAMP_H = 10; // a made-up default: hours of light on a full charge
export const LAMP_FRAC = { full: 1, half: 0.5, low: 0.15 };
const STEP = 10 * 6e4;

export function lampPlan({ lat, lon, now = Date.now(), endAt = null, burnH = LAMP_H, frac = 1 }) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const end = Number.isFinite(endAt) && endAt > now ? Math.min(endAt, now + 24 * 36e5) : now + 10 * 36e5;
  let darkMs = 0;
  let from = null;
  for (let t = now; t < end; t += STEP) {
    const l = lightLeft(lat, lon, t);
    if (l?.dark) {
      darkMs += Math.min(STEP, end - t);
      from ??= t;
    }
  }
  const darkH = Math.round((darkMs / 36e5) * 10) / 10;
  const haveH = Math.round(Math.max(0, burnH) * frac * 10) / 10;
  const untilAt = Math.round(now + haveH * 36e5);
  const state = darkH === 0 ? 'day' : haveH >= darkH * 1.25 ? 'ok' : haveH >= darkH ? 'tight' : 'short';
  return { state, darkH, haveH, untilAt, from };
}
