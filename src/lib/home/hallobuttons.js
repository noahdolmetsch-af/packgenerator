/**
 * Gruss B «Knöpfe anpassen» (Noah 05.11.2026 «alle umsetzen»): the buttons of the greeting's window (the five faces, the
 * energy and feeling buttons behind «Mehr», the plans) can be added (with an emoji), renamed, hidden, deleted (Undo) and
 * sorted (arrows and drag); the groups of the feelings can be added, renamed, sorted and deleted (where do the buttons go).
 * App rules «Alles selbst ändern» and «Gruppen überall». The record (setting `hello.buttons`) is complete once saved.
 * A deleted button stays in the record as `gone` (and a hidden one as `hidden`): old answers keep their words in the
 * history. The three questions of the history (hallo.js HELLO_QUESTIONS) get all these buttons as their options.
 * Pure parts are tested in tests/hallobuttons.test.js.
 */
import { liveQuery } from 'dexie';
import { clean, uid, move } from '../ruhig/base.js';
import { MOODS, PLANS, FEELING_GROUPS, HELLO_QUESTIONS } from './hallo.js';
import { db } from '../db.js';

export const BUTTONS_KEY = 'hello.buttons';
/** The group that takes the buttons of a deleted group («Ohne Gruppe»). */
export const NO_GROUP = 'none';
const LABEL = 24;

/** The built-in buttons: { faces: [{ key, label, v }], groups: [{ id, std, items }], plans: [{ key, label }] }. */
export function defaults() {
  return {
    faces: MOODS.map(({ key, label, v }) => ({ key, label, v })),
    groups: FEELING_GROUPS.map((g) => ({ id: g.key, std: g.name, items: g.items.map(({ key, label, emoji }) => ({ key, label, emoji })) })),
    plans: PLANS.map(({ key, label }) => ({ key, label })),
  };
}

const flags = (x) => ({ ...(x.hidden ? { hidden: true } : {}), ...(x.gone ? { gone: true } : {}), ...(x.own ? { own: true } : {}) });
const emojiOf = (s) => [...String(s ?? '').trim()].slice(0, 4).join('');
function itemsClean(list, seen, withEmoji) {
  return (Array.isArray(list) ? list : [])
    .filter((x) => x && x.key && !seen.has(String(x.key)) && clean(x.label, LABEL) && (seen.add(String(x.key)), true))
    .map((x) => ({ key: String(x.key), label: clean(x.label, LABEL), ...(withEmoji ? { emoji: emojiOf(x.emoji) } : {}), ...flags(x) }));
}

/** The stored record made safe; without a record the built-in buttons. */
export function cfgOf(value) {
  if (!value || typeof value !== 'object') return defaults();
  const seen = new Set();
  const dv = Object.fromEntries(MOODS.map((m) => [m.key, m.v]));
  const faces = itemsClean(value.faces, seen, false).map((f) => ({ ...f, v: dv[f.key] ?? 0.5 }));
  const groups = (Array.isArray(value.groups) ? value.groups : [])
    .filter((g) => g && g.id)
    .map((g) => ({ id: String(g.id), ...(clean(g.name, 40) ? { name: clean(g.name, 40) } : {}), ...(g.std ? { std: String(g.std) } : {}), items: itemsClean(g.items, seen, true) }))
    .filter((g, i, all) => all.findIndex((x) => x.id === g.id) === i && (g.name || g.std));
  const plans = itemsClean(value.plans, seen, false);
  return { faces, groups, plans };
}

/** The name of a group: an own or renamed one as typed, a built-in one through tr (t). */
export const groupName = (g, tr = (s) => s) => (g?.name ? g.name : g?.std ? tr(g.std) : '');

/** The lists a button lives in: 'faces', 'plans' or the id of a group. */
export function itemsOf(cfg, where) {
  if (where === 'faces') return cfg.faces;
  if (where === 'plans') return cfg.plans;
  return cfg.groups.find((g) => g.id === where)?.items ?? [];
}
function withItems(cfg, where, fn) {
  if (where === 'faces') return { ...cfg, faces: fn(cfg.faces) };
  if (where === 'plans') return { ...cfg, plans: fn(cfg.plans) };
  return { ...cfg, groups: cfg.groups.map((g) => (g.id === where ? { ...g, items: fn(g.items) } : g)) };
}
/** What the editor lists: everything that is not deleted (hidden ones dimmed). */
export const shown = (cfg, where) => itemsOf(cfg, where).filter((x) => !x.gone);
/** What the window offers: not hidden, not deleted. */
export const offered = (cfg, where) => itemsOf(cfg, where).filter((x) => !x.gone && !x.hidden);

export function addItem(cfg, where, label, emoji = '', key = uid('b')) {
  const l = clean(label, LABEL);
  if (!l || shown(cfg, where).some((x) => x.label.toLowerCase() === l.toLowerCase())) return cfg;
  const item = { key, label: l, ...(where === 'faces' || where === 'plans' ? {} : { emoji: emojiOf(emoji) }), own: true, ...(where === 'faces' ? { v: 0.5 } : {}) };
  return withItems(cfg, where, (list) => [...list, item]);
}
export function editItem(cfg, where, key, { label, emoji } = {}) {
  const l = label == null ? null : clean(label, LABEL);
  if (l === '') return cfg;
  return withItems(cfg, where, (list) => list.map((x) => (x.key === key ? { ...x, ...(l ? { label: l } : {}), ...(emoji != null && x.emoji !== undefined ? { emoji: emojiOf(emoji) } : {}) } : x)));
}
export const setHidden = (cfg, where, key, hidden) => withItems(cfg, where, (list) => list.map((x) => (x.key === key ? (hidden ? { ...x, hidden: true } : (({ hidden: _h, ...r }) => r)(x)) : x)));
export const dropItem = (cfg, where, key) => withItems(cfg, where, (list) => list.map((x) => (x.key === key ? { ...x, gone: true } : x)));
/** Undo of a delete: the same record as before (the caller keeps it). */
export const restoreItem = (cfg, where, key) => withItems(cfg, where, (list) => list.map((x) => (x.key === key ? (({ gone: _g, ...r }) => r)(x) : x)));
/** Move the button at place `from` of the shown list to place `to` (deleted ones stay at the end). */
export function moveItem(cfg, where, from, to) {
  return withItems(cfg, where, (list) => {
    const live = list.filter((x) => !x.gone);
    if (from < 0 || from >= live.length || to < 0 || to >= live.length) return list;
    return [...move(live, from, to), ...list.filter((x) => x.gone)];
  });
}

export function addGroup(cfg, name, id = uid('g')) {
  const n = clean(name, 40);
  if (!n || cfg.groups.some((g) => groupName(g).toLowerCase() === n.toLowerCase())) return cfg;
  return { ...cfg, groups: [...cfg.groups, { id, name: n, items: [] }] };
}
export function renameGroup(cfg, id, name) {
  const n = clean(name, 40);
  return n ? { ...cfg, groups: cfg.groups.map((g) => (g.id === id ? { ...g, name: n } : g)) } : cfg;
}
export function moveGroup(cfg, from, to) {
  if (from < 0 || from >= cfg.groups.length || to < 0 || to >= cfg.groups.length) return cfg;
  return { ...cfg, groups: move(cfg.groups, from, to) };
}
/** Delete a group: its buttons (deleted ones too, for the history) go to group `toId`, or to «Ohne Gruppe». Returns the new record. */
export function dropGroup(cfg, id, toId = null) {
  const g = cfg.groups.find((x) => x.id === id);
  if (!g) return cfg;
  let groups = cfg.groups.filter((x) => x.id !== id);
  const target = toId && groups.some((x) => x.id === toId) ? toId : NO_GROUP;
  if (!groups.some((x) => x.id === target)) groups = [...groups, { id: NO_GROUP, std: 'No group|hello', items: [] }];
  groups = groups.map((x) => (x.id === target ? { ...x, items: [...x.items, ...g.items] } : x));
  return { ...cfg, groups };
}

/** All buttons as the options of the three questions (hidden and deleted ones too: old answers keep their words). */
export function optionsOf(cfg) {
  return {
    faces: cfg.faces.map((f) => ({ key: f.key, label: f.label, v: f.v ?? 0.5 })),
    feelings: cfg.groups.flatMap((g) => g.items.map((i) => ({ key: i.key, label: i.label, emoji: i.emoji ?? '', group: g.id }))),
    plans: cfg.plans.map((p) => ({ key: p.key, label: p.label })),
  };
}
const QOPT = { 'hallo.gaht': 'faces', 'hallo.gefuehl': 'feelings', 'hallo.vor': 'plans' };
/** Put the buttons into the three questions of the history (in place: abfragen.js holds the same objects). */
export function applyButtons(cfg) {
  const o = optionsOf(cfg);
  for (const q of HELLO_QUESTIONS) {
    const list = o[QOPT[q.id]];
    if (list) q.form.options.splice(0, q.form.options.length, ...list);
  }
}

/** Keeps the buttons in place when the record changes (start.js; also a backup read in). */
export function watchHelloButtons() {
  return liveQuery(() => db.settings.get(BUTTONS_KEY)).subscribe({ next: (r) => applyButtons(cfgOf(r?.value)), error: (err) => console.warn('watchHelloButtons', err) });
}
export const saveButtons = (cfg) => db.settings.put({ key: BUTTONS_KEY, value: JSON.parse(JSON.stringify(cfg)) });
export const buttonsQuery = () => liveQuery(async () => cfgOf((await db.settings.get(BUTTONS_KEY))?.value));
