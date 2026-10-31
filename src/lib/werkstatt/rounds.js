/**
 * Velo-Idee 76 «Eigene Wartungsabläufe» (996 Ideen, Noah 26.10.2026 «4a 5a»): «Werkstatt-Runden», own
 * routines for the work at home. A round has jobs (each may name a part and what is done to it), tools
 * and material; it is made once and ticked off again and again. A ticked job with a part goes into that
 * part's history («gewartet», «geprüft» or «ersetzt», by yourself, 5a). Rounds live in the settings table
 * (key ROUNDS_KEY), so every backup carries them. Everything can be added, renamed, moved and deleted.
 * Pure functions, tested in tests/veloideen.test.js.
 */
import { localDay } from '../localday.js';

export const ROUNDS_KEY = 'werkstatt.rounds';
/** The kinds of lists in a round. */
export const LISTS = ['steps', 'tools', 'material'];
/** What a job does to its part. */
export const STEP_ACTIONS = ['service', 'check', 'replace'];

const clean = (s, max = 80) => `${s ?? ''}`.replace(/\s+/g, ' ').trim().slice(0, max);
const step = (s) => ({ id: s.id, text: clean(s.text), part: s.part || null, action: STEP_ACTIONS.includes(s.action) ? s.action : 'service' });
const thing = (x) => ({ id: x.id, name: clean(x.name, 60) });

/** A round as stored, with every field. */
export function normRound(r) {
  return {
    id: r.id,
    name: clean(r.name, 60) || 'Round',
    bikes: Array.isArray(r.bikes) ? r.bikes.filter(Boolean) : [],
    steps: (r.steps ?? []).filter((s) => s?.id && clean(s.text)).map(step),
    tools: (r.tools ?? []).filter((x) => x?.id && clean(x.name)).map(thing),
    material: (r.material ?? []).filter((x) => x?.id && clean(x.name)).map(thing),
    last: r.last && typeof r.last === 'object' ? { ...r.last } : {},
  };
}
/** The rounds from the settings value (an array, or nothing). */
export const roundsOf = (value) => (Array.isArray(value) ? value.filter((r) => r?.id).map(normRound) : []);
/** The rounds for one bike: those without bikes are for all. */
export const roundsFor = (rounds, bikeId) => rounds.filter((r) => !r.bikes.length || r.bikes.includes(bikeId));

/** Three suggestions to start from (a tap adds one; names and texts go through t() by the page). */
export const ROUND_IDEAS = [
  { key: 'rain', name: 'After the rain ride', steps: [['Clean and oil the chain', 'chain'], ['Wipe the brakes dry', null, 'check'], ['Check the tyres for cuts', 'tyres', 'check']], tools: ['Brush', 'Rag'], material: ['Chain oil'] },
  { key: 'autumn', name: 'Autumn service', steps: [['Clean and oil the chain', 'chain'], ['Measure the chain', 'chain', 'check'], ['Check the brake pads', 'padsF', 'check'], ['Tighten the bolts', 'bolts', 'check'], ['Pump the tyres to the target', 'tyres', 'check']], tools: ['Chain checker', 'Torque wrench', 'Pump with gauge'], material: ['Chain oil', 'Degreaser', 'Rag'] },
  { key: 'tour', name: 'Before the tour', steps: [['Check the brake pads', 'padsF', 'check'], ['Check the tyres for cuts', 'tyres', 'check'], ['Clean and oil the chain', 'chain'], ['Check the bag mounts', null, 'check']], tools: ['Multitool', 'Pump with gauge'], material: ['Chain oil'] },
];

/** A round from a suggestion; tr translates the texts; ids from newId(). */
export function fromIdea(idea, { tr = (s) => s, newId }) {
  return normRound({
    id: newId(),
    name: tr(idea.name),
    steps: idea.steps.map(([text, part, action]) => ({ id: newId(), text: tr(text), part, action: action ?? 'service' })),
    tools: idea.tools.map((name) => ({ id: newId(), name: tr(name) })),
    material: idea.material.map((name) => ({ id: newId(), name: tr(name) })),
  });
}

/** A round from the lines of a workshop visit (a part and a job each): what the shop did, now at home. */
export function fromVisit(visit, { name, partName = (k) => k, newId }) {
  const lines = (visit?.parts ?? []).filter((l) => l.part && l.part !== 'other');
  const seen = new Set();
  const steps = lines.filter((l) => !seen.has(`${l.part}:${l.action}`) && seen.add(`${l.part}:${l.action}`)).map((l) => ({ id: newId(), text: clean(l.what) || partName(l.part), part: l.part, action: STEP_ACTIONS.includes(l.action) ? l.action : 'service' }));
  return normRound({ id: newId(), name, steps, tools: [], material: [] });
}

/** Changes of one round: rounds → rounds. */
export const changeRound = (rounds, id, fn) => rounds.map((r) => (r.id === id ? normRound(fn(r)) : r));
/** Add a row to a list of a round (steps: { text, part, action }; tools / material: { name }). */
export const addRow = (rounds, id, list, row) => changeRound(rounds, id, (r) => ({ ...r, [list]: [...r[list], row] }));
/** Change one row. */
export const editRow = (rounds, id, list, rowId, patch) => changeRound(rounds, id, (r) => ({ ...r, [list]: r[list].map((x) => (x.id === rowId ? { ...x, ...patch } : x)) }));
/** Take a row away. */
export const dropRow = (rounds, id, list, rowId) => changeRound(rounds, id, (r) => ({ ...r, [list]: r[list].filter((x) => x.id !== rowId) }));
/** Move a row from one place to another. */
export function moveRow(rounds, id, list, from, to) {
  return changeRound(rounds, id, (r) => {
    const rows = [...r[list]];
    if (from < 0 || from >= rows.length || to < 0 || to >= rows.length || from === to) return r;
    const [x] = rows.splice(from, 1);
    rows.splice(to, 0, x);
    return { ...r, [list]: rows };
  });
}
/** Move a round in the list. */
export function moveRound(rounds, from, to) {
  if (from < 0 || from >= rounds.length || to < 0 || to >= rounds.length || from === to) return rounds;
  const list = [...rounds];
  const [x] = list.splice(from, 1);
  list.splice(to, 0, x);
  return list;
}

/**
 * The part history entries of a finished run: [{ key, entry }] for the ticked jobs with a part (one
 * per part and job), as by yourself. km: the bike's km now.
 */
export function runEntries(round, ticked, { km = null, day = localDay(), note = '' } = {}) {
  const seen = new Set();
  return round.steps
    .filter((s) => ticked.includes(s.id) && s.part)
    .filter((s) => !seen.has(`${s.part}:${s.action}`) && seen.add(`${s.part}:${s.action}`))
    .map((s) => ({ key: s.part, entry: { date: day, km, value: null, action: s.action, result: s.action === 'check' ? 'ok' : 'done', by: 'self', model: null, note: note || s.text } }));
}

/** The material of a round with what is at home: stock rows [{ name, left }] matched by name. */
export function materialState(round, stock = []) {
  return round.material.map((m) => {
    const row = stock.find((s) => clean(s.name).toLowerCase() === m.name.toLowerCase());
    return { ...m, left: row ? row.left : null };
  });
}
