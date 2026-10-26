/**
 * «Eingaben überall» (Noah 26.10.2026 «1a 2b 3 nur Ton. kein Video 4b 5a aber b möglich»): one input bar
 * under the text of ten places in the app. It adds what the place lacks: a voice note (up to 1 minute, no
 * video), a photo, a file, the place, tags, a template of this place, writing prompts and the AI helpers.
 * Pure part, tested in tests/eingabe.test.js. The bar is InputBar.svelte, what was added shows with
 * InputsView.svelte. A record keeps it in its field `inputs` (no Dexie change):
 *   inputs = { voices: [{ id, src, s, at, text? }], files: [{ id, name, type, bytes, src }], photos: [{ src }],
 *              place: { name, lat?, lon? } | null, tags: [string] }
 * Everything stays on the device and in the own backup; only an AI step sends text, with a tick each time.
 */

/** A voice note is at most one minute long (Noah «3 nur Ton»; same as Mit Freunden and the Klangbriefe). */
export const VOICE_MAX_S = 60;
export const VOICES_MAX = 3;
/** A file in a record: at most 1.5 MB (the sync takes records up to 3.9 MB), at most 5 per record. */
export const FILE_MAX_BYTES = 1_500_000;
export const FILES_MAX = 5;
export const PHOTOS_MAX = 6;
export const TAGS_MAX = 12;

/** The tools of the bar, in their order. */
export const TOOLS = ['voice', 'photo', 'file', 'place', 'tag', 'template', 'prompt', 'ai'];

/**
 * The ten places and what the bar offers there (what the page already has itself is left out, e.g. the
 * diary has its own photos, place and tags). name: English key for t().
 */
export const PLACES = {
  // the diary keeps its own AI box (title, tidy), which got «Prompts that fit» and «Highlights» too
  diary: { name: 'Diary', tools: ['voice', 'file', 'template', 'prompt'] },
  notes: { name: 'Notes', tools: ['voice', 'prompt', 'ai'] }, // the notes have photos, files, place, templates and #tags of their own
  check: { name: 'Daily check', tools: ['voice', 'photo', 'template', 'prompt'] },
  debrief: { name: 'Debrief', tools: ['voice', 'file', 'place', 'tag', 'template', 'prompt', 'ai'] }, // the tour diary has its photos
  ride: { name: 'Ride', tools: ['voice', 'photo', 'place', 'template'] },
  spur: { name: 'Journey trail', tools: ['voice', 'tag', 'template'] },
  care: { name: 'Bike care', tools: ['voice', 'photo', 'file', 'template'] },
  gear: { name: 'Gear', tools: ['voice', 'file', 'tag', 'template'] },
  // all dreams sit in one settings record (sync: 3.9 MB a record), so no files here; GPX and link the dream has itself
  dreams: { name: 'Dreams', tools: ['voice', 'place', 'tag', 'template', 'prompt'] },
  inbox: { name: 'Inbox', tools: ['voice', 'file', 'place', 'template'] }, // the quick note has its photo
};
export const PLACE_KEYS = Object.keys(PLACES);

/** The tools shown at a place: the place's own list, cut to `only` when given. */
export function toolsOf(place, only = null) {
  const own = PLACES[place]?.tools ?? TOOLS;
  return only ? own.filter((x) => only.includes(x)) : own;
}

/* ---------- inputs ---------- */

export const emptyInputs = () => ({ voices: [], files: [], photos: [], place: null, tags: [] });
const arr = (x) => (Array.isArray(x) ? x : []);
const str = (x) => (typeof x === 'string' ? x : '');

/** Any stored value made whole (unknown parts dropped). */
export function inputsOf(x) {
  const v = x && typeof x === 'object' ? x : {};
  const place = v.place && typeof v.place === 'object' && (str(v.place.name).trim() || Number.isFinite(v.place.lat)) ? { name: str(v.place.name).trim(), ...(Number.isFinite(v.place.lat) && Number.isFinite(v.place.lon) ? { lat: v.place.lat, lon: v.place.lon } : {}) } : null;
  return {
    voices: arr(v.voices).filter((a) => str(a?.src).startsWith('data:')).map((a) => ({ id: str(a.id) || newId('v'), src: a.src, s: Math.max(0, Math.min(VOICE_MAX_S, Math.round(Number(a.s) || 0))), at: str(a.at), ...(str(a.text).trim() ? { text: a.text.trim() } : {}), ...(str(a.name).trim() ? { name: a.name.trim() } : {}) })),
    files: arr(v.files).filter((f) => str(f?.src).startsWith('data:') && str(f.name).trim()).map((f) => ({ id: str(f.id) || newId('f'), name: f.name.trim(), type: str(f.type), bytes: Number(f.bytes) || 0, src: f.src })),
    photos: arr(v.photos).filter((p) => str(p?.src).startsWith('data:')).map((p) => ({ src: p.src })),
    place,
    tags: cleanTags(arr(v.tags)),
  };
}

/** Is anything added? */
export const hasInputs = (x) => {
  const v = inputsOf(x);
  return !!(v.voices.length || v.files.length || v.photos.length || v.place || v.tags.length);
};

/** For saving: null when nothing is added, else only the parts that hold something. */
export function cleanInputs(x) {
  const v = inputsOf(x);
  if (!hasInputs(v)) return null;
  return Object.fromEntries(Object.entries(v).filter(([, val]) => (Array.isArray(val) ? val.length : val)));
}

/** The words of what was added, for the search: tags, the place, file names, voice notes as text. */
export function inputWords(x) {
  const v = inputsOf(x);
  return [...v.tags.map((s) => `#${s}`), v.place?.name, ...v.files.map((f) => f.name), ...v.voices.flatMap((a) => [a.name, a.text])].filter(Boolean).join(' ');
}

/** A short line of what was added: «1 voice note · 2 files · #Tour» (tr: t, tn). */
export function inputsLine(x, { t = (s) => s, tn = (n, one, many) => (n === 1 ? one : many).replace('{n}', n) } = {}) {
  const v = inputsOf(x);
  return [
    v.voices.length ? tn(v.voices.length, '{n} voice note', '{n} voice notes') : '',
    v.photos.length ? tn(v.photos.length, '{n} photo', '{n} photos') : '',
    v.files.length ? tn(v.files.length, '{n} file', '{n} files') : '',
    v.place?.name || (v.place ? t('Position') : ''),
    ...v.tags.map((s) => `#${s}`),
  ]
    .filter(Boolean)
    .join(' · ');
}

export const newId = (p = 'in') => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/** A recorded voice note added (at most VOICES_MAX). → { inputs, error? } error: 'many' */
export function addVoice(x, voice) {
  const v = inputsOf(x);
  if (v.voices.length >= VOICES_MAX) return { inputs: v, error: 'many' };
  return { inputs: inputsOf({ ...v, voices: [...v.voices, { id: newId('v'), at: new Date().toISOString(), ...voice }] }) };
}
export const dropVoice = (x, id) => ({ ...inputsOf(x), voices: inputsOf(x).voices.filter((a) => a.id !== id) });
export const setVoice = (x, id, fields) => ({ ...inputsOf(x), voices: inputsOf(x).voices.map((a) => (a.id === id ? { ...a, ...fields } : a)) });

/** The bytes of a data URL (without reading it). */
export function dataBytes(url = '') {
  const i = url.indexOf(',');
  if (i < 0) return 0;
  const b64 = url.slice(i + 1);
  return Math.floor((b64.length * 3) / 4) - (b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0);
}

/** A file added. → { inputs, error? } error: 'big' (over FILE_MAX_BYTES) | 'many' */
export function addFile(x, file) {
  const v = inputsOf(x);
  const bytes = file.bytes ?? dataBytes(file.src);
  if (bytes > FILE_MAX_BYTES) return { inputs: v, error: 'big' };
  if (v.files.length >= FILES_MAX) return { inputs: v, error: 'many' };
  return { inputs: inputsOf({ ...v, files: [...v.files, { id: newId('f'), name: file.name, type: file.type ?? '', bytes, src: file.src }] }) };
}
export const dropFile = (x, id) => ({ ...inputsOf(x), files: inputsOf(x).files.filter((f) => f.id !== id) });

export function addPhoto(x, src) {
  const v = inputsOf(x);
  if (v.photos.length >= PHOTOS_MAX) return { inputs: v, error: 'many' };
  return { inputs: { ...v, photos: [...v.photos, { src }] } };
}
export const dropPhoto = (x, i) => ({ ...inputsOf(x), photos: inputsOf(x).photos.filter((_, n) => n !== i) });

export const setPlace = (x, place) => ({ ...inputsOf(x), place: inputsOf({ place }).place });

/** A tag as stored: no «#», one space, at most 30 signs. */
export const cleanTag = (s) => String(s ?? '').replace(/^#+/, '').replace(/\s+/g, ' ').trim().slice(0, 30);
/** Tags without empties and doubles (the first spelling wins), at most TAGS_MAX. */
export function cleanTags(list = []) {
  const seen = new Set();
  const out = [];
  for (const s of list.map(cleanTag)) {
    const k = s.toLowerCase();
    if (!s || seen.has(k)) continue;
    seen.add(k);
    out.push(s);
  }
  return out.slice(0, TAGS_MAX);
}
export const addTag = (x, s) => ({ ...inputsOf(x), tags: cleanTags([...inputsOf(x).tags, s]) });
export const dropTag = (x, s) => ({ ...inputsOf(x), tags: inputsOf(x).tags.filter((y) => y !== s) });

/** All tags used at a place, most used first: [{ name, n }]. */
export function tagsUsed(records = []) {
  const count = new Map();
  for (const r of records) for (const s of inputsOf(r?.inputs).tags) {
    const k = s.toLowerCase();
    const had = count.get(k);
    count.set(k, { name: had?.name ?? s, n: (had?.n ?? 0) + 1 });
  }
  return [...count.values()].sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
}

/* ---------- text ---------- */

/** A block of text (a template, a prompt, highlights) added under the text, with an empty line between. */
export function withBlock(text = '', block = '') {
  const b = String(block ?? '').trim();
  if (!b) return text ?? '';
  const s = String(text ?? '').replace(/\s+$/, '');
  return s ? `${s}\n\n${b}\n` : `${b}\n`;
}

/* ---------- templates per place (Noah «4b») ---------- */

export const TEMPLATES_KEY = 'inputTemplates';

/**
 * The Standard templates of each place: name and text are English keys for t() (each line of the text is
 * translated). Noah's examples for the diary: gratitude, small joys, 2 good things, favourite moments.
 */
export const STD_TEMPLATES = {
  diary: [
    { key: 'grateful', name: 'Gratitude', text: 'What am I grateful for today?\n- ' },
    { key: 'joys', name: 'Small joys', text: 'Small joys today:\n- ' },
    { key: 'good2', name: '2 good things', text: 'Two good things that happened today:\n1. \n2. ' },
    { key: 'moment', name: 'Favourite moment', text: 'My favourite moment(s) today:\n- ' },
  ],
  notes: [],
  check: [
    { key: 'grateful', name: 'Gratitude', text: 'Today I am grateful for:\n- ' },
    { key: 'good', name: 'What did me good', text: 'What did me good today:\n- ' },
  ],
  debrief: [
    { key: 'moment', name: 'Favourite moment', text: 'My favourite moment of the tour:\n- ' },
    { key: 'keep', name: 'What I keep', text: 'What I take with me:\n- ' },
    { key: 'next', name: 'Next time', text: 'Next time I do differently:\n- ' },
  ],
  ride: [
    { key: 'how', name: 'How it went', text: 'How it went:\n- Legs: \n- Weather: \n- Food: ' },
    { key: 'problem', name: 'Problem', text: 'Problem:\n- What: \n- Where: ' },
  ],
  spur: [
    { key: 'see', name: 'What I see', text: 'What I see here:\n- ' },
    { key: 'why', name: 'Why I stopped', text: 'Why I stopped here:\n- ' },
  ],
  care: [
    { key: 'done', name: 'What I did', text: 'What I did:\n- ' },
    { key: 'noticed', name: 'What I noticed', text: 'What I noticed (noise, play, wear):\n- ' },
  ],
  gear: [
    { key: 'use', name: 'My experience', text: 'My experience with it:\n- ' },
    { key: 'bought', name: 'Bought and warranty', text: 'Bought at: \nWarranty until: ' },
  ],
  dreams: [
    { key: 'why', name: 'Why this tour', text: 'Why I want to ride this:\n- ' },
    { key: 'need', name: 'What I need for it', text: 'What I need for it:\n- ' },
  ],
  inbox: [
    { key: 'what', name: 'What is it', text: 'What is it:\n- ' },
    { key: 'todo', name: 'What is to do', text: 'What is to do:\n- [ ] ' },
  ],
};

/**
 * The templates of a place: the stored list when there is one (also an empty one: all deleted), else the
 * Standard. stored = the settings value { [place]: [{ key, name, text, raw? }] }.
 */
export function templatesFor(place, stored) {
  const own = stored && typeof stored === 'object' ? stored[place] : undefined;
  if (Array.isArray(own)) return own.filter((x) => x?.key && str(x.name).trim()).map((x) => ({ key: x.key, name: x.name, text: str(x.text), ...(x.raw ? { raw: true } : {}) }));
  return (STD_TEMPLATES[place] ?? []).map((x) => ({ ...x }));
}
/** A template's name and text as shown: typed ones as they are, Standard ones through t() line by line. */
export const tplName = (x, tr = (s) => s) => (x.raw ? x.name : tr(x.name));
export const tplText = (x, tr = (s) => s) =>
  x.raw
    ? x.text
    : x.text
        .split('\n')
        .map((l) => {
          const m = l.match(/^((?:- (?:\[ \] )?)|(?:\d+\. ))?(.*?)(\s*)$/);
          return (m[1] ?? '') + (m[2] ? tr(m[2]) : '') + m[3];
        })
        .join('\n');

/** The templates of one place set in the stored value (the other places kept). */
export const withTemplates = (stored, place, list) => ({ ...(stored && typeof stored === 'object' ? stored : {}), [place]: list });

/** A new own template (name and text needed). */
export function addTemplate(list, name, text, key = newId('tpl')) {
  const n = String(name ?? '').trim();
  return n && String(text ?? '').trim() ? [...list, { key, name: n.slice(0, 40), text: String(text), raw: true }] : list;
}
/** Renamed or rewritten as typed; a Standard template becomes yours with its text in your language. */
export function changeTemplate(list, key, { name, text } = {}, tr = (s) => s) {
  return list.map((x) => {
    if (x.key !== key) return x;
    const n = name == null ? tplName(x, tr) : String(name).trim() || tplName(x, tr);
    return { key: x.key, name: n.slice(0, 40), text: text == null ? tplText(x, tr) : String(text), raw: true };
  });
}
export const removeTemplate = (list, key) => list.filter((x) => x.key !== key);
/** One template moved from place `from` to `to` (out of range: as it was). */
export function moveTemplate(list, from, to) {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const out = [...list];
  const [x] = out.splice(from, 1);
  out.splice(to, 0, x);
  return out;
}

/* ---------- writing prompts (without AI) ---------- */

/** Three prompts per place, chosen by the day (another set tomorrow). English keys for t(). */
export const PROMPTS = {
  diary: ['What surprised you today?', 'Who made your day a little better?', 'What would you like to remember from today in a year?', 'What did your body tell you today?', 'What did you leave out today, and was it good?', 'Which sound, smell or picture of today stays with you?'],
  notes: ['What is the next small step?', 'What do you need for it?', 'Who could help you with it?', 'What would make it easier?'],
  check: ['What gave you energy today?', 'What took energy?', 'What will you keep for tomorrow?', 'Which moment was calm?'],
  debrief: ['Which moment of the tour do you still see in front of you?', 'What worked better than planned?', 'What would you pack differently?', 'Whom did you meet on the way?', 'Which climb or stretch was the best?'],
  dreams: ['What draws you to this tour?', 'With whom would you like to ride it?', 'What would be the most beautiful day of it?', 'What scares you a little about it?'],
};
/** The prompts of a place for a day: `n` of them, turning by the day of the year. */
export function promptsFor(place, day = '2026-01-01', n = 3) {
  const list = PROMPTS[place] ?? PROMPTS.notes;
  const d = new Date(`${day}T12:00:00Z`);
  const k = Math.floor((d - new Date(Date.UTC(d.getUTCFullYear(), 0, 1))) / 864e5) || 0;
  return Array.from({ length: Math.min(n, list.length) }, (_, i) => list[(k + i) % list.length]);
}

/* ---------- AI answers ---------- */

/** Gemini's prompts or highlights as lines: list signs and numbers off, empty lines out, at most `max`. */
export function aiLines(text = '', max = 4) {
  return String(text ?? '')
    .split('\n')
    .map((l) => l.replace(/^\s*(?:[-*•–]|\d+[.)])\s*/, '').replace(/\*\*/g, '').trim())
    .filter((l) => l.length > 1)
    .slice(0, max);
}

/** Highlights as a block for the text. */
export const highlightsBlock = (lines = [], head = 'Highlights') => (lines.length ? `${head}:\n${lines.map((l) => `- ${l}`).join('\n')}` : '');

/* ---------- files ---------- */

/** A file size in KB or MB, with the app's number format (fmt). */
export function sizeText(bytes = 0, fmt = (n) => String(n)) {
  if (bytes >= 1_000_000) return `${fmt(Math.round(bytes / 100_000) / 10)} MB`;
  return `${fmt(Math.max(1, Math.round(bytes / 1000)))} KB`;
}
