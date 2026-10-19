/**
 * «Bausteine» (Noah 15.10.2026: «den Werkstatt-Auftrag und den Velo-Pass im Frontend modular
 * erweitern»; answers B «1 a+b, 2 a+b, 3 a+b, 4a, 5a» and BS «1b 2a 3b 4a 5b»): the Bike pass and the
 * Workshop order are made of building blocks. Pure, tested in tests/sheetblocks.test.js.
 *
 * - One standard for all bikes (settings 'sheetBlocks'), and a bike can have its own order (B1 a+b).
 *   The first change on a bike asks once: for all bikes or only for this one (BS4 a); the answer is
 *   kept on the bike (sheetBlocks.scope) and can be changed on the page «Bausteine».
 * - A block is moved with arrows and by dragging (B2 a+b), on the page «Bausteine» and right in the
 *   sheet (B3 a+b). A block switched off is missing in the PDF and the copied text too (B4 a).
 * - Own blocks (text, checklist, values): the definition is for all bikes, the text, the ticks and
 *   the values belong to each bike (B5 a). Deleting one deletes it on this bike; when other bikes have
 *   it too the app asks whether to delete it there as well (BS5 b).
 *
 * Stored: settings { key: 'sheetBlocks', value: { layout: { pass, order }, own: [def] } } (missing: the
 * standard) and on the bike: sheetBlocks = { layout: { pass, order } (null: the standard), scope:
 * 'all' | 'bike' (asked once), own: { [id]: { text, ticks, values } }, gone: [own id], data: { budget,
 * pickupWish, partsBrought } }. A layout is a list [{ id, on }]: its order is the order on the sheet.
 */

export const BLOCKS_KEY = 'sheetBlocks';
export const SHEETS_WITH_BLOCKS = ['pass', 'order'];

/**
 * The built blocks: id, the sheets it can stand on, its name (English, for t()), its standard
 * position per sheet (null: in «More building blocks») and whether it is on there.
 */
export const BLOCKS = [
  // Bike pass
  { id: 'suspension', name: 'Suspension|sheet', std: { pass: 1 } },
  { id: 'wheels', name: 'Tyres and wheels', std: { pass: 2 } },
  { id: 'fit', name: 'Position and cockpit', std: { pass: 3 } },
  { id: 'drive', name: 'Drivetrain and brakes', std: { pass: 4 } },
  { id: 'measured', name: 'Last measured', std: { pass: 5, order: 4 } },
  { id: 'ownFields', name: 'Own fields', std: { pass: 6 } },
  { id: 'geometry', name: 'Geometry', std: { pass: 8 }, off: ['pass'] },
  { id: 'lastService', name: 'Last service', std: { pass: null } },
  { id: 'warrantyShort', name: 'Warranty in short', std: { pass: null } },
  { id: 'frameId', name: 'Frame number and marks', std: { pass: null } },
  { id: 'workshop', name: 'Bike shop|block', std: { pass: null } },
  { id: 'replaced', name: 'Replaced parts', std: { pass: null, order: null }, isNew: true },
  { id: 'nextDue', name: 'Due next', std: { pass: null }, isNew: true },
  // Workshop order
  { id: 'jobs', name: 'Please do', std: { order: 1 } },
  { id: 'again', name: 'As it should be again', std: { order: 2 } },
  { id: 'budget', name: 'Cost limit', std: { order: 3 } },
  { id: 'wishes', name: 'Wishes', std: { order: 6 } },
  // BS1 b: «Bitte so lassen» is on from the start
  { id: 'keep', name: 'Please leave as it is', std: { order: 7 } },
  { id: 'problems', name: 'Problems since the last visit', std: { order: null } },
  { id: 'pickupWish', name: 'Pick-up wish', std: { order: null } },
  { id: 'nextTrip', name: 'Next trip', std: { order: null } },
  { id: 'partsBrought', name: 'Parts I bring', std: { order: null } },
  { id: 'partSizes', name: 'Sizes for spare parts', std: { order: null }, isNew: true },
];
export const BLOCK = Object.fromEntries(BLOCKS.map((b) => [b.id, b]));

/** The own blocks every app starts with (they can be renamed, changed and deleted like any own block). */
export const OWN_START = [
  { id: 'note', title: 'Note', kind: 'text', sheets: ['pass'], toShop: true, std: '', at: { pass: 7 } },
  {
    id: 'beforeDrop',
    title: 'Before dropping it off',
    kind: 'check',
    sheets: ['order'],
    // BS2 a: a list for me, not in the text to the bike shop
    toShop: false,
    points: [
      { id: 'bags', text: 'Take off the bags' },
      { id: 'computer', text: 'Take off the bike computer and the lights' },
      { id: 'clean', text: 'Clean the bike roughly' },
      { id: 'valuables', text: 'Valuables out of the bags' },
      { id: 'key', text: 'Take the key of the lock' },
    ],
    at: { order: 5 },
  },
];
export const OWN_KINDS = ['text', 'check', 'values'];

const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
const ownId = (id) => `own:${id}`;
export const isOwn = (id) => typeof id === 'string' && id.startsWith('own:');

/** One own block, cleaned. */
function cleanOwn(o) {
  const kind = OWN_KINDS.includes(o.kind) ? o.kind : 'text';
  const sheets = (Array.isArray(o.sheets) ? o.sheets : []).filter((s) => SHEETS_WITH_BLOCKS.includes(s));
  return {
    id: String(o.id),
    title: String(o.title ?? '').trim(),
    kind,
    sheets: sheets.length ? sheets : ['pass'],
    toShop: o.toShop !== false,
    std: typeof o.std === 'string' ? o.std : '',
    points: (Array.isArray(o.points) ? o.points : []).filter((p) => p && p.id && String(p.text ?? '').trim()).map((p) => ({ id: String(p.id), text: String(p.text).trim() })),
    labels: (Array.isArray(o.labels) ? o.labels : []).filter((p) => p && p.id && String(p.text ?? '').trim()).map((p) => ({ id: String(p.id), text: String(p.text).trim(), unit: String(p.unit ?? '').trim() })),
    ...(o.at ? { at: o.at } : {}),
  };
}

/**
 * The standard layout of one sheet: built blocks and the starting own blocks at their places, then
 * the other blocks of that sheet as «More building blocks» (lib: true, always at the end).
 */
export function standardLayout(sheet, own = OWN_START) {
  const placed = [
    ...BLOCKS.filter((b) => b.std[sheet] != null).map((b) => ({ id: b.id, at: b.std[sheet], on: !(b.off ?? []).includes(sheet) })),
    ...own.filter((o) => o.sheets.includes(sheet)).map((o, n) => ({ id: ownId(o.id), at: o.at?.[sheet] ?? 100 + n, on: true })),
  ];
  const lib = BLOCKS.filter((b) => sheet in b.std && b.std[sheet] == null).map((b) => ({ id: b.id, on: false, lib: true }));
  return [...placed.sort((a, b) => a.at - b.at).map(({ id, on }) => ({ id, on })), ...lib];
}

/**
 * The stored standard, cleaned: { layout: { pass, order }, own: [def] }. Without a stored value: the
 * standard with the starting own blocks (in the words of the current language, t).
 */
export function globalOf(stored, t = (s) => s) {
  const v = isObj(stored) ? stored : {};
  const own = Array.isArray(v.own) ? v.own.filter((o) => o && o.id).map(cleanOwn) : OWN_START.map((o) => cleanOwn({ ...o, title: t(o.title), points: (o.points ?? []).map((p) => ({ ...p, text: t(p.text) })) }));
  const layout = {};
  for (const sheet of SHEETS_WITH_BLOCKS) layout[sheet] = fix(Array.isArray(v.layout?.[sheet]) ? v.layout[sheet] : standardLayout(sheet, own), sheet, own);
  return { layout, own };
}

/**
 * A layout with every id known once, the blocks of «More building blocks» at the end, and the
 * blocks that are new since it was stored added: at their standard place, or to «More building blocks».
 */
function fix(list, sheet, own) {
  const known = new Set([...BLOCKS.filter((b) => sheet in b.std).map((b) => b.id), ...own.filter((o) => o.sheets.includes(sheet)).map((o) => ownId(o.id))]);
  const seen = new Set();
  const all = list.filter((x) => x && known.has(x.id) && !seen.has(x.id) && seen.add(x.id)).map((x) => (x.lib ? { id: x.id, on: false, lib: true } : { id: x.id, on: x.on !== false }));
  const out = all.filter((x) => !x.lib);
  const lib = all.filter((x) => x.lib);
  standardLayout(sheet, own).forEach((x, n) => {
    if (seen.has(x.id)) return;
    seen.add(x.id);
    if (x.lib) lib.push({ ...x });
    else out.splice(Math.min(n, out.length), 0, { ...x });
  });
  return [...out, ...lib];
}

/** The bike's own part of the blocks, cleaned. */
export function bikeBlocks(bike) {
  const s = isObj(bike?.sheetBlocks) ? bike.sheetBlocks : {};
  return {
    layout: { pass: Array.isArray(s.layout?.pass) ? s.layout.pass : null, order: Array.isArray(s.layout?.order) ? s.layout.order : null },
    scope: s.scope === 'all' || s.scope === 'bike' ? s.scope : null,
    own: isObj(s.own) ? s.own : {},
    gone: Array.isArray(s.gone) ? s.gone.filter((x) => typeof x === 'string') : [],
    data: isObj(s.data) ? s.data : {},
  };
}

/** The own blocks this bike has (an own block deleted on this bike is gone here). */
export const ownOf = (bike, glob) => glob.own.filter((o) => !bikeBlocks(bike).gone.includes(o.id));

/**
 * The whole layout of one sheet for one bike: [{ id, on, lib }], its own order when it has one, else
 * the standard; an own block deleted on this bike is left out. lib: in «More building blocks».
 */
export function fullLayout(bike, sheet, glob) {
  const mine = bikeBlocks(bike);
  const own = ownOf(bike, glob);
  const list = mine.layout[sheet] ? fix(mine.layout[sheet], sheet, own) : glob.layout[sheet];
  const gone = new Set(mine.gone.map(ownId));
  return list.filter((x) => !gone.has(x.id));
}

/** The blocks on the sheet (switched on or off), in their order: [{ id, on }]. */
export const layoutFor = (bike, sheet, glob) => fullLayout(bike, sheet, glob).filter((x) => !x.lib);

/** The ids of the blocks that are on and in their order (what the sheet, the PDF and the text show). */
export const shownIds = (bike, sheet, glob) => layoutFor(bike, sheet, glob).filter((x) => x.on).map((x) => x.id);

/** Whether this bike follows its own order on that sheet. */
export const hasOwnLayout = (bike, sheet) => !!bikeBlocks(bike).layout[sheet];

/** The blocks of a sheet that are not on it («More building blocks»): [id]. */
export const libraryFor = (bike, sheet, glob) => fullLayout(bike, sheet, glob).filter((x) => x.lib).map((x) => x.id);

/** The definition of a block: { id, name (English, for t) | title (own), own, kind, sheets, isNew }. */
export function blockDef(id, glob) {
  if (isOwn(id)) {
    const o = glob.own.find((x) => ownId(x.id) === id);
    return o ? { ...o, id, ownId: o.id, own: true } : null;
  }
  const b = BLOCK[id];
  return b ? { id, name: b.name, own: false, sheets: Object.keys(b.std), isNew: !!b.isNew } : null;
}

/* ---------- changing a layout (pure: each returns a new list) ---------- */

// A layout is changed whole ([{ id, on, lib }]): the blocks on the sheet first, «More building
// blocks» after them. Moving goes only among the blocks on the sheet.
const onSheet = (list) => list.filter((x) => !x.lib).length;

/** One place up (delta −1) or down (+1). */
export function moveBlock(list, id, delta) {
  const i = list.findIndex((x) => x.id === id);
  const j = i + delta;
  if (i < 0 || list[i].lib || j < 0 || j >= onSheet(list)) return list;
  const out = [...list];
  [out[i], out[j]] = [out[j], out[i]];
  return out;
}
/** Dragged from one place to another (places among the blocks on the sheet). */
export function moveTo(list, from, to) {
  const n = onSheet(list);
  if (from === to || from < 0 || from >= n) return list;
  const out = [...list];
  const [x] = out.splice(from, 1);
  out.splice(Math.max(0, Math.min(to, n - 1)), 0, x);
  return out;
}
export const switchBlock = (list, id, on) => list.map((x) => (x.id === id && !x.lib ? { ...x, on } : x));
/** A block from «More building blocks» onto the sheet, at its end (switched on). */
export function addBlock(list, id) {
  const rest = list.filter((x) => x.id !== id);
  const n = onSheet(rest);
  return [...rest.slice(0, n), { id, on: true }, ...rest.slice(n)];
}
/** A block taken off the sheet: it goes to «More building blocks». */
export const takeOff = (list, id) => (list.some((x) => x.id === id && !x.lib) ? [...list.filter((x) => x.id !== id), { id, on: false, lib: true }] : list);

/**
 * Where a changed layout is stored: { settings } (the new standard) or { bike } (the fields of the
 * bike to update). scope 'all' changes the standard (and a bike with its own order keeps it);
 * scope 'bike' gives the bike its own order of that sheet.
 */
export function saveLayout(glob, bike, sheet, list, scope) {
  const clean = list.map((x) => (x.lib ? { id: x.id, on: false, lib: true } : { id: x.id, on: x.on !== false }));
  if (scope === 'bike') {
    const mine = bikeBlocks(bike);
    return { bike: { sheetBlocks: { ...(bike.sheetBlocks ?? {}), scope: mine.scope ?? 'bike', layout: { ...mine.layout, [sheet]: clean } } } };
  }
  const out = { settings: { layout: { ...glob.layout, [sheet]: clean }, own: glob.own } };
  // BS4 a: the answer «for all bikes» is kept on the bike, so it is asked once
  if (bike && !bikeBlocks(bike).scope) out.bike = { sheetBlocks: { ...(bike.sheetBlocks ?? {}), scope: 'all' } };
  return out;
}

/** «Use the standard again» on one bike and one sheet. */
export function resetBike(bike, sheet) {
  const mine = bikeBlocks(bike);
  return { sheetBlocks: { ...(bike.sheetBlocks ?? {}), layout: { ...mine.layout, [sheet]: null } } };
}

/** The scope a change on this bike goes to: its own order when it has one, else what it answered once. */
export function scopeOf(bike, sheet) {
  if (hasOwnLayout(bike, sheet)) return 'bike';
  return bikeBlocks(bike).scope;
}

/* ---------- own blocks ---------- */

/** A new own block: { def } or { error } (English, for t). */
export function newOwn(glob, { id, title, kind = 'text', sheets = ['pass'], toShop = true, std = '', points = [], labels = [] }) {
  const name = String(title ?? '').trim();
  if (!name) return { error: 'Please give it a title.' };
  if (glob.own.some((o) => o.title.toLowerCase() === name.toLowerCase() && o.id !== id)) return { error: 'There is already a block with this title.' };
  return { def: cleanOwn({ id, title: name, kind, sheets, toShop, std, points, labels }) };
}

/** The standard with an own block added (at the end of its sheets) or changed. */
export function putOwn(glob, def) {
  const exists = glob.own.some((o) => o.id === def.id);
  const own = exists ? glob.own.map((o) => (o.id === def.id ? def : o)) : [...glob.own, def];
  const layout = {};
  for (const sheet of SHEETS_WITH_BLOCKS) {
    let list = glob.layout[sheet].filter((x) => x.id !== ownId(def.id) || def.sheets.includes(sheet));
    if (def.sheets.includes(sheet) && !list.some((x) => x.id === ownId(def.id))) list = addBlock(list, ownId(def.id));
    layout[sheet] = list;
  }
  return { layout, own };
}

/**
 * BS5 b: the other bikes that still have this own block (so the app asks «on all bikes too?» only
 * when that matters).
 */
export const othersWith = (bikes, bikeId, id) => bikes.filter((b) => b.id !== bikeId && !bikeBlocks(b).gone.includes(id));

/** Deleting an own block on one bike: the bike's fields. */
export function goneOnBike(bike, id) {
  const mine = bikeBlocks(bike);
  return { sheetBlocks: { ...(bike.sheetBlocks ?? {}), gone: [...new Set([...mine.gone, id])] } };
}

/** Deleting an own block on all bikes: the new standard (the texts on the bikes stay, unused). */
export function goneEverywhere(glob, id) {
  const layout = {};
  for (const sheet of SHEETS_WITH_BLOCKS) layout[sheet] = glob.layout[sheet].filter((x) => x.id !== ownId(id));
  return { layout, own: glob.own.filter((o) => o.id !== id) };
}

/** The content of an own block on one bike: { text, ticks, values }. */
export function ownContent(bike, def) {
  const c = bikeBlocks(bike).own[def.ownId ?? def.id] ?? {};
  return { text: typeof c.text === 'string' ? c.text : def.std ?? '', ticks: isObj(c.ticks) ? c.ticks : {}, values: isObj(c.values) ? c.values : {} };
}

/** The bike's fields with the content of one own block changed. */
export function setOwnContent(bike, id, patch) {
  const mine = bikeBlocks(bike);
  return { sheetBlocks: { ...(bike.sheetBlocks ?? {}), own: { ...mine.own, [id]: { ...(mine.own[id] ?? {}), ...patch } } } };
}

/** The bike's fields with one value of a built block that takes input (budget, pickupWish, partsBrought). */
export function setBlockData(bike, id, value) {
  const mine = bikeBlocks(bike);
  return { sheetBlocks: { ...(bike.sheetBlocks ?? {}), data: { ...mine.data, [id]: value } } };
}

/** Whether an own block has something to show on this bike. */
export function ownHasContent(bike, def) {
  const c = ownContent(bike, def);
  if (def.kind === 'text') return !!c.text.trim();
  if (def.kind === 'check') return def.points.length > 0;
  return def.labels.some((l) => c.values[l.id] != null && c.values[l.id] !== '');
}
