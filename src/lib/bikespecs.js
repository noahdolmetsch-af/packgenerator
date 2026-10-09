/**
 * v0.48.0 «Teile pro Velo» (Noah, 9.10.2026): the spec sheet of every bike, on the same parts as its
 * care (care.js PARTS, one list). Per part: model, weightG, material, typed attributes (attrs) and
 * free notes; per bike a geometry block (all numbers, all optional). Missing values stay empty,
 * the app never invents one.
 *
 * The import file (Data panel, kind 'bikeSpecs') fills a bike whose name matches:
 *   { kind: 'bikeSpecs', bike: '<name>', parts: [{ area, part, model, weightG, material, dims, notes, attrs: {…} }], geometry: {…} }
 *   or { kind: 'bikeSpecs', bikes: [{ bike, parts, geometry }, …] }
 * Part, attribute and geometry names may be the English keys or the German or English names
 * («Bremsscheiben», «Federweg», «Sitzwinkel»). It never overwrites a filled field without asking:
 * planSpecs lists the conflicts, applySpecs takes the ones the user allowed.
 * Pure functions, easy to test.
 */
import { PARTS, PART, AREAS, attrsOf, areaOf, partName, ensureParts, fits } from './care.js';
import DE from './i18n/de/index.js';

export const SPECS_KIND = 'bikeSpecs';

/** The geometry block of a bike: key, English name (German via t()), unit. */
// v0.65.0: the saddle height moved to FIT; an old geometry.seatHeight is still read (fitValue) and
// moved once by updates.js fitMove2026.
export const GEOMETRY = [
  { key: 'seatTube', name: 'Seat tube', unit: 'mm' },
  { key: 'topTube', name: 'Top tube', unit: 'mm' },
  { key: 'headTube', name: 'Head tube', unit: 'mm' },
  { key: 'headAngle', name: 'Head angle', unit: '°' },
  { key: 'seatAngle', name: 'Seat angle', unit: '°' },
  { key: 'chainstay', name: 'Chainstays', unit: 'mm' },
  { key: 'wheelbase', name: 'Wheelbase', unit: 'mm' },
  { key: 'stack', name: 'Stack', unit: 'mm' },
  { key: 'reach', name: 'Reach', unit: 'mm' },
  { key: 'standover', name: 'Standover', unit: 'mm' },
  { key: 'bbDrop', name: 'Bottom bracket offset', unit: 'mm' },
];

/**
 * v0.65.0 «Velo-Masse» (Noah: «zwingend die Sitzhöhe, der gewünschte Reifendruck, die Lenkerbreite»):
 * the fit and setup numbers of a bike, always shown on the bike page and first in «Compare bikes».
 * Stored on bike.fit (key → value). Noah's three come first. Two kinds of rows live on a part
 * already (one value, one place): the crank length (crank attrs.length) and the tyre widths (tyres
 * attrs.widthF / widthR); fit reads and writes them there. Suspension rows only on a bike with that
 * suspension (care.js fits, or a fork / shock with a model or travel), or when a value is set.
 * pressureF / pressureR: the pressure Noah WANTS (bar), not a measured one (that is the tyre history).
 */
export const FIT = [
  { key: 'seatHeight', name: 'Saddle height', unit: 'mm', num: true },
  { key: 'pressureF', name: 'Target pressure front', unit: 'bar', num: true },
  { key: 'pressureR', name: 'Target pressure rear', unit: 'bar', num: true },
  { key: 'barWidth', name: 'Bar width', unit: 'mm', num: true },
  { key: 'frameSize', name: 'Frame size', unit: '', num: false },
  { key: 'saddleSetback', name: 'Saddle setback', unit: 'mm', num: true },
  { key: 'saddleDrop', name: 'Saddle-to-bar drop', unit: 'mm', num: true },
  { key: 'stemLength', name: 'Stem length', unit: 'mm', num: true },
  { key: 'stemAngle', name: 'Stem angle', unit: '°', num: true },
  { key: 'crankLength', name: 'Crank length', unit: 'mm', num: true, part: 'crank', field: 'attrs.length' },
  { key: 'tyreWidthF', name: 'Tyre width front', unit: '', num: false, part: 'tyres', field: 'attrs.widthF' },
  { key: 'tyreWidthR', name: 'Tyre width rear', unit: '', num: false, part: 'tyres', field: 'attrs.widthR' },
  { key: 'forkPressure', name: 'Fork pressure', unit: 'psi', num: true, susp: 'fork' },
  { key: 'forkSag', name: 'Fork sag', unit: '%', num: true, susp: 'fork' },
  { key: 'shockPressure', name: 'Shock pressure', unit: 'psi', num: true, susp: 'shock' },
  { key: 'shockSag', name: 'Shock sag', unit: '%', num: true, susp: 'shock' },
];
export const FIT_KEY = Object.fromEntries(FIT.map((f) => [f.key, f]));
/** The keys always shown first (Noah's three). */
export const FIT_FIRST = ['seatHeight', 'pressureF', 'pressureR', 'barWidth'];

/** One fit value of a bike, or null (an old geometry.seatHeight counts until it is moved). */
export function fitValue(bike, key) {
  const f = FIT_KEY[key];
  if (!f) return null;
  if (f.part) {
    const part = (bike?.parts ?? []).find((p) => p.key === f.part);
    const v = part?.attrs?.[f.field.slice(6)];
    return v == null || v === '' ? null : v;
  }
  const v = bike?.fit?.[key];
  if (v != null && v !== '') return v;
  if (key === 'seatHeight') return bike?.geometry?.seatHeight ?? null;
  return null;
}

/** The bike's changes for one fit value (an empty value clears it). */
export function setFit(bike, key, value) {
  const f = FIT_KEY[key];
  if (!f) return {};
  const v = value == null || value === '' ? null : value;
  if (f.part) {
    const parts = ensureParts(bike).map((p) => (p.key === f.part ? write(p, f.field, v) : p));
    return { parts };
  }
  const fit = { ...(bike.fit ?? {}) };
  if (v == null) delete fit[key];
  else fit[key] = v;
  const out = { fit };
  if (key === 'seatHeight' && bike.geometry && 'seatHeight' in bike.geometry) {
    const { seatHeight, ...geometry } = bike.geometry;
    out.geometry = geometry;
  }
  return out;
}

/**
 * The changes that move an old geometry.seatHeight to fit.seatHeight (updates.js fitMove2026), or
 * null when there is nothing to move. A saddle height already in fit wins; the old field goes.
 */
export function moveSeatHeight(bike) {
  if (!bike?.geometry || !('seatHeight' in bike.geometry)) return null;
  const { seatHeight, ...geometry } = bike.geometry;
  const has = bike.fit?.seatHeight != null && bike.fit.seatHeight !== '';
  const fit = has || seatHeight == null || seatHeight === '' ? bike.fit ?? {} : { ...(bike.fit ?? {}), seatHeight };
  return { geometry, fit };
}

/** Has this bike a fork (sus 'fork') or a rear shock (sus 'shock')? */
export function hasSuspension(bike, sus) {
  const part = (bike?.parts ?? []).find((p) => p.key === sus);
  if (part && (part.model || part.attrs?.travel != null)) return true;
  return fits(bike ?? {}, PART[sus]);
}

/** The fit rows of one bike: [{ ...field, value }], suspension rows only where they fit or are set. */
export const fitRows = (bike) =>
  FIT.map((f) => ({ ...f, value: fitValue(bike, f.key) })).filter((r) => !r.susp || r.value != null || hasSuspension(bike, r.susp));

/** The target pressures of a bike: { f, r } (bar, null when not set) or null when neither is set. */
export function targetPressure(bike) {
  const n = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  const f = n(fitValue(bike, 'pressureF'));
  const r = n(fitValue(bike, 'pressureR'));
  return f == null && r == null ? null : { f, r };
}

/** «1.6 / 1.7 bar» for target pressures { f, r } (fmt formats one number), '' for null. */
export const pressureText = (tp, fmt = String) => (tp ? `${tp.f != null ? fmt(tp.f) : '–'} / ${tp.r != null ? fmt(tp.r) : '–'} bar` : '');

/** The fit key for a name in the import («Sitzhöhe», «bar width», «barWidth», «Solldruck vorne»), or null. */
export function fitKey(name) {
  const n = low(name).replace(/\s*\((mm|°|bar|psi|%)\)$/, '');
  const extra = {
    seatHeight: ['sitzhöhe', 'sattelhöhe', 'seat height', 'saddle height'],
    pressureF: ['solldruck vorne', 'reifendruck vorne', 'druck vorne', 'pressure front', 'target pressure front', 'tyre pressure front'],
    pressureR: ['solldruck hinten', 'reifendruck hinten', 'druck hinten', 'pressure rear', 'target pressure rear', 'tyre pressure rear'],
    barWidth: ['lenkerbreite', 'handlebar width'],
    frameSize: ['rahmengrösse', 'rahmengroesse', 'grösse', 'size'],
    saddleSetback: ['sattelversatz', 'setback'],
    saddleDrop: ['sattelüberhöhung', 'ueberhoehung', 'überhöhung', 'drop', 'saddle drop'],
    stemLength: ['vorbaulänge', 'vorbau', 'stem'],
    stemAngle: ['vorbauwinkel'],
    crankLength: ['kurbellänge'],
    tyreWidthF: ['reifenbreite vorne', 'tire width front'],
    tyreWidthR: ['reifenbreite hinten', 'tire width rear'],
    forkPressure: ['gabeldruck'],
    forkSag: ['gabel-sag', 'gabel sag', 'sag gabel'],
    shockPressure: ['dämpferdruck', 'daempferdruck'],
    shockSag: ['dämpfer-sag', 'dämpfer sag', 'daempfer-sag', 'sag dämpfer'],
  };
  return FIT.find((f) => n === low(f.key) || names(f.name).includes(n) || (extra[f.key] ?? []).includes(n))?.key ?? null;
}

/** The plain fields of a part's spec, besides its typed attributes. */
export const FIELDS = [
  { key: 'model', name: 'Model' },
  { key: 'weightG', name: 'Weight', unit: 'g', num: true },
  { key: 'material', name: 'Material' },
];

const low = (s) => String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
const names = (en) => [en, DE[en]].filter(Boolean).map(low);

/** Extra words for the part names of the import (German spec sheet, short forms). */
const PART_WORDS = {
  cockpit: ['lenker', 'vorbau', 'lenker+vorbau', 'lenker + vorbau', 'cockpit/lenker+vorbau', 'cockpit / lenker + vorbau', 'bar', 'stem', 'handlebar'],
  rotorF: ['bremsscheibe vorne', 'scheibe vorne', 'rotor front', 'front rotor'],
  rotorR: ['bremsscheibe hinten', 'scheibe hinten', 'rotor rear', 'rear rotor'],
  brakeF: ['scheibenbremse vorne', 'bremse vorne', 'brake front', 'front brake'],
  brakeR: ['scheibenbremse hinten', 'bremse hinten', 'brake rear', 'rear brake'],
  wheelF: ['vorderrad', 'laufrad vorne', 'front wheel'],
  wheelR: ['hinterrad', 'laufrad hinten', 'rear wheel'],
  tyres: ['reifen', 'pneu', 'pneus', 'tyre', 'tires', 'tire', 'tyres'],
  axles: ['steckachse', 'steckachsen', 'axle', 'axles', 'thru axle'],
  battery: ['akku', 'di2-akku', 'di2 akku', 'batterie'],
  shifting: ['schaltwerk', 'derailleur', 'rear derailleur'],
  shifter: ['schalthebel', 'shifter', 'shifters'],
  crank: ['kurbel', 'kurbeln', 'crank', 'cranks'],
  bb: ['innenlager', 'tretlager', 'bb'],
  saddle: ['sattel'],
  seatpost: ['sattelstütze', 'dropper', 'variostütze'],
  seatclamp: ['sattelstützklemme', 'sattelklemme', 'clamp'],
  frame: ['rahmen'],
  shock: ['dämpfer', 'daempfer', 'shock'],
  fork: ['gabel'],
  grips: ['griffe', 'griff', 'lenkerband', 'bar tape'],
  charger: ['ladegerät', 'ladegeraet'],
};
/** One entry for front and rear together («Scheibenbremse», «Bremsscheiben», «Laufräder»): both parts. */
const PAIRS = {
  brakes: { keys: ['brakeF', 'brakeR'], words: ['bremsen', 'bremse', 'scheibenbremse', 'scheibenbremsen', 'brake', 'brakes', 'disc brakes'] },
  rotors: { keys: ['rotorF', 'rotorR'], words: ['bremsscheiben', 'bremsscheibe', 'scheiben', 'rotor', 'rotors', 'discs'] },
  wheels: { keys: ['wheelF', 'wheelR'], words: ['laufräder', 'laufrad', 'räder', 'wheels', 'wheelset'] },
};
/** «Reifen vorne» / «Reifen hinten»: the one tyre part, its front or rear values. */
const TYRE_SIDE = { front: ['reifen vorne', 'vorderreifen', 'tyre front', 'front tyre', 'tire front', 'front tire'], rear: ['reifen hinten', 'hinterreifen', 'tyre rear', 'rear tyre', 'tire rear', 'rear tire'] };

/** The part keys for a name in the import (two for an entry that covers front and rear), or []. */
export function partKeys(name) {
  const n = low(name);
  if (!n) return [];
  const pair = Object.values(PAIRS).find((x) => x.words.includes(n));
  if (pair) return pair.keys;
  if (TYRE_SIDE.front.includes(n) || TYRE_SIDE.rear.includes(n)) return ['tyres'];
  const k = partKey(n);
  return k ? [k] : [];
}
/** 'front' | 'rear' | null: the tyre side a name speaks of. */
const tyreSide = (name) => (TYRE_SIDE.front.includes(low(name)) ? 'front' : TYRE_SIDE.rear.includes(low(name)) ? 'rear' : null);
/** 'F' | 'R' | null: an attribute name for one side only («Durchmesser vorne», «Achsdimension hinten», «diaF»). */
function sideOf(name) {
  const raw = String(name).trim();
  const n = low(raw);
  if (/(\s|-)(vorne|front|v)$/.test(n) || /[a-z]F$/.test(raw)) return 'F';
  if (/(\s|-)(hinten|rear|h)$/.test(n) || /[a-z]R$/.test(raw)) return 'R';
  return null;
}

/**
 * The attribute keys one attribute of the file goes to: [] (another side), null (unknown).
 * S: the side of the part ('F' | 'R' for a pair or a «Reifen vorne» line, else null).
 * A name for one side («Durchmesser vorne», «diaR») only goes to that side; the tyre width
 * («Breite») goes to widthF and widthR, or to the side of the line.
 */
function attrTargets(key, name, S, pair) {
  const direct = attrKey(key, name);
  if (direct) return [direct];
  const side = sideOf(name);
  const base = side ? unside(name) : name;
  if (key === 'tyres' && ['breite', 'width'].includes(low(base))) {
    const sides = side ? [side] : S ? [S] : ['F', 'R'];
    return sides.map((x) => `width${x}`);
  }
  if (side && pair && side !== S) return [];
  const ak = attrKey(key, base);
  return ak ? [ak] : null;
}
const unside = (name) => String(name).trim().replace(/(\s|-)(vorne|hinten|front|rear|v|h)$/i, '').replace(/([a-z])[FR]$/, '$1');

/** The part key for one name in the import, or null. */
export function partKey(name) {
  const n = low(name);
  if (!n) return null;
  for (const p of PARTS) {
    if (p.legacy) continue;
    if (n === p.key.toLowerCase() || names(p.name).includes(n) || (PART_WORDS[p.key] ?? []).includes(n)) return p.key;
  }
  return null;
}

/** The area key for a name in the import («Antrieb», «drive», «Drivetrain»), or null. */
export function areaKey(name) {
  const n = low(name);
  const words = { frame: ['rahmen'], drive: ['antrieb'], brakes: ['bremsen'], wheels: ['räder', 'laufräder'], cockpit: ['cockpit'], extras: ['zubehör', 'extras', 'accessories'] };
  return AREAS.find((a) => n === a.key || names(a.name).includes(n) || (words[a.key] ?? []).includes(n))?.key ?? null;
}

/** The attribute key of a part for a name in the import (key, English or German name), or null. */
export function attrKey(key, name) {
  const n = low(name);
  const extra = { dia: ['durchmesser', 'diameter', 'klemmdurchmesser'], travel: ['hub', 'federweg', 'federweg mm', 'travel'], dims: ['masse', 'maße', 'dimensionen', 'dims'], axle: ['achsdimension', 'achse'], size: ['laufradgrösse', 'radgrösse', 'laufradgroesse', 'radgroesse'], inner: ['innenmaulweite', 'maulweite'], mount: ['bremsaufnahme'], pistons: ['kolben'], cage: ['käfiglänge', 'kaefiglaenge'], cogs: ['ritzel'], range: ['übersetzung', 'bandbreite'], rings: ['kettenblätter'], ring: ['kettenblatt'], length: ['kurbellänge', 'länge'], standard: ['standard', 'norm'], eye: ['einbaulänge'], stanchion: ['standrohr', 'standrohre'], steerer: ['schaft', 'gabelschaft'], offset: ['offset', 'vorlauf'], clearance: ['reifenfreiheit'], insertMin: ['einschubtiefe min'], insertMax: ['einschubtiefe max'], modelR: ['modell hinten'] };
  return attrsOf(key).find((a) => n === low(a.key) || names(a.name).includes(n) || (extra[a.key] ?? []).includes(n))?.key ?? null;
}

/** The geometry key for a name in the import («Sitzwinkel», «seat angle», «seatAngle»), or null. */
export function geoKey(name) {
  const n = low(name).replace(/\s*\((mm|°)\)$/, '').replace(/ °$/, '');
  const extra = { bbDrop: ['tretlager-offset', 'tretlagerabsenkung', 'bb drop', 'bb offset'], headAngle: ['lenkwinkel'], seatAngle: ['sitzwinkel'], chainstay: ['kettenstreben', 'kettenstrebe', 'chainstay'], standover: ['überstand', 'ueberstand', 'überstandshöhe'], seatHeight: ['sitzhöhe'], seatTube: ['sitzrohr'], topTube: ['oberrohr'], headTube: ['steuerrohr'], wheelbase: ['radstand'] };
  return GEOMETRY.find((g) => n === low(g.key) || names(g.name).includes(n) || (extra[g.key] ?? []).includes(n))?.key ?? null;
}

/** A number from the file («245», «245 g», «66,5°»); anything else stays the text as given. */
export function readValue(v, num) {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = String(v).trim();
  if (!s) return null;
  if (!num) return s;
  const m = s.replace(/[’']/g, '').match(/^(-?\d+(?:[.,]\d+)?)\s*(?:g|mm|°|grad|bar|psi|%)?$/i);
  return m ? Number(m[1].replace(',', '.')) : s;
}

const empty = (v) => v == null || v === '';
const slug = (s) => low(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'part';

/** Is this parsed file a bike spec file? */
export const isSpecsFile = (data) => !!data && typeof data === 'object' && data.kind === SPECS_KIND && (typeof data.bike === 'string' || Array.isArray(data.bikes));

const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
/** The entries of a spec file: [{ bike, parts, geometry, fit }] (v0.65.0: fit, also «masse»). */
export const specEntries = (data) => (Array.isArray(data.bikes) ? data.bikes : [data]).map((e) => ({ bike: e.bike ?? '', parts: Array.isArray(e.parts) ? e.parts : [], geometry: obj(e.geometry), fit: { ...obj(e.masse), ...obj(e.fit) } }));

/** The bike whose name matches (ignoring case and spaces); else the one bike whose name contains it. */
export function findBike(bikes, name) {
  const n = low(name);
  if (!n) return null;
  const same = bikes.find((b) => low(b.name) === n || low(b.id) === n);
  if (same) return same;
  const part = bikes.filter((b) => low(b.name).includes(n) || n.includes(low(b.name)));
  return part.length === 1 ? part[0] : null;
}

/** Where a value lives on a part: 'model' | 'weightG' | 'material' | 'notes' | 'attrs.<key>'. */
const read = (part, field) => (field.startsWith('attrs.') ? part?.attrs?.[field.slice(6)] : part?.[field]);
function write(part, field, value) {
  if (field.startsWith('attrs.')) return { ...part, attrs: { ...(part.attrs ?? {}), [field.slice(6)]: value } };
  return { ...part, [field]: value };
}

/**
 * What a spec entry would change on a bike. Returns
 * { fills: [change], conflicts: [change], same: n, unknown: [names], added: [own part names] }
 * with change = { id, target: 'part' | 'geo', key, field, label, old, value }.
 * fills: empty fields that get a value. conflicts: filled fields with another value (asked first).
 */
export function planSpecs(bike, entry) {
  const parts = ensureParts(bike);
  const byKey = Object.fromEntries(parts.map((p) => [p.key, p]));
  const out = { fills: [], conflicts: [], same: 0, unknown: [], added: [] };
  const own = new Map();
  const consider = (target, key, field, value, label) => {
    if (empty(value)) return;
    const old = target === 'geo' ? bike.geometry?.[key] : target === 'fit' ? fitValue(bike, key) : read(byKey[key] ?? own.get(key), field);
    const change = { id: `${target}:${key}:${field}`, target, key, field, label, old: old ?? null, value };
    if (empty(old)) out.fills.push(change);
    else if (String(old) === String(value)) out.same += 1;
    else out.conflicts.push(change);
  };
  for (const line of entry.parts ?? []) {
    if (!line || typeof line !== 'object') continue;
    const name = line.part ?? line.name ?? '';
    let keys = partKeys(name);
    if (!keys.length) {
      if (!String(name).trim()) continue;
      // An own part: kept in its area (or Accessories), found again by its name.
      const key = `own-${slug(name)}`;
      if (!byKey[key] && !own.has(key)) {
        own.set(key, { key, name: String(name).trim(), area: areaKey(line.area) ?? 'extras', model: '', history: [] });
        out.added.push(String(name).trim());
      }
      keys = [key];
    }
    const pair = keys.length === 2;
    const tside = tyreSide(name); // «Reifen hinten»: the rear values of the one tyre part
    keys.forEach((key, i) => {
      const S = pair ? (i === 0 ? 'F' : 'R') : tside === 'front' ? 'F' : tside === 'rear' ? 'R' : null;
      const label = byKey[key] ? partName(byKey[key]) : own.get(key)?.name ?? key;
      const model = readValue(line.model ?? line.modell, false);
      if (key === 'tyres' && tside === 'rear') consider('part', key, 'attrs.modelR', model, label);
      else consider('part', key, 'model', model, label);
      // One weight for a pair (both brakes, both wheels) is split in half; the file names the set.
      const w = readValue(line.weightG ?? line.weight ?? line.gewicht, true);
      consider('part', key, 'weightG', pair && typeof w === 'number' ? Math.round(w / 2) : w, label);
      consider('part', key, 'material', readValue(line.material ?? line.werkstoff, false), label);
      consider('part', key, 'notes', readValue(line.notes ?? line.notiz, false), label);
      const attrs = { ...(line.attrs ?? {}) };
      if (!empty(line.dims)) attrs[attrKey(key, 'dims') ? 'dims' : '__notes'] = line.dims;
      for (const [k, v] of Object.entries(attrs)) {
        if (k === '__notes') {
          consider('part', key, 'notes', readValue(v, false), label);
          continue;
        }
        const targets = attrTargets(key, k, S, pair);
        if (targets === null) out.unknown.push(`${label}: ${k}`);
        for (const ak of targets ?? []) consider('part', key, `attrs.${ak}`, readValue(v, attrsOf(key).find((a) => a.key === ak)?.num), label);
      }
    });
  }
  // v0.65.0: a fit value in the geometry block (the old «Sitzhöhe») goes to fit.
  const fitLine = (k, v) => {
    const fk = fitKey(k);
    if (!fk) return false;
    const f = FIT_KEY[fk];
    const value = readValue(v, f.num);
    if (f.part) consider('part', f.part, f.field, value, byKey[f.part] ? partName(byKey[f.part]) : f.part);
    else consider('fit', fk, 'value', value, f.name);
    return true;
  };
  for (const [k, v] of Object.entries(entry.geometry ?? {})) {
    const gk = geoKey(k);
    if (gk) consider('geo', gk, 'value', readValue(v, true), gk);
    else if (!fitLine(k, v)) out.unknown.push(k);
  }
  for (const [k, v] of Object.entries(entry.fit ?? {})) if (!fitLine(k, v)) out.unknown.push(k);
  out.ownParts = [...own.values()];
  return out;
}

/**
 * The bike with a plan applied: every fill, and the conflicts whose id is in allow (a Set).
 * Returns { parts, geometry, fit } to store; the history of every part stays as it was.
 */
export function applySpecs(bike, plan, allow = new Set()) {
  let parts = ensureParts(bike);
  for (const p of plan.ownParts ?? []) if (!parts.some((x) => x.key === p.key)) parts = ensureParts({ ...bike, parts: [...parts, p] });
  const geometry = { ...(bike.geometry ?? {}) };
  const fit = { ...(bike.fit ?? {}) };
  for (const c of [...plan.fills, ...plan.conflicts.filter((x) => allow.has(x.id))]) {
    if (c.target === 'geo') geometry[c.key] = c.value;
    else if (c.target === 'fit') fit[c.key] = c.value;
    else parts = parts.map((p) => (p.key === c.key ? write(p, c.field, c.value) : p));
  }
  if (fit.seatHeight != null) delete geometry.seatHeight; // moved to fit (v0.65.0)
  return { parts, geometry, fit };
}

/** One spec value of a bike: part field / attribute, geometry (key 'geo') or fit (key 'fit'). */
export const specValue = (bike, key, field) => (key === 'fit' ? fitValue(bike, field) : key === 'geo' ? bike?.geometry?.[field] ?? null : read((bike?.parts ?? []).find((p) => p.key === key), field) ?? null);

/** The bike with one value set (an empty text clears it); for the comparison table and the part sheet. */
export function setSpec(bike, key, field, value) {
  const v = empty(value) ? null : value;
  if (key === 'fit') return setFit(bike, field, v);
  if (key === 'geo') {
    const geometry = { ...(bike.geometry ?? {}) };
    if (v == null) delete geometry[field];
    else geometry[field] = v;
    return { geometry };
  }
  const parts = ensureParts(bike).map((p) => (p.key === key ? write(p, field, v ?? (field === 'model' ? '' : null)) : p));
  return { parts };
}

/** Grams of the spec parts of one area that have a weight: { g, known, total }. */
export function areaWeight(bike, area) {
  const list = ensureParts(bike).filter((p) => (PART[p.key]?.spec || p.key.startsWith('own-')) && areaOf(p) === area);
  const known = list.filter((p) => typeof p.weightG === 'number');
  return { g: known.reduce((s, p) => s + p.weightG, 0), known: known.length, total: list.length };
}

/** Has this bike any spec value (a model, weight, material, attribute or geometry)? */
export function hasSpecs(bike) {
  if (Object.keys(bike?.geometry ?? {}).length || Object.values(bike?.fit ?? {}).some((v) => !empty(v))) return true;
  return (bike?.parts ?? []).some((p) => p.model || typeof p.weightG === 'number' || p.material || Object.values(p.attrs ?? {}).some((v) => !empty(v)));
}

/**
 * The rows of «Compare bikes» (Noah's refinement): the key values on top (travel, stack, reach,
 * wheel size), then per area the parts shown by default, the geometry, and under «More» the other
 * parts (also own parts of any bike, by key). Each part has a row per field and attribute; every
 * row has the value of each bike and whether the filled values differ.
 * v0.65.0: the fit rows («Fit and setup», FIT) come first of all, always shown (suspension rows only
 * when one of the bikes has that suspension or a value).
 * Returns { fit: group, top, main: [group], geo: group, more: [group] } with group = { area, name, rows } and
 * row = { id, key, field, part, first, label, unit, num, values: [v|null], differ }.
 */
export const KEY_VALUES = [
  { key: 'fork', field: 'attrs.travel', label: 'Travel front', unit: 'mm', num: true },
  { key: 'shock', field: 'attrs.travel', label: 'Travel rear', unit: 'mm', num: true },
  { key: 'geo', field: 'stack', label: 'Stack', unit: 'mm', num: true },
  { key: 'geo', field: 'reach', label: 'Reach', unit: 'mm', num: true },
  { key: 'wheelF', field: 'attrs.size', label: 'Wheel size', unit: '', num: false },
];
export function compareRows(bikes) {
  const views = bikes.map((b) => ({ ...b, parts: ensureParts(b) }));
  const partRows = (keys) =>
    keys.flatMap((key) => {
      const sample = views.map((v) => v.parts.find((p) => p.key === key)).find(Boolean) ?? { key };
      const fields = [...FIELDS, ...attrsOf(key).map((x) => ({ key: `attrs.${x.key}`, name: x.name, unit: x.unit, num: x.num }))];
      return fields.map((f, n) => row(views, key, f.key, { part: partName(sample), first: n === 0, label: f.name, unit: f.unit ?? '', num: !!f.num }));
    });
  const main = [];
  const more = [];
  for (const a of AREAS.filter((x) => x.key !== 'checks')) {
    const spec = PARTS.filter((p) => p.spec && p.area === a.key);
    const own = [];
    for (const v of views) for (const p of v.parts) if (p.key.startsWith('own-') && areaOf(p) === a.key && !own.includes(p.key)) own.push(p.key);
    const shown = spec.filter((p) => !p.more).map((p) => p.key);
    const hidden = [...spec.filter((p) => p.more).map((p) => p.key), ...own];
    if (shown.length) main.push({ area: a.key, name: a.name, rows: partRows(shown) });
    if (hidden.length) more.push({ area: a.key, name: a.name, rows: partRows(hidden) });
  }
  const top = KEY_VALUES.map((k, n) => row(views, k.key, k.field, { part: '', first: n === 0, label: k.label, unit: k.unit, num: k.num }));
  const geo = { area: 'geo', name: 'Geometry', rows: GEOMETRY.map((g, n) => row(views, 'geo', g.key, { part: '', first: n === 0, label: g.name, unit: g.unit, num: true })) };
  const fitList = FIT.filter((f) => !f.susp || views.some((v) => fitValue(v, f.key) != null || hasSuspension(v, f.susp)));
  const fit = { area: 'fit', name: 'Fit and setup', rows: fitList.map((f, n) => row(views, 'fit', f.key, { part: '', first: n === 0, label: f.name, unit: f.unit, num: f.num })) };
  return { fit, top, main, geo, more };
}
function row(views, key, field, meta) {
  const values = views.map((v) => specValue(v, key, field)).map((x) => (empty(x) ? null : x));
  const filled = values.filter((x) => !empty(x)).map((x) => String(x).toLowerCase());
  return { id: `${key}:${field}`, key, field, ...meta, values, differ: new Set(filled).size > 1 };
}
