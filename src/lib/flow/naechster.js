/**
 * «Meilensteine motivierender» PR 1 (Noah 21.11.2026 «1-5 a»): the card «Dein nächster Stern» on top of the
 * Meilensteine page. Pure (no runes): which star is next, how much is missing, what the Wochenplan has for it
 * this week and, without a plan, the pace of the last four weeks. Tests: tests/naechster.test.js.
 *
 * Honest by design: a tick in the Wochenplan does not count for a milestone (only a tick on Aktiv does), so the
 * card never says «the star arrives»; it says what the plan has and that ticking it off on Aktiv counts.
 */
import { addDays } from '../flow.js';
import { mondayOf, shiftDay } from '../training.js';
import { weekFor, logOf, weekLog, weekPins } from '../training/wochenlog.js';
import { soonList } from '../flowms.js';

/** Which units of the Wochenplan belong to a sport, by the sport's icon. Sports without a unit get no plan line. */
export const UNITS_OF_ICON = { tennis: ['tennis'], gym: ['gym'], hockey: ['hockey'], yoga: ['yoga'], run: ['runOut', 'runIn'], bike: ['bikeOut'], spin: ['bikeIn'], sauna: ['sauna'] };
/** Milestones that only ever grow (a running sum): the pace of the last weeks says something about them. */
const GROWS = /\.(sessions|hours|total|commute)$|\.year\.|^x\.(hours\.|activeDay$|outdoor$|early$|newTried$|recovery$)|^d\.(bikeKm|azm|steps10k|sleep7|packOk)/;
/** How many days of the past the pace looks at, at most; and the least history it needs. */
const WINDOW = 28;
const LEAST = 8;
/** A date further away than this is no useful answer. */
const FAR = 120;

/** The star that is next: the closest «soon» one, else the one with the most progress. null when nothing is open. */
export function nextStar(list) {
  const open = list.filter((r) => !r.off && r.next);
  return soonList(open, 1)[0] ?? [...open].sort((a, b) => b.progress - a.progress || a.target - b.target)[0] ?? null;
}

/** What is missing for the next star, in the milestone's unit (one decimal at most). */
export const leftOf = (r) => Math.max(0, Math.round((r.target - r.value) * 10) / 10);

/** How much one planned unit adds to a milestone when it is ticked off on Aktiv: 1 for «Times», hours for «Hours», else null. */
function perUnit(r, unit) {
  const id = r.m.id;
  if (/\.sessions$|\.year\./.test(id)) return 1;
  if (/\.hours$/.test(id)) return unit.mins / 60;
  return null;
}

/**
 * The open units of this week that fit the milestone's sport, soonest first, and the one that gets there.
 * → { unit, day, reach: unit | null, count } | null. unit = the first open one; reach = the unit after which the
 * star would be there when all of them up to it are ticked off on Aktiv (null when it does not get there or the
 * milestone cannot be counted this way). plan = the stored `training.weekplan`, rawLog = `training.weeklog`.
 */
export function planFor(r, act, plan, rawLog, today, sessions = []) {
  if (plan == null || !act) return null;
  const types = UNITS_OF_ICON[act.icon];
  if (!types) return null;
  const monday = mondayOf(today);
  const dNow = (new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7;
  const log = logOf(rawLog);
  const w = weekLog(log, monday);
  const wp = weekPins(log, monday);
  const { week } = weekFor(plan, monday, wp.pins, w.mode, sessions, wp.carried);
  const open = week.units.filter((u) => types.includes(u.type) && u.d >= dNow && !w.done[u.id] && !w.released.includes(u.id)).sort((a, b) => a.d - b.d || a.t.localeCompare(b.t));
  if (!open.length) return null;
  const left = leftOf(r);
  let sum = 0;
  let reach = null;
  for (const u of open) {
    const add = perUnit(r, u);
    if (add == null) break;
    sum += add;
    if (sum >= left) {
      reach = u;
      break;
    }
  }
  const pick = reach ?? open[0];
  return { unit: pick, day: shiftDay(monday, pick.d), reach, count: open.length };
}

/**
 * The pace of the last four weeks for a milestone that only grows → { perWeek, days, eta } or null (a streak, too
 * little history, no growth, or further away than 120 days). A guess from the past, nothing more.
 */
export function paceOf(r, ctx, today) {
  if (!GROWS.test(r.m.id)) return null;
  const s = r.m.series(ctx);
  const n = s.length;
  if (n < LEAST) return null;
  const k = Math.min(WINDOW, n - 1);
  for (let i = n - k; i < n; i++) if (s[i] < s[i - 1]) return null;
  const delta = s[n - 1] - s[n - 1 - k];
  const left = r.target - r.value;
  if (!(delta > 0) || !(left > 0)) return null;
  const perDay = delta / k;
  const days = Math.ceil(left / perDay);
  if (days > FAR) return null;
  return { perWeek: Math.round(perDay * 7 * 10) / 10, days, eta: addDays(today, days) };
}

/**
 * The whole card: { r, left, pct, plan, pace }. plan wins over pace (the plan is what you decided; the pace only
 * says what usually happens). Returns null when no star is open.
 */
export function heroOf({ list, ctx, acts = [], plan = null, weeklog = null, sessions = [], today }) {
  const r = nextStar(list);
  if (!r) return null;
  const act = r.m.actId ? acts.find((a) => a.id === r.m.actId) : null;
  const p = planFor(r, act, plan, weeklog, today, sessions);
  return { r, left: leftOf(r), pct: Math.round(r.progress * 100), plan: p, pace: p ? null : paceOf(r, ctx, today) };
}
