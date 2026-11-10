/**
 * «Variabler Wochenplan» (Noah 09.11.2026, Thread «Prüfen: Trainingsplan Woche packbar»), part 1: the planner.
 * Pure, no clock, no database, no texts. Goals per week (units with a count, hours per week, fixed days) go in,
 * a week with times comes out. Rules, not AI: the same input always gives the same week, and every placement
 * carries a reason as a code (`why`), so the page can always say «Warum hier?». The page (later parts) turns codes
 * into German through `t()`; nothing here is shown to a person directly.
 *
 * Setting WEEKPLAN_KEY (the goals; travels with the backup like every setting, no api/):
 *   { v: 1, winter: Config, summer: Config }, Config = { hours, counts: { [type]: n }, fixes: { [type]: [{ d, t }] }, custom: { [type]: true } }
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
        custom: {},
        bikeHours: 8,
      }
    : {
        hours: 15,
        counts: { hockey: 1, tennis: 3, yoga: 2, gym: 2, sauna: 1, rest: 1, bikeOut: 1, bikeIn: 1, runOut: 1, runIn: 1, mini: 1 },
        fixes: { hockey: fx('hockey', [6], false), tennis: fx('tennis', [1, 3, 5], false), yoga: fx('yoga', [0, 3], false), gym: fx('gym', [2], false) },
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
  const bikeHours = counts.bikeOut && Number.isFinite(Number(raw.bikeHours)) && raw.bikeHours > 0 ? Math.min(40, Number(raw.bikeHours)) : summer && counts.bikeOut ? base.bikeHours : null;
  return { hours, counts, fixes, custom, bikeHours };
}

/** The stored setting made safe: { v, winter, summer }. Always a full value, also for nothing at all. */
export const planOf = (raw) => ({ v: 1, winter: configOf(raw?.winter, false), summer: configOf(raw?.summer, true) });

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

// ---- the week ------------------------------------------------------------------------------------------------------

/** Meditation every second day, continuing across weeks: the days of the week (0 = Monday) that carry it. */
export function medDays(monday) {
  const [y, m, d] = monday.split('-').map(Number);
  const dayNo = Math.round(Date.UTC(y, m - 1, d) / 864e5);
  return dayNo % 2 === 0 ? [0, 2, 4, 6] : [1, 3, 5];
}

/**
 * Plans one week.
 *   cfg: a season config (configOf); ctx: { monday, ski, rain, pins: { [unitId]: { d, t } } }.
 * Returns { units, dayLoad, notes, warnings, freeHalves, perDay }:
 *   units: [{ id, type, d, t, start, end, mins, load, fixed, pinned, variant, why }] sorted by day and time
 *   dayLoad: 'H' | 'M' | 'L' per weekday; perDay: units per weekday (meditation, stretching, sauna and rest not counted)
 *   notes: [{ key, … }] what the planner changed on its own; warnings: [{ key, … , fix? }] what does not fit
 */
export function planWeek(cfg, ctx) {
  const summer = isSummer(ctx.monday);
  const pins = ctx.pins || {};
  const counts = { ...cfg.counts };
  const U = [];
  const notes = [];
  const ski = !!ctx.ski;
  const hf = (cfg.fixes.hockey || [])[0];
  const skiDay = ski ? (hf && hf.d === 5 ? 6 : 5) : -1; // Saturday, or Sunday when the ice hockey is on Saturday
  if (ski)
    for (const t of SKI_DROPS) {
      if (counts[t]) notes.push({ key: 'ski-drops', type: t });
      counts[t] = 0;
    }
  const units = (d) => U.filter((x) => x.d === d && !NOT_UNIT.includes(x.type)).length;
  const loadSum = (d) => U.filter((x) => x.d === d && !BARE.includes(x.type)).reduce((a, x) => a + LV[x.load], 0);
  const hardDays = () => new Set(U.filter((x) => x.load === 'H').map((x) => x.d));
  const clash = (d, t, m) => {
    const a = toM(t);
    const b = a + m;
    return U.some((x) => x.d === d && a < x.end + 5 && b + 5 > x.start) || b > 22 * 60;
  };
  const seq = {};
  const nid = (type) => `${type}#${(seq[type] = (seq[type] || 0) + 1)}`;
  function put(type, d, t, o = {}) {
    const id = o.id || nid(type);
    const pin = o.noPin ? null : pins[id];
    const day = pin ? pin.d : d;
    const time = pin ? pin.t : t;
    const mins = o.mins || TYPES[type].mins;
    const x = { id, type, d: day, t: time, start: toM(time), end: toM(time) + mins, mins, load: o.load || TYPES[type].load, fixed: !!o.fixed, pinned: !!pin, variant: o.variant || null, why: pin ? { key: 'pinned' } : o.why || { key: 'best' } };
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
  const banned = (d) => d === skiDay || (ski && d === skiDay - 1); // no unit on the tour day and the day before
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
  function flex(type) {
    const n = counts[type] || 0;
    const reserve = type === 'gym' ? 35 : 0; // the sauna after the gym needs room too
    for (let i = (have[type] || 0) + skippedFixed(type); i < n; i++) {
      const id = nid(type);
      const pin = pins[id];
      if (pin) {
        put(type, pin.d, pin.t, { id });
        continue;
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

  // intervals: once a week, not next to a hard day
  {
    const H = hardDays();
    const bikes = U.filter((x) => x.type === 'bikeIn' || x.type === 'bikeOut');
    bikes.forEach((b) => {
      b.variant = 'easy';
      if (b.type === 'bikeIn') b.load = 'L';
    });
    const cands = bikes
      .filter((b) => !H.has(b.d))
      .map((b) => ({ b, k: (H.has(b.d - 1) ? 1 : 0) + (H.has(b.d + 1) ? 1 : 0) + (b.type === 'bikeOut' ? 0.5 : 0) }))
      .sort((a, b) => a.k - b.k || a.b.d - b.b.d);
    if (cands[0]) {
      const b = cands[0].b;
      b.load = 'M';
      b.variant = 'intervals';
      b.why = { key: 'intervals', calm: cands[0].k < 1 };
    }
  }
  // summer: spread the cycling hours, the longest ride at the weekend
  if (cfg.bikeHours) {
    const bs = U.filter((x) => x.type === 'bikeOut').sort((a, b) => a.d - b.d);
    if (bs.length) {
      const total = cfg.bikeHours * 60;
      const wk = bs.find((b) => b.d >= 5) || bs[bs.length - 1];
      const rest = bs.filter((b) => b !== wk);
      const base = Math.round(total / (bs.length + 0.5) / 5) * 5;
      wk.mins = Math.round((base * 1.5) / 5) * 5;
      rest.forEach((b) => (b.mins = Math.round((total - wk.mins) / Math.max(1, rest.length) / 5) * 5));
      bs.forEach((b) => (b.end = b.start + b.mins));
      notes.push({ key: 'bike-hours', hours: cfg.bikeHours });
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
  let run = 0;
  dayLoad.forEach((l, d) => {
    run = l === 'H' ? run + 1 : 0;
    if (run === 3) {
      const t = ['tennis', 'hockey'].find((k) => (counts[k] || 0) > 0 && U.some((x) => x.type === k && x.load === 'H' && x.d === d)) || 'tennis';
      warnings.push({ key: 'hard-run', d, fix: { type: t, delta: -1 } });
    }
  });
  perDay.forEach((n, d) => n > DAY_MAX && warnings.push({ key: 'too-many', d, n, fix: { type: 'mini', delta: -1 } }));
  const fh = freeHalves();
  if (fh < 1) warnings.push({ key: 'no-free-half', fix: { type: 'bikeOut', delta: -1 } });
  notes.filter((n) => n.key === 'no-room').forEach((n) => warnings.push({ key: 'no-room', type: n.type }));
  warnings.push(...overlaps(U));
  return { units: U, dayLoad, notes: notes.filter((n) => n.key !== 'no-room'), warnings, freeHalves: fh, perDay };
}

/** Units that overlap on a day (meditation, stretching and the sauna after the gym do not count): [{ key: 'overlap', a, b, d, fix? }]. */
export function overlaps(units) {
  const U = units.filter((x) => !NOT_UNIT.includes(x.type) || x.type === 'rest');
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
