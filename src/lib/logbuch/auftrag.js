/**
 * «Verbesserungs-Logbuch» step 4 (Noah 21.11.2026 «freigabe»): «Auftrag kopieren». The open entries as one text to paste into the chat:
 * sorted by page (with the address), «Bothers me now» first, a picture number per entry that has a photo, «Good as it is» apart as a
 * plain note. The pictures go with «Bilder speichern» under the same numbers (imageName). Nothing is sent from here.
 */
import { isOpen } from './logbuch.js';
import { artLabel } from './words.js';
import { t } from '../i18n.svelte.js';

const byNow = (a, b) => (a.urgent === 'now' ? 0 : 1) - (b.urgent === 'now' ? 0 : 1) || String(a.at).localeCompare(String(b.at));

/**
 * The entries in the order of the text: { groups: [{ page, title, items }], notes }.
 * Pages with something that bothers now come first, then by address; inside a page «now» first, then the oldest.
 */
export function ordered(list = []) {
  const open = list.filter((e) => isOpen(e) && e.route !== 'note');
  const notes = list.filter((e) => e.route === 'note' && e.state === 'noted').sort((a, b) => String(a.page).localeCompare(String(b.page)) || byNow(a, b));
  const pages = new Map();
  for (const e of open) {
    const key = e.page || '';
    if (!pages.has(key)) pages.set(key, { page: key, title: e.pageTitle || '', items: [] });
    const g = pages.get(key);
    if (!g.title && e.pageTitle) g.title = e.pageTitle;
    g.items.push(e);
  }
  const groups = [...pages.values()];
  for (const g of groups) g.items.sort(byNow);
  const nowFirst = (g) => (g.items.some((e) => e.urgent === 'now') ? 0 : 1);
  groups.sort((a, b) => nowFirst(a) - nowFirst(b) || a.page.localeCompare(b.page));
  return { groups, notes };
}

/** The picture number of each entry that has a photo, in the order of the text (1, 2, 3 …); notes come last. */
export function pictureNumbers({ groups, notes }) {
  const out = new Map();
  let k = 0;
  for (const e of [...groups.flatMap((g) => g.items), ...notes]) if (e.photo) out.set(e.id, ++k);
  return out;
}

/** The file name of a picture: the number and the page, e.g. logbuch-03-flow-training.jpg. */
export function imageName(n, page = '') {
  const slug = String(page).replace(/^#\/?/, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 40);
  return `logbuch-${String(n).padStart(2, '0')}${slug ? `-${slug}` : ''}.jpg`;
}

/** The pictures to save: [{ n, name, photo }] in the order of the text. */
export function images(list = []) {
  const o = ordered(list);
  const nums = pictureNumbers(o);
  return [...o.groups.flatMap((g) => g.items), ...o.notes].filter((e) => nums.has(e.id)).map((e) => ({ n: nums.get(e.id), name: imageName(nums.get(e.id), e.page), photo: e.photo, id: e.id }));
}

const place = (g) => (g.page ? t('Page «{title}» ({address})', { title: g.title || g.page, address: g.page }) : t('Without a page'));

function line(i, e, nums) {
  const head = [e.urgent === 'now' ? t('Bothers me now') : null, artLabel(e.art)].filter(Boolean).join(', ');
  const block = e.block ? ` · ${t('Block «{name}»', { name: e.block })}` : '';
  const how = e.route === 'draft' ? t('picture first') : t('small change');
  const pic = nums.has(e.id) ? `, ${t('picture {n}', { n: nums.get(e.id) })}` : '';
  return `${i}. [${head}]${block}: ${e.text} (${how}${pic})`;
}

/** The text of the order. day: the date line (already formatted). */
export function buildOrder(list = [], day = '') {
  const o = ordered(list);
  const nums = pictureNumbers(o);
  const n = o.groups.reduce((s, g) => s + g.items.length, 0);
  const out = [t('Improvement order'), t('{day} · to change: {n} · notes: {m}', { day, n, m: o.notes.length }), t('small change = one small step with a before and after picture · picture first = a picture of how it could look, then my ok'), ''];
  let i = 0;
  for (const g of o.groups) {
    out.push(place(g));
    for (const e of g.items) out.push(line(++i, e, nums));
    out.push('');
  }
  if (o.notes.length) {
    out.push(t('Only a note, change nothing:'));
    for (const e of o.notes) out.push(`- ${e.page ? `${e.pageTitle || e.page}: ` : ''}${e.block ? `${e.block}: ` : ''}${e.text}${nums.has(e.id) ? ` (${t('picture {n}', { n: nums.get(e.id) })})` : ''}`);
    out.push('');
  }
  return out.join('\n').trim();
}

/** How many entries the order would hold. */
export function orderSize(list = []) {
  const o = ordered(list);
  return { items: o.groups.reduce((s, g) => s + g.items.length, 0), notes: o.notes.length };
}
