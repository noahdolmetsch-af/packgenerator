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
/**
 * Kontakt-QR-Code (Noah 27.10.2026 «1a 2b 3a 4a 5a»): one card, every part ticked on or off before you show
 * it. Order = order on the card. The address starts off (only ticked on by you); the rest shows once filled in.
 */
export const SHOWN = ['phone', 'wa', 'email', 'insta', 'strava', 'komoot', 'web', 'addr', 'bike', 'note'];
export const SHOW_DEFAULT = { phone: false, wa: false, email: true, insta: true, strava: true, komoot: true, web: true, addr: false, bike: true, note: true };
/**
 * Kontakt-QR-Code (Noah «4a»): how long a shown card stays readable, in days (0 = always). Soft: the card page
 * says «expired» after that day; the details still sit in the link, so nothing is truly taken back.
 */
export const VALID_DAYS = [1, 7, 30, 0];
/** The last day a card made on `today` (YYYY-MM-DD) shows, or '' for always. Calendar days, no clock. */
export function untilFor(days, today) {
  const d = Number(days);
  if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(String(today))) return '';
  const [y, m, dd] = today.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, dd + d - 1)).toISOString().slice(0, 10);
}
/** Is the card over (today after its last day)? */
export const expired = (until, today) => !!until && /^\d{4}-\d{2}-\d{2}$/.test(until) && String(today) > until;
const MAX = (f) => (f === 'note' || f === 'addr' ? 120 : f === 'web' || f === 'strava' || f === 'komoot' ? 100 : 60);

const clean = (s, n = 60) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
const same = (a, b) => clean(a).toLocaleLowerCase('de') === clean(b).toLocaleLowerCase('de');
export const newId = (p = 'p') => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** A kept value → a list that always has both parts. */
export const peopleOf = (v) => ({ groups: Array.isArray(v?.groups) ? v.groups : [], people: Array.isArray(v?.people) ? v.people : [] });

/** What of your card goes into the QR code: the name and the parts you ticked. */
export function cardShown(card = {}) {
  const out = { name: clean(card.name) };
  for (const f of SHOWN) if ((card.show?.[f] ?? SHOW_DEFAULT[f]) !== false && clean(card[f])) out[f] = clean(card[f], MAX(f));
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
  const p = { name: clean(card.name) };
  for (const f of SHOWN) if (clean(card[f]) || f === 'insta' || f === 'phone' || f === 'bike' || f === 'note') p[f] = clean(card[f], MAX(f));
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

/* Kontakt-QR-Code: the ways to reach a person. Only web links (https) and the usual app links come out; anything else gives ''. */
const digits = (p) => clean(p).replace(/[^\d+]/g, '').replace(/^00/, '+');
/** WhatsApp: wa.me wants the number without + and without the leading 0 of a Swiss number. */
export function waLink(p) {
  let d = digits(p);
  if (!d) return '';
  if (d.startsWith('0') && !d.startsWith('00')) d = `+41${d.slice(1)}`;
  return `https://wa.me/${d.replace(/^\+/, '')}`;
}
export const mailLink = (m) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(m)) ? `mailto:${clean(m)}` : '');
/** A web address as typed (with or without https://) → a https link, or '' when it is not one. */
export function webLink(u) {
  const v = clean(u, 100);
  if (!v) return '';
  const w = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const x = new URL(w);
    return x.protocol === 'https:' || x.protocol === 'http:' ? x.href : '';
  } catch {
    return '';
  }
}
/** Strava: a link or the number of the profile. */
export const stravaLink = (s) => (/^\d+$/.test(clean(s)) ? `https://www.strava.com/athletes/${clean(s)}` : /strava\./i.test(clean(s)) ? webLink(s) : '');
/** Komoot: a link or the user name / number. */
export const komootLink = (s) => (/komoot\./i.test(clean(s)) ? webLink(s) : /^[\w.-]+$/.test(clean(s)) ? `https://www.komoot.com/user/${encodeURIComponent(clean(s))}` : '');
/** The address on a map (OpenStreetMap search, free). */
export const mapLink = (a) => (clean(a, 120) ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(clean(a, 120))}` : '');

const vEsc = (s) => String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
/**
 * The card as a contact file (vCard 3.0), so «In Kontakte speichern» puts the person into the phone's
 * address book. Made on the device that opened the card; nothing goes to a server.
 */
export function cardVcf(card = {}) {
  const c = Object.fromEntries(Object.entries(card).map(([k, v]) => [k, clean(v, MAX(k))]));
  if (!c.name) return '';
  const parts = c.name.split(' ');
  const last = parts.length > 1 ? parts.pop() : '';
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${vEsc(c.name)}`, `N:${vEsc(last)};${vEsc(parts.join(' '))};;;`];
  if (c.phone) lines.push(`TEL;TYPE=CELL:${digits(c.phone)}`);
  if (c.wa && digits(c.wa) !== digits(c.phone)) lines.push(`TEL;TYPE=CELL:${digits(c.wa)}`);
  if (mailLink(c.email)) lines.push(`EMAIL;TYPE=INTERNET:${c.email}`);
  if (c.addr) lines.push(`ADR;TYPE=HOME:;;${vEsc(c.addr)};;;;`);
  for (const u of [webLink(c.web), stravaLink(c.strava), komootLink(c.komoot), instaLink(c.insta), waLink(c.wa)]) if (u) lines.push(`URL:${u}`);
  const note = [c.bike, c.note].filter(Boolean).join(' · ');
  if (note) lines.push(`NOTE:${vEsc(note)}`);
  lines.push('END:VCARD');
  return lines.join('\r\n') + '\r\n';
}
