/**
 * «Suche mit Sprache und Antworten» (Noah 21.10.2026 «1a 2a 3a und ausschaltbar und b ebenfalls möglich
 * 4b und a einstellbar 5b», ideas «1-8 alle»): the settings of the top search and its pure rules.
 * Only on this device (localStorage «suche.*»), set in Ich › Suche (#/me/suche).
 *   mic        the microphone in the search field (1a: always there where the browser can listen)
 *   run        a spoken command runs at once, with Undo (2a)
 *   read       'auto': an answer to a spoken question is read aloud at once; 'tap': only on a tap (4b + a)
 *   app        «The app answers, from your data»
 *   gemini     Gemini answers inside the search (free, needs the helper code; 3a, can be switched off)
 *   geminiAuto Gemini answers a spoken question by itself when the app knows nothing
 *   links      «Ask further at …» (Claude, ChatGPT …) opens the service in a new tab (3b)
 *   chrome     Chrome's own AI on the computer
 *   local      the AI on this device («KI im Gerät»)
 */
export const SUCHE_KEY = 'suche.';
export const SUCHE_DEFAULTS = { mic: true, run: true, read: 'auto', app: true, gemini: true, geminiAuto: true, links: true, chrome: true, local: true };
export const READ_MODES = [
  { key: 'auto', name: 'At once', text: 'After a spoken question the answer is read aloud at once.' },
  { key: 'tap', name: 'Only on a tap', text: 'The answer is read aloud only when you tap «Read aloud».' },
];

/** A stored setting, or its default when nothing (or something unknown) is stored. */
export function sucheOf(key, stored) {
  if (key === 'read') return READ_MODES.some((m) => m.key === stored) ? stored : SUCHE_DEFAULTS.read;
  if (stored === '1') return true;
  if (stored === '0') return false;
  return SUCHE_DEFAULTS[key];
}

/** Commands that write something at once (the others open a page or a window). */
export const WRITES = ['chain', 'sealant', 'wash', 'note'];

/**
 * The command a spoken text runs by itself (2a), or null. Only when exactly one command fits: «Kette
 * geölt» with three bikes shows the three, you choose. A note needs words after «Notiz».
 */
export function spokenCommand(cmds = [], { run = true } = {}) {
  if (!run || cmds.length !== 1) return null;
  const c = cmds[0];
  if (c.cmd?.kind === 'note' && !String(c.cmd.text ?? '').trim()) return null;
  return c;
}

/** Spoken words for the search field: one line, no trailing «.», at most 200 signs. */
export function searchText(said = '') {
  return String(said ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.。]+$/, '')
    .slice(0, 200);
}
