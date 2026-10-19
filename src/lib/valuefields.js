/**
 * «Bugfix Dateneingabe» D2–D4 (Noah 13.10.2026, «1a 2a 3b 4b 5a», «D1–D4 freigegeben»): the values
 * of a bike on one page «Enter values», in four groups. Which fields the page shows is chosen once
 * for all bikes (3b) and hides a field only on that page (4b): the Bike pass, the Pick-up check and
 * the Equipment still show every value, and a hidden value stays stored. Own fields (5a) have a
 * name, a unit, a kind (number or text) and a group; every bike gets them empty.
 *
 * Stored in settings under FIELDS_KEY: { hidden: [id], own: [{ id, name, unit, num, group }] }.
 * The value of an own field is stored on the bike: bike.ownValues = { [id]: value }.
 * A field id is '<part>:<field>' as in «Compare bikes» ('fit:seatHeight', 'fork:attrs.travel'),
 * or 'own:<id>'. Pure functions, tested in tests/valuefields.test.js.
 */
import { FIT_KEY, specValue, setSpec, hasSuspension, readValue } from './bikespecs.js';

export const FIELDS_KEY = 'bikeValueFields';

/** The groups of the page with their fields, in order. susp: only on a bike with that suspension (or a value). */
export const VALUE_GROUPS = [
  {
    key: 'tyres',
    name: 'Tyres and pressure',
    fields: [{ fit: 'pressureF' }, { fit: 'pressureR' }, { fit: 'tyreWidthF' }, { fit: 'tyreWidthR' }, { part: 'tyres', field: 'model', label: 'Tyres' }],
  },
  {
    key: 'susp',
    name: 'Suspension|values',
    fields: [
      { fit: 'forkPressure' },
      { fit: 'forkSag' },
      { part: 'fork', field: 'attrs.travel', label: 'Fork travel', unit: 'mm', num: true, susp: 'fork' },
      { fit: 'shockPressure' },
      { fit: 'shockSag' },
      { part: 'shock', field: 'attrs.travel', label: 'Shock travel', unit: 'mm', num: true, susp: 'shock' },
    ],
  },
  {
    key: 'fit',
    name: 'Measurements',
    fields: [{ fit: 'seatHeight' }, { fit: 'barWidth' }, { fit: 'frameSize' }, { fit: 'stemLength' }, { fit: 'stemAngle' }, { fit: 'saddleSetback' }, { fit: 'saddleDrop' }, { fit: 'crankLength' }],
  },
  {
    key: 'parts',
    name: 'Parts|values',
    fields: [
      { part: 'wheelF', field: 'attrs.size', label: 'Wheel size' },
      { part: 'axles', field: 'attrs.axle', label: 'Thru axles' },
      { part: 'cassette', field: 'attrs.range', label: 'Gear range' },
      { part: 'crank', field: 'attrs.ring', label: 'Chainring size' },
      { part: 'chain', field: 'model', label: 'Chain' },
      { part: 'brakeF', field: 'model', label: 'Brakes' },
      { part: 'rotorF', field: 'attrs.dia', label: 'Rotor front', unit: 'mm', num: true },
      { part: 'rotorR', field: 'attrs.dia', label: 'Rotor rear', unit: 'mm', num: true },
    ],
  },
];
export const GROUP_KEYS = VALUE_GROUPS.map((g) => g.key);

/**
 * «Gruppen überall» (Noah 18.10.2026): the groups as the person has them ([{ key, name }]: renamed,
 * deleted, own ones, in their order; «Listen und Typen» › Groups of the bike values). setValueGroups
 * puts them in place (lists.js). The fields of a deleted group show under «Ohne Gruppe» (key ''),
 * unless they were moved to another group when it was deleted (stored.place, stored own[].group).
 */
export const GROUP_LIST = VALUE_GROUPS.map((g) => ({ key: g.key, name: g.name }));
export const NO_GROUP = '';
export function setValueGroups(list) {
  GROUP_LIST.splice(0, GROUP_LIST.length, ...list.map((g) => ({ key: g.key, name: g.name, ...(g.raw ? { raw: true } : {}) })));
}
/** The group of each built-in field in the Standard: { fieldId: groupKey }. */
const HOME = Object.fromEntries(VALUE_GROUPS.flatMap((g) => g.fields.map((f) => [fieldOf(f).id, g.key])));

const empty = (v) => v == null || v === '';

/** The stored choice, cleaned: { hidden: [id], own: [field], place: { fieldId: groupKey } }. */
export function fieldsOf(stored) {
  const s = stored && typeof stored === 'object' ? stored : {};
  const own = (Array.isArray(s.own) ? s.own : []).filter((f) => f && typeof f.id === 'string' && String(f.name ?? '').trim());
  const place = Object.fromEntries(Object.entries(s.place && typeof s.place === 'object' ? s.place : {}).filter(([id, g]) => HOME[id] && typeof g === 'string'));
  return {
    hidden: Array.isArray(s.hidden) ? s.hidden.filter((x) => typeof x === 'string') : [],
    own: own.map((f) => ({ id: f.id, name: String(f.name).trim(), unit: String(f.unit ?? '').trim(), num: !!f.num, group: typeof f.group === 'string' ? f.group : 'parts' })),
    ...(Object.keys(place).length ? { place } : {}),
  };
}

/** The group a field shows in: its place, else its Standard group (own fields: their group). */
const groupOfRow = (s, row) => (row.own ? (s.own.find((o) => `own:${o.id}` === row.id)?.group ?? NO_GROUP) : (s.place?.[row.id] ?? HOME[row.id]));
const ALL_FIELDS = VALUE_GROUPS.flatMap((g) => g.fields.map(fieldOf));

/** How many fields each group holds (hidden ones too): { groupKey: n }. */
export function groupCounts(stored) {
  const s = fieldsOf(stored);
  const out = {};
  for (const r of [...ALL_FIELDS, ...s.own.map(ownField)]) {
    const g = groupOfRow(s, r);
    out[g] = (out[g] ?? 0) + 1;
  }
  return out;
}

/**
 * Before a group is deleted: its fields move to the group `to` (null: they show under «Ohne Gruppe»
 * and come back with the group when «Auf Standard zurücksetzen» brings it back).
 */
export function moveGroupFields(stored, from, to) {
  const s = fieldsOf(stored);
  if (!to) return s;
  const place = { ...(s.place ?? {}) };
  for (const r of ALL_FIELDS) if (groupOfRow(s, r) === from) place[r.id] = to;
  return { ...s, own: s.own.map((o) => (o.group === from ? { ...o, group: to } : o)), ...(Object.keys(place).length ? { place } : {}) };
}

/** One field of a group in a common form: { id, key, field, label (English, for t), unit, num, own, susp }. */
function fieldOf(f) {
  if (f.fit) {
    const x = FIT_KEY[f.fit];
    return { id: `fit:${f.fit}`, key: 'fit', field: f.fit, label: x.name, unit: x.unit ?? '', num: !!x.num, own: false, susp: x.susp ?? null };
  }
  return { id: `${f.part}:${f.field}`, key: f.part, field: f.field, label: f.label, unit: f.unit ?? '', num: !!f.num, own: false, susp: f.susp ?? null };
}
const ownField = (o) => ({ id: `own:${o.id}`, key: 'own', field: o.id, label: o.name, unit: o.unit, num: o.num, own: true, susp: null });

/** The value of one field on a bike, or null. */
export function valueOf(bike, row) {
  if (row.own) {
    const v = bike?.ownValues?.[row.field];
    return empty(v) ? null : v;
  }
  const v = specValue(bike, row.key, row.field);
  return empty(v) ? null : v;
}

/** The bike's changes for one field (an empty text clears it). A number field reads «1,8» as 1.8. */
export function setValue(bike, row, input) {
  const v = typeof input === 'string' ? (input.trim() === '' ? null : readValue(input, row.num)) : input ?? null;
  if (row.own) {
    const ownValues = { ...(bike.ownValues ?? {}) };
    if (v == null) delete ownValues[row.field];
    else ownValues[row.field] = v;
    return { ownValues };
  }
  return setSpec(bike, row.key, row.field, v);
}

/** Does this field belong on this bike (a suspension value only with that suspension, or a value)? */
function fitsBike(bike, row) {
  if (!row.susp) return true;
  return valueOf(bike, row) != null || hasSuspension(bike, row.susp);
}

/**
 * The page of one bike: { groups: [{ key, name, rows, filled, total }], filled, total }.
 * row = { ...field, value, hidden }. all: also the hidden fields (for «Choose fields»);
 * without a bike, every field (the choice is the same for all bikes).
 */
export function valueGroups(bike, stored, { all = false } = {}) {
  const s = fieldsOf(stored);
  const { hidden, own } = s;
  const known = new Set(GROUP_LIST.map((g) => g.key));
  const rowsOf = (key) => [...ALL_FIELDS, ...own.map(ownField)].filter((r) => (known.has(groupOfRow(s, r)) ? groupOfRow(s, r) : NO_GROUP) === key);
  const list = [...GROUP_LIST, { key: NO_GROUP, name: 'No group' }];
  const groups = list.map((g) => {
    const rows = rowsOf(g.key)
      .filter((r) => !bike || fitsBike(bike, r))
      .map((r) => ({ ...r, value: bike ? valueOf(bike, r) : null, hidden: hidden.includes(r.id) }))
      .filter((r) => all || !r.hidden);
    const shown = rows.filter((r) => !r.hidden);
    return { key: g.key, name: g.name, raw: !!g.raw, rows, filled: shown.filter((r) => r.value != null).length, total: shown.length };
  }).filter((g) => g.rows.length || (all && g.key !== NO_GROUP));
  return { groups, filled: groups.reduce((s, g) => s + g.filled, 0), total: groups.reduce((s, g) => s + g.total, 0) };
}

/** The choice with one field shown or hidden. */
export function toggleField(stored, id, show) {
  const s = fieldsOf(stored);
  const hidden = show ? s.hidden.filter((x) => x !== id) : [...new Set([...s.hidden, id])];
  return { ...s, hidden };
}

/** The choice with every field shown again. */
export const showAll = (stored) => ({ ...fieldsOf(stored), hidden: [] });

const slug = (s) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24) || 'feld';

/** The choice with a new own field; returns { fields, id } (id: the field's 'own:…' id), or null without a name. */
export function addOwnField(stored, { name, unit = '', num = true, group = 'parts' }) {
  const s = fieldsOf(stored);
  const n = String(name ?? '').trim();
  if (!n) return null;
  let id = slug(n);
  for (let k = 2; s.own.some((o) => o.id === id); k++) id = `${slug(n)}-${k}`;
  const field = { id, name: n, unit: String(unit ?? '').trim(), num: !!num, group: typeof group === 'string' ? group : 'parts' };
  return { fields: { ...s, own: [...s.own, field] }, id: `own:${id}` };
}

/** The choice with an own field renamed (an empty name keeps the old one). */
export function renameOwnField(stored, id, name) {
  const s = fieldsOf(stored);
  const n = String(name ?? '').trim();
  if (!n) return s;
  return { ...s, own: s.own.map((o) => (`own:${o.id}` === id ? { ...o, name: n } : o)) };
}

/** The choice without an own field (the values stay on the bikes, so adding it again brings them back). */
export function removeOwnField(stored, id) {
  const s = fieldsOf(stored);
  return { ...s, hidden: s.hidden.filter((x) => x !== id), own: s.own.filter((o) => `own:${o.id}` !== id) };
}

/** The step of the − and + buttons for a unit: 0.1 bar, 1 for the rest. */
export const stepOf = (unit) => (unit === 'bar' ? 0.1 : 1);

/** A number one step up (dir 1) or down (dir -1), rounded to the step; null stays null. */
export function stepValue(v, unit, dir) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return v;
  const s = stepOf(unit);
  const out = Math.round((v + dir * s) / s) * s;
  return Number(out.toFixed(s < 1 ? 1 : 0));
}

