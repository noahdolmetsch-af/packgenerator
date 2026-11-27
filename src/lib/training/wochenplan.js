/**
 * «Variabler Wochenplan» (Noah 09.11.2026, Thread «Prüfen: Trainingsplan Woche packbar»), part 1: the planner.
 * Pure, no clock, no database, no texts. Goals per week (units with a count, hours per week, fixed days) go in,
 * a week with times comes out. Rules, not AI: the same input always gives the same week, and every placement
 * carries a reason as a code (`why`), so the page can always say «Warum hier?». The page (later parts) turns codes
 * into German through `t()`; nothing here is shown to a person directly.
 *
 * Setting WEEKPLAN_KEY (the goals; travels with the backup like every setting, no api/):
 *   { v: 1, winter: Config, summer: Config }, Config = { hours, counts: { [type]: n }, fixes: { [type]: [{ d, t }] }, wishes: { [type]: [{ d, t }] }, custom: { [type]: true }, tpHours? }
 * `fixes` stand on their day at their time (a fixed slot). `wishes` are places the person likes, in the order of liking: a free unit goes to the first wish
 * that is free and allowed, and the planner takes another place (and says so) when none is (Noah 26.11.2026 «Wunsch- und Fix-Plätze pro Sportart»).
 * `tpHours` (optional): the hours goal of a week that has TrainingPeaks or team dates in it; without it `hours` counts for every week.
 * `d` is the weekday 0 (Monday) … 6 (Sunday), `t` is «HH:MM». Which season counts follows the date (1 April to 30 October is summer).
 * What belongs to one week only (moved units, ticks, skiing week, rain week) is not stored here; it goes in as `ctx`.
 *
 * Unit ids are stable, so a tick or a moved unit stays with its unit when a goal changes: `tennis@1` (fixed day),
 * `bikeOut#2` (second free unit of that kind), `med@0` and `stretch@2` (meditation, stretching on a weekday).
 */
export const WEEKPLAN_KEY = 'training.weekplan';
export const MIN_HOURS = 6;
export const MAX_HOURS = 24;
export const SUMMER_FROM = '04-01'; // Noah 09.11.2026: summer is 1 April to 30 October
export const SUMMER_TO = '10-30';
export const DAY_MAX = 3; // «2 bis max 3 Einheiten pro Tag, Ziel 1–2»
const MEDSTRETCH = 140; // minutes per week for meditation and stretching (mean of the two weeks)

/** What a kind of unit is. mins = typical length, load H/M/L = hard/medium/easy, cand = good start times in order of liking. */
export const TYPES = {
  hockey: { mins: 90, load: 'H', kind: 'team', cand: ['08:00'] },
  tennis: { mins: 60, load: 'H', kind: 'endurance', cand: ['10:00', '15:00', '19:00'] },
  yoga: { mins: 60, load: 'L', kind: 'calm', cand: ['09:30', '07:00'] },
  gym: { mins: 50, load: 'M', kind: 'strength', cand: ['08:00', '14:00', '15:00', '16:00', '10:00'] },
  sauna: { mins: 25, load: 'L', kind: 'calm' },
  rest: { mins: 180, load: 'L', kind: 'calm' },
  bikeOut: { mins: 100, load: 'M', kind: 'endurance', cand: ['11:00', '10:30', '13:00', '14:30', '09:00'] },
  bikeIn: { mins: 50, load: 'L', kind: 'endurance', cand: ['14:00', '11:00', '16:00', '12:30', '09:30'] },
  runOut: { mins: 45, load: 'M', kind: 'endurance', cand: ['14:30', '12:30', '11:00', '17:30', '09:30'] },
  runIn: { mins: 25, load: 'M', kind: 'endurance', cand: ['12:00', '16:30', '10:00'] },
  mini: { mins: 15, load: 'L', kind: 'strength', cand: ['17:30', '12:00', '09:00', '19:00'] },
  ski: { mins: 540, load: 'H', kind: 'team' },
  med: { mins: 30, load: 'L', kind: 'calm' },
  stretch: { mins: 10, load: 'L', kind: 'calm' },
};
/** The goals a person sets, in the order they are planned and shown. */
export const GOAL_TYPES = ['hockey', 'tennis', 'yoga', 'gym', 'sauna', 'rest', 'bikeOut', 'bikeIn', 'runOut', 'runIn', 'mini'];
/** Goals that can get fixed days. */
export const FIXABLE = ['hockey', 'tennis', 'yoga', 'gym', 'bikeOut', 'bikeIn', 'runOut', 'rest'];
export const MAX_COUNT = { hockey: 2, tennis: 5, yoga: 3, gym: 4, sauna: 3, rest: 2, bikeOut: 6, bikeIn: 3, runOut: 3, runIn: 3, mini: 4 };
const SKI_DROPS = ['bikeOut', 'bikeIn', 'runOut', 'runIn', 'mini']; // a skiing week is a light week: the tour replaces these
const BARE = ['med', 'stretch']; // do not count as units of the day
const NOT_UNIT = ['rest', 'sauna', 'med', 'stretch']; // do not count towards the 3 units of a day
const LV = { L: 1, M: 2, H: 3 };

const toM = (s) => {
  const [h, m] = s.split(':');
  return Number(h) * 60 + Number(m);
};
const toT = (n) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
const timeOk = (t) => typeof t === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(t);

/** True when the day (YYYY-MM-DD) is in the summer window. */
export const isSummer = (day) => {
  const md = String(day).slice(5, 10);
  return md >= SUMMER_FROM && md <= SUMMER_TO;
};

/** The usual time of a fixed day: the start time that fits the kind of unit and the weekday. */
export function defTime(type, d, summer) {
  if (type === 'tennis') return { 1: '10:00', 3: summer ? '19:00' : '15:00', 5: '10:00', 6: '10:00' }[d] || '10:00';
  if (type === 'yoga') return { 0: '09:30', 3: '07:00', 4: '09:30' }[d] || '09:30';
  if (type === 'hockey') return '08:00';
  if (type === 'gym') return d === 2 ? '15:00' : '08:00';
  return (TYPES[type].cand || ['10:00'])[0];
}

const fx = (type, days, summer) => days.map((d) => ({ d, t: defTime(type, d, summer) }));

/** The start settings of a season (what the musterweek of Noah says). */
export function defaultsFor(summer) {
  return summer
    ? {
        hours: 19,
        counts: { hockey: 0, tennis: 3, yoga: 2, gym: 2, sauna: 1, rest: 1, bikeOut: 4, bikeIn: 0, runOut: 2, runIn: 0, mini: 0 },
        fixes: { tennis: fx('tennis', [1, 3, 6], true), yoga: fx('yoga', [0, 3], true), gym: fx('gym', [2], true) },
        wishes: {},
        custom: {},
        bikeHours: 8,
      }
    : {
        hours: 15,
        counts: { hockey: 1, tennis: 3, yoga: 2, gym: 2, sauna: 1, rest: 1, bikeOut: 1, bikeIn: 1, runOut: 1, runIn: 1, mini: 1 },
        fixes: { hockey: fx('hockey', [6], false), tennis: fx('tennis', [1, 3, 5], false), yoga: fx('yoga', [0, 3], false), gym: fx('gym', [2], false) },
        wishes: {},
        custom: {},
        bikeHours: null,
      };
}

const whole = (v, lo, hi) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : null;
};

/** One season of the stored setting made safe; missing or broken parts come from the defaults. */
export function configOf(raw, summer) {
  const base = defaultsFor(summer);
  if (!raw || typeof raw !== 'object') return base;
  const hours = whole(raw.hours, MIN_HOURS, MAX_HOURS) ?? base.hours;
  const counts = {};
  for (const t of GOAL_TYPES) counts[t] = whole(raw.counts?.[t], 0, MAX_COUNT[t]) ?? base.counts[t];
  const custom = {};
  const fixes = {};
  for (const t of FIXABLE) {
    custom[t] = !!raw.custom?.[t];
    const src = custom[t] || raw.fixes?.[t] ? raw.fixes?.[t] : base.fixes[t];
    const seen = new Set();
    const list = [];
    for (const f of Array.isArray(src) ? src : []) {
      const d = whole(f?.d, 0, 6);
      if (d === null || seen.has(d)) continue;
      seen.add(d);
      list.push({ d, t: timeOk(f?.t) ? f.t : defTime(t, d, summer) });
    }
    list.sort((a, b) => a.d - b.d);
    if (list.length) fixes[t] = list.slice(0, counts[t]);
  }
  Object.keys(custom).forEach((t) => !custom[t] && delete custom[t]);
  const wishes = {};
  for (const t of FIXABLE) {
    const seen = new Set((fixes[t] || []).map((f) => f.d)); // a day holds a fixed slot or a wish of one kind of unit, not both
    const list = [];
    for (const f of Array.isArray(raw.wishes?.[t]) ? raw.wishes[t] : []) {
      const d = whole(f?.d, 0, 6);
      if (d === null || seen.has(d)) continue;
      seen.add(d);
      list.push({ d, t: timeOk(f?.t) ? f.t : defTime(t, d, summer) });
    }
    if (list.length) wishes[t] = list; // the order is the order of liking: not sorted
  }
  const bikeHours = counts.bikeOut && Number.isFinite(Number(raw.bikeHours)) && raw.bikeHours > 0 ? Math.min(40, Number(raw.bikeHours)) : summer && counts.bikeOut ? base.bikeHours : null;
  const tpHours = raw.tpHours == null ? null : whole(raw.tpHours, MIN_HOURS, MAX_HOURS); // optional: its own goal for weeks with TrainingPeaks or team dates (Noah 23.11.2026 «2b»)
  return { hours, counts, fixes, wishes, custom, bikeHours, ...(tpHours ? { tpHours } : {}) };
}

/** The stored setting made safe: { v, winter, summer }. Always a full value, also for nothing at all. */
export const planOf = (raw) => ({ v: 1, winter: configOf(raw?.winter, false), summer: configOf(raw?.summer, true) });

/**
 * ONE hours goal for a week (Noah 26.11.2026 «ja» to «ein Wochenziel statt zwei»): the hours of the weekly plan when one is saved (that is
 * the plan the person sees and ticks off), else the hours of the training goal («Dein Trainingsziel») while its day has not passed.
 * An old goal stays stored and untouched, it just stops counting after its day. null = no hours goal at all.
 * `goal` is the stored training goal (or null), `weekplan` the stored setting (or null = no weekly plan yet), `day` a day of the week.
 */
export function weekHours({ goal = null, weekplan = null } = {}, day) {
  if (weekplan != null) {
    const p = planOf(weekplan);
    const h = (isSummer(day) ? p.summer : p.winter).hours;
    if (h > 0) return h;
  }
  const g = Number(goal?.hours);
  const until = typeof goal?.until === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(goal.until) ? goal.until : null;
  if (g >= 0.5 && g <= 40 && !(until && day && until < day)) return g;
  return null;
}

// ---- hours → units -------------------------------------------------------------------------------------------------

const WINTER_LADDER = ['hockey', 'tennis', 'yoga', 'gym', 'yoga', 'sauna', 'bikeOut', 'tennis', 'gym', 'runOut', 'bikeIn', 'tennis', 'runIn', 'mini', 'bikeOut', 'runOut', 'bikeIn', 'bikeOut', 'runIn', 'mini'];
const WINTER_CAP = { hockey: 1, tennis: 3, yoga: 2, gym: 2, sauna: 1, bikeOut: 3, bikeIn: 2, runOut: 2, runIn: 2, mini: 1 };
const SUMMER_LADDER = ['tennis', 'yoga', 'gym', 'sauna', 'tennis', 'runOut', 'yoga', 'gym', 'tennis', 'runOut'];
const SUMMER_CAP = { tennis: 3, yoga: 2, gym: 2, sauna: 1, runOut: 2 };
const ZERO = { hockey: 0, tennis: 0, yoga: 0, gym: 0, sauna: 0, rest: 1, bikeOut: 0, bikeIn: 0, runOut: 0, runIn: 0, mini: 0 };

/** Minutes a set of counts adds up to (the Ruheblock does not count: it is rest). */
export const countsMins = (c) => GOAL_TYPES.reduce((a, t) => a + (t === 'rest' ? 0 : (c[t] || 0) * TYPES[t].mins), 0);

/**
 * The units that fit an hours goal: { counts, bikeHours }. Winter fills a ladder of units (the ones that matter most
 * first); summer keeps the fixed things and lets cycling outdoors fill what is left. Above about 20 hours the ladder is
 * full: the answer is then the most that still fits, never more.
 */
export function suggestFromHours(hours, summer) {
  const target = whole(hours, MIN_HOURS, MAX_HOURS) * 60 - MEDSTRETCH;
  const c = { ...ZERO };
  if (summer) {
    for (const t of SUMMER_LADDER) if (c[t] < SUMMER_CAP[t] && countsMins(c) + TYPES[t].mins <= target) c[t]++;
    const left = Math.max(0, target - countsMins(c));
    c.bikeOut = left < 60 ? 0 : Math.min(5, Math.max(1, Math.round(left / 120)));
    return { counts: c, bikeHours: c.bikeOut ? Math.round(left / 30) / 2 : null };
  }
  for (const t of WINTER_LADDER) if (c[t] < WINTER_CAP[t] && countsMins(c) + TYPES[t].mins <= target + TYPES[t].mins * 0.35) c[t]++;
  return { counts: c, bikeHours: null };
}

// ---- changes of a season config (pure: each returns a new config) --------------------------------------------------

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Sets the hours goal and takes over the units that fit. Fixed days the person set stay (cut to the new count). */
export function setHours(cfg, hours, summer) {
  const h = whole(hours, MIN_HOURS, MAX_HOURS);
  const r = suggestFromHours(h, summer);
  const def = defaultsFor(summer);
  const fixes = {};
  for (const t of FIXABLE) {
    const list = cfg.custom?.[t] ? cfg.fixes?.[t] || [] : def.fixes[t] || [];
    if (list.length && r.counts[t]) fixes[t] = list.slice(0, r.counts[t]);
  }
  return { ...cfg, hours: h, counts: r.counts, bikeHours: r.bikeHours, fixes };
}

/** A lighter week (part 5): this share of the hours goal, for one week; fixed days the person set stay. */
export const LIGHT_SHARE = 0.6;
export const lightOf = (cfg, summer) => setHours(cfg, Math.max(MIN_HOURS, Math.round(cfg.hours * LIGHT_SHARE)), summer);

/** A harder week (V4b2, Noah 22.11.2026 «1a»): this share of the hours goal, for one week; the goals themselves stay. */
export const HARD_SHARE = 1.2;
export const hardOf = (cfg, summer) => setHours(cfg, Math.min(MAX_HOURS, Math.round(cfg.hours * HARD_SHARE)), summer);

/** The hours goal of a week for its modes: harder, lighter or as it is (hard and light never both). */
export const modeCfg = (cfg, summer, mode = {}) => {
  const out = mode.hard ? hardOf(cfg, summer) : mode.light ? lightOf(cfg, summer) : cfg;
  if (out === cfg || !cfg.tpHours) return out;
  const share = mode.hard ? HARD_SHARE : LIGHT_SHARE; // the goal for weeks with TrainingPeaks follows the kind of week
  return { ...out, tpHours: Math.min(MAX_HOURS, Math.max(MIN_HOURS, Math.round(cfg.tpHours * share))) };
};

/**
 * The focus of a week (Noah 23.11.2026 «3a»): «Intervals» (`hit`) or «Strength» (`kraft`), one kind of week next to lighter and harder, never both.
 * It changes which units the week holds, not the hours: the planner swaps small units for the ones the focus needs and says so in a note.
 */
export const FOCUS_MODES = ['hit', 'kraft'];
export const focusOf = (mode = {}) => FOCUS_MODES.find((k) => mode?.[k]) || null;
const HIT_BIKES = 2; // intervals: two bike units are the hard ones
const KRAFT_GYMS = 3; // strength: three gym sessions
const SWAP_OUT = ['runIn', 'mini', 'bikeIn', 'runOut']; // what makes room for a focus unit first (the smallest and least important)

/** True when the units are exactly what the hours goal suggests (no change by hand since). */
export const followsHours = (cfg, summer) => same(suggestFromHours(cfg.hours, summer).counts, cfg.counts);

/** One more or less of a unit. Fixed days beyond the count are dropped; summer cycling hours follow the count. */
export function stepCount(cfg, type, delta, summer) {
  if (!GOAL_TYPES.includes(type)) return cfg;
  const n = Math.max(0, Math.min(MAX_COUNT[type], (cfg.counts[type] || 0) + delta));
  const counts = { ...cfg.counts, [type]: n };
  const fixes = { ...cfg.fixes };
  if (fixes[type]) fixes[type] = fixes[type].slice(0, n);
  const bikeHours = type === 'bikeOut' && summer ? (n ? Math.round(n * 1.9 * 2) / 2 : null) : cfg.bikeHours;
  return { ...cfg, counts, fixes, bikeHours };
}

/** Makes a weekday a fixed day of a goal, or takes it away again. A fixed day beyond the count raises the count. */
export function toggleFix(cfg, type, d, summer) {
  if (!FIXABLE.includes(type)) return cfg;
  const list = (cfg.fixes[type] || []).slice();
  const i = list.findIndex((f) => f.d === d);
  if (i >= 0) list.splice(i, 1);
  else list.push({ d, t: defTime(type, d, summer) });
  list.sort((a, b) => a.d - b.d);
  const counts = { ...cfg.counts, [type]: Math.max(cfg.counts[type] || 0, Math.min(MAX_COUNT[type], list.length)) };
  return { ...cfg, counts, fixes: { ...cfg.fixes, [type]: list.slice(0, counts[type]) }, custom: { ...cfg.custom, [type]: true } };
}

/** Changes the start time of a fixed day (the wish time). Only an existing fixed day with a valid time changes. */
export function setFixTime(cfg, type, d, t) {
  const list = cfg.fixes[type];
  if (!FIXABLE.includes(type) || !list || !timeOk(t) || !list.some((f) => f.d === d)) return cfg;
  return { ...cfg, fixes: { ...cfg.fixes, [type]: list.map((f) => (f.d === d ? { d: f.d, t } : f)) }, custom: { ...cfg.custom, [type]: true } };
}

// ---- slots of the standard week (Noah 26.11.2026): per kind of unit fixed slots and wishes --------------------------------

/** The slots of one kind of unit: the fixed ones by weekday, then the wishes in the order of liking. [{ d, t, kind: 'fix' | 'wish' }] */
export const slotsOf = (cfg, type) => [...(cfg.fixes?.[type] || []).map((f) => ({ d: f.d, t: f.t, kind: 'fix' })), ...(cfg.wishes?.[type] || []).map((f) => ({ d: f.d, t: f.t, kind: 'wish' }))];

/** Which slot (of one kind of unit) sits on a weekday: { d, t, kind } or null. */
export const slotOn = (cfg, type, d) => slotsOf(cfg, type).find((x) => x.d === d) || null;

/** Takes the slot on a weekday away (a fixed slot or a wish). Fixed days then count as set by hand. */
export function removeSlot(cfg, type, d) {
  if (!FIXABLE.includes(type) || !slotOn(cfg, type, d)) return cfg;
  const fixes = { ...cfg.fixes, [type]: (cfg.fixes[type] || []).filter((f) => f.d !== d) };
  const wishes = { ...(cfg.wishes || {}), [type]: (cfg.wishes?.[type] || []).filter((f) => f.d !== d) };
  if (!fixes[type].length) delete fixes[type];
  if (!wishes[type].length) delete wishes[type];
  return { ...cfg, fixes, wishes, custom: { ...cfg.custom, [type]: true } };
}

/**
 * Puts a slot on a weekday: a fixed slot (the unit stands on that day at that time) or a wish (a free unit prefers it, in the order the wishes
 * were made). The weekday holds one slot of a kind of unit; an older one there is replaced. A fixed slot beyond the count raises the count; a wish
 * makes sure the count holds one free unit that can use it. Times that are not «HH:MM» come from the usual time (defTime).
 */
export function setSlot(cfg, type, d, t, kind, summer) {
  if (!FIXABLE.includes(type) || !(d >= 0 && d <= 6) || !Number.isInteger(d) || (kind !== 'fix' && kind !== 'wish')) return cfg;
  const time = timeOk(t) ? t : defTime(type, d, summer);
  const old = slotOn(cfg, type, d);
  let next = old ? removeSlot(cfg, type, d) : cfg;
  const fixes = { ...next.fixes };
  const wishes = { ...(next.wishes || {}) };
  if (kind === 'fix') fixes[type] = [...(fixes[type] || []), { d, t: time }].sort((a, b) => a.d - b.d);
  else {
    const list = (wishes[type] || []).slice();
    const at = old?.kind === 'wish' ? Math.min(list.length, (cfg.wishes?.[type] || []).findIndex((f) => f.d === d)) : list.length; // a wish keeps its place in the order of liking when only its time changes
    list.splice(at, 0, { d, t: time });
    wishes[type] = list.slice(0, 7);
  }
  const need = (fixes[type] || []).length + (wishes[type]?.length ? 1 : 0);
  const counts = { ...next.counts, [type]: Math.max(next.counts[type] || 0, Math.min(MAX_COUNT[type], need)) };
  if (fixes[type]) fixes[type] = fixes[type].slice(0, counts[type]);
  return { ...next, counts, fixes, wishes, custom: { ...next.custom, [type]: true } };
}

/** Moves a slot to another weekday (same kind, same time unless a new time is given). Nothing changes when that day already holds a slot of the kind of unit. */
export function moveSlot(cfg, type, from, to, t, summer) {
  const s = slotOn(cfg, type, from);
  if (!s || from === to || slotOn(cfg, type, to)) return cfg;
  const moved = setSlot(removeSlot(cfg, type, from), type, to, t || s.t, s.kind, summer);
  return moved;
}

// ---- the week ------------------------------------------------------------------------------------------------------

/** Meditation every second day, continuing across weeks: the days of the week (0 = Monday) that carry it. */
export function medDays(monday) {
  const [y, m, d] = monday.split('-').map(Number);
  const dayNo = Math.round(Date.UTC(y, m - 1, d) / 864e5);
  return dayNo % 2 === 0 ? [0, 2, 4, 6] : [1, 3, 5];
}

// ---- TrainingPeaks in the week (Noah 22.11.2026 «1a 2a 3a 4a») -------------------------------------------------------

/** The sessions that come from TrainingPeaks carry this `src` (lib/trainingpeaks.js). */
export const TP_SRC = 'tp';
export const PLAN_SRC = 'tpl:'; // the sessions of a training plan in use (plans.js: `tpl:<planId>`)
const STRENGTH = /kraft|strength|gym|weights?\b/i;
const INDOOR = /indoor|drinnen|trainer|zwift|rolle|treadmill|laufband/i;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const UNTIMED = 600; // a session without a start time is assumed at 10:00 (only for «does a half day stay free», never shown)

/**
 * Which unit of the plan a TrainingPeaks session replaces (Noah «2a»: the same sport): bike → «Bike outdoors» (with
 * «indoor» in the title: «Bike indoors»), run → «Run outdoors / Treadmill», strength → «Gym». Hikes and everything else
 * replace nothing; they only count towards the hours. The title decides, there is no new field.
 */
export function tpTypeOf(s) {
  const name = String(s?.name ?? '');
  if (s?.kind === 'bike') return INDOOR.test(name) ? 'bikeIn' : 'bikeOut';
  if (s?.kind === 'run') return INDOOR.test(name) ? 'runIn' : 'runOut';
  if (STRENGTH.test(name)) return 'gym';
  return null;
}
/** Hard from the zone (Noah «3a»): zone 4 or 5 hard, zone 3 medium, 1 and 2 easy, no zone medium. */
export const tpLoad = (zone) => (zone >= 4 ? 'H' : zone === 3 || !zone ? 'M' : 'L');

/**
 * The TrainingPeaks sessions of one week, as the planner needs them: [{ id, d (0 Monday), mins, t ('HH:MM' or ''), load, type, name, kind }].
 * sessions: the sessions of `training.plan` (any source; only src 'tp' and the training plans 'tpl:…' count here). Pure.
 */
export function tpWeek(sessions, monday) {
  const m0 = Date.parse(`${monday}T12:00:00Z`);
  const out = [];
  for (const s of Array.isArray(sessions) ? sessions : []) {
    const mine = String(s?.src ?? '').startsWith(PLAN_SRC); // a training plan in use («Trainingspläne», src 'tpl:<id>') stands fixed like TrainingPeaks (Noah 23.11.2026 «5a»)
    if ((s?.src !== TP_SRC && !mine) || !DAY_RE.test(s.day ?? '') || !(s.mins > 0)) continue;
    const d = Math.round((Date.parse(`${s.day}T12:00:00Z`) - m0) / 864e5);
    if (d < 0 || d > 6) continue;
    out.push({ id: `tp:${s.id}`, d, mins: Math.round(s.mins), t: timeOk(s.time) ? s.time : '', load: tpLoad(s.zone), type: tpTypeOf(s), name: String(s.name ?? ''), kind: s.kind, ...(mine ? { plan: true } : {}) });
  }
  return out.sort((a, b) => a.d - b.d || a.t.localeCompare(b.t) || a.id.localeCompare(b.id));
}

/** The weekdays (0 = Monday) of a week that TrainingPeaks keeps free («Recovery Day»): entries `{ rest: true, day }` of the sessions list. */
export function restWeek(sessions, monday) {
  const m0 = Date.parse(`${monday}T12:00:00Z`);
  const out = new Set();
  for (const s of Array.isArray(sessions) ? sessions : []) {
    if (s?.rest !== true || !DAY_RE.test(s.day ?? '')) continue;
    const d = Math.round((Date.parse(`${s.day}T12:00:00Z`) - m0) / 864e5);
    if (d >= 0 && d <= 6) out.add(d);
  }
  return [...out].sort((a, b) => a - b);
}

// ---- the team dates of Spielerplus (Noah 23.11.2026 «1a», thread «Wochenplan-Vorschläge verlässlich machen») ---------

/**
 * The ice hockey of a week comes from the team calendar when one is connected (lib/spielerplus.js teamSessions puts
 * `{ team: 'on' }` and `{ team: 'date', day, time, mins, id, name }` into the sessions list). Then every date of the week
 * is an ice hockey session, fixed on its day (training and game alike), and the plan puts no ice hockey of its own: a
 * week without a date has none. Without a connected calendar the plan keeps its own unit. → { on, dates: [{ id, d, mins, t, name }] }.
 */
export function teamWeek(sessions, monday) {
  const list = Array.isArray(sessions) ? sessions : [];
  const on = list.some((s) => s?.team === 'on');
  if (!on) return { on: false, dates: [] };
  const m0 = Date.parse(`${monday}T12:00:00Z`);
  const dates = [];
  for (const s of list) {
    if (s?.team !== 'date' || !DAY_RE.test(s.day ?? '')) continue;
    const d = Math.round((Date.parse(`${s.day}T12:00:00Z`) - m0) / 864e5);
    if (d < 0 || d > 6) continue;
    dates.push({ id: `team:${s.id}`, d, mins: s.mins > 0 ? Math.round(s.mins) : TYPES.hockey.mins, t: timeOk(s.time) ? s.time : '', name: String(s.name ?? '') });
  }
  return { on, dates: dates.sort((a, b) => a.d - b.d || a.t.localeCompare(b.t) || a.id.localeCompare(b.id)) };
}

/**
 * The goal counts after TrainingPeaks took its share (Noah «1a»: the hours stay, the plan plans the rest). A unit falls
 * away when the minutes TrainingPeaks has left cover at least half of it; the minutes of a sport first cover its own
 * kind (indoors → indoors), what is left covers the other kind. Never below nothing: what TrainingPeaks has too much
 * takes nothing from another sport. → { counts, bikeHours, notes }.
 */
function replaceByTp(cfg, counts, tp) {
  const out = { ...counts };
  const notes = [];
  let bikeHours = cfg.bikeHours;
  const FAMILIES = [['bikeIn', 'bikeOut'], ['runIn', 'runOut'], ['gym']];
  for (const fam of FAMILIES) {
    const pool = Object.fromEntries(fam.map((t) => [t, tp.filter((x) => x.type === t).reduce((a, x) => a + x.mins, 0)]));
    if (!fam.some((t) => pool[t] > 0)) continue;
    const orig = { ...Object.fromEntries(fam.map((t) => [t, out[t] || 0])) };
    const unitMins = (t) => (t === 'bikeOut' && bikeHours && out.bikeOut ? Math.round((bikeHours * 60) / out.bikeOut) : TYPES[t].mins);
    const take = (t, r) => {
      let rest = r;
      while ((out[t] || 0) > 0 && rest >= unitMins(t) / 2) {
        rest = Math.max(0, rest - unitMins(t));
        out[t]--;
      }
      return rest;
    };
    const left = {};
    const um = Object.fromEntries(fam.map((t) => [t, unitMins(t)]));
    for (const t of fam) left[t] = take(t, pool[t]);
    const spare = fam.reduce((a, t) => a + left[t], 0);
    let rest = spare;
    for (const t of [...fam].reverse()) rest = take(t, rest);
    for (const t of fam) {
      const n = orig[t] - (out[t] || 0);
      if (n > 0) notes.push({ key: 'tp-replaces', type: t, n, mins: n * um[t] });
    }
  }
  if (bikeHours && out.bikeOut !== counts.bikeOut) bikeHours = out.bikeOut ? Math.round((bikeHours * out.bikeOut * 2) / counts.bikeOut) / 2 : null;
  return { counts: out, bikeHours, notes };
}

// ---- the hours goal with TrainingPeaks and team dates (Noah 23.11.2026 «2a und b») --------------------------------------

/** What goes first when a week with TrainingPeaks or team dates is above the hours goal. Tennis, yoga, ice hockey, the first gym, the sauna and the rest block stay. */
const CUT_ORDER = [['mini', 0], ['runIn', 0], ['gym', 1], ['runOut', 0], ['bikeIn', 0], ['bikeOut', 0]];

/**
 * The goal counts after the hours goal was kept (2a): the hours of the week (`budget` minutes for the units, after meditation, stretching,
 * TrainingPeaks and team dates) are the limit; the units that matter least go first (CUT_ORDER), one at a time, as long as more than
 * half of the unit is over. Never below the floor. → { counts, bikeHours, notes: [{ key: 'soll-cut', type, n, mins }], over }.
 */
export function fitToHours(cfg, counts, bikeHours, budget) {
  const out = { ...counts };
  const unitMins = (t) => (t === 'bikeOut' && bikeHours && out.bikeOut ? Math.round((bikeHours * 60) / out.bikeOut) : TYPES[t].mins);
  const own = () => GOAL_TYPES.reduce((a, t) => a + (t === 'rest' ? 0 : (out[t] || 0) * unitMins(t)), 0);
  const notes = [];
  for (const [type, floor] of CUT_ORDER) {
    let n = 0;
    let mins = 0;
    while ((out[type] || 0) > floor && own() - budget > unitMins(type) / 2) {
      mins += unitMins(type);
      out[type]--;
      n++;
    }
    if (n) notes.push({ key: 'soll-cut', type, n, mins });
  }
  const left = own() - budget;
  const bh = bikeHours && out.bikeOut !== counts.bikeOut ? (out.bikeOut ? Math.round((bikeHours * out.bikeOut * 2) / counts.bikeOut) / 2 : null) : bikeHours;
  return { counts: out, bikeHours: bh, notes, over: Math.max(0, Math.round(left)) };
}

/**
 * Plans one week.
 *   cfg: a season config (configOf); ctx: { monday, ski, rain, pins: { [unitId]: { d, t } }, sessions }. sessions (optional): the sessions of `training.plan` (and `{ rest: true, day }` for a Recovery Day, see plannerSessions);
 *   the ones from TrainingPeaks stand fixed on their day, take their share of the hours (replaceByTp) and are checked like every unit.
 * Returns { units, dayLoad, notes, warnings, freeHalves, perDay }:
 *   units: [{ id, type, d, t, start, end, mins, load, fixed, pinned, variant, why }] sorted by day and time
 *   dayLoad: 'H' | 'M' | 'L' per weekday; perDay: units per weekday (meditation, stretching, sauna and rest not counted)
 *   notes: [{ key, … }] what the planner changed on its own; warnings: [{ key, … , fix? }] what does not fit;
 *   tp: [{ id, d, mins, t, load, type, name }] the TrainingPeaks sessions of the week (not part of `units`: they are sessions, shown as such)
 *   team: [{ id, d, mins, t, name }] the team dates of the week (Spielerplus, ice hockey; not part of `units` either: the dates are shown as dates)
 */
export function planWeek(cfg, ctx) {
  const summer = isSummer(ctx.monday);
  const pins = ctx.pins || {};
  const carried = new Set(Array.isArray(ctx.carried) ? ctx.carried : []); // ids whose move comes from an earlier week (not made in this one)
  let counts = { ...cfg.counts };
  let bikeHours = cfg.bikeHours;
  const U = [];
  const notes = [];
  const tp = tpWeek(ctx.sessions, ctx.monday);
  const restDays = restWeek(ctx.sessions, ctx.monday); // Recovery Day: no free unit on it (what stands fixed stays)
  for (const d of restDays) notes.push({ key: 'tp-rest', d });
  if (tp.length) {
    const r = replaceByTp(cfg, counts, tp);
    counts = r.counts;
    bikeHours = r.bikeHours;
    const all = tp.reduce((a, x) => a + x.mins, 0);
    const sum = (list) => list.reduce((a, x) => a + x.mins, 0);
    const feed = tp.filter((x) => !x.plan);
    const planned = tp.filter((x) => x.plan);
    if (feed.length) notes.push({ key: 'tp-in', n: feed.length, mins: sum(feed), hours: Math.round(sum(feed) / 6) / 10 });
    if (planned.length) notes.push({ key: 'tpl-in', n: planned.length, mins: sum(planned), hours: Math.round(sum(planned) / 6) / 10 });
    notes.push(...r.notes.map((n) => (!feed.length && n.key === 'tp-replaces' ? { ...n, key: 'tpl-replaces' } : n)));
    if (all > cfg.hours * 60) notes.push({ key: feed.length ? 'tp-over' : 'tpl-over', hours: cfg.hours, mins: all });
    // TrainingPeaks stands fixed: it goes in first, the rest plans around it
    for (const x of tp) {
      const start = x.t ? toM(x.t) : UNTIMED;
      U.push({ id: x.id, type: 'tp', d: x.d, t: x.t || toT(UNTIMED), start, end: start + x.mins, mins: x.mins, load: x.load, fixed: true, pinned: false, variant: null, tp: true, assumed: !x.t });
    }
  }
  // the team dates stand fixed like TrainingPeaks and replace the plan's own ice hockey (Noah «1a»)
  const team = teamWeek(ctx.sessions, ctx.monday);
  if (team.on) {
    counts.hockey = 0;
    notes.push(team.dates.length ? { key: 'team-in', n: team.dates.length } : { key: 'team-none' });
    for (const x of team.dates) {
      const start = x.t ? toM(x.t) : UNTIMED;
      U.push({ id: x.id, type: 'team', d: x.d, t: x.t || toT(UNTIMED), start, end: start + x.mins, mins: x.mins, load: TYPES.hockey.load, fixed: true, pinned: false, variant: null, team: true, assumed: !x.t, name: x.name });
    }
  }
  const ski = !!ctx.ski;
  const hf = team.on ? (team.dates[0] ? { d: team.dates.find((x) => x.d === 5)?.d ?? team.dates[0].d } : null) : (cfg.fixes.hockey || [])[0];
  const skiDay = ski ? (hf && hf.d === 5 ? 6 : 5) : -1; // Saturday, or Sunday when the ice hockey is on Saturday
  if (ski)
    for (const t of SKI_DROPS) {
      if (counts[t]) notes.push({ key: 'ski-drops', type: t });
      counts[t] = 0;
    }
  // the hours goal holds with TrainingPeaks and team dates in the week (Noah «2a»); `tpHours` is its own goal for such weeks («2b»). Not in a ski tour week: the tour is the plan.
  const outside = tp.reduce((a, x) => a + x.mins, 0) + team.dates.reduce((a, x) => a + x.mins, 0);
  if (outside > 0 && !ski) {
    const goalH = cfg.tpHours || cfg.hours;
    const r = fitToHours(cfg, counts, bikeHours, goalH * 60 - MEDSTRETCH - outside);
    counts = r.counts;
    bikeHours = r.bikeHours;
    notes.push(...r.notes.map((n) => ({ ...n, hours: goalH })));
    if (r.over > 0) notes.push({ key: 'soll-over', hours: goalH, mins: r.over, own: !!cfg.tpHours });
  }
  // the focus of the week (Noah «3a»): not in a ski tour week, the tour is the plan. It comes after the hours goal was kept: the hours stay,
  // small units make room for what the focus needs (only when enough room is freed; otherwise nothing is added and nothing is taken away).
  const focus = !ski && FOCUS_MODES.includes(ctx.focus) ? ctx.focus : null;
  const tpBikes = tp.filter((x) => x.type === 'bikeOut' || x.type === 'bikeIn').length; // bike sessions that TrainingPeaks or a training plan brings
  if (focus) {
    const room = (need, keep) => {
      const take = {};
      let freed = 0;
      for (const t of SWAP_OUT.filter((x) => x !== keep)) {
        let n = 0;
        while (freed < need - TYPES[t].mins / 2 && (counts[t] || 0) - n > (cfg.fixes[t]?.length ?? 0) && n < 2) {
          freed += TYPES[t].mins;
          n++;
        }
        if (n) take[t] = n;
      }
      return freed >= need - 25 ? take : null; // not enough room: no swap
    };
    const swap = (take) =>
      Object.entries(take).forEach(([t, n]) => {
        counts[t] -= n;
        notes.push({ key: 'focus-swap', type: t, n, mins: n * TYPES[t].mins });
      });
    if (focus === 'hit') {
      let more = Math.min(Math.max(0, HIT_BIKES - tpBikes) - (counts.bikeOut + counts.bikeIn), MAX_COUNT.bikeIn - counts.bikeIn);
      while (more-- > 0) {
        const take = room(TYPES.bikeIn.mins, 'bikeIn');
        if (!take) break;
        counts.bikeIn++;
        swap(take);
      }
    } else {
      while (counts.gym < Math.min(KRAFT_GYMS, MAX_COUNT.gym)) {
        const take = room(TYPES.gym.mins, 'gym');
        if (!take) break;
        counts.gym++;
        swap(take);
      }
    }
  }
  const units = (d) => U.filter((x) => x.d === d && !NOT_UNIT.includes(x.type)).length;
  const loadSum = (d) => U.filter((x) => x.d === d && !BARE.includes(x.type)).reduce((a, x) => a + LV[x.load], 0);
  const hardDays = () => new Set(U.filter((x) => x.load === 'H').map((x) => x.d));
  const clash = (d, t, m) => {
    const a = toM(t);
    const b = a + m;
    return U.some((x) => x.d === d && !x.assumed && a < x.end + 5 && b + 5 > x.start) || b > 22 * 60;
  };
  const seq = {};
  const nid = (type) => `${type}#${(seq[type] = (seq[type] || 0) + 1)}`;
  function put(type, d, t, o = {}) {
    const id = o.id || nid(type);
    const pin = o.noPin ? null : pins[id];
    const day = pin ? pin.d : d;
    const time = pin ? pin.t : t;
    const mins = o.mins || TYPES[type].mins;
    const like = !!pin && carried.has(id);
    const x = { id, type, d: day, t: time, start: toM(time), end: toM(time) + mins, mins, load: o.load || TYPES[type].load, fixed: !!o.fixed, pinned: !!pin, carried: like, variant: o.variant || null, why: like ? { key: 'carried' } : pin ? { key: 'pinned' } : o.why || { key: 'best' } };
    U.push(x);
    return x;
  }
  const freeHalves = () => {
    let n = 0;
    for (let d = 0; d < 7; d++) for (const [a, b] of [[480, 780], [780, 1080]]) if (!U.some((x) => x.d === d && !BARE.includes(x.type) && x.start < b && x.end > a)) n++;
    return n;
  };
  function score(d, type, load) {
    let sc = 3 * units(d) + loadSum(d);
    const H = hardDays();
    const nb = (H.has(d - 1) ? 1 : 0) + (H.has(d + 1) ? 1 : 0);
    if (load === 'H') {
      sc += 4 * nb;
      const hs = new Set(H);
      hs.add(d);
      let run = 0;
      let mx = 0;
      for (let i = 0; i < 7; i++) {
        run = hs.has(i) ? run + 1 : 0;
        mx = Math.max(mx, run);
      }
      if (mx >= 3) sc += 15;
    } else if (load === 'M') sc += 1.5 * nb;
    if (U.some((x) => x.d === d && x.type === type)) sc += 8;
    const out = ['bikeOut', 'runOut'];
    if (out.includes(type) && U.some((x) => x.d === d && out.includes(x.type) && x.type !== type)) sc += 6;
    return sc;
  }
  const banned = (d) => d === skiDay || (ski && d === skiDay - 1) || restDays.includes(d); // no unit on the tour day and the day before, none on a free day of TrainingPeaks
  const noRoom = (type) => notes.push({ key: 'no-room', type });

  // 1 the tour
  if (ski) put('ski', skiDay, skiDay === 5 ? '07:00' : '06:30', { fixed: true, why: { key: 'ski', sunday: skiDay === 6 } });

  // 2 fixed days
  const have = {};
  for (const type of FIXABLE) {
    const n = counts[type] || 0;
    for (const f of (cfg.fixes[type] || []).slice(0, n)) {
      if (ski && f.d === skiDay) {
        notes.push({ key: 'ski-day-taken', type, d: f.d });
        continue;
      }
      const o = { id: `${type}@${f.d}`, fixed: true, why: { key: 'fixed' } };
      if (type === 'tennis' && ski && f.d === 3) Object.assign(o, { load: 'M', variant: 'light' });
      if (type === 'tennis' && summer && toM(f.t) >= 17 * 60) o.variant = 'evening';
      if (type === 'hockey' && ski) o.variant = 'legs-easy';
      put(type, f.d, f.t, o);
      have[type] = (have[type] || 0) + 1;
    }
  }
  const skippedFixed = (type) => (cfg.fixes[type] || []).slice(0, counts[type] || 0).filter((f) => ski && f.d === skiDay).length;

  // 3 free units
  // wishes first (Noah 26.11.2026): a free unit goes to the first place of liking that is free and allowed, before the planner places anything else
  // (the rest block and the other free units wait). The ids stay the ones of the order (`gym#1`, `gym#2`): a unit with a move of the person keeps its id and its move.
  const wished = new Set(); // wishes taken by a unit of this kind (type + weekday)
  const wishedNote = new Set();
  const handled = new Set(); // ids placed on a wish already
  const freeIds = (type) => {
    const out = [];
    for (let k = 1; k <= Math.max(0, (counts[type] || 0) - (have[type] || 0) - skippedFixed(type)); k++) out.push(`${type}#${k}`);
    return out;
  };
  const reserveOf = (type) => (type === 'gym' ? 35 : 0); // the sauna after the gym needs room too
  function wishFirst(type) {
    const list = cfg.wishes?.[type] || [];
    if (!list.length) return;
    for (const id of freeIds(type)) {
      if (pins[id]) continue; // the person moved it: that stays
      const wish = list.find((w) => !wished.has(`${type}${w.d}`) && !banned(w.d) && !clash(w.d, w.t, TYPES[type].mins + reserveOf(type)));
      if (!wish) continue;
      wished.add(`${type}${wish.d}`);
      handled.add(id);
      put(type, wish.d, wish.t, { id, noPin: true, why: { key: 'wish' } });
    }
  }
  const wishTypes = ['hockey', 'tennis', 'yoga', 'gym', 'bikeOut', 'runOut', 'bikeIn'];
  wishTypes.forEach(wishFirst);
  function flex(type) {
    const reserve = reserveOf(type);
    const list = cfg.wishes?.[type] || [];
    for (const id of freeIds(type)) {
      seq[type] = (seq[type] || 0) + 1;
      if (handled.has(id)) continue;
      const pin = pins[id];
      if (pin) {
        put(type, pin.d, pin.t, { id });
        continue;
      }
      if (list.some((w) => !wished.has(`${type}${w.d}`)) && !wishedNote.has(type)) {
        wishedNote.add(type);
        notes.push({ key: 'wish-missed', type });
      }
      let best = null;
      for (let d = 0; d < 7; d++) {
        if (banned(d)) continue;
        const t = (TYPES[type].cand || ['10:00']).find((c) => !clash(d, c, TYPES[type].mins + reserve));
        if (!t) continue;
        let sc = type === 'mini' ? units(d) * 6 + d * 0.1 : score(d, type, TYPES[type].load);
        put(type, d, t, { id: 'tmp', noPin: true });
        const fh = freeHalves();
        U.pop();
        if (fh < 2) sc += 6 * (2 - fh);
        sc += d * 0.1;
        if (!best || sc < best.sc) best = { d, t, sc };
      }
      if (!best) {
        noRoom(type);
        continue;
      }
      const H = hardDays();
      put(type, best.d, best.t, { id, noPin: true, why: { key: 'best', empty: units(best.d) === 0, calm: !(H.has(best.d - 1) || H.has(best.d + 1)) } });
    }
  }
  function flexOne(type, id) {
    let best = null;
    for (let d = 0; d < 7; d++) {
      if (banned(d)) continue;
      const t = TYPES[type].cand.find((c) => !clash(d, c, TYPES[type].mins));
      if (!t) continue;
      const sc = score(d, type, TYPES[type].load) + d * 0.1;
      if (!best || sc < best.sc) best = { d, t, sc };
    }
    if (best) put(type, best.d, best.t, { id, noPin: true, why: { key: 'best', empty: false, calm: false } });
    else noRoom(type);
  }
  // the rest block first: it hangs on the hard days
  {
    const n = counts.rest || 0;
    for (let i = have.rest || 0; i < n; i++) {
      const id = nid('rest');
      const pin = pins[id];
      if (pin) {
        put('rest', pin.d, pin.t, { id });
        continue;
      }
      const wishR = (cfg.wishes?.rest || []).find((w) => !wished.has(`rest${w.d}`) && !banned(w.d) && !clash(w.d, w.t, 180));
      if (wishR) {
        wished.add(`rest${wishR.d}`);
        put('rest', wishR.d, wishR.t, { id, noPin: true, why: { key: 'wish' } });
        continue;
      }
      const H = hardDays();
      let best = null;
      for (let d = 0; d < 7; d++) {
        if (banned(d)) continue;
        const t = ['14:00', '13:00', '09:00'].find((c) => !clash(d, c, 180));
        if (!t) continue;
        const sc = 6 * units(d) + 2 * loadSum(d) - 2 * (H.has(d + 1) ? 1 : 0) - 2 * (H.has(d) ? 1 : 0) + d * 0.1;
        if (!best || sc < best.sc) best = { d, t, sc };
      }
      if (best) put('rest', best.d, best.t, { id, noPin: true, why: { key: 'rest' } });
      else noRoom('rest');
    }
  }
  ['hockey', 'tennis', 'yoga', 'gym', 'bikeOut', 'runOut', 'bikeIn'].forEach(flex);
  // the treadmill straight after a gym session
  {
    const n = counts.runIn || 0;
    const gyms = U.filter((x) => x.type === 'gym').sort((a, b) => a.d - b.d || a.start - b.start);
    for (let i = 0; i < n; i++) {
      const id = nid('runIn');
      const pin = pins[id];
      if (pin) {
        put('runIn', pin.d, pin.t, { id });
        continue;
      }
      const g = gyms.map((x) => ({ x, k: U.filter((y) => y.d === x.d && y.type === 'runIn').length })).sort((a, b) => a.k - b.k || a.x.d - b.x.d)[0];
      let placed = false;
      if (g) {
        const end = Math.max(...U.filter((y) => y.d === g.x.d && ['gym', 'runIn'].includes(y.type)).map((y) => y.end));
        const t = toT(end + 5);
        if (!clash(g.x.d, t, 25)) {
          put('runIn', g.x.d, t, { id, noPin: true, why: { key: 'after-gym' } });
          placed = true;
        }
      }
      if (!placed) flexOne('runIn', id);
    }
  }
  // the sauna after a gym session
  {
    const gyms = U.filter((x) => x.type === 'gym').sort((a, b) => a.d - b.d);
    for (let i = 0; i < (counts.sauna || 0); i++) {
      const id = nid('sauna');
      const pin = pins[id];
      if (pin) {
        put('sauna', pin.d, pin.t, { id });
        continue;
      }
      const g = gyms.find((x) => !U.some((y) => y.type === 'sauna' && y.d === x.d)) || gyms[0];
      if (!g) {
        notes.push({ key: 'sauna-needs-gym' });
        continue;
      }
      const end = Math.max(...U.filter((y) => y.d === g.d && ['gym', 'runIn'].includes(y.type)).map((y) => y.end));
      const t = toT(end + 5);
      if (clash(g.d, t, 25)) {
        notes.push({ key: 'sauna-no-room', d: g.d });
        continue;
      }
      put('sauna', g.d, t, { id, noPin: true, why: { key: 'after-gym' } });
    }
  }
  flex('mini');

  // intervals: once a week, not next to a hard day; with the focus «Intervals» twice, never on following days; with «Strength» none (the bike stays easy)
  {
    const H = hardDays();
    const bikes = U.filter((x) => x.type === 'bikeIn' || x.type === 'bikeOut');
    bikes.forEach((b) => {
      b.variant = 'easy';
      if (b.type === 'bikeIn') b.load = 'L';
    });
    const want = focus === 'kraft' ? 0 : focus === 'hit' ? Math.max(0, HIT_BIKES - tpBikes) : 1;
    const chosen = [];
    for (let i = 0; i < want; i++) {
      const cands = bikes
        .filter((b) => !H.has(b.d) && !chosen.some((c) => Math.abs(c.d - b.d) < 2))
        .map((b) => ({ b, k: (H.has(b.d - 1) ? 1 : 0) + (H.has(b.d + 1) ? 1 : 0) + (b.type === 'bikeOut' ? 0.5 : 0) }))
        .sort((a, b) => a.k - b.k || a.b.d - b.b.d);
      if (!cands[0]) break;
      const b = cands[0].b;
      b.load = 'M';
      b.variant = 'intervals';
      b.why = { key: 'intervals', calm: cands[0].k < 1 };
      chosen.push(b);
    }
    if (focus === 'hit') notes.push({ key: tpBikes ? 'focus-hit-tp' : chosen.length ? 'focus-hit' : 'focus-hit-none', n: tpBikes || chosen.length });
    if (focus === 'kraft') notes.push({ key: counts.gym >= KRAFT_GYMS ? 'focus-kraft' : 'focus-kraft-none', n: counts.gym });
  }
  // summer: spread the cycling hours, the longest ride at the weekend
  if (bikeHours) {
    const bs = U.filter((x) => x.type === 'bikeOut').sort((a, b) => a.d - b.d);
    if (bs.length) {
      const total = bikeHours * 60;
      const wk = bs.find((b) => b.d >= 5) || bs[bs.length - 1];
      const rest = bs.filter((b) => b !== wk);
      const base = Math.round(total / (bs.length + 0.5) / 5) * 5;
      wk.mins = Math.round((base * 1.5) / 5) * 5;
      rest.forEach((b) => (b.mins = Math.round((total - wk.mins) / Math.max(1, rest.length) / 5) * 5));
      bs.forEach((b) => (b.end = b.start + b.mins));
      notes.push({ key: 'bike-hours', hours: bikeHours });
    }
  }
  if (ctx.rain)
    U.filter((x) => x.type === 'bikeOut').forEach((x) => {
      x.type = 'bikeIn';
      x.variant = 'rain';
      x.why = { key: 'rain' };
    });

  // meditation and stretching, every second day each, in turns
  const md = medDays(ctx.monday);
  const sd = [0, 1, 2, 3, 4, 5, 6].filter((d) => !md.includes(d));
  for (const d of md) {
    if (d === skiDay) continue;
    const t = ['06:45', '06:15'].find((c) => !clash(d, c, 30));
    if (!t) {
      notes.push({ key: 'med-skipped', d });
      continue;
    }
    put('med', d, t, { id: `med@${d}`, noPin: true, why: t === '06:15' ? { key: 'earlier-yoga' } : { key: 'fixed' } });
  }
  for (const d of sd) {
    if (d === skiDay) continue;
    const ends = U.filter((x) => x.d === d && !BARE.includes(x.type)).map((x) => x.end);
    const t = ends.length ? toT(Math.max(...ends) + 5) : '10:00';
    if (toM(t) + 10 > 22 * 60 || clash(d, t, 10)) continue;
    put('stretch', d, t, { id: `stretch@${d}`, noPin: true, why: { key: 'stretch-after' } });
  }

  U.sort((a, b) => a.d - b.d || a.start - b.start);
  const dayLoad = [0, 1, 2, 3, 4, 5, 6].map((d) => {
    const r = U.filter((x) => x.d === d);
    return r.some((x) => x.load === 'H') ? 'H' : r.some((x) => x.load === 'M') ? 'M' : 'L';
  });
  const perDay = [0, 1, 2, 3, 4, 5, 6].map(units);
  const warnings = [];
  // with TrainingPeaks in the week a way out is only offered when the unit is there to take away
  const way = (type, fix) => (!tp.length || (counts[type] || 0) > 0 ? { fix } : {});
  let run = 0;
  dayLoad.forEach((l, d) => {
    run = l === 'H' ? run + 1 : 0;
    if (run === 3) {
      const t = ['tennis', 'hockey'].find((k) => (counts[k] || 0) > 0 && U.some((x) => x.type === k && x.load === 'H' && x.d === d));
      warnings.push({ key: 'hard-run', d, ...(t ? { fix: { type: t, delta: -1 } } : tp.length ? {} : { fix: { type: 'tennis', delta: -1 } }) });
    }
  });
  perDay.forEach((n, d) => n > DAY_MAX && warnings.push({ key: 'too-many', d, n, ...way('mini', { type: 'mini', delta: -1 }) }));
  const fh = freeHalves();
  if (fh < 1) warnings.push({ key: 'no-free-half', ...way('bikeOut', { type: 'bikeOut', delta: -1 }) });
  notes.filter((n) => n.key === 'no-room').forEach((n) => warnings.push({ key: 'no-room', type: n.type }));
  warnings.push(...overlaps(U));
  return { units: U.filter((x) => !x.tp && !x.team), dayLoad, notes: notes.filter((n) => n.key !== 'no-room'), warnings, freeHalves: fh, perDay, tp, team: team.dates };
}

/** Units that overlap on a day (meditation, stretching and the sauna after the gym do not count): [{ key: 'overlap', a, b, d, fix? }]. */
export function overlaps(units) {
  const U = units.filter((x) => !x.assumed && (!NOT_UNIT.includes(x.type) || x.type === 'rest'));
  const out = [];
  for (let i = 0; i < U.length; i++)
    for (let j = i + 1; j < U.length; j++) {
      const a = U[i];
      const b = U[j];
      if (a.d === b.d && a.start < b.end && b.start < a.end) {
        const p = a.pinned ? a : b.pinned ? b : null;
        out.push({ key: 'overlap', a: a.id, b: b.id, d: a.d, ...(p ? { fix: { unpin: p.id } } : {}) });
      }
    }
  return out;
}

/** Total planned minutes of a week without the rest block: the figure to compare with the hours goal. */
export const plannedMins = (units) => units.filter((x) => x.type !== 'rest').reduce((a, x) => a + x.mins, 0);
