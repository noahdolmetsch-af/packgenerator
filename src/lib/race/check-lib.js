/**
 * «Rennen-Check» (Ziel 6, Noah 27.10.2026 «diesen Check 1:1 auf die App bringen», «1b 2b»): the sheets
 * of the paper check for every race, on the page «Rennen detailliert planen» (#/racecheck/<tripId>). 1 the order A to Z, 2 the target setup per
 * bag, 3 the basic list, 4 sleep variants side by side, 5 one night played through, 6 the day before the start (Noah «7a»).
 *
 * The answers live in the race (stored.check = { values: { key: value }, at }), so they are in the backup.
 * The keys are the same as on the fillable sheets page, so its answers load 1:1 (answersFrom).
 * Every text here is a general suggestion (English keys for t()); your own words go into the fields.
 * Tested in tests/race-check.test.js.
 */

export const SHEETS = [
  { id: 'ablauf', tab: '1 Order', title: 'Packing from A to Z', lead: 'Go through every step. Write what fits you, change or delete the rest. Everything saves by itself.' },
  { id: 'setup', tab: '2 Target setup', title: 'Target setup', lead: 'What goes in which bag? This becomes your target. Weigh what is missing on the kitchen scale.' },
  { id: 'liste', tab: '3 Basic list', title: 'Race basic list', lead: '«Always» means: comes along every time. «Only if» needs a reason. Everything else stays at home.' },
  { id: 'schlaf', tab: '4 Sleep', title: 'Sleep: play the variants through', lead: 'Write for every variant what it means for you. Then pick one.' },
  { id: 'nacht', tab: '5 Night', title: 'Play one night through', lead: 'Take a real night from a past race or a planned one. Write for every time what you do and need.' },
  { id: 'vorher', tab: '6 Day before', title: 'The day before the start', lead: 'The evening before the start: write your plan once, then tick off what is done. Change or delete what does not fit.' },
];

/** Sheet 1: the steps. extra: 'race' = the race and the four questions, 'test' = the test ride. */
export const STATIONS = [
  { k: 'A', t: 'The race and the four questions', tip: 'Which race? Which bike? Sleep outside? Cook? Ride at night?', extra: 'race' },
  { k: 'B', t: 'Bike and target setup', tip: 'Details on sheet 2.', ph: 'e.g. Nothing new from 5 weeks before. Bike checked 3 weeks before.' },
  { k: 'C', t: 'Basic list «always comes along»', tip: 'Details on sheet 3.', ph: 'e.g. 1 for rain, 1 warm, 1 for wind. What is not on the list needs a reason.' },
  { k: 'D', t: 'Extras only with a reason (weather, night, sleep)', tip: 'Write the reason, e.g. «because the night is below 5 °C».', ph: '' },
  { k: 'E', t: 'Every thing has exactly one bag', tip: '', ph: 'e.g. No bag in a bag. Always the same place, on every ride.' },
  { k: 'F', t: 'Test ride fully loaded', tip: '', ph: 'e.g. From 3 weeks before, full bottles, lights, everything. After it no more setup questions.', extra: 'test' },
  { k: 'Z', t: 'Looking back: never used?', tip: '', ph: 'e.g. Not used once: question mark. Not used twice: it stays at home.' },
];
export const RACE_QUESTIONS = [
  { k: 'outside', label: 'sleep outside' },
  { k: 'cook', label: 'cook' },
  { k: 'night', label: 'ride at night' },
  { k: 'depot', label: 'drop bag on the way' },
];

/** Sheet 2: the bags. n = the number in the sketch (0 = not in the sketch). */
export const BAGS = [
  { n: 1, name: 'Saddle bag', ph: 'e.g. spare shorts, emergency bivy, wash bag' },
  { n: 2, name: 'Top tube bag', ph: 'e.g. power bank, cables, sun cream' },
  { n: 3, name: 'Frame bag', ph: 'e.g. rain jacket, head torch, food' },
  { n: 4, name: 'Down tube / tools', ph: 'e.g. tube, tyre levers, cable ties, plug kit, pump' },
  { n: 5, name: 'Food pouches', ph: 'e.g. left gels, right bars' },
  { n: 0, name: 'Bottles', ph: 'e.g. how many litres, where they sit' },
  { n: 0, name: 'On the bike', ph: 'e.g. bike computer, phone mount, lights' },
  { n: 0, name: 'Jersey / on the body', ph: 'e.g. phone, card, cash, heart-rate strap' },
];

/** Sheet 3: the groups of the basic list. */
export const LIST = [
  { name: 'On the body', ph: 'e.g. bib shorts, jersey, socks, shoes, helmet, glasses, gloves', on: true },
  { name: 'Rain', ph: 'e.g. 1 rain jacket', w: 'e.g. rain trousers only if …', on: true },
  { name: 'Warm', ph: 'e.g. leg warmers, thin fleece, buff, thin gloves', w: 'e.g. down jacket only if the night is below … °C', on: true },
  { name: 'Wind', ph: 'e.g. wind vest', on: true },
  { name: 'Electronics', ph: 'e.g. bike computer, phone, power bank, charger, cables', on: true },
  { name: 'Light', ph: 'e.g. front light, rear light, head torch', on: true },
  { name: 'Tools', ph: 'e.g. multitool, tyre levers, tube, pump, cable ties, chain oil', on: true },
  { name: 'Food / drink', ph: 'e.g. 2 bottles, powder for 4 h, gels for 3 h. Buy the rest on the way.', on: true },
  { name: 'Wash bag', ph: 'e.g. sun cream, chamois cream, wipes, toothbrush, ear plugs', on: true },
  { name: 'Money / papers', ph: 'e.g. ID, card, cash, small lock', on: true },
  { name: 'Sleep', ph: 'e.g. emergency bivy', w: 'e.g. mat / quilt only if …', on: true },
  { name: 'Evening / comfort', ph: 'e.g. fresh shorts, T-shirt', on: false },
  { name: 'My own', ph: '', on: false },
];

/** Sheet 4: the sleep variants (columns) and what you write for each (rows). */
export const SLEEP_COLS = ['Hotel + emergency bivy', 'Only hotels', 'Tent / quilt / mat', 'Only bivy + mat'];
export const SLEEP_ROWS = ['Sleep weight', 'Time lost by the weight', 'Flexible where to stop', 'Recovery', 'Costs', 'The first night', 'When do you book?', 'What changes in packing?', 'How does it feel?', 'Mark 1–5'];

/** Sheet 5: one night, hour by hour. */
export const NIGHT = [
  ['17:00', 'Where is the last open shop before the night? When does it close?', ''],
  ['17:30', 'What do you buy for the night? (Food, drink, for how many hours?)', 'e.g. Eat in the shop at once, then buy for the night.'],
  ['19:00', 'Where is the next bed? Call whether a late check-in works?', ''],
  ['20:30', 'Change lights and clothes: what do you put on?', ''],
  ['21:30', 'Sunset. Ride on or sleep? How do you decide?', ''],
  ['23:00', 'How long do you ride on? What is your sign to stop (tired, cold, hungry)?', ''],
  ['00:00', 'Where do you sleep? How long?', 'e.g. Sleep 4–6 h between 00:00 and 04:30, a 20 min nap in the day.'],
  ['04:30', 'Getting up: where is breakfast or the first open shop?', ''],
  ['Sunday', 'What do you do if tomorrow is Sunday and everything is closed?', ''],
];

/** Sheet 6: the evening before the start (Noah «7a»: charging, food, clothes, start time). */
export const DAY_BEFORE = [
  { name: 'Charge', ph: 'e.g. bike computer, phone, power bank, lights, heart-rate strap' },
  { name: 'Food', ph: 'e.g. a big pasta dinner at 18:00, breakfast 2 h before the start' },
  { name: 'Clothes for the start', ph: 'e.g. lay out everything; look at the weather for the first night' },
  { name: 'Start time and alarm', ph: 'e.g. start 06:00, alarm 04:30, 20 min to the start' },
  { name: 'Bike ready', ph: 'e.g. tyres pumped, chain oiled, track on the bike computer' },
  { name: 'Bottles and food on the bike', ph: 'e.g. 2 bottles filled, food for the first 4 h in the pouches' },
  { name: 'Sleep the night before', ph: 'e.g. in bed by 21:00, ear plugs, phone on silent' },
];

/** Every key with its empty start value (text '' or a tick). */
export function fieldKeys() {
  const out = {};
  for (const s of STATIONS) out[`ablauf.${s.k}`] = '';
  for (const k of ['race', 'racedate', 'racekm', 'racedays', 'depotkm', 'testdate', 'testkm', 'testbad', 'missing']) out[`ablauf.${k}`] = '';
  for (const q of RACE_QUESTIONS) out[`ablauf.q.${q.k}`] = q.k === 'night';
  BAGS.forEach((_, i) => ['v', 'g', 'full'].forEach((f) => (out[`setup.${i}.${f}`] = '')));
  for (const k of ['total', 'gone', 'newbags']) out[`setup.${k}`] = '';
  LIST.forEach((r, i) => {
    out[`liste.${i}.v`] = '';
    out[`liste.${i}.on`] = !!r.on;
    out[`liste.${i}.w`] = '';
    out[`liste.${i}.bag`] = '';
  });
  SLEEP_ROWS.forEach((_, i) => SLEEP_COLS.forEach((_, j) => (out[`schlaf.${i}.${j}`] = '')));
  out['schlaf.own'] = '';
  out['schlaf.rule'] = '';
  NIGHT.forEach((_, i) => (out[`nacht.${i}`] = ''));
  out['nacht.help'] = '';
  DAY_BEFORE.forEach((_, i) => {
    out[`vorher.${i}.v`] = '';
    out[`vorher.${i}.done`] = false;
  });
  out['vorher.own'] = '';
  return out;
}
const KEYS = fieldKeys();

/** The value of one field: yours, else the empty start. */
export const valueOf = (check, key) => (check?.values && key in check.values ? check.values[key] : KEYS[key]);

/** The check with one field changed (a new object, for saveRace). */
export function withValue(check, key, value, now = new Date().toISOString()) {
  return { ...(check ?? {}), values: { ...(check?.values ?? {}), [key]: value }, at: now };
}

/**
 * Answers from a file (the fillable sheets page: { values } or { data: { values } }): only known keys,
 * text or ticks. → { values, n } or null when nothing fits.
 */
export function answersFrom(json) {
  const src = json?.values ?? json?.data?.values ?? json?.check?.values ?? null;
  if (!src || typeof src !== 'object') return null;
  const values = {};
  for (const [k, v] of Object.entries(src)) {
    if (!(k in KEYS)) continue;
    if (typeof KEYS[k] === 'boolean') values[k] = v === true;
    else if (typeof v === 'string' || typeof v === 'number') values[k] = String(v).slice(0, 4000);
  }
  const n = Object.keys(values).length;
  return n ? { values, n } : null;
}

/** How far a sheet is filled: { done, of } over its text fields. */
export function filled(check, sheet) {
  const keys = Object.keys(KEYS).filter((k) => k.startsWith(`${sheet}.`) && typeof KEYS[k] === 'string');
  const done = keys.filter((k) => String(valueOf(check, k) ?? '').trim()).length;
  return { done, of: keys.length };
}

/** Fields that belong to one race only and are not taken over into the next (name, date, test ride …). */
export const OWN_RACE_KEYS = ['ablauf.race', 'ablauf.racedate', 'ablauf.racekm', 'ablauf.racedays', 'ablauf.depotkm', 'ablauf.testdate', 'ablauf.testkm', 'ablauf.testbad', ...DAY_BEFORE.map((_, i) => `vorher.${i}.done`)];

/**
 * Take over another race's check: its answers go into the fields that are still empty here (your own
 * answers stay), except the fields of one race only. → { check, n } (n = fields filled) .
 */
export function takeOver(mine, other, now = new Date().toISOString()) {
  const values = { ...(mine?.values ?? {}) };
  let n = 0;
  for (const [k, v] of Object.entries(other?.values ?? {})) {
    if (!(k in KEYS) || OWN_RACE_KEYS.includes(k)) continue;
    const empty = !(k in values) || (typeof KEYS[k] === 'string' && !String(values[k] ?? '').trim());
    if (!empty) continue;
    if (typeof KEYS[k] === 'string' && !String(v ?? '').trim()) continue;
    values[k] = v;
    n++;
  }
  return { check: { ...(mine ?? {}), values, at: now }, n };
}

/**
 * Grams from what you wrote: «200», «2× 100», «1.2 kg», «150 g + 40». Every number counts; «N×» multiplies
 * the number after it; «kg» turns kilos into grams. → grams or null when there is no number.
 */
export function gramsOf(text) {
  const s = String(text ?? '').toLowerCase().replace(/(\d),(\d)/g, '$1.$2');
  const re = /(?:(\d+(?:\.\d+)?)\s*[x×]\s*)?(\d+(?:\.\d+)?)\s*(kg|g)?/g;
  let sum = 0;
  let any = false;
  for (const m of s.matchAll(re)) {
    if (!m[2]) continue;
    const times = m[1] ? Number(m[1]) : 1;
    const n = Number(m[2]) * (m[3] === 'kg' ? 1000 : 1);
    sum += times * n;
    any = true;
  }
  return any ? Math.round(sum) : null;
}

/**
 * The weight of the target setup (sheet 2): empty and full per bag added up, against your target.
 * → { empty, full, target, over (full − target, + = too heavy), bags: [{ i, empty, full }], counted }
 */
export function setupWeight(check) {
  const bags = BAGS.map((_, i) => ({ i, empty: gramsOf(valueOf(check, `setup.${i}.g`)), full: gramsOf(valueOf(check, `setup.${i}.full`)) }));
  const empty = bags.reduce((a, b) => a + (b.empty ?? 0), 0);
  const full = bags.reduce((a, b) => a + (b.full ?? b.empty ?? 0), 0);
  const target = gramsOf(valueOf(check, 'setup.total'));
  const counted = bags.filter((b) => b.empty != null || b.full != null).length;
  return { empty, full, target, over: target != null && counted ? full - target : null, bags, counted };
}

/** Sheet 6: how many steps are ticked off. → { done, of } */
export function dayBeforeDone(check) {
  const done = DAY_BEFORE.filter((_, i) => valueOf(check, `vorher.${i}.done`) === true).length;
  return { done, of: DAY_BEFORE.length };
}
