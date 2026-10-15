/**
 * «Inhalte Flow» IF1–IF3 (Noah 14.10.2026, answers «1b 2a 3a 4a», mockups approved 04:32 «IF1–IF3
 * freigegeben»): three small kinds of text on a page, each a suggestion that can be hidden.
 *   - the tip line «Gut zu wissen»: one tip a day, own words, × hides it for today, «Alle Tipps» shows all
 *     (IF3: switch single tips off, all tips off, add an own tip);
 *   - the fold «Das kann die App hier»: closed, a few rows, each opens the place in the app (1b);
 * The tiles «Weiter» (3a) are the page tiles of SK (src/lib/sk/PageTiles.svelte, approved 13.10.2026):
 * one tile row at the page end, with links outside and own links, so they are not here twice.
 * «Wusstest du» WD1 + WD3 (Noah 14.10.2026, mockups approved 18:34 «wd1-wd3 freigegeben», «1a»): a tip has a
 * kind: 'tip' (Gut zu wissen), 'know' (Wusstest du: background, ideas, a smile; on unless the switch says
 * «only useful tips») or 'today' (Passt zu heute: only on a day that fits, `when` heat, foehn, sauna, cold
 * or long; such a tip comes first on its day).
 * «Einstieg» (Noah 15.10.2026 «1a 2a 3a 4a», lib/intro.js): a tip may carry `months` (a «Passt zu heute» that
 * fits in those months, e.g. the ski season), `button` + `href` (one step that starts it) and `source` (a
 * «Good to know» with its source; factOfDay picks one). Pages «touren» and «material» are new.
 * Pure data and functions; the texts are English keys translated with t() at the call site (German in
 * i18n/de/pageinfo.js). The state lives in one setting (PAGEINFO_KEY), on the device and in the backup.
 */
export const PAGEINFO_KEY = 'pageInfo';
/** Heat from this many °C, cold below this many °C, a long tour from this many km (WD3). */
export const HEAT_C = 28;
export const COLD_C = 5;
export const LONG_KM = 100;

/** «Passt zu heute» (WD3): each only on a day that fits; `note` says when, in the list «All tips». */
export const TODAY_TIPS = [
  { id: 'today-heat', kind: 'today', when: 'heat', note: 'only from 28 °C', text: 'In the heat plan about half a litre of water per hour. A fountain on the way is lighter than the third bottle.' },
  { id: 'today-foehn', kind: 'today', when: 'foehn', note: 'only on a föhn day', text: 'Föhn today: warm, dry wind from the south. Against the wind the way home can take longer than the way out.' },
  { id: 'today-sauna', kind: 'today', when: 'sauna', note: 'only on a day with sauna', text: 'Finland has about 3 million saunas for about 5.5 million people.' },
  { id: 'today-cold', kind: 'today', when: 'cold', note: 'only below 5 °C', text: 'Below 5 °C fingers and toes get cold first. Gloves and overshoes make the ride much nicer.' },
  { id: 'today-long', kind: 'today', when: 'long', note: 'only before a tour over 100 km', text: 'A long tour is coming: a spare tube, a pump and food for the whole day belong in the bag.' },
];

/**
 * The pages with their tips and rows. In hrefs `{base}` is the page's own address (an activity page).
 * A tile: { id, icon, title, sub, href } inside the app, or { …, out: 'https://…', domain } outside;
 * { id, own: true, title, sub } is an empty slot for an own link (e.g. «My music», DG-X8).
 */
export const PAGES = {
  aktiv: {
    tips: [
      { id: 'aktiv-rolling', text: 'The rings always count the last 7 days. A rest day does not cost everything at once.' },
      { id: 'aktiv-one-ring', text: 'Move, Mindful, Recovery: if you only fill one ring, you see it here first.' },
      { id: 'aktiv-amount', text: 'A long press enters another amount, for example 25 push-ups instead of 10.' },
      { id: 'aktiv-strava', text: 'Rides from Strava and trip days count on «Cycling outdoors» by themselves.' },
      { id: 'know-baspo', kind: 'know', text: 'The Federal Office of Sport recommends at least 150 minutes of moderate exercise a week for adults.', source: 'Federal Office of Sport (BASPO)' },
      { id: 'know-who-strength', kind: 'know', text: 'Adults should also strengthen their muscles on two or more days a week.', source: 'World Health Organization (WHO), 2020' },
      { id: 'aktiv-ski', kind: 'today', when: 'month', months: [10, 11], note: 'only in October and November', text: 'The ski season is coming. Set a goal «ski tour once a week» now, then it counts from the first snow.', button: 'Set a goal', href: '#/flow/goals' },
      { id: 'aktiv-spring', kind: 'today', when: 'month', months: [3, 4], note: 'only in March and April', text: 'The cycling season starts. A goal «cycling twice a week» brings you into it gently.', button: 'Set a goal', href: '#/flow/goals' },
      { id: 'know-strava', kind: 'know', text: 'The name Strava comes from the Swedish «sträva», which means «to strive».' },
      { id: 'know-star', kind: 'know', text: 'Every star was once a «just quickly».' },
      ...TODAY_TIPS,
    ],
    can: [
      { id: 'rings', title: 'Rings over 7 days', sub: 'Move, Mindful and Recovery count on a rolling basis', href: '#/flow/goals' },
      { id: 'window', title: 'Goals with their own window', sub: '1, 7, 10 or 30 days, with a season', href: '#/flow/goals' },
      { id: 'strava', title: 'Strava counts along', sub: 'Your rides tick off «Cycling outdoors»', href: '#/debrief/ride' },
      { id: 'counts', title: '«Counts too»', sub: 'Commuting and trip days count by themselves', href: '#/flow/goals' },
    ],
  },
  touren: {
    tips: [
      { id: 'touren-template', text: 'A good trip becomes a template: the next weekend starts with the right list.', button: 'Templates', href: '#/pack/templates' },
      { id: 'touren-weather', text: 'Fetch the weather about three days before: then the clothes on the list fit the forecast.' },
      { id: 'touren-debrief', text: 'Look back the day after: what you did not use gets quieter on the next list.', button: 'Look back|page', href: '#/debrief' },
      { id: 'touren-blocks', text: 'Building blocks like «Rain» add a whole package to a trip with one tap.', button: 'Building blocks', href: '#/blocks' },
      { id: 'know-veloland', kind: 'know', text: 'Switzerland has nine national cycle routes, signposted in red and white.', source: 'SwitzerlandMobility' },
      ...TODAY_TIPS.filter((x) => x.when === 'long' || x.when === 'cold' || x.when === 'heat'),
    ],
    can: [],
  },
  material: {
    tips: [
      { id: 'material-weigh', text: 'Weigh the heavy things first: three items often make half of the base weight.' },
      { id: 'material-bag', text: 'Give each item its usual bag. Packing then shows the weight per bag.' },
      { id: 'material-block', text: 'Three items you always take together make a good building block.', button: 'Building blocks', href: '#/blocks' },
      { id: 'material-wish', text: 'Note what you want to buy on the wish list, with the price: the shopping tab adds it up.', button: 'Shopping|tab', href: '#/gear?view=wish' },
      { id: 'know-ultralight', kind: 'know', text: 'In bikepacking and hiking a base weight under 4.5 kg (10 lb) is usually called «ultralight».', source: 'common definition of the ultralight community' },
      ...TODAY_TIPS.filter((x) => x.when === 'cold'),
    ],
    can: [],
  },
  meditation: {
    tips: [
      { id: 'med-short', text: 'Short and often carries further than rare and long. 5 minutes count.' },
      { id: 'med-depth', text: 'The depth after the gong is only for you. Under Patterns you see when it goes deepest.' },
      { id: 'med-gongs', text: 'Interval gongs help you come back when your thoughts wander.' },
      { id: 'med-tpl', text: 'Templates keep the length, sound and place. One tap and it runs.' },
      { id: 'know-meditari', kind: 'know', text: 'The word «meditation» comes from the Latin «meditari»: to ponder or to practise.' },
      { id: 'know-after-ride', kind: 'know', text: 'Idea: try a session right after a ride, when the body calms down anyway.' },
      ...TODAY_TIPS.filter((x) => x.when === 'sauna'),
    ],
    can: [
      { id: 'tpl', title: 'Templates', sub: 'length, sound and place with one tap', href: '{base}/timer' },
      { id: 'gongs', title: 'Interval gongs', sub: 'help you come back', href: '{base}/timer' },
      { id: 'log', title: 'Log', sub: 'list, calendar and curve', href: '{base}/log' },
      { id: 'patterns', title: 'Patterns', sub: 'when it goes deepest', href: '{base}/muster' },
      { id: 'more', title: 'Quotes and own links', sub: 'under More', href: '{base}/mehr' },
    ],
  },
};

/** The stored state made whole. */
export function infoOf(v) {
  const o = v && typeof v === 'object' ? v : {};
  const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
  return {
    tipsOn: o.tipsOn !== false,
    knowOn: o.knowOn !== false,
    off: Array.isArray(o.off) ? o.off.filter((x) => typeof x === 'string') : [],
    own: obj(o.own),
    gone: obj(o.gone),
    canOff: obj(o.canOff),
  };
}

const list = (x) => (Array.isArray(x) ? x : []);
/** The page's own tips (the user's). */
export const ownTips = (info, page) => list(infoOf(info).own[page]).filter((x) => x && typeof x.text === 'string' && x.text.trim());

/** All tips of a page, built in first, then the own ones, each with `on`. */
export function allTips(info, page) {
  const i = infoOf(info);
  const off = new Set(i.off);
  const base = list(PAGES[page]?.tips).map((x) => ({ kind: 'tip', ...x, on: !off.has(x.id) }));
  return [...base, ...ownTips(i, page).map((x) => ({ id: x.id, kind: 'tip', text: x.text, own: true, on: !off.has(x.id) }))];
}

const dayNo = (day) => Math.floor(Date.parse(`${day}T00:00:00Z`) / 864e5);
const pick = (xs, day) => xs[((dayNo(day) % xs.length) + xs.length) % xs.length];
/** The tips that can come today: switched on, «Wusstest du» only while knowOn, «Passt zu heute» only when ctx fits. */
function dayTips(i, page, ctx = {}) {
  const on = allTips(i, page).filter((x) => x.on && (x.kind !== 'know' || i.knowOn));
  // the day's weather (heat, föhn …) fits better than the month: a month tip only on a day without one
  const day = on.filter((x) => x.kind === 'today' && x.when !== 'month' && ctx[x.when]);
  const fit = day.length ? day : on.filter((x) => x.kind === 'today' && x.when === 'month' && (x.months ?? []).includes(ctx.month));
  return { fit, rest: on.filter((x) => x.kind !== 'today') };
}
/**
 * The tip of the day (the same all day, the next one tomorrow); a fitting «Passt zu heute» comes first.
 * null when tips are off, hidden today or none is on. ctx: { heat, foehn, sauna, cold, long, max } (contextOf).
 */
export function tipOfDay(info, page, today, ctx = {}) {
  const i = infoOf(info);
  if (!i.tipsOn || i.gone[page] === today) return null;
  const { fit, rest } = dayTips(i, page, ctx);
  if (fit.length) return pick(fit, today);
  return rest.length ? pick(rest, today) : null;
}
/** Which number the tip of the day is among the tips that can come today (1-based), and how many there are. */
export function tipPlace(info, page, today, ctx = {}) {
  const tip = tipOfDay(info, page, today, ctx);
  if (!tip) return null;
  const { fit, rest } = dayTips(infoOf(info), page, ctx);
  const all = tip.kind === 'today' ? fit : rest;
  return { n: all.findIndex((x) => x.id === tip.id) + 1, of: all.length };
}

/**
 * «Einstieg» 3a: one «Good to know» with its source (a built-in tip with `source`), the same all day; null
 * when tips or «Wusstest du» are off or the page has none. `skip`: the id of the tip of the day (never twice).
 */
export function factOfDay(info, page, today, skip = null) {
  const i = infoOf(info);
  if (!i.tipsOn || !i.knowOn) return null;
  const off = new Set(i.off);
  const xs = list(PAGES[page]?.tips).filter((x) => x.source && !off.has(x.id) && x.id !== skip);
  return xs.length ? { kind: 'know', ...pick(xs, today) } : null;
}

/**
 * What kind of day it is (WD3), from today's home forecast day ({ min, max, rainMm, windDir, gust }), the
 * activity log of today ([{ actId }]) and the trips ([{ startDate, route: { km } }]). Föhn: dry (under
 * 1 mm), the wind mostly from the south (140–230°) and gusts of 45 km/h or more.
 */
export function contextOf({ day = null, log = [], trips = [] } = {}, today) {
  const max = typeof day?.max === 'number' ? day.max : null;
  const min = typeof day?.min === 'number' ? day.min : null;
  const dir = day?.windDir;
  const tomorrow = new Date(`${today}T00:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const soon = [today, tomorrow.toISOString().slice(0, 10)];
  return {
    max,
    month: Number(String(today ?? '').slice(5, 7)) || null,
    heat: max != null && max >= HEAT_C,
    cold: min != null && min < COLD_C,
    foehn: typeof dir === 'number' && dir >= 140 && dir <= 230 && (day?.gust ?? 0) >= 45 && (day?.rainMm ?? 0) < 1,
    sauna: list(log).some((x) => x?.day === today && /sauna/i.test(String(x.actId ?? ''))),
    long: list(trips).some((x) => soon.includes(x?.startDate) && Number(x?.route?.km) > LONG_KM),
  };
}

/** The rows of «Das kann die App hier» with the page's address filled in. */
export const canRows = (page, base = '') => list(PAGES[page]?.can).map((r) => ({ ...r, href: r.href.replace('{base}', base) }));

/* ---------- changes (each returns the new stored value) ---------- */
export const setTipsOn = (info, on) => ({ ...infoOf(info), tipsOn: !!on });
/** WD1: «Only useful tips» (false) or «Also knowledge and fun» (true), for all pages. */
export const setKnowOn = (info, on) => ({ ...infoOf(info), knowOn: !!on });
export function setTip(info, id, on) {
  const i = infoOf(info);
  const off = new Set(i.off);
  on ? off.delete(id) : off.add(id);
  return { ...i, off: [...off] };
}
export const hideToday = (info, page, today) => {
  const i = infoOf(info);
  return { ...i, gone: { ...i.gone, [page]: today } };
};
export function addTip(info, page, text, now = Date.now()) {
  const i = infoOf(info);
  const tx = String(text ?? '').trim().slice(0, 240);
  if (!tx) return i;
  return { ...i, own: { ...i.own, [page]: [...ownTips(i, page), { id: `own-${now.toString(36)}`, text: tx }] } };
}
export function removeTip(info, page, id) {
  const i = infoOf(info);
  return { ...i, own: { ...i.own, [page]: ownTips(i, page).filter((x) => x.id !== id) }, off: i.off.filter((x) => x !== id) };
}
export const setCan = (info, page, on) => {
  const i = infoOf(info);
  return { ...i, canOff: { ...i.canOff, [page]: !on } };
};
export const canShown = (info, page) => !infoOf(info).canOff[page];

/* ---------- WD2 «Erde und Everest» (approved 18:34, «2a»: always, for the period chosen) ---------- */
export const EARTH_KM = 40075;
export const EVEREST_M = 8849;
/**
 * How far around the Earth (at the equator) and how often up the Everest the km and metres climbed of a
 * period go. Each null when there is nothing to count. pct: % of the first round; laps/times with one
 * decimal; fill: the bar (the part of the round or Everest under way); left: km or m to the next one.
 */
export function farOf(km, gainM) {
  const part = (v, of) => {
    if (!(Number(v) > 0)) return null;
    const x = v / of;
    const next = Math.floor(x) + 1;
    return { x: Math.floor(x * 10) / 10, pct: Math.floor(x * 100), fill: x - Math.floor(x), next, left: Math.ceil(next * of - v) };
  };
  return { earth: part(km, EARTH_KM), everest: part(gainM, EVEREST_M) };
}
