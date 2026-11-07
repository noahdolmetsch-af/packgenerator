/**
 * «Spruch zum Einstieg» PR 1 (Noah 06./07.11.2026 «1b 2a 3b Bern», «1a 2a 3a», «Bau spruch pr1»): the tile «Spruch» on
 * Heute. One short sentence built on the device from templates and your own numbers: weather, active zone minutes,
 * sleep and resting pulse, the next trip. No AI call, no internet needed for the sentence itself.
 *
 * - The sentences are Bernese German, fixed text, like the greeting (HG1 1a) and the weather line (mundart.js): they do
 *   NOT go through t(). The «Warum?» line and every other text of the tile do (English keys, German in i18n/de/spruch.js).
 * - Tone (mot, ruhig, lustig, vision, chal): in the mix the tone changes by itself.
 * - Health data is observation only: a sentence names a value, never a cause and never gives advice. A sentence of the
 *   tone «chal» (a small challenge) is not chosen on a day when sleep or resting pulse are clearly off the person's
 *   own normal (recoveryOf); on such a day only calm and friendly sentences can come.
 * - Never the same twice: the last 30 sentences shown are kept (settings row SPRUCH_KEY) and are not chosen again; the
 *   same source (weather, zone minutes …) does not come twice in a row and in the mix the tone changes. When
 *   nothing else is left, the oldest of the last 30 is let free; when nothing fits at all, the tile says why it is empty.
 * Pure (no database, no screen), tested in tests/spruch.test.js. Konzept: design/tagesspruch/konzept.md in the project folder.
 */
import { normalOf, latest, azmWeek, addDays } from '../health.js';
import { daysFrom } from '../phase.js';
import { wetPct } from '../rainlimit.svelte.js';

export const SPRUCH_KEY = 'home.spruch';
/** How many shown sentences are kept and not chosen again. */
export const HISTORY_MAX = 30;
export const TONES = ['mot', 'ruhig', 'lustig', 'vision', 'chal'];
/** English keys for t(): the name of each tone (the small tag on the tile). */
export const TONE_NAME = { mot: 'Encouraging|saying', ruhig: 'Calm|saying', lustig: 'Funny|saying', vision: 'Vision|saying', chal: 'Challenge|saying' };
/** English keys for t(): the name of each source (where the sentence comes from). */
export const SOURCE_NAME = { weather: 'Weather|saying', azm: 'Zone minutes|saying', body: 'Sleep and pulse|saying', tour: 'Next trip|saying' };

/** The stored row { recent: [{ id, src, ton }] newest first, off: [template ids] }; anything else becomes the empty row. */
export function spruchOf(value) {
  const v = value && typeof value === 'object' ? value : {};
  const recent = (Array.isArray(v.recent) ? v.recent : [])
    .filter((x) => x && typeof x.id === 'string')
    .map((x) => ({ id: x.id, src: typeof x.src === 'string' ? x.src : '', ton: typeof x.ton === 'string' ? x.ton : '' }))
    .slice(0, HISTORY_MAX);
  const off = (Array.isArray(v.off) ? v.off : []).filter((x) => typeof x === 'string');
  return { recent, off };
}

/** The history with one more shown sentence on top (kept to HISTORY_MAX; the same id is moved to the top). */
export function remember(rec, pick) {
  const r = spruchOf(rec);
  const recent = [{ id: pick.id, src: pick.src, ton: pick.ton }, ...r.recent.filter((x) => x.id !== pick.id)].slice(0, HISTORY_MAX);
  return { ...r, recent };
}

/* ---------- recovery: sleep and resting pulse against the person's own normal ---------- */

/** Sleep at least this many minutes under the own normal, or resting pulse at least this many beats over it, is «off». */
export const SLEEP_LOW_MIN = 40;
export const RHR_HIGH = 3;
/** Sleep at least this many minutes over the normal: a calm sentence (S1). */
export const SLEEP_HIGH_MIN = 30;

/**
 * { state: 'normal' | 'off' | 'unknown', sleep: { min, normal, diff } | null, rhr: { v, normal, diff } | null }.
 * Only last night and today count (the day of «today» or the day before). The normal is the median of the 30 days
 * before (health.js normalOf, at least 7 values). 'off' = sleep ≤ −40 min or resting pulse ≥ +3; more sleep or a lower
 * pulse is not «off». 'unknown' = no value to compare (no watch, or not enough days): nothing is off, so it does not block.
 */
export function recoveryOf(rows = [], today) {
  const from = addDays(today, -1);
  const sRow = latest(rows, 'sleep', today);
  const sMin = sRow && sRow.date >= from ? sRow.sleep?.asleepMin : null;
  const sNorm = normalOf(rows, 'sleep', today);
  const sleep = Number.isFinite(sMin) && sNorm != null ? { min: Math.round(sMin), normal: Math.round(sNorm), diff: Math.round(sMin - sNorm) } : null;
  const hRow = latest(rows, 'restingHr', today);
  const hV = hRow && hRow.date >= from ? hRow.restingHr : null;
  const hNorm = normalOf(rows, 'restingHr', today);
  const rhr = Number.isFinite(hV) && hNorm != null ? { v: Math.round(hV), normal: Math.round(hNorm), diff: Math.round(hV - hNorm) } : null;
  const off = (sleep && sleep.diff <= -SLEEP_LOW_MIN) || (rhr && rhr.diff >= RHR_HIGH);
  return { state: off ? 'off' : sleep || rhr ? 'normal' : 'unknown', sleep, rhr };
}

/* ---------- the numbers a sentence needs ---------- */

/** Bernese words for the hours on a clock face: «am zwöi». */
const HOUR_WORD = ['zwölfi', 'eis', 'zwöi', 'drü', 'vieri', 'füfi', 'sächsi', 'sibni', 'achti', 'nüni', 'zähni', 'eufi'];
const clock = (h) => HOUR_WORD[h % 12];
/** 460 min → «7 h 40», 420 → «7 h». */
const hm = (min) => `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60}` : ''}`;

/** The forecast day (home-weather.js shape: { date, min, max, rain, hourly: { t, p } }) of a calendar day, or null. */
const dayOf = (forecast, date) => (forecast?.days ?? []).find((x) => x.date === date) ?? null;

/** Wet hours (rain chance from the one rain limit) of a day as 24 booleans, or null without hourly values. */
const wetHours = (day) => (day?.hourly?.p?.length === 24 ? day.hourly.p.map((p) => wetPct(p)) : null);

/**
 * What the sentences need, from what Today already knows:
 * { today, hour, weekday (1 = Monday … 7), forecast, rows (healthDays), goal (zone minutes per week), trip, packed, fog }
 * trip: the next trip { startDate, name } or null; packed: { packed, of } or null; fog: summary() of nebelgrenze.js or null.
 */
export function contextOf({ today, hour = 12, weekday = 1, forecast = null, rows = [], goal = 150, trip = null, packed = null, fog = null } = {}) {
  const week = azmWeek(rows, today);
  const recent = (rows ?? []).filter((r) => r.date >= addDays(today, -14) && Number.isFinite(r.azm));
  return {
    today,
    hour,
    weekday,
    day: dayOf(forecast, today),
    azm: { sum: week.sum, goal, connected: recent.length > 0 },
    rec: recoveryOf(rows, today),
    trip: trip?.startDate ? { name: String(trip.name ?? '').trim(), days: daysFrom(today, trip.startDate), packed: packed?.of ? Math.round((packed.packed / packed.of) * 100) : null } : null,
    fog,
  };
}

/* ---------- the 16 sentences ---------- */

/**
 * Every template: { id, src, ton, make(ctx) } where make returns null (does not fit today) or
 * { text: the Bernese sentence, why: { key, vars } } (key: English text for t() in the «Warum?» line).
 * chal: true marks a sentence that needs «not off» recovery.
 */
export const TEMPLATES = [
  // --- weather: only before 18:00 (the weather line of Today turns to tomorrow in the evening) ---
  {
    id: 'w.rain-until', src: 'weather', ton: 'lustig',
    make: (c) => {
      const wet = wetHours(c.day);
      if (!wet || c.hour >= 18 || !wet[c.hour]) return null;
      let h = c.hour;
      while (h < 23 && wet[h]) h++; // first dry hour after the wet stretch
      if (h <= c.hour || h > 17 || wet.slice(h, 21).some(Boolean)) return null;
      return { text: `Bis am ${clock(h)} rägnets, när isch’s troche. D’Wolke und dr Kaländer si sech hüt usnahmswys einig: zersch Kafi, när Velo.`, why: { key: 'Rain at your home place until {h}:00, dry after that.', vars: { h } } };
    },
  },
  {
    id: 'w.dry-mild', src: 'weather', ton: 'mot',
    make: (c) => {
      const max = c.day?.max;
      if (!c.day || c.hour >= 17 || !Number.isFinite(max) || max < 10) return null;
      const wet = wetHours(c.day);
      const dry = wet ? !wet.slice(Math.max(9, c.hour), 19).some(Boolean) : (c.day.rain ?? 'none') === 'none';
      return dry ? { text: `Troche und ${Math.round(max)} Grad. Dr Wätterbricht het hüt nüt gäge ne Rundi.`, why: { key: 'Dry at your home place today, up to {t}°.', vars: { t: Math.round(max) } } } : null;
    },
  },
  {
    id: 'w.fog-sun', src: 'weather', ton: 'vision',
    make: (c) => {
      const top = c.fog?.now?.top;
      if (c.hour >= 11 || !Number.isFinite(top) || c.fog?.above !== 'sun') return null;
      const m = Math.round(top / 10) * 10;
      return { text: `Unger em Näbel, ab ${m} m Sunne. Wär früech startet, luegt vo obe uf d’Wolkedecki.`, why: { key: 'Fog line about {m} m above sea level, sun above (estimate).', vars: { m } } };
    },
  },
  {
    id: 'w.cold-morning', src: 'weather', ton: 'chal', chal: true,
    make: (c) => {
      const min = c.day?.min;
      if (c.hour >= 11 || !Number.isFinite(min) || min >= 4) return null;
      const t = Math.round(min);
      const deg = t < 0 ? `Minus ${-t}` : `Nume ${t}`;
      return { text: `${deg} Grad am Morge. Warm aalege, när isch d’Rundi nume haub so schlimm.`, why: { key: 'Lowest temperature today at your home place: {t}°.', vars: { t } } };
    },
  },
  // --- zone minutes of the week (goal: Aktiv › Aktivzonenminuten) ---
  {
    id: 'a.close', src: 'azm', ton: 'mot',
    make: (c) => {
      const { sum, goal, connected } = c.azm;
      const rest = goal - sum;
      if (!connected || sum <= 0 || rest <= 0 || rest >= 100) return null;
      const until = c.weekday === 7 ? 'Hüt bis zum Abe' : 'Bis Sunntig';
      return { text: `${sum} vo ${goal} Zonenminute hesch scho. ${until} fähle no ${rest}, das isch e Firaaberundi und e Spaziergang.`, why: { key: 'Active zone minutes this week: {n} of {goal}.', vars: { n: sum, goal } } };
    },
  },
  {
    id: 'a.more', src: 'azm', ton: 'chal', chal: true,
    make: (c) => {
      const { sum, goal, connected } = c.azm;
      const rest = goal - sum;
      if (!connected || rest <= 0 || c.hour >= 20) return null;
      return { text: `Für ds Wuchezil fähle no ${rest} Zonenminute. Hüt scho es Stückli meh aus gester?`, why: { key: 'Active zone minutes this week: {n} of {goal}.', vars: { n: sum, goal } } };
    },
  },
  {
    id: 'a.goal', src: 'azm', ton: 'lustig',
    make: (c) => {
      const { sum, goal, connected } = c.azm;
      return connected && sum >= goal ? { text: `Wuchezil gschafft: ${sum} vo ${goal}. Ds Sofa het das persönlech gno.`, why: { key: 'Active zone minutes this week: {n} of {goal}.', vars: { n: sum, goal } } } : null;
    },
  },
  {
    id: 'a.new-week', src: 'azm', ton: 'ruhig',
    make: (c) => {
      const { sum, goal, connected } = c.azm;
      return connected && c.weekday <= 2 && sum < goal ? { text: `E neui Wuche fat a: ${sum} vo ${goal} Zonenminute. Es geit Schritt für Schritt.`, why: { key: 'Active zone minutes since Monday: {n} of {goal}.', vars: { n: sum, goal } } } : null;
    },
  },
  // --- sleep and resting pulse, against the own normal of 30 days; observation only ---
  {
    id: 'b.sleep-more', src: 'body', ton: 'ruhig',
    make: (c) => {
      const s = c.rec.sleep;
      return s && s.diff >= SLEEP_HIGH_MIN ? { text: `${hm(s.min)} gschlafe, ${s.diff} Minute meh aus dys Normal. Das merkt me ofte erscht ungerwägs.`, why: { key: 'Sleep last night {min} min, your normal {normal} min.', vars: { min: s.min, normal: s.normal } } } : null;
    },
  },
  {
    id: 'b.sleep-less', src: 'body', ton: 'ruhig',
    make: (c) => {
      const s = c.rec.sleep;
      return s && s.diff <= -SLEEP_LOW_MIN ? { text: `${hm(s.min)} gschlafe, ${-s.diff} Minute weniger aus dys Normal. S’Tempo bestimmsch hüt du.`, why: { key: 'Sleep last night {min} min, your normal {normal} min.', vars: { min: s.min, normal: s.normal } } } : null;
    },
  },
  {
    id: 'b.rhr-high', src: 'body', ton: 'ruhig',
    make: (c) => {
      const r = c.rec.rhr;
      return r && r.diff >= RHR_HIGH ? { text: `Dr Rueipuls isch ${r.diff} Schläg höcher aus dys Normal. Dr Körper redt liislig.`, why: { key: 'Resting pulse {v}, your normal {normal}.', vars: { v: r.v, normal: r.normal } } } : null;
    },
  },
  {
    id: 'b.rhr-low', src: 'body', ton: 'mot',
    make: (c) => {
      const r = c.rec.rhr;
      return r && r.diff <= -RHR_HIGH ? { text: `Dr Rueipuls isch ${-r.diff} Schläg tiefer aus dys Normal. Ruig im Motor.`, why: { key: 'Resting pulse {v}, your normal {normal}.', vars: { v: r.v, normal: r.normal } } } : null;
    },
  },
  // --- the next trip ---
  {
    id: 't.far', src: 'tour', ton: 'vision',
    make: (c) => {
      const t = c.trip;
      return t && t.days >= 7 && t.packed != null ? { text: `I ${t.days} Täg geit’s los. S’Gepäck isch zu ${t.packed} % packet, dr Räscht isch Vorfreud.`, why: { key: 'Your next trip starts in {n} days, packed {p} %.', vars: { n: t.days, p: t.packed } } } : null;
    },
  },
  {
    id: 't.near', src: 'tour', ton: 'chal', chal: true,
    make: (c) => {
      const t = c.trip;
      return t && t.days >= 2 && t.days <= 6 && t.packed != null && t.packed < 100 ? { text: `No ${t.days} Täg bis ${t.name || 'zum Start'}. ${t.packed} % packet: schaffsch dr Räscht hüt no?`, why: { key: 'Your next trip starts in {n} days, packed {p} %.', vars: { n: t.days, p: t.packed } } } : null;
    },
  },
  {
    id: 't.packed', src: 'tour', ton: 'mot',
    make: (c) => {
      const t = c.trip;
      return t && t.days >= 1 && t.days <= 14 && t.packed === 100 ? { text: `Alles packet für ${t.name || 'dr Start'}. Jitz fählt nume no ds Wätter, u das chunnt ou no.`, why: { key: 'Your next trip starts in {n} days, packed {p} %.', vars: { n: t.days, p: t.packed } } } : null;
    },
  },
  {
    id: 't.tomorrow', src: 'tour', ton: 'lustig',
    make: (c) => (c.trip && c.trip.days === 1 ? { text: 'Morn geit’s los. D’Velo wüsse’s scho, dr Kafi no nid.', why: { key: 'Your next trip starts tomorrow.', vars: {} } } : null),
  },
];
export const TEMPLATE = Object.fromEntries(TEMPLATES.map((x) => [x.id, x]));

/** All sentences that fit today: [{ id, src, ton, text, why }], in the order of TEMPLATES. `ton`: 'mix' or one tone. */
export function fitting(ctx, { ton = 'mix', off = [] } = {}) {
  const calm = ctx.rec?.state === 'off'; // a day off the own normal: no challenge
  return TEMPLATES.filter((x) => (ton === 'mix' || x.ton === ton) && !off.includes(x.id) && !(calm && x.chal))
    .map((x) => {
      const m = x.make(ctx);
      return m ? { id: x.id, src: x.src, ton: x.ton, text: m.text, why: m.why } : null;
    })
    .filter(Boolean);
}

/**
 * Choose one sentence: { id, src, ton, text, why } or null when nothing fits.
 * 1. not one of the last 30 shown (rec.recent); when all that fit are in it, the oldest of them is let free;
 * 2. if possible not the same source as the last one and (in the mix) not the same tone;
 * 3. among the rest one by chance (`rand`, 0 ≤ x < 1; a test passes its own).
 * `not`: an id to leave out as well (the one on the screen when «New» is tapped).
 */
export function pickSpruch(ctx, rec = null, { ton = 'mix', rand = Math.random, not = '' } = {}) {
  const r = spruchOf(rec);
  const all = fitting(ctx, { ton, off: r.off }).filter((x) => x.id !== not);
  if (!all.length) return null;
  const seen = new Map(r.recent.map((x, i) => [x.id, i]));
  let pool = all.filter((x) => !seen.has(x.id));
  if (!pool.length) {
    // everything that fits was shown lately: let the oldest free (the largest index in the history)
    const oldest = Math.max(...all.map((x) => seen.get(x.id)));
    pool = all.filter((x) => seen.get(x.id) === oldest);
  }
  const last = r.recent[0];
  const other = pool.filter((x) => !last || x.src !== last.src);
  const step1 = other.length ? other : pool;
  const other2 = ton === 'mix' && last ? step1.filter((x) => x.ton !== last.ton) : step1;
  const list = other2.length ? other2 : step1;
  return list[Math.min(list.length - 1, Math.floor(rand() * list.length))];
}
