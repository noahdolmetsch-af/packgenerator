/**
 * Paket R (Noah 19.10.2026 «4a»): «Velomech und Guide», your own list of bike mechanics and tour
 * guides. A request goes out by mail (prepared text) or through their own link; no money goes through
 * the app and nobody else sees the list. Everything can be added, renamed, deleted and reordered.
 *
 * db.settings 'pros': [{ id, name, kind ('mech'|'guide'|'other'), mail, link, phone, note }]
 * (in the backup and the sync like every other setting). Names the person typed never go through t().
 * Pure functions, tested in tests/pros.test.js.
 */
export const PROS_KEY = 'pros';
/** The kinds (English keys for t()); the subject of a request mail per kind. */
export const PRO_KINDS = [
  { key: 'mech', label: 'Bike mechanic', subject: 'Request: bike service' },
  { key: 'guide', label: 'Guide', subject: 'Request: guided tour' },
  { key: 'other', label: 'Other|pro', subject: 'Request' },
];
export const kindOf = (k) => PRO_KINDS.find((x) => x.key === k) ?? PRO_KINDS[2];

const clean = (v, max = 200) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
export const isMail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v ?? '').trim());
/** A link the person typed: https only (a plain «example.ch» gets https:// in front). */
export function cleanLink(v) {
  const s = clean(v, 500);
  if (!s) return '';
  const u = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try {
    const url = new URL(u);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
  } catch {
    return '';
  }
}

/** A new entry from a form; null without a name. */
export function newPro(form, id = `pro-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`) {
  const name = clean(form?.name, 80);
  if (!name) return null;
  return {
    id,
    name,
    kind: PRO_KINDS.some((k) => k.key === form.kind) ? form.kind : 'mech',
    mail: isMail(form.mail) ? clean(form.mail, 120) : '',
    link: cleanLink(form.link),
    phone: clean(form.phone, 40).replace(/[^\d+ ]/g, ''),
    note: clean(form.note, 300),
  };
}

/** The list with one entry changed (same id), added (new id) or removed. */
export const savePro = (list, pro) => (list.some((p) => p.id === pro.id) ? list.map((p) => (p.id === pro.id ? pro : p)) : [...list, pro]);
export const removePro = (list, id) => list.filter((p) => p.id !== id);
/** Move the entry at `from` to place `to` (arrows and drag). */
export function movePro(list, from, to) {
  if (from === to || from < 0 || from >= list.length) return list;
  const out = [...list];
  const [x] = out.splice(from, 1);
  out.splice(Math.max(0, Math.min(to, out.length)), 0, x);
  return out;
}

/**
 * The request mail: a mailto: address with subject and text. t: the translator (subject and lines);
 * bike: the bike's name (mechanic), when: the wished days, text: anything the person adds.
 */
export function requestMail(pro, { bike = '', when = '', text = '' } = {}, t = (s, v) => (v ? s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '') : s)) {
  if (!pro?.mail) return '';
  const lines = [t('Hello {name}', { name: pro.name }), ''];
  if (pro.kind === 'mech') lines.push(bike ? t('I would like to bring my bike «{bike}» for a service.', { bike }) : t('I would like to bring my bike for a service.'));
  else if (pro.kind === 'guide') lines.push(t('I am interested in a guided tour.'));
  else lines.push(t('I have a request.'));
  if (when) lines.push(t('Days that suit me: {when}', { when }));
  if (text) lines.push('', text);
  lines.push('', t('Thank you and kind regards'));
  const q = new URLSearchParams({ subject: t(kindOf(pro.kind).subject), body: lines.join('\n') });
  return `mailto:${encodeURIComponent(pro.mail).replace(/%40/g, '@')}?${q.toString().replace(/\+/g, '%20')}`;
}
