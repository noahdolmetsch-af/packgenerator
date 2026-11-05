// Wächter «Fehlendes Deutsch» (Frontend-Durchklick Etappe 1, Noah 05.11.2026 «1a»): every text that goes through
// t('English') or tn(n, 'one', 'many') in src/ needs a German entry in src/lib/i18n/de/*.js. Before this test a gap
// showed only when someone clicked to the place on a German page (E1-002 to E1-004: «Show all 15 trips»).
// The test reads the source as text and finds the texts written out in the call (no template strings, no
// computed texts). KNOWN lists the texts that stay English on purpose; the list may only shrink.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import DE from '../src/lib/i18n/de/index.js';

const ROOT = new URL('../src', import.meta.url).pathname;

// stay English on purpose: the placeholder of the function itself, a sign (Ø, max) and a name used in German too
const KNOWN = new Set(['English text', 'Ø {v} {unit}', 'max {v} {unit}', 'KI-Helfer']);

const walk = (dir, out = []) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) {
      if (/[\\/](i18n|news)$/.test(p)) continue; // the dictionaries and the news files bring their own German
      walk(p, out);
    } else if (/\.(svelte|js)$/.test(f)) out.push(p);
  }
  return out;
};

const RE = /\b(t|tn)\(\s*(?:[^'"`,()]*?,\s*)?(['"`])((?:\\.|(?!\2).)*?)\2(?:\s*,\s*(['"`])((?:\\.|(?!\4).)*?)\4)?/g;

function gaps() {
  const missing = new Map();
  for (const file of walk(ROOT)) {
    const src = readFileSync(file, 'utf8');
    for (const m of src.matchAll(RE)) {
      const cands = [m[3]];
      if (m[1] === 'tn' && m[5]) cands.push(m[5]); // tn(n, 'one', 'many')
      for (const raw of cands) {
        const text = raw.replace(/\\'/g, "'").replace(/\\"/g, '"');
        if (!/[A-Za-z]{3}/.test(text) || text.includes('${')) continue;
        if (!(text in DE) && !missing.has(text)) missing.set(text, `${file.slice(ROOT.length - 3)}:${src.slice(0, m.index).split('\n').length}`);
      }
    }
  }
  return missing;
}

describe('every text in the app has German', () => {
  const missing = gaps();
  it('no t() / tn() text without a German entry (add it to src/lib/i18n/de/*.js)', () => {
    const open = [...missing].filter(([text]) => !KNOWN.has(text)).map(([text, where]) => `${where}  ${text}`);
    expect(open, `Texts without German:\n${open.join('\n')}`).toEqual([]);
  });
  it('KNOWN only lists texts that are still missing (remove an entry once it has German)', () => {
    const done = [...KNOWN].filter((text) => !missing.has(text));
    expect(done).toEqual([]);
  });
});
