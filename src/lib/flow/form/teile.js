/**
 * «Diagramme zum Antippen» K3 (Noah 27.10.2026 «1-5 a»): the days behind each row of «Was heute zählt» on the
 * page «Form und Erholung». For every part (resting pulse, HRV, sleep, the felt sleep and energy, the form)
 * the value, the normal it was measured against and the points it gave, day by day. The points are the same
 * as the readiness counts them (form.js recoveryParts and readiness). Pure; tests/form-teile.test.js.
 */
import { addDays } from '../../health.js';
import { recoveryParts, readiness } from '../../form.js';

/** The parts in the order of the page, with how the app turns them into points and what normal means. */
export const PARTS = {
  rhr: { rule: 'Every beat above your normal takes 4 points, every beat below adds 4 (from −25 to +12).', normal: 'Normal: the middle of your 30 days before.' },
  hrv: { rule: 'Every 10 % above your normal adds 6 points, every 10 % below takes 6 (from −20 to +12).', normal: 'Normal: the middle of your 30 days before.' },
  sleep: { rule: 'Every hour above 7.5 h adds 6 points, every hour below takes 6 (from −18 to +8).', normal: 'Normal: 7.5 h.' },
  feltSleep: { rule: 'Every step above 6 of 10 adds 2.5 points, every step below takes 2.5 (from −10 to +8).', normal: 'Normal: 6 of 10.' },
  energy: { rule: 'Every step above 6 of 10 adds 3 points, every step below takes 3 (from −12 to +10).', normal: 'Normal: 6 of 10.' },
  form: { rule: 'Form against your fitness: fresh adds up to 20 points, tired takes up to 30.', normal: 'Normal: 0, load and recovery in balance.' },
};
export const PART_KEYS = Object.keys(PARTS);

/** The n days up to today, oldest first: «YYYY-MM-DD». */
export const lastDays = (today, n) => Array.from({ length: n }, (_, i) => addDays(today, i - (n - 1)));

/**
 * One part over the n days up to today. src: { table (Map day → row), felt (Map day → { sleep, energy }),
 * series (formSeries, oldest first) }. → [{ day, v, normal, points }], v null on a day without a value.
 */
export function partDays(key, { table, felt = new Map(), series = [] }, today, n = 7) {
  const days = lastDays(today, n);
  if (key === 'form') {
    const at = new Map(series.map((s, i) => [s.day, i]));
    return days.map((day) => {
      const i = at.get(day);
      if (i == null) return { day, v: null, normal: 0, points: null };
      const r = readiness({ series: series.slice(0, i + 1), parts: [] });
      return { day, v: Math.round(series[i].form), normal: 0, points: r?.formPts ?? null };
    });
  }
  return days.map((day) => {
    const p = recoveryParts(table, day, felt.get(day) ?? null).find((x) => x.key === key);
    return p ? { day, v: p.v, normal: p.normal, points: p.points } : { day, v: null, normal: null, points: null };
  });
}

/** The parts that have at least one value in these days, in the order of PARTS. */
export function partsWithData(src, today, n) {
  return PART_KEYS.filter((k) => partDays(k, src, today, n).some((d) => d.v != null));
}
