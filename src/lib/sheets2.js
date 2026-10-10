/**
 * v0.70.0 «Velo-Blätter Teil 2» (Noah 10.10.2026, W1–W7 all «a»): the four more sheets of a bike's
 * folder, next to the four of sheets.js. Pure functions, tested in tests/sheets2.test.js.
 *
 * - Break-in plan (W1 a, W2 a, W3 a): four steps (after the first ride, about 50 km, 100–150 km, the
 *   first service at 300–500 km or three months), each with tick rows. The ticks are stored on the
 *   bike with the day and the km of the tick; «Take the ticked into care» makes care entries «by me»
 *   (the inspection: by the bike shop). A step is due by km or by date, whichever comes first; Today
 *   reminds of a due step (sheetReminders).
 * - Repair kit (W4 a, W5 a): per kind of ride (after-work ride, day tour, multi-day) the rows
 *   «Matching this bike» (sizes from the parts), «Tools» and «Emergency»; each row finds its item in
 *   the gear list (or says it is missing there), with a tick «packed» per kind of ride.
 * - Warranty & receipts (W6 a): the purchase, the warranty per part with its end, the parts replaced
 *   since (from the workshop visits), the receipts; Today reminds 30 days before a warranty ends.
 * - Theft sheet (W7 a): frame number, marks, photos, insurance and what to do. The frame number is in
 *   the PDF and the copied text; otherwise it stays on this device.
 *
 * Stored on the bike, next to the values of sheets.js:
 * bike.sheets.breakin = { ticks: { 's1:bolts': { date, km } }, applied: { id: date }, remind: true }
 * bike.sheets.kit = { type: 'evening' | 'day' | 'multi', ticks: { type: { rowKey: true } } }
 * bike.sheets.warranty = { shop, price, years: { frame: 5, … }, remind: true, calendar: false }
 * bike.sheets.theft = { frameNo, colour, marks, changes, sensor, hidden, insurer, policy, sum, deductible, report }
 * bike.sheets.snooze = { reminderKey: date } («later» on Today: not before that day)
 * The purchase date is the bike's own bought (the same as in Care's start values).
 */
import { PART, CHECK_PARTS, ensureParts, logPart, fits } from './care.js';
import { fitValue, hasSuspension, specValue } from './bikespecs.js';
import { bikesHash, bikeWeightKind, bikeTypeName } from './bikes.js';
import { itemWeight, nextId } from './gear.js';
import { slotFor } from './trips.js';
import { sheetsOf, sheetText, bikeLine, isShown, firstServiceDone, NEW_KM } from './sheets.js';
import { t, tn, num, dateOf, locale, nameOf } from './i18n.svelte.js';

/* ---------- days ---------- */

const DAY = 864e5;
const ms = (iso) => Date.parse(`${iso}T00:00:00Z`);
export const addDays = (iso, n) => new Date(ms(iso) + n * DAY).toISOString().slice(0, 10);
export const daysBetween = (a, b) => Math.round((ms(b) - ms(a)) / DAY);
/** The same day n years later (29 February → 28 February). */
export function addYears(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const last = new Date(Date.UTC(y + n, m, 0)).getUTCDate();
  return `${y + n}-${String(m).padStart(2, '0')}-${String(Math.min(d, last)).padStart(2, '0')}`;
}
/** «4 Oct» / «4. Okt.» (day and month only). */
export const dayMonth = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', timeZone: 'UTC' });

const tubeless = (tyres) => tyres?.front === 'tubeless' || tyres?.rear === 'tubeless';
/** Does a row or part fit this bike: susp (a suspension fork), full (a rear shock), tubeless. */
function fitsWhen(when, bike, tyres) {
  if (!when) return true;
  if (when === 'susp') return hasSuspension(bike, 'fork') || hasSuspension(bike, 'shock');
  if (when === 'fork') return hasSuspension(bike, 'fork');
  if (when === 'full') return hasSuspension(bike, 'shock');
  if (when === 'tubeless') return tubeless(tyres);
  return true;
}
const pair = (a, b, unit) => (a == null && b == null ? null : `${a ?? '–'} / ${b ?? '–'} ${unit}`);
/** Fork and shock pressure «85 / 190 psi» (only the fork on a hardtail). */
function suspValue(bike) {
  const f = fitValue(bike, 'forkPressure');
  const s = hasSuspension(bike, 'shock') ? fitValue(bike, 'shockPressure') : null;
  if (!hasSuspension(bike, 'shock')) return f == null ? null : `${num(f)} psi`;
  return pair(f == null ? null : num(f), s == null ? null : num(s), 'psi');
}
const tyreValue = (bike) => {
  const f = fitValue(bike, 'pressureF');
  const r = fitValue(bike, 'pressureR');
  return pair(f == null ? null : num(f), r == null ? null : num(r), 'bar');
};

/* ---------- the Break-in plan (W1 a, W2 a, W3 a) ---------- */

/**
 * The four steps. km: due from these km; days: due that many days after the purchase (whichever
 * comes first). Row: value (a text, or 'susp' / 'tyres' for the bike's pressures), when (only on a
 * bike with that), parts (the care parts a tick is written to; 'check': the check points of the
 * 1000 km check), action (check or service), by (me; the inspection: the bike shop), link (a sheet).
 */
export const BREAKIN = [
  {
    key: 's1',
    name: 'After the first ride',
    km: 1,
    days: null,
    rows: [
      { key: 'bolts', label: 'Tighten stem, handlebar and seatpost clamp', value: '5 Nm', parts: ['bolts'] },
      { key: 'sag', label: 'Measure the sag front and rear', value: 'susp', when: 'susp', parts: ['fork', 'shock'], sag: true },
      { key: 'brakes', label: 'Brakes do not rub, levers firm', value: 'ok|fine', parts: ['brakeF', 'brakeR'] },
      { key: 'shift', label: 'Shifting: every gear clean', value: 'ok|fine', parts: ['shifting'] },
    ],
  },
  {
    key: 's2',
    name: 'After about 50 km',
    km: 50,
    days: 14,
    rows: [
      { key: 'pads', label: 'Brake pads bedded in?', value: 'Test ride|value', hint: '10–20 times hard from 25 km/h, without locking', parts: ['padsF', 'padsR'], action: 'service' },
      { key: 'cable', label: 'Adjust the shift cable', value: '½ turn', hint: 'New cables settle in the first km', parts: ['shifting'], action: 'service' },
      { key: 'air', label: 'Measure fork and shock pressure again', value: 'susp', when: 'susp', hint: 'A little air goes at the start', parts: ['fork', 'shock'] },
      { key: 'tl', label: 'Tubeless: does the pressure hold overnight?', value: 'tyres', when: 'tubeless', parts: ['tyres'] },
    ],
  },
  {
    key: 's3',
    name: 'After 100–150 km',
    km: 100,
    days: 30,
    rows: [
      { key: 'torque', label: 'Tighten every bolt with the torque wrench', value: '5–12 Nm', hint: 'Stem, saddle, brake calipers, thru axles', parts: ['bolts'] },
      { key: 'spokes', label: 'Check the spoke tension', value: 'By feel', hint: 'New wheels settle, squeeze the spokes in pairs', parts: ['wheelF', 'wheelR'] },
      { key: 'headset', label: 'Check the headset for play', value: 'no play', hint: 'Pull the front brake, push the bike back and forth', parts: ['bearings'] },
      { key: 'sealant', label: 'Check the tubeless sealant', value: 'valve at the bottom', when: 'tubeless', parts: ['tyres'] },
      { key: 'pivots', label: 'Rear pivots without play', value: 'no play', when: 'full', parts: ['linkage'] },
    ],
  },
  {
    key: 's4',
    name: 'First service',
    km: 300,
    kmTo: NEW_KM,
    days: 91,
    rows: [
      { key: 'inspect', label: 'First inspection at the bike shop', link: 'order', hint: 'Often a condition of the warranty · suggest a date', parts: 'check', by: 'shop' },
      { key: 'pass', label: 'Take the suspension values into the Bike pass', link: 'pass', when: 'susp', parts: [] },
    ],
  },
];
/** The km marks of the bar: the first ride, 50, 150 and the first service. */
export const BREAKIN_MARKS = [
  { km: 0, label: '1st ride' },
  { km: 50, label: '50 km' },
  { km: 150, label: '150 km' },
  { km: NEW_KM, label: `${NEW_KM} km` },
];

const LINK_NAME = { order: 'Workshop order|sheet', pass: 'Bike pass' };
const roundUp10 = (n) => Math.max(10, Math.ceil(n / 10) * 10);

/**
 * The Break-in plan of one bike: { steps, ticked, total, km, bought, due (the first due step, or null),
 * next, done (first service done) }. step = { key, n, name, rows, state: 'done' | 'due' | 'later',
 * badge: { text, tone }, dueDate }. row = { id, label, hint, value, edit, link, tick, applied }.
 * tyres: { front, rear } (workshop.js tyreSetup); visits: for «first service done».
 */
export function breakIn(bike, { tyres = null, today, visits = [] }) {
  const b = { ...bike, parts: ensureParts(bike ?? {}) };
  const km = typeof bike?.km === 'number' ? bike.km : null;
  const st = sheetsOf(bike).breakin ?? {};
  const ticks = st.ticks ?? {};
  const applied = st.applied ?? {};
  const bought = bike?.bought ?? null;
  const setupHref = bikesHash({ tab: 'setup', bike: b.id });
  const steps = BREAKIN.map((step, i) => {
    const rows = step.rows
      .filter((r) => fitsWhen(r.when, b, tyres))
      .map((r) => {
        const id = `${step.key}:${r.key}`;
        let value = r.value === 'susp' ? suspValue(b) : r.value === 'tyres' ? tyreValue(b) : r.value ? t(r.value) : '';
        let hint = r.hint ? t(r.hint) : '';
        if (r.sag) {
          const f = fitValue(b, 'forkSag');
          const s = hasSuspension(b, 'shock') ? fitValue(b, 'shockSag') : null;
          hint = f != null || s != null ? [f != null ? t('Fork {n} %', { n: num(f) }) : '', s != null ? t('Shock {n} %', { n: num(s) }) : ''].filter(Boolean).join(' · ') : t('Sag about 20–30 %, as the maker suggests');
        }
        const tick = ticks[id] ?? null;
        if (tick && r.key === 'bolts' && typeof tick.km === 'number') hint = t('at {km} km', { km: num(tick.km) });
        return {
          id,
          key: r.key,
          label: t(r.label),
          hint,
          value: r.link ? '' : value,
          edit: setupHref,
          link: r.link ? { href: bikesHash({ tab: 'setup', bike: b.id, sheet: r.link }), label: t(LINK_NAME[r.link]) } : null,
          tick,
          applied: applied[id] ?? null,
        };
      });
    const ticked = rows.filter((r) => r.tick).length;
    const done = rows.length > 0 && ticked === rows.length;
    const dueDate = bought && step.days ? addDays(bought, step.days) : null;
    const due = !done && ((km != null && km >= step.km) || (!!dueDate && today >= dueDate));
    return { key: step.key, n: i + 1, name: t(step.name), km: step.km, kmTo: step.kmTo ?? null, rows, ticked, done, due, dueDate };
  });
  for (const s of steps) {
    const last = s.rows.map((r) => r.tick?.date).filter(Boolean).sort().at(-1);
    if (s.done) s.badge = { text: last ? t('done {date}', { date: dayMonth(last) }) : t('done'), tone: 'ok' };
    else if (s.due) s.badge = { text: t('due now'), tone: 'warn' };
    else if (s.kmTo) s.badge = { text: s.dueDate ? t('{from}–{to} km or by {date}', { from: num(s.km), to: num(s.kmTo), date: dateOf(s.dueDate) }) : t('{from}–{to} km', { from: num(s.km), to: num(s.kmTo) }), tone: 'n' };
    else if (km != null) s.badge = { text: t('in about {km} km', { km: num(roundUp10(s.km - km)) }), tone: 'n' };
    else s.badge = { text: s.dueDate ? t('by {date}', { date: dateOf(s.dueDate) }) : t('later'), tone: 'n' };
    s.state = s.done ? 'done' : s.due ? 'due' : 'later';
  }
  const all = steps.flatMap((s) => s.rows);
  return {
    steps,
    km,
    bought,
    ticked: all.filter((r) => r.tick).length,
    total: all.length,
    toApply: all.filter((r) => r.tick && !r.applied).length,
    due: steps.find((s) => s.due) ?? null,
    next: steps.find((s) => !s.done) ?? null,
    done: firstServiceDone(bike, visits),
    remind: st.remind !== false,
  };
}

/** The break-in values with one tick set (with the day and the km) or taken off. */
export function tickBreakin(breakin, id, on, { today, km = null }) {
  const ticks = { ...(breakin?.ticks ?? {}) };
  const applied = { ...(breakin?.applied ?? {}) };
  if (on) ticks[id] = { date: today, km: typeof km === 'number' ? km : null };
  else {
    delete ticks[id];
    delete applied[id];
  }
  return { ...(breakin ?? {}), ticks, applied };
}

const rowDef = (id) => {
  const [sk, rk] = id.split(':');
  return BREAKIN.find((s) => s.key === sk)?.rows.find((r) => r.key === rk) ?? null;
};

/**
 * W2 a: the ticked rows not taken yet as care entries. Each row writes to its parts (that fit the
 * bike) one entry with the day and the km of its tick, by me (the inspection: by the bike shop).
 * Returns { parts, logged (part keys), rows (ids), breakin (with applied) }.
 */
export function breakinEntries(bike, breakin, { today }) {
  let parts = ensureParts(bike ?? {});
  const logged = [];
  const ids = [];
  const applied = { ...(breakin?.applied ?? {}) };
  for (const [id, tick] of Object.entries(breakin?.ticks ?? {})) {
    if (!tick || applied[id]) continue;
    const r = rowDef(id);
    if (!r) continue;
    const keys = r.parts === 'check' ? CHECK_PARTS.filter((k) => parts.some((p) => p.key === k) && fits(bike, PART[k])) : r.parts.filter((k) => fits(bike, PART[k] ?? {}) && (k !== 'fork' || hasSuspension(bike, 'fork')) && (k !== 'shock' || hasSuspension(bike, 'shock')));
    const action = r.action ?? 'check';
    for (const k of keys) {
      parts = logPart(parts, k, { date: tick.date ?? today, km: typeof tick.km === 'number' ? tick.km : null, value: null, action, result: action === 'check' ? 'ok' : 'done', by: r.by ?? 'self', model: null, note: `${t('Break-in plan')}: ${t(r.label)}` });
      logged.push(k);
    }
    applied[id] = today;
    ids.push(id);
  }
  return { parts, logged: [...new Set(logged)], rows: ids, breakin: { ...(breakin ?? {}), applied } };
}

/* ---------- the Repair kit (W4 a, W5 a) ---------- */

export const RIDE_TYPES = [
  { key: 'evening', name: 'After-work ride' },
  { key: 'day', name: 'Day tour' },
  { key: 'multi', name: 'Multi-day' },
];
const ALL = ['evening', 'day', 'multi'];
const LONG = ['day', 'multi'];

/**
 * The rows of the kit, by section. for: the kinds of ride it comes on; when: only on a bike with that;
 * words: how its item is found in the gear list (name, German name, model); not: words that rule an
 * item out; size: the size the label takes from the bike's parts.
 */
export const KIT = [
  {
    key: 'fit',
    name: 'Matching this bike',
    rows: [
      { key: 'tube', label: 'Spare tube', for: ALL, words: /schlauch|\btube\b/, not: /tubeless|reifen|rohr/, size: 'tube' },
      { key: 'plugs', label: 'Tubeless plugs', for: ALL, when: 'tubeless', words: /würst|wurst|salami|plug|bacon|tubeless.?(repair|rep)/, hint: 'The tyres are tubeless' },
      { key: 'link', label: 'Chain quick link', for: ALL, words: /kettenschloss|chain ?link|quick ?link|power ?link|missing ?link/, size: 'chain' },
      { key: 'hanger', label: 'Spare derailleur hanger', for: LONG, words: /schaltauge|hanger|\budh\b/, size: 'hanger' },
      { key: 'pads', label: 'Spare brake pads', for: LONG, words: /bremsbel|brake ?pad/, size: 'pads' },
      { key: 'sealant', label: 'Sealant, small bottle', for: ['multi'], when: 'tubeless', words: /dichtmilch|sealant/ },
    ],
  },
  {
    key: 'tools',
    name: 'Tools',
    rows: [
      { key: 'multitool', label: 'Multitool', for: ALL, words: /multi.?tool|minitool|werkzeug multi/, hint: 'with 4, 5, 6 mm and T25' },
      { key: 'pump', label: 'Mini pump', for: ALL, words: /pumpe|\bpump\b|co2/, not: /dämpfer|shock|stand/ },
      { key: 'levers', label: 'Tyre levers (2)', for: ALL, words: /reifenheber|tyre ?lever|tire ?lever/ },
      { key: 'chaintool', label: 'Chain tool', for: LONG, words: /kettennieter|chain ?tool|kettenwerkzeug/, hint: 'leave it at home when the multitool has one' },
      { key: 'shockpump', label: 'Shock pump', for: ['multi'], when: 'full', words: /dämpferpumpe|shock ?pump/ },
    ],
  },
  {
    key: 'emergency',
    name: 'Emergency',
    rows: [
      { key: 'ties', label: 'Zip ties and tape', for: LONG, words: /kabelbinder|zip.?tie|panzertape|duct ?tape|gaffa|klebeband/, many: true },
      { key: 'firstaid', label: 'First aid kit', for: LONG, words: /erste.?hilfe|first.?aid|apotheke|verband/ },
      { key: 'lock', label: 'Lock', for: LONG, words: /schloss|\block\b/, not: /kette|chain/, hint: 'for a break on the way' },
      { key: 'card', label: 'Emergency card', for: ALL, words: /notfall|emergency|\bice\b/, hint: 'Name, emergency number, allergies' },
    ],
  },
];
export const KIT_ROW = Object.fromEntries(KIT.flatMap((s) => s.rows.map((r) => [r.key, r])));

/** The size a kit row takes from the bike's parts: «29 × 2.4», «12-speed», «UDH». */
function kitSize(row, bike) {
  if (row.size === 'tube') {
    const wheel = specValue(bike, 'wheelF', 'attrs.size');
    const width = fitValue(bike, 'tyreWidthF');
    return [wheel, width].filter((v) => v != null && v !== '').join(' × ');
  }
  if (row.size === 'chain') {
    const cogs = specValue(bike, 'cassette', 'attrs.cogs');
    return cogs ? t('{n}-speed', { n: String(cogs).replace(/\D+/g, '') || cogs }) : '';
  }
  if (row.size === 'hanger') {
    const frame = (bike.parts ?? []).find((p) => p.key === 'frame');
    return /\budh\b/i.test(`${frame?.model ?? ''} ${Object.values(frame?.attrs ?? {}).join(' ')}`) ? 'UDH' : '';
  }
  if (row.size === 'pads') {
    const pistons = specValue(bike, 'brakeF', 'attrs.pistons');
    return pistons ? t('for {n}-piston', { n: String(pistons).replace(/\D+/g, '') || pistons }) : '';
  }
  return '';
}
/** The label of a kit row in the current language (and in English, for a new gear item). */
function kitLabel(row, bike, tr = t) {
  const size = kitSize(row, bike);
  const base = tr(row.label);
  if (!size) return base;
  return row.size === 'tube' ? `${base} ${size}` : `${base} (${size})`;
}
const ID = (s) => s;
const words = (i) => `${i.name ?? ''} ${i.nameDe ?? ''} ${i.model ?? ''}`.toLowerCase().replace(/test_data_gtp_/g, ' ');
const usable = (i) => i.ownership === 'owned' || i.ownership === 'unclear';

/** The items of the gear list that match a kit row (owned ones; a wish only as «on the wish list»). */
export function kitMatch(row, items = []) {
  const hit = (i) => row.words.test(words(i)) && !(row.not && row.not.test(words(i)));
  const own = items.filter((i) => usable(i) && hit(i));
  return { own: row.many ? own : own.slice(0, 1), wish: own.length ? null : (items.find((i) => (i.ownership === 'to-buy' || i.ownership === 'wishlist') && hit(i)) ?? null) };
}

/** The kind of ride the kit starts with: the stored one, else from the next trip (more than a day: multi-day). */
export const kitType = (bike, trip = null) => sheetsOf(bike).kit?.type ?? (trip ? (Number(trip.days) > 1 ? 'multi' : 'day') : 'day');

/**
 * The Repair kit of one bike for one kind of ride: { type, sections, rows, packed, total, g, missing,
 * toTrip }. row = { key, label, hint, items: [{ id, name, g }], g, missing, wish, packed, onTrip }.
 * trip: the next trip on this bike (its packing list); toTrip: the items not on it yet.
 */
export function repairKit(bike, { items = [], tyres = null, type = 'day', trip = null }) {
  const b = { ...bike, parts: ensureParts(bike ?? {}) };
  const ticks = sheetsOf(bike).kit?.ticks?.[type] ?? {};
  const on = new Set((trip?.entries ?? []).map((e) => e.itemId));
  const sections = KIT.map((s) => {
    const rows = s.rows
      .filter((r) => r.for.includes(type) && fitsWhen(r.when, b, tyres))
      .map((r) => {
        const m = kitMatch(r, items);
        const list = m.own.map((i) => ({ id: i.id, name: nameOf(i), g: itemWeight(i) }));
        const weighed = list.filter((i) => i.g != null);
        let hint = r.hint ? t(r.hint) : '';
        if (r.key === 'pump' && hasSuspension(b, 'shock') && type !== 'multi') hint = t('the shock pump stays at home');
        if (r.key === 'tube' && tubeless(tyres)) hint = t('Backup for the tubeless tyres');
        return {
          key: r.key,
          label: kitLabel(r, b),
          hint,
          items: list,
          g: weighed.length ? weighed.reduce((a, i) => a + i.g, 0) : null,
          missing: !list.length,
          wish: m.wish ? nameOf(m.wish) : null,
          packed: !!ticks[r.key] && !!list.length,
          onTrip: list.length > 0 && list.every((i) => on.has(i.id)),
        };
      });
    return { key: s.key, name: t(s.name), rows };
  }).filter((s) => s.rows.length);
  const rows = sections.flatMap((s) => s.rows);
  const toTrip = trip ? rows.flatMap((r) => r.items.filter((i) => !on.has(i.id))) : [];
  return {
    type,
    sections,
    rows,
    packed: rows.filter((r) => r.packed).length,
    total: rows.length,
    g: rows.filter((r) => r.packed).reduce((a, r) => a + (r.g ?? 0), 0),
    missing: rows.filter((r) => r.missing).length,
    toTrip: [...new Map(toTrip.map((i) => [i.id, i])).values()],
  };
}

/** The kit values with one «packed» tick set or taken off (per kind of ride). */
export function tickKit(kit, type, key, on) {
  const ticks = { ...(kit?.ticks ?? {}) };
  ticks[type] = { ...(ticks[type] ?? {}), [key]: !!on };
  return { ...(kit ?? {}), ticks };
}

/** «add»: a gear item for a kit row that is missing in the gear list (owned, still to weigh). */
export function kitItem(rowKey, bike, items = [], { now = new Date().toISOString(), de = false } = {}) {
  const row = KIT_ROW[rowKey];
  const b = { ...bike, parts: ensureParts(bike ?? {}) };
  const name = kitLabel(row, b, ID);
  return {
    id: nextId(items, 'tools'),
    name,
    ...(de ? { nameDe: kitLabel(row, b) } : {}),
    brand: '',
    model: '',
    category: 'tools',
    weightG: null,
    qty: 1,
    weightStatus: 'missing',
    carry: 'bike',
    defaultBag: 'tool',
    ownership: 'owned',
    role: null,
    sets: ['repair'],
    kits: [],
    domains: ['bikepacking'],
    note: t('From the Repair kit of {bike}.', { bike: bike?.name ?? '' }),
    updatedAt: now,
  };
}

/** W5 a: the packing list of a trip with the chosen items added (each in its usual place). */
export function kitToTrip(trip, itemIds = [], items = []) {
  const on = new Set((trip.entries ?? []).map((e) => e.itemId));
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  const add = itemIds.filter((id) => !on.has(id) && byId[id]).map((id) => ({ itemId: id, slot: slotFor(byId[id].defaultBag, trip.setup), qty: 1, packed: false }));
  return { entries: [...(trip.entries ?? []), ...add], added: add.map((e) => e.itemId) };
}

/* ---------- Warranty & receipts (W6 a) ---------- */

/** The warranty per part: a suggestion in years (2 by law; the frame often longer), changeable. */
export const WARRANTY_PARTS = [
  { key: 'frame', name: 'Frame', years: 5 },
  { key: 'fork', name: 'Fork', years: 2, when: 'fork' },
  { key: 'shock', name: 'Rear shock', years: 2, when: 'full' },
  { key: 'wheels', name: 'Wheels', years: 2 },
  { key: 'rest', name: 'Drivetrain, brakes, other parts', years: 2, law: true },
];
/** Today reminds this many days before a warranty ends. */
export const WARRANTY_REMIND = 30;
/** «in 5 months» is shown from this many days before the end. */
export const WARRANTY_SOON = 183;

const yearsText = (n, law = false) => `${tn(n, '{n} year', '{n} years')}${law ? ` (${t('law')})` : ''}`;
/** «in 12 days», «in 5 months». */
export function inText(days) {
  if (days < 0) return t('ended');
  if (days <= 45) return tn(days, 'in {n} day', 'in {n} days');
  return tn(Math.round(days / 30.4), 'in {n} month', 'in {n} months');
}

function warrantyRow({ key, label, years, law = false, from, today, edit = true }) {
  const end = addYears(from, years);
  const left = daysBetween(today, end);
  const span = Math.max(1, daysBetween(from, end));
  return {
    key,
    label,
    years,
    yearsText: yearsText(years, law),
    from,
    end,
    left,
    fill: Math.max(0, Math.min(1, left / span)),
    tone: left < 0 ? 'n' : left <= WARRANTY_SOON ? 'warn' : 'ok',
    badge: left < 0 ? t('ended') : left <= WARRANTY_SOON ? inText(left) : '',
    edit,
  };
}

/**
 * Warranty & receipts of one bike: { bought, shop, price, rows, replaced, receipts, soon, remind,
 * calendar, withPhoto }. rows: per part (from the purchase; none without a purchase date);
 * replaced: the parts replaced since (workshop visits, 2 years from the visit, while running);
 * receipts: the visits of this bike, newest first; soon: the rows ending in the next 30 days.
 */
export function warranty(bike, { visits = [], today }) {
  const w = sheetsOf(bike).warranty ?? {};
  const bought = bike?.bought ?? null;
  const rows = bought
    ? WARRANTY_PARTS.filter((p) => fitsWhen(p.when, bike, null)).map((p) => warrantyRow({ key: p.key, label: t(p.name), years: Number(w.years?.[p.key]) || p.years, law: p.law && !w.years?.[p.key], from: bought, today }))
    : [];
  const mine = visits.filter((v) => v.bikeId === bike?.id).sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
  const seen = new Set();
  const replaced = [];
  for (const v of mine) {
    if (!v.date || (bought && v.date <= bought)) continue;
    for (const l of v.parts ?? []) {
      if (l.action !== 'replace' || !l.part || seen.has(l.part)) continue;
      seen.add(l.part);
      const r = warrantyRow({ key: `v:${v.id}:${l.part}`, label: t('{part} (replaced)', { part: PART[l.part] ? t(PART[l.part].name) : l.what || l.part }), years: 2, from: v.date, today, edit: false });
      if (r.left >= 0) replaced.push(r);
    }
  }
  const receipts = mine.map((v) => ({
    id: v.id,
    label: [...new Set((v.parts ?? []).map((l) => l.what || (PART[l.part] ? t(PART[l.part].name) : '')).filter(Boolean))].slice(0, 3).join(', ') || t('Workshop visit'),
    date: v.date,
    shop: v.shop ?? '',
    chf: typeof v.totalChf === 'number' ? v.totalChf : null,
    photo: !!v.photos?.length,
    href: bikesHash({ tab: 'shop', bike: bike.id, visit: v.id }),
  }));
  const all = [...rows, ...replaced];
  return {
    bought,
    shop: w.shop ?? '',
    price: typeof w.price === 'number' ? w.price : null,
    rows,
    replaced,
    receipts,
    soon: all.filter((r) => r.left >= 0 && r.left <= WARRANTY_REMIND),
    longest: rows.filter((r) => r.left >= 0).sort((a, b) => b.end.localeCompare(a.end))[0] ?? null,
    remind: w.remind !== false,
    calendar: !!w.calendar,
    withPhoto: receipts.filter((r) => r.photo).length,
  };
}

/** «CHF 4’290» in the language's number format. */
export const chf = (n) => (n == null ? null : `CHF ${num(Math.round(n))}`);

/**
 * W6 a «Also in the calendar»: a calendar file (.ics) with one all-day event 30 days before each
 * warranty ends. rows: from warranty(); stamp: the creation time (UTC, «20261010T120000Z»).
 */
export function warrantyIcs(bike, rows, { stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '') } = {}) {
  const esc = (s) => String(s).replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');
  const d = (iso) => iso.replace(/-/g, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Pack Generator//Velo-Blaetter//DE', 'CALSCALE:GREGORIAN'];
  for (const r of rows.filter((x) => x.left == null || x.left >= 0)) {
    const day = addDays(r.end, -WARRANTY_REMIND);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${esc(`pg-warranty-${bike.id}-${r.key}-${r.end}`)}@pack-generator`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${d(day)}`,
      `DTEND;VALUE=DATE:${d(addDays(day, 1))}`,
      `SUMMARY:${esc(t('Warranty {part} ({bike}) ends on {date}', { part: r.label, bike: bike.name, date: dateOf(r.end) }))}`,
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return `${lines.join('\r\n')}\r\n`;
}

/* ---------- the Theft sheet (W7 a) ---------- */

/** The values of the Theft sheet that are typed on the sheet (sec: id = how to know it, marks, insurance). */
export const THEFT_FIELDS = [
  { key: 'frameNo', label: 'Frame number', sec: 'id' },
  { key: 'colour', label: 'Colour', sec: 'id' },
  { key: 'marks', label: 'Scratches', sec: 'marks' },
  { key: 'changes', label: 'Different from the factory', sec: 'marks' },
  { key: 'sensor', label: 'Sensor in the bike', sec: 'marks' },
  { key: 'hidden', label: 'Hidden marking', sec: 'marks' },
  { key: 'insurer', label: 'Where it is insured', sec: 'ins' },
  { key: 'policy', label: 'Policy number', sec: 'ins' },
  { key: 'sum', label: 'Insured up to', sec: 'ins', chf: true },
  { key: 'deductible', label: 'Deductible', sec: 'ins', chf: true },
  { key: 'report', label: 'Report within', sec: 'ins' },
];
export const THEFT_FIELD = Object.fromEntries(THEFT_FIELDS.map((f) => [f.key, f]));
/** The four photos of the sheet; a photo of the bike's gallery is used for the side (its main photo). */
export const THEFT_PHOTOS = [
  { key: 'side', label: 'Whole left side' },
  { key: 'frame', label: 'Frame number' },
  { key: 'mark', label: 'Mark' },
  { key: 'cockpit', label: 'Cockpit' },
];
/** What to do when it is stolen. */
export const THEFT_STEPS = [
  { key: 'police', title: 'Police', text: 'report it, take this sheet along as a PDF', hint: 'The frame number and the photos help to find it' },
  { key: 'insurance', title: 'Insurance', text: 'report it at once, add the police report and the receipt' },
  { key: 'market', title: 'Online marketplaces', text: 'search for brand and size for a few weeks' },
  { key: 'shops', title: 'Bike shops nearby', text: 'tell them, with a photo and the frame number' },
];

const fieldValue = (v, f) => (v == null || v === '' ? null : f.chf ? chf(Number(v)) : String(v));

/**
 * The Theft sheet of one bike: { id, marks, insurance (rows), photos (tiles), frameNo, missing
 * (empty rows), photosMissing, filled, total }. row = { id, label, value (or null), field (typed on
 * the sheet) or edit (where it is changed), href (a link next to it) }. photos: the photos table rows;
 * gallery: bikePhotos() (the main photo stands in for the side).
 */
export function theftSheet(bike, { photos = [], gallery = [], visits = [] } = {}) {
  const s = sheetsOf(bike).theft ?? {};
  const w = sheetsOf(bike).warranty ?? {};
  const b = { ...bike, parts: ensureParts(bike ?? {}) };
  const row = (key) => ({ id: key, label: t(THEFT_FIELD[key].label), value: fieldValue(s[key], THEFT_FIELD[key]), field: key });
  const kind = bikeWeightKind(b);
  const size = [fitValue(b, 'frameSize'), specValue(b, 'wheelF', 'attrs.size') ? t('{size} inch', { size: specValue(b, 'wheelF', 'attrs.size') }) : null].filter(Boolean).join(' · ');
  const buy = visits.filter((v) => v.bikeId === b.id && v.date && v.date === b.bought)[0] ?? null;
  const id = [
    row('frameNo'),
    { id: 'model', label: t('Brand and model'), value: [b.name, b.type ? t(bikeTypeName(b.type)) : ''].filter(Boolean).join(' · ') || null, edit: bikesHash({ tab: 'setup', bike: b.id }) },
    { id: 'size', label: t('Frame size · wheels'), value: size || null, edit: bikesHash({ tab: 'compare' }) },
    row('colour'),
    { id: 'weight', label: t('Weight'), value: b.weightG ? `${num(Math.round(b.weightG / 100) / 10)} kg${kind === 'measured' ? ` ${t('measured')}` : ''}` : null, edit: bikesHash({ tab: 'setup', bike: b.id }) },
    { id: 'price', label: t('Purchase price'), value: chf(typeof w.price === 'number' ? w.price : null), edit: bikesHash({ tab: 'setup', bike: b.id, sheet: 'warranty' }), href: buy ? { href: bikesHash({ tab: 'shop', bike: b.id, visit: buy.id }), label: t('Receipt') } : null },
  ];
  const marks = ['marks', 'changes', 'sensor', 'hidden'].map(row);
  const insurance = ['insurer', 'policy', 'sum', 'deductible', 'report'].map(row);
  const own = photos.filter((p) => p.bikeId === b.id && p.theft);
  const main = gallery.find((p) => p.main) ?? gallery[0] ?? null;
  const tiles = THEFT_PHOTOS.map((p) => {
    const ph = own.find((x) => x.theft === p.key) ?? (p.key === 'side' && main ? { id: main.id, data: main.src, gallery: true } : null);
    return { key: p.key, label: t(p.label), src: ph?.data ?? null, photoId: ph && !ph.gallery ? ph.id : null };
  });
  const all = [...id, ...marks, ...insurance];
  return {
    id,
    marks,
    insurance,
    photos: tiles,
    frameNo: s.frameNo || null,
    photosMissing: tiles.filter((p) => !p.src).length,
    filled: all.filter((r) => r.value != null).length,
    total: all.length,
  };
}

/* ---------- the folder lines of the four sheets ---------- */

/** The state line of the four sheets in the folder ({ key: { text, tone } }), as folderState() in sheets.js. */
export function moreState({ breakin, kit, warranty: w, theft }) {
  const out = {};
  if (breakin) {
    if (breakin.done || !breakin.next) out.breakin = { text: t('done'), tone: 'ok' };
    else if (breakin.due) out.breakin = { text: t('Step {n} due', { n: breakin.due.n }), tone: 'warn' };
    else out.breakin = { text: t('Step {n}: {when}', { n: breakin.next.n, when: breakin.next.badge.text }), tone: 'n' };
  }
  if (kit) out.kit = kit.missing ? { text: tn(kit.missing, '{n} missing', '{n} missing'), tone: 'warn' } : kit.packed === kit.total ? { text: t('everything packed'), tone: 'ok' } : { text: t('{n} of {all} packed', { n: kit.packed, all: kit.total }), tone: 'n' };
  if (w) {
    const soon = w.soon[0];
    if (soon) out.warranty = { text: t('{part} ends {when}', { part: soon.label, when: inText(soon.left) }), tone: 'warn' };
    else if (w.longest) out.warranty = { text: t('{part} until {year}', { part: w.longest.label, year: w.longest.end.slice(0, 4) }), tone: 'ok' };
    else out.warranty = w.bought ? { text: t('ended'), tone: 'n' } : { text: t('purchase date missing'), tone: 'n' };
  }
  if (theft) {
    if (!theft.frameNo) out.theft = { text: t('frame number missing'), tone: 'warn' };
    else if (theft.photosMissing) out.theft = { text: tn(theft.photosMissing, '{n} photo missing', '{n} photos missing'), tone: 'warn' };
    else out.theft = theft.filled === theft.total ? { text: t('complete'), tone: 'ok' } : { text: t('{n} of {all} values', { n: theft.filled, all: theft.total }), tone: 'n' };
  }
  return out;
}

/* ---------- reminders on Today (W3 a, W6 a) ---------- */

/** «later» on Today: the reminder waits this many days. */
export const LATER_DAYS = 7;
const snoozed = (bike, key, today) => {
  const until = sheetsOf(bike).snooze?.[key];
  return !!until && until > today;
};
/** The sheets of a bike with a reminder put off until a week later. */
export const laterChanges = (bike, key, today) => ({ ...sheetsOf(bike), snooze: { ...(sheetsOf(bike).snooze ?? {}), [key]: addDays(today, LATER_DAYS) } });

/**
 * The reminders of the sheets for Today: a due step of a Break-in plan that is shown (W3 a), and a
 * warranty that ends in the next 30 days (W6 a); each can be put off («later») or switched off on its
 * sheet. Returns [{ key, bikeId, text, href, tone }].
 */
export function sheetReminders(bikes = [], { visits = [], today }) {
  const out = [];
  for (const bike of bikes) {
    if (isShown(bike, 'breakin', { today, visits })) {
      const p = breakIn(bike, { today, visits });
      const key = p.due ? `breakin:${p.due.key}` : null;
      if (p.remind && !p.done && p.due && !snoozed(bike, key, today)) out.push({ key, bikeId: bike.id, tone: 'warn', text: t('Break-in plan {bike}: step {n} is due ({step})', { bike: bike.name, n: p.due.n, step: p.due.name }), href: bikesHash({ tab: 'setup', bike: bike.id, sheet: 'breakin' }) });
    }
    if (isShown(bike, 'warranty', { today, visits })) {
      const w = warranty(bike, { visits, today });
      if (!w.remind) continue;
      for (const r of w.soon) {
        const key = `warranty:${r.key}:${r.end}`;
        if (!snoozed(bike, key, today)) out.push({ key, bikeId: bike.id, tone: 'info', text: t('Warranty {part} ({bike}) ends on {date}', { part: r.label, bike: bike.name, date: dateOf(r.end) }), href: bikesHash({ tab: 'setup', bike: bike.id, sheet: 'warranty' }) });
      }
    }
  }
  return out;
}

/* ---------- the four sheets as text (V3 a; W7 a: the frame number is in it) ---------- */

const STAND = (today) => t('As of {date}', { date: dateOf(today) });
const kmLine = (km) => (km != null ? `${num(km)} km` : t('km not set'));

export function breakinText(bike, plan, { today }) {
  return sheetText({
    title: t('Break-in plan'),
    sub: bikeLine(bike),
    facts: [STAND(today), kmLine(plan.km), t('{n} of {all} done', { n: plan.ticked, all: plan.total })],
    sections: plan.steps.map((s) => ({ name: `${s.n} · ${s.name} (${s.badge.text})`, rows: s.rows.map((r) => ({ ...r, value: r.link ? r.link.label : r.value })) })),
    ticks: Object.fromEntries(plan.steps.flatMap((s) => s.rows.map((r) => [r.id, !!r.tick]))),
    foot: t('Pack Generator · due is what comes first: km or date'),
  });
}

export function kitText(bike, kit) {
  const type = RIDE_TYPES.find((r) => r.key === kit.type);
  return sheetText({
    title: t('Repair kit'),
    sub: `${bike.name} · ${t(type.name)}`,
    facts: [t('{n} of {all} packed', { n: kit.packed, all: kit.total }), `${num(kit.g)} g`],
    sections: kit.sections.map((s) => ({ name: s.name, rows: s.rows.map((r) => ({ id: r.key, label: r.label, value: r.missing ? t('missing in the gear list') : r.g != null ? `${num(r.g)} g` : '', hint: r.items.map((i) => i.name).join(', ') })) })),
    ticks: Object.fromEntries(kit.rows.map((r) => [r.key, r.packed])),
    foot: t('Pack Generator · sizes from the Bike pass and the parts'),
  });
}

export function warrantyText(bike, w, { today }) {
  const rows = [...w.rows, ...w.replaced].map((r) => ({ id: r.key, label: r.label, value: dateOf(r.end), hint: r.yearsText }));
  return sheetText({
    title: t('Warranty & receipts'),
    sub: [bike.name, w.bought ? t('bought on {date}', { date: dateOf(w.bought) }) : '', w.shop ? t('at {shop}', { shop: w.shop }) : ''].filter(Boolean).join(' · '),
    facts: [STAND(today), w.price != null ? t('Purchase price {chf}', { chf: chf(w.price) }) : ''].filter(Boolean),
    sections: [
      { name: t('Warranty per part'), rows: rows.length ? rows : [{ id: 'none', label: t('Purchase date'), value: null }] },
      { name: t('Receipts'), rows: w.receipts.map((r) => ({ id: r.id, label: r.label, value: r.chf != null ? chf(r.chf) : '', hint: [dateOf(r.date), r.shop].filter(Boolean).join(' · ') })) },
    ],
    foot: t('Pack Generator · the years per part are suggestions and can be changed'),
  });
}

export function theftText(bike, s, { today }) {
  return [
    sheetText({
      title: t('Theft sheet'),
      sub: `${bike.name} · ${t('for the police and the insurance')}`,
      facts: [STAND(today)],
      sections: [
        { name: t('How to know it'), rows: s.id },
        { name: t('Special marks'), rows: s.marks },
        { name: t('Photos'), rows: s.photos.map((p) => ({ id: p.key, label: p.label, value: p.src ? t('in the app') : null })) },
        { name: t('Insurance'), rows: s.insurance },
      ],
    }),
    '',
    t('WHEN IT IS STOLEN').toUpperCase(),
    ...THEFT_STEPS.map((x, i) => `${i + 1}. ${t(x.title)}: ${t(x.text)}`),
  ].join('\n');
}

/* ---------- everything the four sheets of one bike need ---------- */

/**
 * The data of the four sheets, next to sheetData() of sheets.js (base: its result, for the bike with
 * its visits, the tyres and the next trip): { breakin, kit, warranty, theft }.
 * gallery: bikePhotos() of photo.js (the main photo stands in for the side view of the Theft sheet).
 */
export function moreData(bike, base, { visits = [], items = [], photos = [], gallery = [], today, type = null }) {
  const view = base.view;
  return {
    breakin: breakIn(view, { tyres: base.tyres, today, visits }),
    kit: repairKit(view, { items, tyres: base.tyres, type: type ?? kitType(bike, base.trip), trip: base.trip }),
    warranty: warranty(view, { visits, today }),
    theft: theftSheet(view, { photos, gallery, visits }),
  };
}
