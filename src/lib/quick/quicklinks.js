/**
 * «Quick Links» (Noah 28.10.2026 «1a 2a 3a 4a 5a», 6–20): your shortcuts to the functions of the app,
 * in groups you name yourself. Step 1: the page and its place in the bar, 20 suggested pins to start,
 * own groups (add, rename, delete, order), pins with an own name and a note.
 *
 * Every pin points at a function of the catalogue (features.js); a tap goes there (goFeature).
 * Noah «13»: a phone and a computer keep their own pins (one settings record each, both in the backup
 * and synced, so a second phone shows the same pins as the first). «Take over from the other device»
 * copies the other record.
 *
 * Group and pin names: a suggested group keeps its English key in `std` and is shown through t();
 * a name the person typed sits in `name` and is never translated (app rule «Gruppen überall»).
 * Pure functions (tests/quicklinks.test.js); Quick.svelte saves.
 */
import { FEATURE } from '../features.js';

/** The record of each kind of device in the settings table. */
export const QUICK_KEYS = { phone: 'quickLinks.phone', computer: 'quickLinks.computer' };

/** Noah «4a»: 20 suggestions from the 400 functions, by situation (English keys of the group names). */
export const STARTER = [
  { std: 'Before the trip', pins: ['f.quickstart', 'f.plan', 'f.wear', 'f.weather', 'f.dreams'] },
  { std: 'On the way|quick', pins: ['f.live', 'ride', 'note', 'f.sos'] },
  { std: 'After the trip', pins: ['debrief', 'f.upload', 'f.heatmap'] },
  { std: 'Bike|quick', pins: ['care', 'km', 'f.partwear', 'f.problem'] },
  { std: 'Active and everyday', pins: ['f.tick', 'f.form', 'f.abfragen', 'f.notes'] },
];

/** The kind of this device: a finger (phone, tablet) or a mouse (computer). */
export function deviceKind(w = typeof window === 'undefined' ? null : window) {
  try {
    return w?.matchMedia?.('(pointer: coarse)').matches ? 'phone' : 'computer';
  } catch {
    return 'computer';
  }
}
export const otherKind = (kind) => (kind === 'phone' ? 'computer' : 'phone');

let seq = 0;
/** A new id (time + counter, so two made in the same millisecond differ). */
export const newId = (p = 'q') => `${p}${Date.now().toString(36)}${(seq++).toString(36)}`;

/** The 20 suggestions as a fresh record. */
export function starter() {
  const groups = STARTER.map((g, i) => ({ id: `s${i + 1}`, std: g.std, name: '' }));
  const pins = STARTER.flatMap((g, i) => g.pins.filter((f) => FEATURE[f]).map((f) => ({ id: `p-${f}`, feature: f, group: `s${i + 1}`, name: '', note: '' })));
  return { groups, pins };
}

const str = (v, max = 80) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** A stored record made safe; nothing stored yet: the suggestions. Pins of a function that no longer exists are left out. */
export function cleanQuick(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.groups) || !Array.isArray(raw.pins)) return starter();
  const groups = raw.groups.filter((g) => g && typeof g.id === 'string' && g.id).map((g) => ({ id: g.id, std: str(g.std), name: str(g.name, 60) }));
  const ids = new Set(groups.map((g) => g.id));
  const pins = raw.pins
    .filter((p) => p && typeof p.id === 'string' && FEATURE[p.feature])
    .map((p) => ({ id: p.id, feature: p.feature, group: ids.has(p.group) ? p.group : '', name: str(p.name, 60), note: str(p.note, 120) }));
  return { groups, pins };
}

/** The shown name of a group (tr: t()); a typed name is never translated. '' is «Without a group». */
export const groupLabel = (g, tr = (s) => s) => (g ? g.name || tr(g.std) : tr('Without a group|quick'));
/** The shown name of a pin: your own name, else the function's. */
export const pinLabel = (p, tr = (s) => s) => p.name || tr(FEATURE[p.feature]?.title ?? '');

/** The pins of a group, in their order ('' = without a group). */
export const pinsIn = (s, gid) => s.pins.filter((p) => p.group === gid);
/** Is a function pinned already? */
export const isPinned = (s, feature) => s.pins.some((p) => p.feature === feature);

/** The groups as the page shows them: yours in order, «Without a group» last when it holds pins. */
export function shownGroups(s) {
  return [...s.groups, ...(pinsIn(s, '').length ? [null] : [])];
}

/** Pin a function into a group (at its end). Already pinned: nothing changes. */
export function addPin(s, feature, gid = '') {
  if (!FEATURE[feature] || isPinned(s, feature)) return s;
  const group = gid === '' || s.groups.some((g) => g.id === gid) ? gid : '';
  return { ...s, pins: [...s.pins, { id: newId('p'), feature, group, name: '', note: '' }] };
}
export const removePin = (s, id) => ({ ...s, pins: s.pins.filter((p) => p.id !== id) });
/** Change a pin: { name, note, group }; an empty name brings back the function's own name. */
export function editPin(s, id, patch = {}) {
  return {
    ...s,
    pins: s.pins.map((p) => {
      if (p.id !== id) return p;
      const n = { ...p };
      if ('name' in patch) n.name = str(patch.name, 60);
      if ('note' in patch) n.note = str(patch.note, 120);
      if ('group' in patch) n.group = patch.group === '' || s.groups.some((g) => g.id === patch.group) ? patch.group : p.group;
      return n;
    }),
  };
}
/** Move a pin inside its group from place `from` to place `to` (places as the group shows them). */
export function movePin(s, gid, from, to) {
  const inG = pinsIn(s, gid);
  if (from === to || from < 0 || to < 0 || from >= inG.length || to >= inG.length) return s;
  const order = [...inG];
  const [x] = order.splice(from, 1);
  order.splice(to, 0, x);
  let k = 0;
  return { ...s, pins: s.pins.map((p) => (p.group === gid ? order[k++] : p)) };
}

export function addGroup(s, name) {
  const n = str(name, 60);
  if (!n) return s;
  return { ...s, groups: [...s.groups, { id: newId('g'), std: '', name: n }] };
}
/** Rename a group; an empty name brings a suggested group back to its own name. */
export function renameGroup(s, id, name) {
  const n = str(name, 60);
  return { ...s, groups: s.groups.map((g) => (g.id === id && (n || g.std) ? { ...g, name: n } : g)) };
}
/** Delete a group; its pins go to group `to` (null or '': «Without a group»). No pin is deleted. */
export function deleteGroup(s, id, to = '') {
  const dest = to && to !== id && s.groups.some((g) => g.id === to) ? to : '';
  return { groups: s.groups.filter((g) => g.id !== id), pins: s.pins.map((p) => (p.group === id ? { ...p, group: dest } : p)) };
}
export function moveGroup(s, from, to) {
  if (from === to || from < 0 || to < 0 || from >= s.groups.length || to >= s.groups.length) return s;
  const groups = [...s.groups];
  const [x] = groups.splice(from, 1);
  groups.splice(to, 0, x);
  return { ...s, groups };
}

/**
 * The functions a search in «Add a pin» finds: every word in the title, the text or the words
 * (tr: t(), so German titles match too). Empty search: none (the page shows the groups instead).
 */
export function findForPin(all, q, tr = (s) => s) {
  const words = String(q ?? '').toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return all.filter((f) => {
    const hay = [f.title, tr(f.title), f.text, tr(f.text), f.words].join(' ').toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}
