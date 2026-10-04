#!/usr/bin/env node
/**
 * One-time converter: Bikepacking_Master_v2.xlsx → Pack Generator backup file.
 *
 *   node tools/import-excel/convert.mjs --excel <file.xlsx> --translations <de-en.json> --out <import.json>
 *
 * The result is a normal backup file: open the app, Your data → Import, choose the file.
 * Your Excel, the translations and the result stay outside this public repository.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import readExcel from 'read-excel-file/node';
import { mapItem, appliesTo, isoDate, hhmm, PRIORITY } from './mapping.js';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
if (!args.excel || !args.translations || !args.out) {
  console.error('Usage: convert.mjs --excel <file.xlsx> --translations <de-en.json> --out <import.json>');
  process.exit(1);
}

// ---------- English texts from the public prototype ----------
const protoPath = fileURLToPath(new URL('../../public/cockpit/index.html', import.meta.url));
const proto = readFileSync(protoPath, 'utf8');
/** Read `var NAME = [ ... ];` out of the prototype and evaluate the array literal. */
function protoArray(name) {
  const start = proto.indexOf(`var ${name} = [`);
  const end = proto.indexOf('\n];', start);
  return Function(`"use strict"; return ${proto.slice(start + `var ${name} = `.length, end + 2)};`)();
}
const LIB = Object.fromEntries(protoArray('LIB').map((r) => [r[0], r]));
const RULES = Object.fromEntries(protoArray('RULES').map((r) => [r[0], r]));
const EVENTS = protoArray('EVENTS');
const PROTO_ITEMS = Object.fromEntries(protoArray('ITEMS').map((r) => [r[0], r]));
const CAT_DEF = Function(`"use strict"; return ${/var CAT_DEF = (\{[^}]*\});/.exec(proto)[1]};`)();

// ---------- translations ----------
const tr = JSON.parse(readFileSync(args.translations, 'utf8'));
const missing = new Set();
/** Translate a German text; unknown texts stay German and are reported at the end. */
const t = (s) => {
  if (s == null || s === '') return '';
  if (s in tr.text) return tr.text[s];
  missing.add(s);
  return s;
};

// ---------- Excel ----------
const sheets = await readExcel(args.excel); // [{ sheet: 'Master', data: [[A1, B1, …], [A2, …]] }, …]
/** Rows of a sheet as { n: row number, vals: [column A, B, …] }, from row `first` on, skipping empty rows. */
function rows(sheetName, first = 5) {
  const data = sheets.find((s) => s.sheet === sheetName)?.data;
  if (!data) throw new Error(`Sheet "${sheetName}" not found`);
  return data
    .map((vals, i) => ({ n: i + 1, vals }))
    .filter(({ n, vals }) => n >= first && vals.some((v) => v !== null && v !== ''));
}

// Items (Master + wishlist priority)
const wish = Object.fromEntries(rows('Wunschliste').map(({ vals }) => [vals[0], PRIORITY[vals[7]] ?? null]));
const items = rows('Master')
  .filter(({ vals }) => /^[A-Z]{2}\d{2}$/.test(String(vals[0] ?? '')))
  .map(({ vals }) => {
    const item = mapItem(vals, LIB[vals[0]], t, wish[vals[0]]);
    // Same rules as the prototype: its packing list (ITEMS) knows the best name and bag,
    // otherwise the library's bag, otherwise the usual bag for the category.
    const p = PROTO_ITEMS[item.id];
    if (p) item.name = p[1];
    item.defaultBag = (p && (p[7] || p[5])) || item.defaultBag || CAT_DEF[item.category] || null;
    return item;
  });

// Kits and the two inputs below them
const kitRows = rows('Kits');
const kits = kitRows
  .filter(({ vals }) => /^[A-Z]$/.test(String(vals[0] ?? '')))
  .map(({ vals }) => ({ id: vals[0], name: t(vals[1]), use: t(vals[2]), bike: t(vals[3]), bags: t(vals[4]), domain: 'bikepacking' }));
const input = (label) => kitRows.find(({ vals }) => vals[0] === label)?.vals;
const settings = [
  { key: 'bikeWeightG', value: input('Bike (g)')?.[1] ?? null, note: t(input('Bike (g)')?.[2]) },
  { key: 'riderWeightG', value: input('Fahrer (g)')?.[1] ?? null, note: t(input('Fahrer (g)')?.[2]) },
];

// Learnings: English text from the prototype, kit scope from the Excel
const learnings = rows('Learnings')
  .filter(({ vals }) => typeof vals[0] === 'number')
  .map(({ vals }) => {
    const r = RULES[vals[0]];
    return {
      id: vals[0],
      topic: r?.[1] ?? t(vals[1]),
      rule: r?.[2] ?? t(vals[2]),
      action: r?.[3] ?? t(vals[4]),
      itemIds: r?.[4] ?? String(vals[5] ?? '').split(/,\s*/).filter(Boolean),
      source: r?.[5] ?? vals[3],
      appliesTo: appliesTo(vals[6], t),
      priority: r?.[6] ?? PRIORITY[vals[7]] ?? null,
    };
  });

// Events: English rows from the prototype, plus Excel rows the prototype does not have
const protoEvents = Object.fromEntries(
  EVENTS.map((e) => [e[0], { id: e[0], name: e[1], sortDate: e[2], dateText: e[3], type: e[4], bike: e[5], bags: e[6], result: e[7], learnings: e[8] }]),
);
const events = rows('Events').map(({ vals }) => {
  const id = tr.eventIds[vals[0]];
  if (id && protoEvents[id]) return { ...protoEvents[id], sources: vals[7] ?? '' };
  return {
    id: 'ev-' + String(vals[0]).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    name: t(vals[0]), sortDate: '', dateText: t(vals[1]), type: t(vals[2]), bike: t(vals[3]), bags: t(vals[4]),
    result: t(vals[5]), learnings: t(vals[6]), sources: vals[7] ?? '',
  };
});
for (const e of events) if (e.id === 'ev-303-oktober-2026') Object.assign(e, { id: 'ev-303', sortDate: '2026-10' });

// Alpenbrevet details go onto the two Alpenbrevet events
const ab = rows('Alpenbrevet');
const segments = ab
  .filter(({ n }) => n >= 5 && n <= 13)
  .map(({ vals }) => ({
    segment: t(vals[0]), type: t(vals[1]), climbM: vals[2], km: vals[3], vam: vals[4], time: hhmm(vals[5]), hr: vals[6], watts: vals[7], kmh: vals[8], gradient: vals[9],
  }));
const stations = ab.filter(({ n }) => n >= 19 && n <= 24).map(({ vals }) => ({ station: t(vals[0]), km: vals[1], time: hhmm(vals[2]) }));
const scenarios = ab.filter(({ n }) => n >= 33 && n <= 35).map(({ vals }) => ({ scenario: t(vals[0]), rideFactor: vals[1], stopFactor: vals[2] }));
const abText = (n) => t(ab.find((r) => r.n === n)?.vals[0]);
const ev = (id) => events.find((e) => e.id === id);
if (ev('ev-ab25')) ev('ev-ab25').details = { segments, stations };
if (ev('ev-ab26')) ev('ev-ab26').details = { startTime: hhmm(ab.find((r) => r.n === 28)?.vals[1]), scenarios, scenarioNote: abText(37), foodPlan: abText(38) };

// Maintenance
const maintenance = rows('Wartung')
  .filter(({ vals }) => typeof vals[0] === 'number')
  .map(({ vals }) => ({
    id: vals[0], area: t(vals[1]), subject: t(vals[2]), task: t(vals[3]), category: t(vals[4]), source: vals[5] ?? '',
    logDate: isoDate(vals[6]), leadWeeks: vals[7], priority: PRIORITY[vals[10]] ?? null, status: t(vals[11]), note: t(vals[13]), done: false,
  }));

// Bikes
const bikes = rows('Bikes').map(({ vals }) => ({
  id: String(vals[0]).toLowerCase().replace(/[^a-z0-9]+/g, '-'), name: vals[0], type: t(vals[1]), use: t(vals[2]),
  gearing: [vals[3], vals[4]].filter((v) => v != null), openPoints: t(vals[5]),
}));

// Weight checks
const weightChecks = rows('Gewichts-Check').map(({ vals }, i) => ({
  id: i + 1, item: t(vals[0]), logbook: t(vals[1]), online: t(vals[2]),
  adoptedG: typeof vals[3] === 'number' ? vals[3] : null, decision: t(vals[4]), sources: t(vals[5]), link: vals[6] ?? '',
}));

// The planned 303 trip (sheet "303 Plan")
const plan = rows('303 Plan', 1);
const p3 = tr.trip303;
const itemById = Object.fromEntries(items.map((i) => [i.id, i]));
const entries = plan
  .filter(({ n, vals }) => n >= 13 && /^[A-Z]{2}\d{2}$/.test(String(vals[2] ?? '')))
  .map(({ vals }) => ({ itemId: vals[2], container: itemById[vals[2]]?.defaultBag ?? null, qty: itemById[vals[2]]?.qty ?? 1, packed: false }));
const schedStart = plan.find(({ vals }) => vals[10] === 'Block')?.n;
const schedule = plan
  .filter(({ n, vals }) => schedStart && n > schedStart && vals[10])
  .map(({ vals }) => ({
    block: p3.scheduleLabels[vals[10]] ?? vals[10], from: hhmm(vals[11]), to: hhmm(vals[12]),
    note: vals[13] ? p3.scheduleNotes[vals[13]] ?? t(vals[13]) : '',
  }));
const trips = [
  {
    id: 'trip-303', domain: 'bikepacking', title: p3.title, startDate: isoDate(plan.find((r) => r.n === 4)?.vals[1]) ?? '2026-10-15',
    days: p3.food.days, bike: 'Scott Hardtail', sleep: p3.sleep, status: 'planned', copiedFrom: null, entries,
    plan: { weatherNote: p3.weatherNote, clothingByTemp: p3.clothingByTemp, clothingNote: p3.clothingNote, food: p3.food, climbing: p3.climbing, schedule, scheduleNote: p3.scheduleNote },
  },
];

const tables = { items, kits, trips, debriefs: [], learnings, events, maintenance, bikes, weightChecks, settings };
const backup = { app: 'pack-generator', schemaVersion: 1, exportedAt: new Date().toISOString(), source: 'Bikepacking_Master_v2.xlsx', tables };
writeFileSync(args.out, JSON.stringify(backup, null, 2));

// ---------- report ----------
console.log('Written:', args.out);
for (const [k, v] of Object.entries(tables)) console.log(`  ${k.padEnd(13)} ${v.length}`);
console.log(`  items without weight: ${items.filter((i) => i.weightG == null).length}`);
if (missing.size) {
  console.log(`\n${missing.size} texts without translation (kept in German):`);
  for (const s of missing) console.log('  -', s);
}
