/**
 * Gruppenfahrt für Events (Noah 26.10.2026 «5», mockup G7, «5a»): the contact card and the people you
 * met at events, under Ich › Mit Freunden › Kontaktkarte. Only with you (settings: your devices, the sealed
 * sync and your backup; never in a group):
 *   settings CARD_KEY   { name, insta, phone, bike, note, show: { insta, phone, bike, note } }  your card
 *   settings PEOPLE_KEY { groups: [{ id, name }], people: [{ id, name, insta, phone, bike, note, memo, group, at }] }
 * The events are the groups of the people (app rule «Gruppen überall»: rename, sort, delete; their people
 * go to «Without an event» or to another event). Pure, tested in tests/people.test.js.
 */
export const CARD_KEY = 'contact-card';
export const PEOPLE_KEY = 'people-met';
export const SHOWN = ['insta', 'phone', 'bike', 'note'];

const clean = (s, n = 60) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
const same = (a, b) => clean(a).toLocaleLowerCase('de') === clean(b).toLocaleLowerCase('de');
export const newId = (p = 'p') => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** A kept value → a list that always has both parts. */
export const peopleOf = (v) => ({ groups: Array.isArray(v?.groups) ? v.groups : [], people: Array.isArray(v?.people) ? v.people : [] });

/** What of your card goes into the QR code: the name and the parts you ticked. */
export function cardShown(card = {}) {
  const out = { name: clean(card.name) };
  for (const f of SHOWN) if (card.show?.[f] !== false && clean(card[f])) out[f] = clean(card[f], f === 'note' ? 120 : 60);
  return out;
}

/** The event group with this name (made when missing). → [list, groupId] ('' for no name). */
export function groupFor(list, name) {
  const n = clean(name, 40);
  if (!n) return [list, ''];
  const g = list.groups.find((x) => same(x.name, n));
  if (g) return [list, g.id];
  const id = newId('g');
  return [{ ...list, groups: [...list.groups, { id, name: n }] }, id];
}

/** Remember a person (from a card or by hand), in the event `event`; the same name and Instagram in the same event is updated. */
export function addPerson(list, card, event = '', now = new Date().toISOString()) {
  const p = { name: clean(card.name), insta: clean(card.insta), phone: clean(card.phone), bike: clean(card.bike), note: clean(card.note, 120) };
  if (!p.name) return peopleOf(list);
  const [l, gid] = groupFor(peopleOf(list), event);
  const old = l.people.find((x) => x.group === gid && same(x.name, p.name) && same(x.insta, p.insta));
  if (old) return { ...l, people: l.people.map((x) => (x === old ? { ...x, ...p } : x)) };
  return { ...l, people: [...l.people, { id: newId(), ...p, memo: '', group: gid, at: now }] };
}

export const updatePerson = (list, id, patch) => ({ ...list, people: list.people.map((x) => (x.id === id ? { ...x, ...patch } : x)) });
export const removePerson = (list, id) => ({ ...list, people: list.people.filter((x) => x.id !== id) });
export const renameGroup = (list, id, name) => (clean(name, 40) ? { ...list, groups: list.groups.map((g) => (g.id === id ? { ...g, name: clean(name, 40) } : g)) } : list);
export function moveGroup(list, from, to) {
  if (to < 0 || to >= list.groups.length || from === to) return list;
  const g = [...list.groups];
  const [x] = g.splice(from, 1);
  g.splice(to, 0, x);
  return { ...list, groups: g };
}
/** Delete an event group: its people go to `to` (another event) or to «Without an event» (''); never deleted. */
export function deleteGroup(list, id, to = '') {
  const target = to && list.groups.some((g) => g.id === to && g.id !== id) ? to : '';
  return { groups: list.groups.filter((g) => g.id !== id), people: list.people.map((p) => (p.group === id ? { ...p, group: target } : p)) };
}
/** The people by event, in the order of the groups, «Without an event» last: [{ group | null, people }]. */
export function byGroup(list) {
  const l = peopleOf(list);
  const byName = (a, b) => a.name.localeCompare(b.name, 'de');
  const out = l.groups.map((g) => ({ group: g, people: l.people.filter((p) => p.group === g.id).sort(byName) }));
  const known = new Set(l.groups.map((g) => g.id));
  const rest = l.people.filter((p) => !p.group || !known.has(p.group)).sort(byName);
  if (rest.length) out.push({ group: null, people: rest });
  return out;
}
/** Links to reach a person: Instagram and phone. */
export const instaLink = (h) => (clean(h) ? `https://www.instagram.com/${encodeURIComponent(clean(h).replace(/^@/, ''))}/` : '');
export const telLink = (p) => (clean(p) ? `tel:${clean(p).replace(/[^\d+]/g, '')}` : '');
