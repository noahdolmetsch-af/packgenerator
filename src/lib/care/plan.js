/**
 * v0.144.0 RE «Pflege selbst einstellen» (mockup RE3, Noah 14.10.2026 «RE1–RE3 freigegeben», 4a 5a):
 * the card «Pflege für …» above the part list. Per bike Noah chooses which care the app reminds him
 * of (a switch per care), its interval (km and/or days, whichever comes first, 5a) or its limits
 * (warn / replace), and a note. Today's numbers stay the standard; «zurücksetzen» brings them back.
 *
 * Where it is kept (no new table, no migration, old data stays valid):
 *   - the numbers on the bike's parts, as own fields over the template (care.js partInfo merges them):
 *     everyKm, everyDays (interval), warnAt, limit (wear). A field missing = the standard; null = none.
 *     Switched off = all its fields null (an interval with neither km nor days, a wear without limits),
 *     so every rule that reads the part (due, soon, wishlist, trip check) follows without knowing this file.
 *   - the check: bike.checkKm (care.js checkKmOf; missing = 1000 km, null = off).
 *   - the notes: bike.careNotes { [care key]: text }.
 * Everything stays a suggestion: switching off only stops the reminder, the history stays.
 * Pure functions, tested in tests/careplan.test.js.
 */
import { PART, ensureParts, fits, checkKmOf, partStd } from '../care.js';
import { own as ownLive } from '../ownlive.svelte.js';

/**
 * The cares of the card, in this order. kind: 'interval' (km and/or days), 'wear' (warn and replace
 * limit of a measured value), 'check' (the km check). parts: the parts it is kept on (the first one
 * carries what is shown). name/sub: the words of the row (sub names the part).
 */
export const CARE_ITEMS = [
  { key: 'wax', kind: 'interval', parts: ['chain'], name: 'Wax the chain', sub: 'Drivetrain · Chain' },
  { key: 'chainwear', kind: 'wear', parts: ['chain'], name: 'Measure the chain', sub: 'Drivetrain · Chain' },
  { key: 'pads', kind: 'wear', parts: ['padsF', 'padsR'], name: 'Brake pads', sub: 'Brakes · front and rear' },
  { key: 'rotors', kind: 'wear', parts: ['rotorF', 'rotorR'], name: 'Brake rotors', sub: 'Brakes · front and rear' },
  { key: 'sealant', kind: 'interval', parts: ['tyres'], name: 'Top up sealant', sub: 'Wheels · tubeless only' },
  { key: 'fork', kind: 'interval', parts: ['fork'], name: 'Fork service', sub: 'Frame · suspension' },
  { key: 'shock', kind: 'interval', parts: ['shock'], name: 'Shock service', sub: 'Frame · suspension' },
  { key: 'check', kind: 'check', parts: [], name: 'Km check', sub: 'whole bike' },
];
export const CARE_ITEM = Object.fromEntries(CARE_ITEMS.map((c) => [c.key, c]));

const nn = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);
const own = (part, f) => !!part && Object.hasOwn(part, f);

/** The standard of one care: { everyKm, everyDays } | { warnAt, limit } | { everyKm } (check), from the part template. */
export function careStd(key) {
  const c = CARE_ITEM[key];
  if (!c) return null;
  if (c.kind === 'check') return { everyKm: ownLive.v.checkKm }; // «Eigene Werte» checkKm (standard CHECK_KM)
  const p = { ...PART[c.parts[0]], ...partStd(c.parts[0]) }; // «Eigene Werte»: the own standard interval
  if (c.kind === 'wear') return { warnAt: p.warnAt ?? null, limit: p.limit ?? null };
  return { everyKm: nn(p.everyKm), everyDays: nn(p.everyDays) };
}

/** The cares that fit this bike (fork and shock only with that suspension, as the due rules). */
export const careItems = (bike) => CARE_ITEMS.filter((c) => c.kind === 'check' || c.parts.every((k) => !PART[k]?.suspension || fits(bike ?? {}, PART[k])));

const partOf = (bike, key) => ensureParts(bike ?? {}).find((p) => p.key === key) ?? null;
const pick = (part, f, std) => (own(part, f) ? (part[f] == null ? null : part[f]) : std);

/**
 * One row of the card: { key, kind, name, sub, on, values, std, changed, note }.
 * values: what counts now (interval { everyKm, everyDays }, wear { warnAt, limit }, check { everyKm }).
 */
export function careRow(bike, key) {
  const c = CARE_ITEM[key];
  if (!c) return null;
  const std = careStd(key);
  let values;
  if (c.kind === 'check') values = { everyKm: checkKmOf(bike) };
  else {
    const part = partOf(bike, c.parts[0]);
    values = c.kind === 'wear' ? { warnAt: pick(part, 'warnAt', std.warnAt), limit: pick(part, 'limit', std.limit) } : { everyKm: pick(part, 'everyKm', std.everyKm), everyDays: pick(part, 'everyDays', std.everyDays) };
  }
  const on = c.kind === 'wear' ? values.limit != null : values.everyKm != null || (c.kind === 'interval' && values.everyDays != null);
  const changed = on && Object.keys(std).some((f) => (values[f] ?? null) !== (std[f] ?? null));
  return { key, kind: c.kind, name: c.name, sub: c.sub, on, values, std, changed, note: String(bike?.careNotes?.[key] ?? '') };
}

/** All rows of the card for this bike, and the line under it: { rows, on, n, changed }. */
export function carePlan(bike) {
  const rows = careItems(bike).map((c) => careRow(bike, c.key));
  return { rows, on: rows.filter((r) => r.on).length, n: rows.length, changed: rows.filter((r) => r.changed).length };
}

/**
 * Check what the sheet typed: → { values } or { error: 'interval' | 'wear' | 'number' }.
 * interval: at least km or days; wear: a replace limit, the warning on the right side of it.
 */
export function checkCare(key, values, on = true) {
  const c = CARE_ITEM[key];
  if (!c || !on) return { values: null };
  const fields = Object.keys(careStd(key));
  const out = {};
  for (const f of fields) {
    const v = values?.[f];
    if (v == null || v === '') out[f] = null;
    else if (!(typeof v === 'number' && Number.isFinite(v) && v > 0)) return { error: 'number' };
    else out[f] = v;
  }
  if (c.kind !== 'wear' && out.everyKm == null && out.everyDays == null) return { error: 'interval' };
  if (c.kind === 'wear') {
    if (out.limit == null) return { error: 'wear' };
    const low = !!PART[c.parts[0]]?.lowIsWorn;
    if (out.warnAt != null && (low ? out.warnAt <= out.limit : out.warnAt >= out.limit)) return { error: 'wear' };
  }
  return { values: out };
}

/**
 * The change to store for one care, from the bike AS STORED (not withVisits): { parts } or { checkKm }
 * plus { careNotes } when the note changed. on false switches it off; values null with on true is the
 * standard. A value equal to the standard is not kept (the part goes back to «Standard»).
 */
export function careChange(stored, key, { on = true, values = null, note } = {}) {
  const c = CARE_ITEM[key];
  if (!c) return {};
  const std = careStd(key);
  const want = on ? { ...std, ...(values ?? {}) } : Object.fromEntries(Object.keys(std).map((f) => [f, null]));
  const out = {};
  if (c.kind === 'check') {
    if (want.everyKm === std.everyKm) {
      if (Object.hasOwn(stored ?? {}, 'checkKm')) out.checkKm = undefined;
    } else out.checkKm = want.everyKm ?? null;
  } else {
    out.parts = ensureParts(stored ?? {}).map((p) => {
      if (!c.parts.includes(p.key)) return p;
      const next = { ...p };
      for (const f of Object.keys(std)) {
        if ((want[f] ?? null) === (std[f] ?? null)) delete next[f];
        else next[f] = want[f] ?? null;
      }
      return next;
    });
  }
  if (note !== undefined) {
    const text = String(note ?? '').trim();
    const notes = { ...(stored?.careNotes ?? {}) };
    if (text) notes[key] = text;
    else delete notes[key];
    out.careNotes = notes;
  }
  return out;
}

/** «Alle auf Standard zurücksetzen»: every care of the bike back to the standard (the notes stay). */
export function careResetAll(stored) {
  let bike = { ...(stored ?? {}) };
  for (const c of CARE_ITEMS) {
    const ch = careChange(bike, c.key, { on: true, values: null });
    bike = { ...bike, ...ch };
    if (Object.hasOwn(ch, 'checkKm') && ch.checkKm === undefined) delete bike.checkKm;
  }
  return { parts: bike.parts ?? ensureParts(stored ?? {}), checkKm: Object.hasOwn(bike, 'checkKm') ? bike.checkKm : undefined };
}
