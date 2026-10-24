/**
 * FE10 «Sprechen statt tippen» (Noah 13.10.2026 23:52): the pure parts of the microphone button
 * (ui/SpeakButton.svelte). The browser's speech recognition turns speech into text; the button only
 * shows where the browser has it.
 *
 * «Diktat» (Noah 19.10.2026 «1a 2a 3a 4 a oder b beides wählbar 5a»): dictation runs until you stop it
 * (the browser stops after a pause; dictate.js starts it again quietly), shows the words while you
 * speak, knows spoken commands («Punkt», «neue Zeile») and finds a question in what was said, so the
 * app can answer it from your data (assistent/answers.js).
 */

/** The speech recognition of this browser, or null. */
export const speechApi = (w = typeof window !== 'undefined' ? window : null) => w?.SpeechRecognition ?? w?.webkitSpeechRecognition ?? null;

/** The language to listen in: Swiss German for the German app, else British English. */
export const speechLang = (lang = 'de') => (lang === 'de' ? 'de-CH' : 'en-GB');

/** All recognised words of a result event, as one line. */
export const heard = (results = []) =>
  [...results]
    .map((r) => r?.[0]?.transcript ?? '')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * The new words of one result event, split into the finished part and the part still being heard.
 * Only results from `resultIndex` on are new. A result without `isFinal` counts as finished.
 */
export function split(e = {}) {
  const res = [...(e.results ?? [])];
  const from = Number.isInteger(e.resultIndex) ? e.resultIndex : 0;
  let final = '';
  let interim = '';
  for (const r of res.slice(from)) {
    const s = r?.[0]?.transcript ?? '';
    if (r?.isFinal === false) interim += ` ${s}`;
    else final += ` ${s}`;
  }
  const tidy = (s) => s.replace(/\s+/g, ' ').trim();
  return { final: tidy(final), interim: tidy(interim) };
}

/**
 * Chrome on Android sometimes repeats what it already gave as finished, with the new words added at
 * the end. Returns only the new part of `next` (or all of it when it does not repeat `last`).
 */
export function fresh(last = '', next = '') {
  const a = last.trim().toLowerCase();
  const b = next.trim();
  if (!a || !b) return b;
  if (b.toLowerCase() === a) return '';
  if (b.toLowerCase().startsWith(`${a} `)) return b.slice(a.length).trim();
  return b;
}

/**
 * The text with the spoken words appended: a space between, a new line stays a new line. After an
 * empty field, a new line or . ! ? the first letter is a capital.
 */
export function appendSpoken(text = '', said = '') {
  let s = said.replace(/^ +| +$/g, '');
  if (!s.trim()) return text;
  if (!text.trim() || /[.!?]\s*$|\n\s*$/.test(text)) s = s.replace(/^(\s*)(\p{Ll})/u, (m, a, b) => a + b.toUpperCase());
  if (!text) return s.replace(/^\s+/, '');
  if (/^[.,;:!?]/.test(s) || /^\n/.test(s)) return `${text.replace(/ +$/, '')}${s}`;
  return /\s$/.test(text) ? `${text}${s}` : `${text} ${s}`;
}

/* ---------- spoken commands ---------- */

/** What you can say instead of a sign (German and English), longest first. Shown in the settings. */
export const COMMANDS = [
  { say: ['neuer absatz', 'new paragraph'], put: '\n\n', name: 'new paragraph' },
  { say: ['neue zeile', 'new line'], put: '\n', name: 'new line' },
  { say: ['fragezeichen', 'question mark'], put: '?', name: 'question mark' },
  { say: ['ausrufezeichen', 'exclamation mark'], put: '!', name: 'exclamation mark' },
  { say: ['doppelpunkt', 'colon'], put: ':', name: 'colon' },
  { say: ['komma', 'comma'], put: ',', name: 'comma' },
  { say: ['punkt', 'full stop', 'period'], put: '.', name: 'full stop' },
];

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const CMD_RE = new RegExp(`(^|\\s)(${COMMANDS.flatMap((c) => c.say).sort((a, b) => b.length - a.length).map((s) => esc(s).replace(' ', '\\s+')).join('|')})(?=$|[\\s.,;:!?])`, 'giu');

/**
 * Spoken commands turned into signs: «Kette quietscht Punkt neue Zeile was ist fällig Fragezeichen»
 * → «Kette quietscht.\nWas ist fällig?». A capital letter after . ! ? and a new line.
 */
export function withCommands(said = '', { start = false } = {}) {
  let s = String(said ?? '').replace(CMD_RE, (m, pre, word) => {
    const c = COMMANDS.find((x) => x.say.some((w) => w === word.toLowerCase().replace(/\s+/g, ' ')));
    return c ? `\u0000${c.put}\u0000` : m;
  });
  s = s
    .replace(/\s*\u0000([.,;:!?])\u0000\s*/g, '$1 ')
    .replace(/\s*\u0000(\n+)\u0000\s*/g, '$1')
    .replace(/ +$/g, '')
    .replace(/^ +/, '')
    .replace(/([.!?]) +([.,;:!?])/g, '$1$2');
  s = s.replace(/([.!?]\s+|\n)(\p{Ll})/gu, (m, a, b) => a + b.toUpperCase());
  if (start) s = s.replace(/^(\p{Ll})/u, (m) => m.toUpperCase());
  return s;
}

/* ---------- a question in what was said ---------- */

const ASK = [
  // German
  'was', 'wie', 'wann', 'wo', 'wohin', 'woher', 'wer', 'wen', 'wem', 'welche', 'welcher', 'welches', 'welchen', 'wieviel', 'wie viel', 'wie viele', 'warum', 'weshalb', 'wieso',
  'gibt es', 'habe ich', 'hab ich', 'muss ich', 'brauche ich', 'bin ich', 'fehlt',
  // English
  'what', 'how', 'when', 'where', 'who', 'which', 'why', 'do i', 'did i', 'have i', 'is there', 'am i', 'should i',
];
const ASK_RE = new RegExp(`^(${ASK.sort((a, b) => b.length - a.length).map((w) => w.replace(' ', '\\s+')).join('|')})\\b`, 'iu');

/** Is this one sentence a question? It ends with «?» or starts with a question word. */
export const isQuestion = (s = '') => {
  const x = String(s).trim();
  return x.length >= 3 && (/\?$/.test(x) || ASK_RE.test(x));
};

/** The sentences of a text (split at . ! ? and new lines; a ? stays on its sentence). */
export const sentences = (text = '') =>
  String(text ?? '')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

/** The last question in a text, or ''. */
export function lastQuestion(text = '') {
  const qs = sentences(text).filter(isQuestion);
  return qs.length ? qs[qs.length - 1] : '';
}

/** 42 000 ms → «0:42», 3 725 000 → «62:05». */
export function clock(ms = 0) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/* ---------- settings (only on this device) ---------- */

/** Which speech model turns speech into text. */
export const ENGINES = [
  { key: 'browser', name: 'Browser (Google)', text: 'Fast, no download. Needs internet; the sound goes to Google.' },
  { key: 'whisper', name: 'On this device (Whisper)', text: 'Private and offline. The first time it loads about 80 MB; slower on a phone. The text comes after you stop.' },
];
/** When the app answers a question it heard. */
export const ANSWERS = [
  { key: 'after', name: 'After stop', text: 'You finish speaking, tap stop, then the answer comes.' },
  { key: 'live', name: 'Right away', text: 'The answer comes as soon as the question is spoken.' },
  { key: 'off', name: 'Never', text: 'The app does not answer while you dictate.' },
];
export const DICT_KEY = 'dict.';
export const DICT_DEFAULTS = { engine: 'browser', answer: 'after', read: false, commands: true, gemini: true, others: null, order: null };

/** A stored setting, or its default when nothing (or something unknown) is stored. */
export function dictOf(key, stored) {
  if (key === 'engine') return ENGINES.some((e) => e.key === stored) ? stored : DICT_DEFAULTS.engine;
  if (key === 'answer') return ANSWERS.some((a) => a.key === stored) ? stored : DICT_DEFAULTS.answer;
  if (key === 'others') return typeof stored === 'string' ? stored : null; // the shown services, null = all
  if (key === 'order') return typeof stored === 'string' ? stored : null; // the services' order, null = as built (22.10.2026 «4a»)
  if (stored === '1') return true;
  if (stored === '0') return false;
  return DICT_DEFAULTS[key];
}

/* ---------- reading aloud (the browser's own voice, free) ---------- */

/** The browser's voice, or null. */
export const voiceApi = (w = typeof window !== 'undefined' ? window : null) => (w?.speechSynthesis && w?.SpeechSynthesisUtterance ? w : null);

/** Read a text aloud; `onend` once it is done (also when it cannot). Returns false where it cannot. */
export function readAloud(text, { lang = 'de-CH', onend = () => {}, w } = {}) {
  const v = voiceApi(w);
  const s = String(text ?? '').trim();
  if (!v || !s) {
    onend();
    return false;
  }
  try {
    v.speechSynthesis.cancel();
    const u = new v.SpeechSynthesisUtterance(s);
    u.lang = lang;
    u.onend = () => onend();
    u.onerror = () => onend();
    v.speechSynthesis.speak(u);
    return true;
  } catch {
    onend();
    return false;
  }
}

/** Stop reading aloud. */
export function stopReading(w) {
  try {
    voiceApi(w)?.speechSynthesis.cancel();
  } catch {
    /* nothing to stop */
  }
}
