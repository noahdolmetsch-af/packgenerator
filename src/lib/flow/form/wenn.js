/**
 * «Was wäre, wenn …» (Noah 03.11.2026, Cockpit-Idee 2): one day in the next week as a pause, a short or a long
 * session, and what that does to fitness, fatigue and form over the following days. A MODEL, not a forecast:
 * it uses the same load numbers as «Form und Erholung», the planned sessions as the estimate of
 * landschaft.js, and shows every number with a range (all future loads 25 % lower or higher than estimated).
 * Only fitness, fatigue and form can be modelled this way. Resting pulse, HRV and sleep cannot be predicted
 * from a plan, so they are not here and never invented. Pure; tests/wenn.test.js.
 */
import { addDays } from '../../health.js';
import { formSeries } from '../../form.js';
import { plannedLoad } from './landschaft.js';

/** The chosen day may be tomorrow … today + CHOOSE_DAYS. */
export const CHOOSE_DAYS = 7;
/** The numbers are shown this many days after the chosen day. */
export const CHECKS = [1, 3, 7];
/** All future loads count with these factors: 25 % lower, as estimated, 25 % higher. */
export const SPREAD = [0.75, 1, 1.25];
export const DEFAULTS = { short: 45, long: 180, zone: 2 };
export const MINS_MIN = 10;
export const MINS_MAX = 480;

const clampMins = (v, d) => Math.min(MINS_MAX, Math.max(MINS_MIN, Math.round(Number(v)) || d));

/**
 * The options for the day, each with the load it brings: pause (0), short, long, and «as planned» when
 * sessions are planned that day. → [{ key, load, mins? }]
 */
export function optionsFor({ planned = new Map(), day, short = DEFAULTS.short, long = DEFAULTS.long, zone = DEFAULTS.zone } = {}) {
  const sm = clampMins(short, DEFAULTS.short);
  const lm = clampMins(long, DEFAULTS.long);
  const z = zone >= 1 && zone <= 5 ? zone : DEFAULTS.zone;
  const out = [];
  const p = planned.get(day);
  if (p) out.push({ key: 'plan', load: p.load });
  out.push({ key: 'pause', load: 0 });
  out.push({ key: 'short', load: plannedLoad({ mins: sm, zone: z }), mins: sm });
  out.push({ key: 'long', load: plannedLoad({ mins: lm, zone: z }), mins: lm });
  return out;
}

/**
 * Fitness, fatigue and form after the chosen day, for every option.
 * loads: measured loads (form.js dayLoads); planned: plannedByDay(); day: the chosen day (after today).
 * → [{ key, load, mins?, points: [{ offset, day, fit: {v,lo,hi}, fat: {…}, form: {…} }] }] or [] for a day outside the week.
 */
export function whatIf({ loads, planned = new Map(), today, day, options }) {
  if (!day || day <= today || day > addDays(today, CHOOSE_DAYS)) return [];
  const last = addDays(day, Math.max(...CHECKS));
  const runs = (opt) =>
    SPREAD.map((f) => {
      const all = new Map(loads);
      for (const [d, e] of planned) if (d !== day) all.set(d, (all.get(d) ?? 0) + e.load * f);
      if (opt.load > 0) all.set(day, (all.get(day) ?? 0) + opt.load * f);
      return formSeries(all, today, last);
    });
  return options.map((opt) => {
    const rs = runs(opt);
    const points = CHECKS.map((offset) => {
      const d = addDays(day, offset);
      const rows = rs.map((s) => s.find((x) => x.day === d));
      const m = (k) => {
        const vals = rows.map((r) => r[k]);
        return { v: Math.round(rows[1][k]), lo: Math.round(Math.min(...vals)), hi: Math.round(Math.max(...vals)) };
      };
      return { offset, day: d, fit: m('fit'), fat: m('fat'), form: m('form') };
    });
    return { ...opt, points };
  });
}
