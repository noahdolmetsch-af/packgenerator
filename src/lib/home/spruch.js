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
 * - PR 2 (Noah 07.11.2026 «Bau spruch pr2»): more sources (steps, weeks in a row, bike km of the year, a year ago, the
 *   fog clearing, your quotes of «Kissenzeit») and a second wording for each of the first 16 sentences (`alts`; the id of
 *   a second wording is «id~2»). Quotes stay High German (lang 'de'); they come every few sentences and when nothing else fits.
 * Pure (no database, no screen), tested in tests/spruch.test.js. Konzept: design/tagesspruch/konzept.md in the project folder.
 */
import { normalOf, latest, azmWeek, addDays, MOVE_RULE } from '../health.js';
import { daysFrom } from '../phase.js';
import { wetPct } from '../rainlimit.svelte.js';

export const SPRUCH_KEY = 'home.spruch';
/** How many shown sentences are kept and not chosen again. */
export const HISTORY_MAX = 30;
export const TONES = ['mot', 'ruhig', 'lustig', 'vision', 'chal'];
/** English keys for t(): the name of each tone (the small tag on the tile). */
export const TONE_NAME = { mot: 'Encouraging|saying', ruhig: 'Calm|saying', lustig: 'Funny|saying', vision: 'Vision|saying', chal: 'Challenge|saying' };
/** English keys for t(): the name of each source (where the sentence comes from). */
export const SOURCE_NAME = { weather: 'Weather|saying', azm: 'Zone minutes|saying', body: 'Sleep and pulse|saying', tour: 'Next trip|saying', steps: 'Steps|saying', serie: 'Weeks in a row|saying', velo: 'Bike km|saying', jahr: 'A year ago|saying', quote: 'Quote|saying' };

/** The template of a sentence id: «w.rain-until~2» → «w.rain-until». */
export const baseId = (id) => String(id ?? '').split('~')[0];

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
 * PR 2: series: the weeks in a row (series.js seriesOf) or null; km: { now, week } the bike km of this year now and a week ago;
 * ago: { title } the trip of a year ago or null; quotes: [{ id, text, author, source }] the quotes that are on.
 */
export function contextOf({ today, hour = 12, weekday = 1, forecast = null, rows = [], goal = 150, trip = null, packed = null, fog = null, series = null, km = null, ago = null, quotes = [] } = {}) {
  const week = azmWeek(rows, today);
  const stepsOf = (d) => (rows ?? []).find((r) => r.date === d && Number.isFinite(r.steps))?.steps ?? null;
  const yS = stepsOf(addDays(today, -1));
  const nS = normalOf(rows ?? [], 'steps', today);
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
    steps: { y: yS, today: stepsOf(today), normal: nS != null ? Math.round(nS) : null },
    series,
    km,
    ago,
    quotes: Array.isArray(quotes) ? quotes : [],
  };
}

/** Bike km of the year that are worth a sentence (reached in the last 7 days, or close). */
export const KM_MARKS = [250, 500, 750, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 8000, 10000];

/* ---------- the sentences ---------- */

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
      return {
        text: `Bis am ${clock(h)} rägnets, när isch’s troche. D’Wolke und dr Kaländer si sech hüt usnahmswys einig: zersch Kafi, när Velo.`,
        alts: [`Bis am ${clock(h)} nässelet’s no. Hüt isch’s e Tag für dr zwöit Kafi und när für d’Rundi.`],
        why: { key: 'Rain at your home place until {h}:00, dry after that.', vars: { h } },
      };
    },
  },
  {
    id: 'w.dry-mild', src: 'weather', ton: 'mot',
    make: (c) => {
      const max = c.day?.max;
      if (!c.day || c.hour >= 17 || !Number.isFinite(max) || max < 10) return null;
      const wet = wetHours(c.day);
      const dry = wet ? !wet.slice(Math.max(9, c.hour), 19).some(Boolean) : (c.day.rain ?? 'none') === 'none';
      const t = Math.round(max);
      return dry ? { text: `Troche und ${t} Grad. Dr Wätterbricht het hüt nüt gäge ne Rundi.`, alts: [`${t} Grad und troche. Gueti Usrede git’s hüt kener.`], why: { key: 'Dry at your home place today, up to {t}°.', vars: { t } } } : null;
    },
  },
  {
    id: 'w.fog-sun', src: 'weather', ton: 'vision',
    make: (c) => {
      const top = c.fog?.now?.top;
      if (c.hour >= 11 || !Number.isFinite(top) || c.fog?.above !== 'sun') return null;
      const m = Math.round(top / 10) * 10;
      return {
        text: `Unger em Näbel, ab ${m} m Sunne. Wär früech startet, luegt vo obe uf d’Wolkedecki.`,
        alts: [`Dr Näbel höret bi ${m} m uf. Wär ufe geit, het d’Sunne für sech.`],
        why: { key: 'Fog line about {m} m above sea level, sun above (estimate).', vars: { m } },
      };
    },
  },
  {
    id: 'w.fog-clears', src: 'weather', ton: 'ruhig',
    make: (c) => {
      const k = c.fog?.clearing;
      if (!k || k.kind !== 'clears' || !Number.isFinite(k.hour) || k.hour <= c.hour || c.hour >= 18) return null;
      return {
        text: `Dr Näbel verzieht sech am ${clock(k.hour)}. Bis dänne bsorgt dr Kafi ds Programm.`,
        alts: [`Um ${k.hour} Uhr isch dr Näbel wäg. Wär wartet, gseht meh.`],
        why: { key: 'The fog at your home place is expected to clear at {h}:00 (estimate).', vars: { h: k.hour } },
      };
    },
  },
  {
    id: 'w.cold-morning', src: 'weather', ton: 'chal', chal: true,
    make: (c) => {
      const min = c.day?.min;
      if (c.hour >= 11 || !Number.isFinite(min) || min >= 4) return null;
      const t = Math.round(min);
      const deg = t < 0 ? `Minus ${-t}` : `Nume ${t}`;
      return {
        text: `${deg} Grad am Morge. Warm aalege, när isch d’Rundi nume haub so schlimm.`,
        alts: [`${deg} Grad am Morge. E zwöiti Schicht und d’Händsche, när geit’s.`],
        why: { key: 'Lowest temperature today at your home place: {t}°.', vars: { t } },
      };
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
      return {
        text: `${sum} vo ${goal} Zonenminute hesch scho. ${until} fähle no ${rest}, das isch e Firaaberundi und e Spaziergang.`,
        alts: [`Nume no ${rest} Zonenminute bis zum Wuchezil (${sum} vo ${goal}). D’Ziellinie isch scho z gseh.`],
        why: { key: 'Active zone minutes this week: {n} of {goal}.', vars: { n: sum, goal } },
      };
    },
  },
  {
    id: 'a.more', src: 'azm', ton: 'chal', chal: true,
    make: (c) => {
      const { sum, goal, connected } = c.azm;
      const rest = goal - sum;
      if (!connected || rest <= 0 || c.hour >= 20) return null;
      return {
        text: `Für ds Wuchezil fähle no ${rest} Zonenminute. Hüt scho es Stückli meh aus gester?`,
        alts: [`${sum} vo ${goal}: ${rest} Zonenminute ligge no parat. Wär nimmt sie hüt?`],
        why: { key: 'Active zone minutes this week: {n} of {goal}.', vars: { n: sum, goal } },
      };
    },
  },
  {
    id: 'a.goal', src: 'azm', ton: 'lustig',
    make: (c) => {
      const { sum, goal, connected } = c.azm;
      return connected && sum >= goal
        ? { text: `Wuchezil gschafft: ${sum} vo ${goal}. Ds Sofa het das persönlech gno.`, alts: [`${sum} vo ${goal} Zonenminute: ds Wuchezil isch dinne. Jitz isch alles Bonus.`], why: { key: 'Active zone minutes this week: {n} of {goal}.', vars: { n: sum, goal } } }
        : null;
    },
  },
  {
    id: 'a.new-week', src: 'azm', ton: 'ruhig',
    make: (c) => {
      const { sum, goal, connected } = c.azm;
      return connected && c.weekday <= 2 && sum < goal
        ? { text: `E neui Wuche fat a: ${sum} vo ${goal} Zonenminute. Es geit Schritt für Schritt.`, alts: [`Dr Zähler steit uf ${sum} vo ${goal} Zonenminute. D’Wuche het no aui Charte.`], why: { key: 'Active zone minutes since Monday: {n} of {goal}.', vars: { n: sum, goal } } }
        : null;
    },
  },
  // --- sleep and resting pulse, against the own normal of 30 days; observation only ---
  {
    id: 'b.sleep-more', src: 'body', ton: 'ruhig',
    make: (c) => {
      const s = c.rec.sleep;
      return s && s.diff >= SLEEP_HIGH_MIN
        ? { text: `${hm(s.min)} gschlafe, ${s.diff} Minute meh aus dys Normal. Das merkt me ofte erscht ungerwägs.`, alts: [`${hm(s.min)} gschlafe, ${s.diff} Minute über dym Normal. Das isch e ruigi Usgangslag.`], why: { key: 'Sleep last night {min} min, your normal {normal} min.', vars: { min: s.min, normal: s.normal } } }
        : null;
    },
  },
  {
    id: 'b.sleep-less', src: 'body', ton: 'ruhig',
    make: (c) => {
      const s = c.rec.sleep;
      return s && s.diff <= -SLEEP_LOW_MIN
        ? { text: `${hm(s.min)} gschlafe, ${-s.diff} Minute weniger aus dys Normal. S’Tempo bestimmsch hüt du.`, alts: [`${hm(s.min)} gschlafe, ${-s.diff} Minute under dym Normal. Hüt dörfsch ds Tempo säuber wähle.`], why: { key: 'Sleep last night {min} min, your normal {normal} min.', vars: { min: s.min, normal: s.normal } } }
        : null;
    },
  },
  {
    id: 'b.rhr-high', src: 'body', ton: 'ruhig',
    make: (c) => {
      const r = c.rec.rhr;
      return r && r.diff >= RHR_HIGH
        ? { text: `Dr Rueipuls isch ${r.diff} Schläg höcher aus dys Normal. Dr Körper redt liislig.`, alts: [`Rueipuls ${r.v}: ${r.diff} Schläg über dym Normal vo ${r.normal}. Das isch nume e Zahl, kes Urteil.`], why: { key: 'Resting pulse {v}, your normal {normal}.', vars: { v: r.v, normal: r.normal } } }
        : null;
    },
  },
  {
    id: 'b.rhr-low', src: 'body', ton: 'mot',
    make: (c) => {
      const r = c.rec.rhr;
      return r && r.diff <= -RHR_HIGH
        ? { text: `Dr Rueipuls isch ${-r.diff} Schläg tiefer aus dys Normal. Ruig im Motor.`, alts: [`Rueipuls ${r.v}: ${-r.diff} Schläg under dym Normal vo ${r.normal}. Schön ruig.`], why: { key: 'Resting pulse {v}, your normal {normal}.', vars: { v: r.v, normal: r.normal } } }
        : null;
    },
  },
  // --- steps of the watch (PR 2): yesterday and today so far ---
  {
    id: 's.yesterday', src: 'steps', ton: 'lustig',
    make: (c) => {
      const y = c.steps?.y;
      return Number.isFinite(y) && y >= MOVE_RULE.goatSteps
        ? { text: `Geschter ${y} Schritt. Dr Schrittzähler het gmeint, är müess ufpasse.`, alts: [`${y} Schritt geschter: dr Wäg vom Sofa zum Chüelschrank isch das nid gsi.`], why: { key: 'Steps yesterday: {n}.', vars: { n: y } } }
        : null;
    },
  },
  {
    id: 's.more-than-usual', src: 'steps', ton: 'ruhig',
    make: (c) => {
      const { y, normal } = c.steps ?? {};
      return Number.isFinite(y) && normal != null && y - normal >= 2000 && y < MOVE_RULE.goatSteps
        ? { text: `Geschter ${y} Schritt, ${y - normal} meh aus dys Normal. E guete Rhythmus.`, alts: [`${y} Schritt geschter. Dys Normal isch ${normal}: es guets Stück Wäg meh.`], why: { key: 'Steps yesterday: {n}, your normal {normal}.', vars: { n: y, normal } } }
        : null;
    },
  },
  {
    id: 's.today', src: 'steps', ton: 'mot',
    make: (c) => {
      const n = c.steps?.today;
      return Number.isFinite(n) && n >= 6000 && c.hour < 15
        ? { text: `Scho ${n} Schritt hüt, und dr Tag isch no jung.`, alts: [`${n} Schritt sit am Morge. Dr Räscht vom Tag het nüt z’tüe.`], why: { key: 'Steps today so far: {n}.', vars: { n } } }
        : null;
    },
  },
  // --- the next trip ---
  {
    id: 't.far', src: 'tour', ton: 'vision',
    make: (c) => {
      const t = c.trip;
      return t && t.days >= 7 && t.packed != null
        ? { text: `I ${t.days} Täg geit’s los. S’Gepäck isch zu ${t.packed} % packet, dr Räscht isch Vorfreud.`, alts: [`Nonig ${t.days} Täg, när geit’s los. ${t.packed} % packet: dr Räscht isch Vorfreud.`], why: { key: 'Your next trip starts in {n} days, packed {p} %.', vars: { n: t.days, p: t.packed } } }
        : null;
    },
  },
  {
    id: 't.near', src: 'tour', ton: 'chal', chal: true,
    make: (c) => {
      const t = c.trip;
      return t && t.days >= 2 && t.days <= 6 && t.packed != null && t.packed < 100
        ? { text: `No ${t.days} Täg bis ${t.name || 'zum Start'}. ${t.packed} % packet: schaffsch dr Räscht hüt no?`, alts: [`${t.days} Täg bis ${t.name || 'zum Start'}, ${t.packed} % packet. E chline Schritt hüt, und dr Räscht wird liechter.`], why: { key: 'Your next trip starts in {n} days, packed {p} %.', vars: { n: t.days, p: t.packed } } }
        : null;
    },
  },
  {
    id: 't.packed', src: 'tour', ton: 'mot',
    make: (c) => {
      const t = c.trip;
      return t && t.days >= 1 && t.days <= 14 && t.packed === 100
        ? { text: `Alles packet für ${t.name || 'dr Start'}. Jitz fählt nume no ds Wätter, u das chunnt ou no.`, alts: [`${t.name || 'Dr Start'} isch packet. Jitz darf dr Chopf scho mal vorfahre.`], why: { key: 'Your next trip starts in {n} days, packed {p} %.', vars: { n: t.days, p: t.packed } } }
        : null;
    },
  },
  {
    id: 't.tomorrow', src: 'tour', ton: 'lustig',
    make: (c) => (c.trip && c.trip.days === 1 ? { text: 'Morn geit’s los. D’Velo wüsse’s scho, dr Kafi no nid.', alts: ['Morn isch’s so wyt. Hüt no e ruige Abe, morn d’Wält.'], why: { key: 'Your next trip starts tomorrow.', vars: {} } } : null),
  },
  // --- weeks in a row (the series of Today, PR 2) ---
  {
    id: 'e.run', src: 'serie', ton: 'mot',
    make: (c) => {
      const n = c.series?.n;
      return Number.isFinite(n) && n >= 2
        ? { text: `${n} Wuche hinterenang aktiv. Settigi Serie baut me nid i eim Tag.`, alts: [`Wuche Nummer ${n} i dr Reihe. Dr Rhythmus treit di.`], why: { key: 'Weeks in a row with something active: {n}.', vars: { n } } }
        : null;
    },
  },
  {
    id: 'e.next', src: 'serie', ton: 'chal', chal: true,
    make: (c) => {
      const { n, next, left } = c.series ?? {};
      return Number.isFinite(n) && n >= 1 && Number.isFinite(next) && Number.isFinite(left) && left >= 1 && left <= 2
        ? { text: `No ${left} Wuche bis zur ${next}-Wuche-Serie. Di aktuell Wuche zöut scho.`, alts: [`${n} Wuche hinterenang, bis ${next} fähle no ${left}. Dr nächst Schritt isch chlyner aus är tönt.`], why: { key: 'Weeks in a row: {n}, next goal {next}.', vars: { n, next } } }
        : null;
    },
  },
  // --- bike kilometres of this year (rides, Strava, ride book) ---
  {
    id: 'v.milestone', src: 'velo', ton: 'mot',
    make: (c) => {
      const k = c.km;
      if (!k || !(k.now > 0)) return null;
      const m = [...KM_MARKS].reverse().find((x) => k.now >= x && k.week < x);
      return m
        ? { text: `D’${m} km-Marke isch gschafft: ${k.now} km uf em Velo i däm Jahr.`, alts: [`${k.now} Velo-Kilometer i däm Jahr. D’${m} hesch hinger dir.`], why: { key: 'Bike km this year: {n}.', vars: { n: k.now } } }
        : null;
    },
  },
  {
    id: 'v.close', src: 'velo', ton: 'chal', chal: true,
    make: (c) => {
      const k = c.km;
      if (!k || !(k.now > 0)) return null;
      const m = KM_MARKS.find((x) => x > k.now);
      return m && m - k.now <= 60
        ? { text: `No ${m - k.now} km bis ${m} Velo-Kilometer i däm Jahr. E Rundi, und dr Zähler chnackt d’Marke.`, alts: [`${k.now} km uf em Velo i däm Jahr, bis ${m} fähle no ${m - k.now}. Das isch e Usfahrt.`], why: { key: 'Bike km this year: {n}.', vars: { n: k.now } } }
        : null;
    },
  },
  // --- a year ago: the trip around this day ---
  {
    id: 'j.ago', src: 'jahr', ton: 'ruhig',
    make: (c) => {
      const a = c.ago;
      return a && a.title
        ? { text: `Vor emene Jahr isch ${a.title} dra gsi. Es Jahr geit schnäu verbi.`, alts: [`${a.title}: das isch vor emene Jahr gsi. Was chunnt als nächschts?`], why: { key: 'A year ago around this day: {name}.', vars: { name: a.title } } }
        : null;
    },
  },
];
export const TEMPLATE = Object.fromEntries(TEMPLATES.map((x) => [x.id, x]));

/** The quote sentences of the quotes that are on (High German, as written; the author or source after it). */
function quoteEntries(ctx) {
  return (ctx.quotes ?? [])
    .filter((q) => q && typeof q.id === 'string' && typeof q.text === 'string' && q.text.trim())
    .map((q) => {
      const by = String(q.author || q.source || '').trim();
      return { id: `z.${q.id}`, src: 'quote', ton: 'ruhig', lang: 'de', low: true, text: `«${q.text.trim()}»${by ? ` – ${by}` : ''}`, why: { key: 'A quote from your list under «Cushion time».', vars: {} } };
    });
}

/**
 * All sentences that fit today: [{ id, src, ton, text, why, lang }], in the order of TEMPLATES, then the quotes. `ton`: 'mix' or
 * one tone. A template with `alts` gives one entry per wording (ids «id», «id~2» …). Quotes (`low`) fit always, in every tone filter
 * only the tone «ruhig» and «mix».
 */
export function fitting(ctx, { ton = 'mix', off = [] } = {}) {
  const calm = ctx.rec?.state === 'off'; // a day off the own normal: no challenge
  const out = [];
  for (const x of TEMPLATES) {
    if ((ton !== 'mix' && x.ton !== ton) || off.includes(x.id) || (calm && x.chal)) continue;
    const m = x.make(ctx);
    if (!m) continue;
    [m.text, ...(m.alts ?? [])].forEach((text, i) => out.push({ id: i ? `${x.id}~${i + 1}` : x.id, src: x.src, ton: x.ton, text, why: m.why, lang: 'gsw' }));
  }
  for (const q of quoteEntries(ctx)) if ((ton === 'mix' || ton === q.ton) && !off.includes(baseId(q.id))) out.push(q);
  return out;
}

/**
 * Choose one sentence: { id, src, ton, text, why, lang } or null when nothing fits.
 * 1. not one of the last 30 shown (rec.recent); when all that fit are in it, the oldest of them is let free;
 * 2. quotes only when nothing else is left, and as every 4th sentence (when none of the last 3 shown was a quote);
 * 3. if possible not the same source as the last one and (in the mix) not the same tone;
 * 4. among the rest one by chance (`rand`, 0 ≤ x < 1; a test passes its own).
 * `not`: a sentence to leave out as well, with its other wordings (the one on the screen when «New» is tapped).
 */
export function pickSpruch(ctx, rec = null, { ton = 'mix', rand = Math.random, not = '' } = {}) {
  const r = spruchOf(rec);
  const all = fitting(ctx, { ton, off: r.off }).filter((x) => !not || baseId(x.id) !== baseId(not));
  if (!all.length) return null;
  const seen = new Map(r.recent.map((x, i) => [x.id, i]));
  let pool = all.filter((x) => !seen.has(x.id));
  if (!pool.length) {
    // everything that fits was shown lately: let the oldest free (the largest index in the history)
    const oldest = Math.max(...all.map((x) => seen.get(x.id)));
    pool = all.filter((x) => seen.get(x.id) === oldest);
  }
  // quotes: every 4th sentence, or when nothing else is left
  const quotes = pool.filter((x) => x.src === 'quote');
  const data = pool.filter((x) => x.src !== 'quote');
  const wantQuote = r.recent.length >= 3 && !r.recent.slice(0, 3).some((x) => x.src === 'quote');
  if (quotes.length && (wantQuote || !data.length)) pool = quotes;
  else if (data.length) pool = data;
  const last = r.recent[0];
  const other = pool.filter((x) => !last || x.src !== last.src);
  const step1 = other.length ? other : pool;
  const other2 = ton === 'mix' && last ? step1.filter((x) => x.ton !== last.ton) : step1;
  const list = other2.length ? other2 : step1;
  return list[Math.min(list.length - 1, Math.floor(rand() * list.length))];
}
