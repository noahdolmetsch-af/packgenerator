/**
 * v0.69.0 «Velo-Blätter» (Noah 10.10.2026, V1–V7 all «a», Vorschlag A): a folder («Mappe») of sheets
 * per bike. Four sheets first (V2 a): Bike pass, Service plan, Workshop order, Pick-up check. Every
 * value comes from the data the app already has (V5 a: fit and setup, the part specs, the care
 * history, the ride ledger); a missing value is an empty line «enter» that links to where it is
 * edited. A sheet can be viewed, printed or saved as PDF and copied as text (V3 a). The ticks of the
 * pick-up check are stored on the bike; the work done becomes care entries, a replaced part gets its
 * start point (V4 a, Q1 «Jeder km zählt»). Everything is a suggestion: a sheet can be hidden, a job
 * taken off the order, a tick undone.
 *
 * Stored on the bike: bike.sheets = { hidden: [key], orderOff: [row key], wishes: '', pickup }
 * with pickup = { date, jobs: [{ key, name, detail, part, action, taskId }], ticks: { id: true }, applied: date | null }.
 * Pure functions, tested in tests/sheets.test.js.
 */
import { PART, CHECK_PARTS, ensureParts, logPart, kmSince, partInfo, fits, upcomingTrips } from './care.js';
import { FIT_KEY, fitValue, hasSuspension, specValue } from './bikespecs.js';
import { lastWork, partStatus, isDueState, shopSkip } from './care/last.js';
import { orderText, withVisits, tyreSetup, timeDue, workshopOrder } from './workshop.js';
import { bikesHash, bikeTypeName } from './bikes.js';
import { t, tn, num, dateOf } from './i18n.svelte.js';

/**
 * The sheets, in the folder's order. v0.69.0: the first four (V2 a). v0.70.0 «Velo-Blätter Teil 2»
 * (Noah W1–W7 a): the Break-in plan goes first (it shows by itself on a new bike, W1 a), the Repair
 * kit, Warranty & receipts and the Theft sheet after the four (sheets2.js). since: the version that
 * brought the sheet (the folder marks it «new» until it was opened once).
 */
export const SHEETS = [
  { key: 'breakin', name: 'Break-in plan', sub: 'What to check after the first km, step by step', since: '0.70.0' },
  { key: 'pass', name: 'Bike pass', sub: 'Suspension, tyres, position and parts on one page' },
  { key: 'plan', name: 'Service plan', sub: 'Every part with its interval, the last work and when it is next' },
  { key: 'order', name: 'Workshop order|sheet', sub: 'What the bike shop should do, with km and wishes' },
  { key: 'pickup', name: 'Pick-up check', sub: 'Tick at the pick-up: work done, values, receipt' },
  { key: 'kit', name: 'Repair kit', sub: 'What comes along, matching the parts of this bike', since: '0.70.0' },
  { key: 'warranty', name: 'Warranty & receipts', sub: 'Purchase date, warranty per part, all receipts', since: '0.70.0' },
  { key: 'theft', name: 'Theft sheet', sub: 'Frame number, photos, marks, insurance', since: '0.70.0' },
];
export const SHEET = Object.fromEntries(SHEETS.map((s) => [s.key, s]));
export const SHEET_KEYS = SHEETS.map((s) => s.key);
/** Where a sheet comes from in the address: #/bikes?bike=<id>&sheet=<key>[&from=care|shop]. */
export const isSheetKey = (k) => SHEET_KEYS.includes(k) || k === 'all';

/* ---------- what is stored on the bike ---------- */

export const sheetsOf = (bike) => ({ hidden: [], shown: [], orderOff: [], wishes: '', pickup: null, ...(bike?.sheets ?? {}) });

/**
 * v0.70.0 (W1 a): the Break-in plan comes by itself on a new bike: under NEW_KM km (or, without km,
 * bought in the last NEW_DAYS days), or once a step of it is ticked; it goes after the first service
 * (its inspection ticked, or a workshop visit since the purchase). «Choose sheets» still shows it.
 */
export const NEW_KM = 500;
export const NEW_DAYS = 180;
export function firstServiceDone(bike, visits = []) {
  if (sheetsOf(bike).breakin?.ticks?.['s4:inspect']) return true;
  // a workshop visit two weeks after the purchase or later (the receipt of the purchase does not count)
  const from = bike?.bought ?? null;
  if (!from) return false;
  const after = new Date(Date.parse(`${from}T00:00:00Z`) + 14 * 864e5).toISOString().slice(0, 10);
  return visits.some((v) => v.bikeId === bike.id && v.date >= after);
}
export function breakinAuto(bike, { today, visits = [] } = {}) {
  if (!bike || firstServiceDone(bike, visits)) return false;
  const ticked = Object.values(sheetsOf(bike).breakin?.ticks ?? {}).some(Boolean);
  if (ticked) return true;
  if (typeof bike.km === 'number') return bike.km < NEW_KM;
  if (!bike.bought || !today) return false;
  return Date.parse(`${today}T00:00:00Z`) - Date.parse(`${bike.bought}T00:00:00Z`) <= NEW_DAYS * 864e5;
}
/** Does the folder show this sheet by itself (without a choice)? Only the Break-in plan may not. */
export const autoOn = (bike, key, ctx = {}) => (key === 'breakin' ? breakinAuto(bike, ctx) : true);
/** Is the sheet shown: switched on in «Choose sheets», or by itself and not hidden. */
export const isShown = (bike, key, ctx = {}) => {
  const s = sheetsOf(bike);
  return s.shown.includes(key) || (!s.hidden.includes(key) && autoOn(bike, key, ctx));
};
/** The sheets shown in the folder (a hidden one can be switched on again in «Choose sheets»). */
export const shownSheets = (bike, ctx = {}) => SHEETS.filter((s) => isShown(bike, s.key, ctx));
/** «Choose sheets»: a sheet switched on or off (stored as hidden / shown on the bike). */
export function chooseSheet(bike, key, on, ctx = {}) {
  const s = sheetsOf(bike);
  const hidden = s.hidden.filter((k) => k !== key);
  const shown = s.shown.filter((k) => k !== key);
  if (on && !autoOn(bike, key, ctx)) shown.push(key);
  if (!on) hidden.push(key);
  return { hidden, shown };
}

/* ---------- the Bike pass ---------- */

/**
 * The rows of the Bike pass, by section. A row is a fit value (bikespecs.js FIT), a part value
 * (part + field, as in «Compare bikes») or the tube / tubeless setting of the wheels.
 * susp: only on a bike with that suspension (or when a value is set).
 */
export const PASS = [
  {
    key: 'susp',
    name: 'Suspension|sheet',
    rows: [
      { fit: 'forkPressure' },
      { fit: 'forkSag' },
      { part: 'fork', field: 'attrs.travel', label: 'Fork travel', unit: 'mm', susp: 'fork' },
      { fit: 'shockPressure' },
      { fit: 'shockSag' },
      { part: 'shock', field: 'attrs.travel', label: 'Shock travel', unit: 'mm', susp: 'shock' },
    ],
  },
  {
    key: 'wheels',
    name: 'Tyres and wheels',
    rows: [
      { part: 'tyres', field: 'model', label: 'Tyres' },
      { fit: 'tyreWidthF' },
      { fit: 'tyreWidthR' },
      { fit: 'pressureF' },
      { fit: 'pressureR' },
      { tubeless: true, label: 'Tubeless' },
      { part: 'wheelF', field: 'attrs.size', label: 'Wheel size' },
      { part: 'axles', field: 'attrs.axle', label: 'Thru axles' },
    ],
  },
  {
    key: 'fit',
    name: 'Position and cockpit',
    rows: [{ fit: 'seatHeight' }, { fit: 'saddleSetback' }, { fit: 'saddleDrop' }, { fit: 'barWidth' }, { fit: 'stemLength' }, { fit: 'stemAngle' }, { fit: 'crankLength' }, { fit: 'frameSize' }],
  },
  {
    key: 'drive',
    name: 'Drivetrain and brakes',
    rows: [
      { part: 'cassette', field: 'attrs.range', label: 'Gear range' },
      { part: 'crank', field: 'attrs.ring', label: 'Chainring size' },
      { part: 'chain', field: 'model', label: 'Chain' },
      { part: 'brakeF', field: 'model', label: 'Brakes' },
      { part: 'rotorF', field: 'attrs.dia', label: 'Rotor front', unit: 'mm' },
      { part: 'rotorR', field: 'attrs.dia', label: 'Rotor rear', unit: 'mm' },
    ],
  },
];

const empty = (v) => v == null || v === '';
/** A value with its unit: «72 psi», «1.6 bar», «29 × 2.4» (text as typed). */
export const withUnit = (v, unit = '') => (empty(v) ? null : typeof v === 'number' ? `${num(v)}${unit ? ` ${unit}` : ''}` : String(v));

/** Tube or tubeless in words, from { front, rear } (workshop.js tyreSetup); null when not known. */
function tubelessText(tyres) {
  const f = tyres?.front ?? null;
  const r = tyres?.rear ?? null;
  if (f == null && r == null) return null;
  if (f === r) return f === 'tubeless' ? t('yes|tubeless') : t('no, with tubes');
  const w = (x) => (x === 'tubeless' ? t('tubeless') : x === 'tube' ? t('tube') : '–');
  return t('front {f}, rear {r}', { f: w(f), r: w(r) });
}

/**
 * The Bike pass of one bike: { sections: [{ key, name, rows }], filled, total }.
 * row = { id, label, value (text or null), edit (the address where it is changed) }.
 * tyres: { front, rear } from tyreSetup.
 */
export function bikePass(bike, { tyres = null } = {}) {
  const b = { ...bike, parts: ensureParts(bike ?? {}) };
  const sections = PASS.map((s) => {
    const rows = s.rows
      .map((r) => {
        if (r.fit) {
          const f = FIT_KEY[r.fit];
          const value = fitValue(b, r.fit);
          if (f.susp && empty(value) && !hasSuspension(b, f.susp)) return null;
          return { id: `fit:${r.fit}`, label: t(f.name), value: withUnit(value, f.unit), edit: bikesHash({ tab: 'setup', bike: b.id }) };
        }
        if (r.tubeless) return { id: 'tubeless', label: t(r.label), value: tubelessText(tyres), edit: bikesHash({ tab: 'care', bike: b.id, open: true }) };
        const value = specValue(b, r.part, r.field);
        if (r.susp && empty(value) && !hasSuspension(b, r.susp)) return null;
        if (!empty(value) || fits(b, PART[r.part] ?? {})) return { id: `${r.part}:${r.field}`, label: t(r.label), value: withUnit(value, r.unit), edit: bikesHash({ tab: 'compare' }) };
        return null;
      })
      .filter(Boolean);
    return { key: s.key, name: t(s.name), rows };
  }).filter((s) => s.rows.length);
  const all = sections.flatMap((s) => s.rows);
  return { sections, filled: all.filter((r) => r.value != null).length, total: all.length };
}

/* ---------- the Service plan ---------- */

/** The parts the plan lists: the ones with a rule (an interval by km or time, or a wear limit). */
export const PLAN_PARTS = Object.values(PART)
  .filter((p) => !p.legacy && (p.everyKm || p.everyDays || p.limit != null))
  .map((p) => p.key);

const DAY = 864e5;
const daysBetween = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY);

/** The rule of a part in words: «every 150 km · replace at 0.5 %», «yearly», «every 3 months». */
export function intervalText(key) {
  const p = PART[key];
  if (!p) return '';
  const out = [];
  if (p.everyKm) out.push(t('every {km} km', { km: num(p.everyKm) }));
  if (p.everyDays) out.push(p.everyDays >= 365 ? t('yearly') : t('every {n} months', { n: Math.round(p.everyDays / 30.4) }));
  if (p.limit != null) {
    const unit = p.unit === '%' ? ' %' : ` ${p.unit}`;
    out.push(p.lowIsWorn ? t('replace below {limit}', { limit: `${num(p.limit)}${unit}` }) : t('replace at {limit}', { limit: `${num(p.limit)}${unit}` }));
  }
  return out.join(' · ');
}

/**
 * The Service plan of one bike (from withVisits): { rows, due } with
 * row = { key, name, interval, last, since, state, fill, tone, next }.
 * time: the bike's timeDue rows (workshop.js). A part whose time rule does not apply (sealant on a
 * bike with tubes) and that has no other rule is left out.
 */
export function servicePlan(bike, { time = [], today }) {
  const parts = ensureParts(bike ?? {});
  const rows = PLAN_PARTS.map((key) => parts.find((p) => p.key === key))
    .filter((p) => p && fits(bike, PART[p.key]))
    .filter((p) => {
      const info = partInfo(p);
      return !(info.everyDays && !info.everyKm && info.limit == null && !time.some((r) => r.key === p.key) && !p.history?.length);
    })
    .map((p) => {
      const last = lastWork(p)?.main ?? null;
      const st = partStatus(bike, p, time, today);
      const km = kmSince(bike, last);
      const since = km != null ? `${num(km)} km` : last?.date ? tn(Math.max(0, Math.round(daysBetween(last.date, today) / 30.4)), '{n} month', '{n} months') : '';
      return {
        key: p.key,
        name: t(PART[p.key].name),
        interval: intervalText(p.key),
        last: last ? `${dateOf(last.date)}${typeof last.km === 'number' ? ` · ${num(last.km)} km` : ''}` : '',
        since,
        state: st.state,
        fill: st.fill,
        tone: st.tone,
        next: st.next || '',
      };
    });
  return { rows, due: rows.filter((r) => isDueState(r.state)).length };
}

/* ---------- the Workshop order ---------- */

/** The jobs of the order that are not taken off (bike.sheets.orderOff). */
export const orderPicked = (order, bike) => (order?.rows ?? []).filter((r) => !sheetsOf(bike).orderOff.includes(r.key));

/** The values the shop should leave as they are (or set again): the fit values that are filled. */
export const KEEP = ['forkPressure', 'shockPressure', 'pressureF', 'pressureR', 'seatHeight'];
/** The German names of the values to keep, for the text to the shop. */
export const KEEP_DE = { forkPressure: 'Gabeldruck', shockPressure: 'Dämpferdruck', pressureF: 'Reifendruck vorne', pressureR: 'Reifendruck hinten', seatHeight: 'Sattelhöhe' };
export function keepValues(bike) {
  return KEEP.map((k) => ({ key: k, label: t(FIT_KEY[k].name), de: KEEP_DE[k], value: withUnit(fitValue(bike, k), FIT_KEY[k].unit) })).filter((r) => r.value != null);
}

/**
 * The text for the bike shop (in German, the bike shops speak German): the message of the order
 * (workshop.js orderText) with the km, the wishes and the values to keep after the list.
 */
export function orderSheetText(rows, { bike, trip = null, wishes = '', keep = [] } = {}) {
  const text = orderText(rows, { bike, trip });
  const extra = [];
  if (typeof bike?.km === 'number') extra.push(`Kilometerstand: ${bike.km.toLocaleString('de-CH')} km`);
  if (wishes.trim()) extra.push(`Wünsche: ${wishes.trim()}`);
  if (keep.length) extra.push(`Bitte so lassen: ${keep.map((r) => `${r.de ?? r.label} ${r.value}`).join(', ')}`);
  if (!extra.length) return text;
  const lines = text.split('\n');
  const listEnd = lines.findIndex((l, n) => n > 2 && l === '');
  lines.splice(listEnd < 0 ? lines.length : listEnd, 0, '', ...extra);
  return lines.join('\n');
}
/* ---------- the Pick-up check ---------- */

/** What to check before riding home (section 3). */
export const PICKUP_SAFE = [
  { key: 'brakes', label: 'Brakes pull, nothing rubs', hint: 'Test ride' },
  { key: 'bolts', label: 'Thru axles and stem tightened', hint: 'Torque as on the part' },
  { key: 'old', label: 'Old parts back or disposed of', hint: 'As you wished' },
  { key: 'receipt', label: 'Receipt received and photographed', hint: 'Goes to Workshop & receipts' },
];
/** The values to compare with before (section 2), from the fit values. */
export const PICKUP_VALUES = ['forkPressure', 'shockPressure', 'pressureF', 'pressureR', 'seatHeight'];

/** A new pick-up check from the order's jobs (the ones not taken off). */
export function startPickup(rows, today) {
  return {
    date: today,
    jobs: rows.map((r) => ({ key: r.key, name: r.name, detail: r.detail ?? '', part: r.part ?? null, action: r.action ?? 'service', taskId: r.taskId ?? null })),
    ticks: {},
    applied: null,
  };
}

/**
 * The Pick-up check: { pickup (stored or a fresh one), sections, ticked, total }.
 * sections: jobs (1 · work done?), values (2 · values as before?), safe (3 · safe and complete?);
 * row = { id, label, hint, value, edit }. A fresh check takes the jobs of the order (orderRows); it is
 * stored with the first tick, so its jobs stay the same when the work done leaves the order.
 */
export function pickupCheck(bike, orderRows, { today }) {
  const stored = sheetsOf(bike).pickup;
  // a stored check stays (also once taken into care, with its ticks) until a new one is started
  const pickup = stored ?? startPickup(orderRows, today);
  const b = { ...bike, parts: ensureParts(bike ?? {}) };
  const jobs = pickup.jobs.map((j) => ({ id: `job:${j.key}`, label: j.name, hint: j.detail, value: j.action === 'replace' ? t('replaced → start point') : '', part: j.part, action: j.action }));
  const values = PICKUP_VALUES.filter((k) => !FIT_KEY[k].susp || hasSuspension(b, FIT_KEY[k].susp) || fitValue(b, k) != null).map((k) => ({
    id: `val:${k}`,
    label: t(FIT_KEY[k].name),
    hint: '',
    value: withUnit(fitValue(b, k), FIT_KEY[k].unit),
    edit: bikesHash({ tab: 'setup', bike: b.id }),
  }));
  const safe = PICKUP_SAFE.map((s) => ({ id: `safe:${s.key}`, label: t(s.label), hint: t(s.hint), value: '' }));
  const sections = [
    { key: 'jobs', name: t('1 · Work done?'), rows: jobs },
    { key: 'values', name: t('2 · Values as before?'), rows: values },
    { key: 'safe', name: t('3 · Safe and complete?'), rows: safe },
  ];
  const all = sections.flatMap((s) => s.rows);
  return { pickup, sections, ticked: all.filter((r) => pickup.ticks?.[r.id]).length, total: all.length };
}

/** The pick-up check with one tick set or taken off. */
export const tickPickup = (pickup, id, on) => ({ ...pickup, ticks: { ...(pickup.ticks ?? {}), [id]: !!on } });

/**
 * The ticked jobs of a pick-up check as care entries (V4 a). Returns { parts, logged, replaced, taskIds }:
 * parts: the bike's parts with one entry per ticked job (by the bike shop, today, at km);
 * a replaced part's entry has the date and km, so it is the part's start point (kmbook.js partStart);
 * the 1000 km check counts for its check points; a repair is a task to mark done (taskIds).
 */
export function pickupEntries(bike, pickup, { today, km = null, note = '' }) {
  let parts = ensureParts(bike ?? {});
  const logged = [];
  const replaced = [];
  const taskIds = [];
  const ticked = (pickup.jobs ?? []).filter((j) => pickup.ticks?.[`job:${j.key}`]);
  // a part serviced or replaced in this visit is not «checked» again by the 1000 km check
  const worked = new Set(ticked.filter((j) => j.part && j.part !== 'check' && j.action !== 'check').map((j) => j.part));
  for (const j of ticked) {
    if (j.action === 'repair') {
      if (j.taskId != null) taskIds.push(j.taskId);
      continue;
    }
    const isCheck = j.part === 'check' || j.action === 'check';
    const keys = j.part === 'check' ? CHECK_PARTS.filter((k) => !worked.has(k) && parts.some((p) => p.key === k)) : j.part && parts.some((p) => p.key === j.part) ? [j.part] : [];
    const action = isCheck ? 'check' : j.action === 'replace' ? 'replace' : 'service';
    for (const k of keys) {
      parts = logPart(parts, k, { date: today, km: typeof km === 'number' ? km : null, value: null, action, result: isCheck ? 'ok' : 'done', by: 'shop', model: null, note });
      logged.push(k);
      if (action === 'replace') replaced.push(k);
    }
  }
  return { parts, logged: [...new Set(logged)], replaced, taskIds };
}

/* ---------- everything the four sheets of one bike need ---------- */

/**
 * The data of the four sheets of one bike, from the stored tables: { view, tyres, time, trip, order,
 * picked, pass, plan, pickup }. The order is the one of «For the bike shop» in Care (next trip, or
 * what is due today; without what I usually do myself).
 */
export function sheetData(bike, { visits = [], tasks = [], trips = [], today }) {
  const view = withVisits({ ...bike, parts: ensureParts(bike) }, visits);
  const tyres = tyreSetup(view, visits);
  const time = timeDue(view, tyres, today);
  const trip = upcomingTrips(trips, today).find((x) => x.bikeId === bike.id) ?? null;
  const order = workshopOrder(view, trip, tasks, visits, tyres, today, { skip: shopSkip(view) });
  const picked = orderPicked(order, bike);
  return { view, tyres, time, trip, order, picked, pass: bikePass(view, { tyres }), plan: servicePlan(view, { time, today }), pickup: pickupCheck(view, picked, { today }) };
}

/* ---------- the folder: one line per sheet ---------- */

/**
 * The state line of each sheet in the folder: { key: { text, tone } } with tone 'ok' | 'warn' | 'n'.
 * pass and plan: from bikePass / servicePlan; order: the jobs; pickup: the ticks.
 */
export function folderState({ pass, plan, order, pickup }) {
  const out = {};
  if (pass) out.pass = pass.filled === pass.total ? { text: t('complete'), tone: 'ok' } : { text: t('{n} of {all} values', { n: pass.filled, all: pass.total }), tone: 'n' };
  if (plan) out.plan = plan.due ? { text: tn(plan.due, '{n} due', '{n} due'), tone: 'warn' } : { text: t('nothing due'), tone: 'ok' };
  if (order) out.order = order.length ? { text: tn(order.length, '{n} job', '{n} jobs'), tone: 'warn' } : { text: t('nothing for the bike shop'), tone: 'n' };
  if (pickup) out.pickup = pickup.ticked ? { text: t('{n} of {all} ticked', { n: pickup.ticked, all: pickup.total }), tone: pickup.ticked === pickup.total ? 'ok' : 'warn' } : { text: t('not started'), tone: 'n' };
  return out;
}

/* ---------- a sheet as text (V3 a: copy for an email or a message) ---------- */

/**
 * A sheet as plain text: the title, the line below it, the facts, then per section its rows
 * «Label: value» (an empty value «–»; a tick «[x]» or «[ ]» when ticks are given).
 */
export function sheetText({ title, sub = '', facts = [], sections = [], ticks = null, foot = '' }) {
  const lines = [title];
  if (sub) lines.push(sub);
  if (facts.length) lines.push(facts.join(' · '));
  for (const s of sections) {
    lines.push('', s.name.toUpperCase());
    for (const r of s.rows) {
      const box = ticks ? (ticks[r.id] ? '[x] ' : '[ ] ') : '';
      const value = r.value == null ? '–' : r.value;
      lines.push(`${box}${r.label}${value ? `: ${value}` : ''}${r.hint ? ` (${r.hint})` : ''}`);
    }
  }
  if (foot) lines.push('', foot);
  return lines.join('\n');
}

/** The heading line of a sheet: «Demo Trail · Full suspension · M». */
export const bikeLine = (bike) => [bike?.name, bike?.type ? t(bikeTypeName(bike.type)) : '', fitValue(bike, 'frameSize') ?? ''].filter(Boolean).join(' · ');
