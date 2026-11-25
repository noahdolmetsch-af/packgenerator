/**
 * «Schreibweise» (Noah 25.11.2026, Gesamttest-Fund C8): the text of an own rule is only ever suggested a better spelling,
 * never rewritten. Two things: a sentence starts with a capital letter, and «5h» is written «5 Std.».
 * Pure: the text in, the suggested text out (or null when nothing is to suggest).
 */

// words whose full stop does not end a sentence («5 Std. geschlafen» stays small after the dot)
const ABBR = /^(std|min|sek|ca|bzw|usw|evtl|ggf|tel|nr|ab|km|kg|z|b|d|h|u)$/i;

/** A capital letter at the start and after «.», «?» and «!» that end a sentence. */
function capitals(text) {
  let out = text.replace(/^(\s*)(\p{Ll})/u, (_, sp, c) => sp + c.toUpperCase());
  out = out.replace(/([.?!])(\s+)(\p{Ll})/gu, (m, p, sp, c, off) => {
    if (p === '.') {
      const word = /(\p{L}+)$/u.exec(text.slice(0, off));
      if (!word || ABBR.test(word[1])) return m;
    }
    return p + sp + c.toUpperCase();
  });
  return out;
}

/** «5h» or «5 h» as «5 Std.» (also 3.5h and 3,5h). */
const hours = (text) => text.replace(/(\d+(?:[.,]\d+)?)\s?h(?![\p{L}\d])/gu, '$1 Std.');

/** The suggested spelling of a text, or null when it is fine as it is (or empty). */
export function suggestSpelling(text) {
  const s = String(text ?? '');
  if (!s.trim()) return null;
  const out = hours(capitals(s));
  return out === s ? null : out;
}
