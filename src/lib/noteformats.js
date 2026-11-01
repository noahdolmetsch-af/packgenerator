/**
 * Paket N «neue Notiz-Formate» (Noah 19.10.2026 11:28 «4a», 11:31 «5b und a»; list in
 * notes/notizen-werkzeuge-2026-10-19/README.md, section 2). Pure functions; the sheet and the page write.
 *
 * - N1 several photos and links per note: note.photo / note.link stay the first ones (older notes,
 *   backups and the Markdown export keep working), more come in note.photos / note.links2.
 * - N2 place: note.place { lat, lon, label } from the phone's location; links to Google Maps and swisstopo.
 * - N5 sketch: drawn with the finger, kept as a photo with sketch: true (SketchPad.svelte).
 * - N7 QR code → note: a web address becomes a link, a Wi-Fi code a note with name and password, the rest text.
 * - N10 templates: Standard ones (English keys for t()) and your own (settings NOTE_TPL_KEY), a group.
 * - N11 formatting: Markdown light (# heading, **bold**, *italic*, lists, tables) shown as a reading view.
 * - N13 Google Keep once: the Keep files of a Google Takeout export (.json, or the whole .zip) become notes.
 * - N14 share a note: the phone's share menu (Keep, WhatsApp, mail …), else copy.
 */
import { tagsOf } from './notebook.js';
import { pruneInks } from './draw/ink.js';
import { pruneOcr } from './notes/files.js';

/* ---------- N1 several photos and links ---------- */

/** Every photo of a note (the first one and the others). */
export const photosOf = (n) => [n?.photo, ...(n?.photos ?? [])].filter(Boolean);
/** Every link of a note: [{ title, url }]. */
export const linksOf = (n) => [n?.link, ...(n?.links2 ?? [])].filter((l) => l?.url);

/** The note with one more photo (the first goes to note.photo). */
export function addPhoto(n, data) {
  if (!data) return n;
  return n.photo ? { ...n, photos: [...(n.photos ?? []), data] } : { ...n, photo: data };
}
/** The note without photo i (of photosOf); the next one moves up to note.photo. */
export const removePhoto = (n, i) => setPhotos(n, photosOf(n).filter((_, j) => j !== i));
/**
 * Paket NE: the note with this list of photos (the first to note.photo); the drawings (inks) of photos
 * that are gone go too. inks: the new map, when a drawing was saved.
 */
export function setPhotos(n, list, inks = n?.inks) {
  const { photos, inks: _old, ...rest } = pruneOcr(n, list);
  const keep = pruneInks(inks, list);
  return { ...rest, photo: list[0] ?? null, ...(list.length > 1 ? { photos: list.slice(1) } : {}), ...(keep ? { inks: keep } : {}) };
}
/** The note with one more link. */
export function addLinkTo(n, link) {
  if (!link?.url) return n;
  return n.link?.url ? { ...n, links2: [...(n.links2 ?? []), link] } : { ...n, link };
}
/** The note without link i (of linksOf). */
export function removeLinkAt(n, i) {
  const all = linksOf(n).filter((_, j) => j !== i);
  const { link, links2, ...rest } = n;
  return { ...rest, ...(all[0] ? { link: all[0] } : {}), ...(all.length > 1 ? { links2: all.slice(1) } : {}) };
}

/* ---------- N2 place ---------- */

const round = (v) => Math.round(Number(v) * 1e5) / 1e5;
/** A place from the browser's position (coords) and an optional name. */
export const placeFrom = (coords, label = '') => ({ lat: round(coords.latitude), lon: round(coords.longitude), label: String(label ?? '').trim() });
/** Links to open the place: Google Maps and swisstopo (map.geo.admin.ch). Only links, nothing is loaded. */
export function placeLinks(p) {
  if (!p || !Number.isFinite(p.lat) || !Number.isFinite(p.lon)) return null;
  return {
    maps: `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lon}`,
    swisstopo: `https://map.geo.admin.ch/?swisssearch=${p.lat},${p.lon}&zoom=10`,
  };
}
export const placeText = (p) => (p ? p.label || `${p.lat.toFixed(4)}, ${p.lon.toFixed(4)}` : '');

/* ---------- N7 QR code ---------- */

/**
 * What a QR code holds, as the start of a note: { title, text, link? }.
 * WIFI:T:WPA;S:Name;P:secret;; → «WLAN Name» with name and password; a web address → a link.
 */
export function qrToNote(raw = '') {
  const s = String(raw).trim();
  if (/^https?:\/\//i.test(s)) {
    let host = s;
    try {
      host = new URL(s).hostname.replace(/^www\./, '');
    } catch {
      /* keep the text */
    }
    return { title: host, text: '', link: { title: host, url: s } };
  }
  const wifi = s.match(/^WIFI:(.*)$/i);
  if (wifi) {
    const f = Object.fromEntries([...wifi[1].matchAll(/([TSPH]):((?:\\.|[^;])*)/gi)].map((m) => [m[1].toUpperCase(), m[2].replace(/\\(.)/g, '$1')]));
    return { title: `WLAN ${f.S ?? ''}`.trim(), text: [f.S ? `SSID: ${f.S}` : '', f.P ? `Passwort: ${f.P}` : '', f.T ? `(${f.T})` : ''].filter(Boolean).join('\n') };
  }
  const first = s.split('\n')[0].slice(0, 60);
  return { title: first, text: s.length > first.length ? s : '' };
}

/* ---------- N10 templates ---------- */

export const NOTE_TPL_KEY = 'noteTemplates';
/** The Standard templates: name and text are English keys for t() (the text is translated when used). */
export const STD_TEMPLATES = [
  { key: 'shopping', name: 'Shopping list|tpl', text: 'Shopping\n- \n- \n- ' },
  { key: 'diary', name: 'Diary|tpl', text: 'Today\nWhat was good:\nWhat I learned:\nTomorrow:' },
  { key: 'bikecheck', name: 'Bike check|tpl', text: 'Bike check\n- [ ] Tyre pressure\n- [ ] Chain oiled\n- [ ] Brakes\n- [ ] Lights\n- [ ] Bolts' },
];

/** Your templates: the stored list, else the Standard ones. [{ key, name, text, raw? }] */
export function templatesOf(value) {
  return Array.isArray(value) && value.length ? value.filter((x) => x?.key && x?.name) : STD_TEMPLATES.map((x) => ({ ...x }));
}
/** A template's name and text as shown: typed ones as they are, Standard ones through t(). */
export const tplName = (x, tr) => (x.raw ? x.name : tr(x.name));
export const tplText = (x, tr) => (x.raw ? x.text : x.text.split('\n').map((l) => { const m = l.match(/^(- (?:\[ \] )?)(.*)$/); return m ? m[1] + (m[2] ? tr(m[2]) : '') : l ? tr(l) : l; }).join('\n'));
/** A note's text saved as your own template. */
export function addTemplate(list, name, text, id = `tpl-${Date.now().toString(36)}`) {
  const n = String(name ?? '').trim();
  return n && String(text ?? '').trim() ? [...list, { key: id, name: n, text: String(text), raw: true }] : list;
}
/** Renamed as typed; a Standard template becomes yours with its text in your language (tr). */
export const renameTemplate = (list, key, name, tr = (x) => x) => (String(name ?? '').trim() ? list.map((x) => (x.key === key ? { ...x, name: String(name).trim(), raw: true, text: tplText(x, tr) } : x)) : list);
export const removeTemplate = (list, key) => list.filter((x) => x.key !== key);

/* ---------- N11 Markdown light ---------- */

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inline = (s) =>
  esc(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/~~([^~]+)~~/g, '<s>$1</s>')
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');

/** Does a text use formatting (then the note shows the reading view first)? */
export const hasFormat = (text = '') => /(^|\n)(#{1,3} |\|.*\|)|\*\*[^*]+\*\*/.test(text);

/**
 * Markdown light to HTML. Everything is escaped first; only these come back: # ## ### headings,
 * **bold**, *italic*, ~~struck~~, `code`, «- » lists, «- [ ] » ticks, «1. » lists, tables with | cells
 * (a |---| line is skipped).
 */
export function mdToHtml(text = '') {
  const out = [];
  let list = null;
  let table = null;
  const close = () => {
    if (list) out.push(`</${list}>`), (list = null);
    if (table) out.push(`<table>${table.join('')}</table>`), (table = null);
  };
  for (const line of String(text).split('\n')) {
    const h = line.match(/^(#{1,3}) (.+)$/);
    const ul = line.match(/^\s*[-*•] (.+)$/);
    const ol = line.match(/^\s*\d+[.)] (.+)$/);
    const tr = line.trim().startsWith('|') && line.trim().endsWith('|') ? line.trim().slice(1, -1).split('|').map((c) => c.trim()) : null;
    if (tr) {
      if (list) out.push(`</${list}>`), (list = null);
      if (tr.every((c) => /^:?-{2,}:?$/.test(c))) continue;
      table = table ?? [];
      const tag = table.length ? 'td' : 'th';
      table.push(`<tr>${tr.map((c) => `<${tag}>${inline(c)}</${tag}>`).join('')}</tr>`);
    } else if (ul || ol) {
      if (table) out.push(`<table>${table.join('')}</table>`), (table = null);
      const want = ul ? 'ul' : 'ol';
      if (list !== want) {
        if (list) out.push(`</${list}>`);
        out.push(`<${want}>`);
        list = want;
      }
      // Paket NE 1147: «- [ ] …» / «- [x] …» are ticks in the text (data-todo 0 / 1)
      const todo = ul && ul[1].match(/^\[( |x|X)\] ?(.*)$/);
      out.push(todo ? `<li data-todo="${/x/i.test(todo[1]) ? 1 : 0}">${inline(todo[2])}</li>` : `<li>${inline((ul ?? ol)[1])}</li>`);
    } else {
      close();
      if (h) out.push(`<h${h[1].length + 2}>${inline(h[2])}</h${h[1].length + 2}>`);
      else if (line.trim()) out.push(`<p>${inline(line)}</p>`);
    }
  }
  close();
  return out.join('');
}

/** A Markdown mark put around the selection (or inserted at the cursor): → { text, start, end }. */
export function wrapSel(text, start, end, kind) {
  const sel = text.slice(start, end);
  if (kind === 'bold') {
    const w = `**${sel || '…'}**`;
    return { text: text.slice(0, start) + w + text.slice(end), start: start + 2, end: start + w.length - 2 };
  }
  const lineStart = text.lastIndexOf('\n', start - 1) + 1;
  if (kind === 'heading') return { text: `${text.slice(0, lineStart)}## ${text.slice(lineStart)}`, start: start + 3, end: end + 3 };
  // table: a small 2×2 table on its own lines
  const tbl = `${start && text[start - 1] !== '\n' ? '\n' : ''}| A | B |\n|---|---|\n|  |  |\n`;
  return { text: text.slice(0, start) + tbl + text.slice(end), start: start + tbl.length, end: start + tbl.length };
}

/* ---------- N13 Google Keep (Takeout) ---------- */

/** Is this the JSON of one Keep note from Google Takeout? */
export const isKeepNote = (j) => !!j && typeof j === 'object' && ('textContent' in j || 'listContent' in j) && ('userEditedTimestampUsec' in j || 'createdTimestampUsec' in j || 'isTrashed' in j);

/**
 * One Keep note → a kept note of the app, or null (trashed or empty). Labels become #tags in the text;
 * a checklist stays a checklist; links (annotations) are kept; pinned stays pinned only as a #pinned tag
 * (the app pins at most 3). Photos of Keep are not taken over (only the text).
 */
export function keepToNote(j, { id, topic = 'general' } = {}) {
  if (!isKeepNote(j) || j.isTrashed) return null;
  const usec = Number(j.userEditedTimestampUsec || j.createdTimestampUsec || 0);
  const at = usec ? new Date(Math.round(usec / 1000)).toISOString() : new Date().toISOString();
  const labels = (j.labels ?? []).map((l) => String(l?.name ?? '').trim().replace(/\s+/g, '-')).filter(Boolean);
  const tags = [...labels, ...(j.isArchived ? ['archiv'] : []), ...(j.isPinned ? ['pinned'] : [])].map((x) => `#${x}`).join(' ');
  const text = [String(j.textContent ?? '').trim(), tags].filter(Boolean).join('\n\n');
  const checklist = (j.listContent ?? []).filter((x) => String(x?.text ?? '').trim()).map((x) => ({ text: String(x.text).trim(), done: !!x.isChecked }));
  const links = (j.annotations ?? []).filter((a) => /^https?:\/\//i.test(a?.url ?? '')).map((a) => ({ title: a.title || a.url, url: a.url }));
  const title = String(j.title ?? '').trim();
  if (!title && !text && !checklist.length && !links.length) return null;
  return {
    id, kind: 'note', status: 'kept', at, editedAt: at, title, text, topic, pinned: false, photo: null,
    ...(links[0] ? { link: links[0] } : {}), ...(links.length > 1 ? { links2: links.slice(1) } : {}),
    ...(checklist.length ? { checklist } : {}), keep: { at: usec || null, title },
  };
}

/** A key that finds a Keep note again, so a second import adds nothing twice. */
export const keepKey = (n) => (n?.keep ? `${n.keep.at}|${n.keep.title}` : null);

/** The notes to add from Keep JSONs, without the ones already imported: { add: [note], skipped, already }. */
export function keepImport(jsons, existing = [], { ids = (i) => `note-keep-${Date.now().toString(36)}-${i}` } = {}) {
  const have = new Set(existing.map(keepKey).filter(Boolean));
  const add = [];
  let skipped = 0;
  let already = 0;
  jsons.forEach((j, i) => {
    const n = keepToNote(j, { id: ids(i) });
    if (!n) return void skipped++;
    const k = keepKey(n);
    if (have.has(k)) return void already++;
    have.add(k);
    add.push(n);
  });
  return { add, skipped, already };
}

/* ---------- N14 share ---------- */

/** A note as plain text to share: title, text, checklist, links, place. */
export function shareText(n, tr = (s) => s.replace(/\|[a-z]+$/, '')) {
  const lines = [];
  if (n.title) lines.push(n.title);
  if (n.text) lines.push(n.text);
  for (const c of n.checklist ?? []) lines.push(`${c.done ? '☑' : '☐'} ${c.text}`);
  for (const l of linksOf(n)) lines.push(l.title && l.title !== l.url ? `${l.title}: ${l.url}` : l.url);
  const pl = placeLinks(n.place);
  if (pl) lines.push(`${tr('Place|location')}: ${placeText(n.place)} ${pl.maps}`);
  return lines.join('\n').trim();
}

export { tagsOf };
