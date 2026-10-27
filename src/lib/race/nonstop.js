/**
 * «Zielzeit nonstop» (Noah 27.10.2026, idea 2 after the Rennen-Check): when are you at the finish if you
 * ride through? The same rule as the race strategy (strategy.js): riding time = km / speed on the flat +
 * metres up / climbing rate, slower by tiredness; stops in % on top; naps in minutes on top.
 * Three answers: good day, as planned, hard day. Pure; tested in tests/race-nonstop.test.js.
 */
import { msOf, localOf } from './race.js';

/** Good and hard day: speed ±10 %, stops ×0.7 / ×1.3. */
export const DAYS = [
  { key: 'good', name: 'Good day', speed: 1.1, stops: 0.7 },
  { key: 'plan', name: 'As planned', speed: 1, stops: 1 },
  { key: 'hard', name: 'Hard day', speed: 0.9, stops: 1.3 },
];

const num = (x, d = 0) => (Number.isFinite(Number(x)) && x !== '' && x != null ? Number(x) : d);

/**
 * In: { km, gainM, start 'YYYY-MM-DDTHH:MM', flatKmh, climbMh, pausePct, fatiguePct, napMin }.
 * → null without km or start, else [{ key, name, rideH, stopH, napH, totalH, finish 'YYYY-MM-DDTHH:MM' }].
 */
export function nonstop(p = {}) {
  const km = num(p.km);
  const t0 = msOf(p.start);
  if (!(km > 0) || !Number.isFinite(t0)) return null;
  const gain = Math.max(0, num(p.gainM));
  const flat = Math.max(1, num(p.flatKmh, 25));
  const climb = Math.max(50, num(p.climbMh, 650));
  const pause = Math.max(0, num(p.pausePct, 25)) / 100;
  const fatigue = Math.max(0, num(p.fatiguePct, 10)) / 100;
  const napH = Math.max(0, num(p.napMin)) / 60;
  return DAYS.map((d) => {
    const rideH = ((km / flat + gain / climb) * (1 + fatigue)) / d.speed;
    const stopH = rideH * pause * d.stops;
    const totalH = rideH + stopH + napH;
    return { key: d.key, name: d.name, rideH, stopH, napH, totalH, finish: localOf(t0 + totalH * 36e5) };
  });
}

/** Hours as { h, m } for «31 h 20». */
export const hm = (h) => {
  const m = Math.round(h * 60);
  return { h: Math.floor(m / 60), m: m % 60 };
};
