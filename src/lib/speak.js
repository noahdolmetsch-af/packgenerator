/**
 * FE10 «Sprechen statt tippen» (Noah 13.10.2026 23:52): the pure parts of the microphone button
 * (ui/SpeakButton.svelte). The browser's speech recognition turns speech into text; the button only
 * shows where the browser has it.
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

/** The text with the spoken words appended: a space between, a new line stays a new line. */
export function appendSpoken(text = '', said = '') {
  const s = said.trim();
  if (!s) return text;
  if (!text) return s;
  return /\s$/.test(text) ? `${text}${s}` : `${text} ${s}`;
}
