/**
 * «Velo im Griff» #1009 (Noah 19.10.2026): a part template per bike kind.
 *
 * Every bike has a kind: road bike, gravel or mountain bike (bike.kind; missing → read from the bike's
 * type text, as sports.js does). Each kind has its template: which parts of care.js PARTS a bike of that
 * kind gets, plus own parts the person added to the template. The person's changes are kept in the
 * settings table (key PART_TEMPLATES) as a difference to the standard, so a part the app adds later
 * still comes:
 *   { road: { add: [keys switched on], drop: [keys switched off], own: [{ key, name, area }] }, gravel: …, mtb: … }
 * Everything is a suggestion: a part with a history, a model or any value always stays on its bike
 * (care.js ensureParts); only EMPTY parts that are not in the template are left out.
 * No import of care.js here (care.js imports this file). Pure functions, tested in tests/bikekind.test.js.
 */

/** Key in the settings table. */
export const PART_TEMPLATES = 'partTemplates';

/** The kinds, in this order. */
export const KINDS = ['road', 'gravel', 'mtb'];
/** Their names (English source, German through t()). */
export const KIND_NAME = { road: 'Road bike', gravel: 'Gravel|kind', mtb: 'Mountain bike' };

/**
 * The standard template of each kind: the parts it does NOT get (every other part of PARTS it gets).
 * A road bike has no suspension; a gravel bike may have a suspension fork (on, switchable off);
 * a mountain bike gets everything (the rear shock and linkage only on a full suspension: care.js fits).
 */
export const STD_OFF = { road: ['fork', 'shock', 'linkage'], gravel: ['shock', 'linkage'], mtb: [] };

/** Average speed of a kind in km/h, for the riding hours where no time is known (bikehours.js). */
export const KIND_SPEED = { road: 25, gravel: 20, mtb: 14 };

const TYPE_KIND = [
  [/gravel|cyclocross|\bcx\b|allroad|bikepack/i, 'gravel'],
  [/\bmtb\b|mountain|hard ?tail|full|fully|enduro|down ?hill|freeride|cross ?country|\bxc\b|trail/i, 'mtb'],
  [/road|renn|racer|aero|endurance|triathlon|\btt\b|zeitfahr/i, 'road'],
];

/** The kind a bike's type text says (null: it says nothing). */
export const kindFromType = (type) => TYPE_KIND.find(([re]) => re.test(String(type ?? '')))?.[1] ?? null;

/** The kind of a bike: its own choice, else from its type (or id), else gravel. */
export function kindOf(bike) {
  if (KINDS.includes(bike?.kind)) return bike.kind;
  return kindFromType(bike?.type) ?? kindFromType(bike?.id) ?? 'gravel';
}

const uniq = (list) => [...new Set(list)];
const clean = (x) => ({
  add: uniq((Array.isArray(x?.add) ? x.add : []).filter((k) => typeof k === 'string')),
  drop: uniq((Array.isArray(x?.drop) ? x.drop : []).filter((k) => typeof k === 'string')),
  own: (Array.isArray(x?.own) ? x.own : []).filter((p) => p && typeof p.key === 'string' && typeof p.name === 'string').map((p) => ({ key: p.key, name: p.name, area: typeof p.area === 'string' ? p.area : 'extras' })),
});

/** The stored record as a whole object (every kind present). */
export function normTemplates(raw) {
  return Object.fromEntries(KINDS.map((k) => [k, clean(raw?.[k])]));
}

/** Is this template part on for this kind (built-in keys; own parts are on while they are in the list)? */
export function partOn(templates, kind, key) {
  const t = normTemplates(templates)[kind] ?? clean(null);
  if (t.own.some((p) => p.key === key)) return true;
  if (t.add.includes(key)) return true;
  if (t.drop.includes(key)) return false;
  return !(STD_OFF[kind] ?? []).includes(key);
}

/** The own parts of a kind's template, in their order. */
export const ownOf = (templates, kind) => normTemplates(templates)[kind]?.own ?? [];

/**
 * One bike's own choice for a built-in part (Noah 19.10.2026 «teile können eingeblendet werden oder
 * ausgeblendet»): bike.partsOn / bike.partsOff win over the kind's template. true, false, or null (template).
 */
export function bikePartOn(bike, key) {
  if (Array.isArray(bike?.partsOn) && bike.partsOn.includes(key)) return true;
  if (Array.isArray(bike?.partsOff) && bike.partsOff.includes(key)) return false;
  return null;
}
/** Show or hide a built-in part on one bike → the patch { partsOn, partsOff } for the bike. */
export function setBikePart(bike, key, on) {
  const drop = (list) => (Array.isArray(list) ? list.filter((k) => k !== key) : []);
  return { partsOn: on ? [...drop(bike?.partsOn), key] : drop(bike?.partsOn), partsOff: on ? drop(bike?.partsOff) : [...drop(bike?.partsOff), key] };
}

/** Has the person changed this kind's template? */
export function changed(templates, kind) {
  const t = normTemplates(templates)[kind];
  return !!(t && (t.add.length || t.drop.length || t.own.length));
}

const withKind = (templates, kind, fn) => {
  const all = normTemplates(templates);
  all[kind] = fn(all[kind]);
  return all;
};

/** Switch a built-in part on or off in a kind's template (kept as a difference to the standard). */
export function setPartOn(templates, kind, key, on) {
  const std = !(STD_OFF[kind] ?? []).includes(key);
  return withKind(templates, kind, (t) => ({
    ...t,
    add: on && !std ? uniq([...t.add, key]) : t.add.filter((k) => k !== key),
    drop: !on && std ? uniq([...t.drop, key]) : t.drop.filter((k) => k !== key),
  }));
}

const slug = (s) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30) || 'part';

/** A key for a new own part, unique in this kind's template (the same «own-…» form as the spec import). */
export function ownKey(templates, kind, name) {
  const taken = new Set(ownOf(templates, kind).map((p) => p.key));
  const base = `own-${slug(name)}`;
  let key = base;
  for (let n = 2; taken.has(key); n++) key = `${base}-${n}`;
  return key;
}

/** Add an own part to a kind's template. → { templates, key } (key null when the name is empty). */
export function addOwn(templates, kind, name, area = 'extras') {
  const text = String(name ?? '').trim();
  if (!text) return { templates: normTemplates(templates), key: null };
  const key = ownKey(templates, kind, text);
  return { templates: withKind(templates, kind, (t) => ({ ...t, own: [...t.own, { key, name: text, area }] })), key };
}

/** Rename an own part (its key stays, so bikes that have it keep it). */
export function renameOwn(templates, kind, key, name) {
  const text = String(name ?? '').trim();
  if (!text) return normTemplates(templates);
  return withKind(templates, kind, (t) => ({ ...t, own: t.own.map((p) => (p.key === key ? { ...p, name: text } : p)) }));
}

/** Change the area of an own part. */
export function areaOwn(templates, kind, key, area) {
  return withKind(templates, kind, (t) => ({ ...t, own: t.own.map((p) => (p.key === key ? { ...p, area } : p)) }));
}

/** Remove an own part from the template. → { templates, part, at } (part and at for Undo). */
export function removeOwn(templates, kind, key) {
  const list = ownOf(templates, kind);
  const at = list.findIndex((p) => p.key === key);
  if (at < 0) return { templates: normTemplates(templates), part: null, at: -1 };
  return { templates: withKind(templates, kind, (t) => ({ ...t, own: t.own.filter((p) => p.key !== key) })), part: list[at], at };
}

/** Put a removed own part back at its place (Undo). */
export function restoreOwn(templates, kind, part, at) {
  return withKind(templates, kind, (t) => {
    if (t.own.some((p) => p.key === part.key)) return t;
    const own = [...t.own];
    own.splice(Math.max(0, Math.min(at, own.length)), 0, part);
    return { ...t, own };
  });
}

/** Move an own part from one place to another (arrows and drag). */
export function moveOwn(templates, kind, from, to) {
  return withKind(templates, kind, (t) => {
    if (from < 0 || from >= t.own.length || to < 0 || to >= t.own.length || from === to) return t;
    const own = [...t.own];
    const [p] = own.splice(from, 1);
    own.splice(to, 0, p);
    return { ...t, own };
  });
}

/** One kind back to the standard (the own parts go too). */
export const resetKind = (templates, kind) => withKind(templates, kind, () => clean(null));
