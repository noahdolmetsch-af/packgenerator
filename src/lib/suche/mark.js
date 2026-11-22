/**
 * «Treffer lesbarer» (Warteliste 1, V4; Noah 22.11.2026 «4a»): the words that were found are marked in the title of a hit.
 * parts('Hardshell Jacke', 'jacke') → [{ s: 'Hardshell ', m: false }, { s: 'Jacke', m: true }]. Pure, no HTML: the page
 * shows the marked parts with <mark>, so nothing from a name can become markup.
 */
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The words of a search worth marking: 2+ letters, lower case, no filter words like «unter 200 g». */
export function markWords(q) {
  return [...new Set(String(q ?? '').toLowerCase().split(/\s+/).filter((w) => w.length >= 2))].sort((a, b) => b.length - a.length);
}

export function parts(text, words) {
  const s = String(text ?? '');
  const ws = Array.isArray(words) ? words : markWords(words);
  if (!s || !ws.length) return [{ s, m: false }];
  const re = new RegExp(`(${ws.map(esc).join('|')})`, 'gi');
  const out = [];
  let last = 0;
  for (const m of s.matchAll(re)) {
    if (m.index > last) out.push({ s: s.slice(last, m.index), m: false });
    out.push({ s: m[0], m: true });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ s: s.slice(last), m: false });
  return out.length ? out : [{ s, m: false }];
}
