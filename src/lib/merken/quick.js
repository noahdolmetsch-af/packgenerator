/**
 * The quick field in «Neu» (mockup PL1, Noah 14.10.2026 «3a»): type first, the app suggests what it is.
 * A rule, no AI: «Liste …» or three or more parts split by commas → a list; a sentence about something
 * missing, broken or an idea → a note; anything else → a to-do. Only a suggestion: every kind stays one tap.
 */
export const KINDS = ['todo', 'list', 'note'];

export function suggestKind(text) {
  const s = String(text ?? '').trim();
  if (!s) return null;
  if (/^(liste|list)\b/i.test(s) || s.split(',').filter((x) => x.trim()).length >= 3) return 'list';
  if (/\b(fehlt|fehlte|kaputt|defekt|idee|notiz|missing|broken|idea|note)\b/i.test(s)) return 'note';
  return 'todo';
}

/** «Liste Einkauf: Brot, Käse» → { name: 'Einkauf', points: ['Brot', 'Käse'] }; without a colon the name is the text. */
export function listFrom(text) {
  const s = String(text ?? '').trim().replace(/^(liste|list)\b\s*/i, '');
  const [head, tail] = s.includes(':') ? [s.slice(0, s.indexOf(':')), s.slice(s.indexOf(':') + 1)] : s.split(',').length >= 3 ? ['', s] : [s, ''];
  return { name: head.trim(), points: tail.split(',').map((x) => x.trim()).filter(Boolean) };
}
