/**
 * Paket H «Packen leichter», answer 4 «4a und b möglich» (Noah 19.10.2026 12:09): the packing list
 * read aloud, so the hands stay free.
 * a) The app reads one item at a time; you say «ok» and it is ticked off (the browser's speech
 *    recognition; in Chrome it runs over Google, so it needs the internet).
 * b) Or only reading aloud, with one big «Packed» button. You switch between both at any time.
 * The voice of the browser reads (speechSynthesis, free, on the device). Pure parts here; the
 * window is pack/ReadAloud.svelte, loaded only when it opens.
 */

/** The browser's voice, or null. */
export const voiceApi = (w = typeof window !== 'undefined' ? window : null) => (w?.speechSynthesis && w?.SpeechSynthesisUtterance ? w.speechSynthesis : null);

/** The words that do something, German and English, lower case. */
export const COMMANDS = {
  tick: ['ok', 'okay', 'okey', 'ja', 'jawohl', 'eingepackt', 'gepackt', 'drin', 'hab ich', 'habe ich', 'check', 'yes', 'packed', 'done'],
  skip: ['weiter', 'später', 'spaeter', 'nein', 'überspringen', 'ueberspringen', 'next', 'skip', 'later', 'no'],
  back: ['zurück', 'zurueck', 'back', 'previous'],
  again: ['nochmal', 'noch mal', 'wiederholen', 'wie bitte', 'again', 'repeat'],
  stop: ['stopp', 'stop', 'fertig', 'ende', 'aufhören', 'aufhoeren', 'finish', 'end'],
};

/** What a heard sentence means: 'tick' | 'skip' | 'back' | 'again' | 'stop' | null. The last command word wins. */
export function commandOf(said = '') {
  const s = ` ${String(said).toLowerCase().replace(/[.,!?;:]/g, ' ').replace(/\s+/g, ' ').trim()} `;
  let best = null;
  let at = -1;
  for (const [cmd, words] of Object.entries(COMMANDS))
    for (const w of words) {
      const i = s.lastIndexOf(` ${w} `);
      if (i > at) (at = i), (best = cmd);
    }
  return best;
}

/**
 * The order of reading: the bags in their order, in each bag the items not packed yet.
 * groups: [{ key, name, entries: [{ itemId, qty, packed }] }] → [{ itemId, qty, bag, bagName }]
 */
export function readQueue(groups = []) {
  const out = [];
  for (const g of groups) for (const e of g.entries ?? []) if (!e.packed) out.push({ itemId: e.itemId, qty: e.qty || 1, bag: g.key, bagName: g.name });
  return out;
}

/**
 * The sentence for one item. texts (translated): { one: '{name}', many: '{qty} × {name}', bag: 'Into {bag}' }.
 * The bag is said only when it changes.
 */
export function sayLine(row, prev, name, texts) {
  const what = row.qty > 1 ? texts.many.replace('{qty}', row.qty).replace('{name}', name) : name;
  return prev?.bag !== row.bag && row.bagName ? `${texts.bag.replace('{bag}', row.bagName)}. ${what}` : what;
}

/** The next index after a step, or -1 at the end. */
export function nextIndex(queue, i, done = new Set()) {
  for (let n = i + 1; n < queue.length; n++) if (!done.has(queue[n].itemId)) return n;
  return -1;
}
export function prevIndex(queue, i, done = new Set()) {
  for (let n = i - 1; n >= 0; n--) if (!done.has(queue[n].itemId)) return n;
  return i;
}

/** Remembered choice per device: 'voice' (say «ok») or 'button' (big button only). */
export const MODE_KEY = 'readaloud.mode';
export function savedMode() {
  try {
    return localStorage.getItem(MODE_KEY) === 'button' ? 'button' : 'voice';
  } catch {
    return 'voice';
  }
}
export function saveMode(m) {
  try {
    localStorage.setItem(MODE_KEY, m);
  } catch {
    /* private window */
  }
}
