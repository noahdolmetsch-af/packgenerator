// «Ausprobieren» bei Neuigkeiten (Noah 27.10.2026 «1a 2a 3a 4a 5a»): every line of a new news file names its exact
// place («go», know/newsgo.js), and every target of the older versions (know/newsgo-map.js) is well formed.
import { describe, it, expect } from 'vitest';
import { NEWS, NEWS_DE } from '../src/lib/news/index.gen.js';
import { WHATS_NEW } from '../src/lib/whatsnew.js';
import { GO } from '../src/lib/know/newsgo-map.js';
import { goOf, isExact, hrefOf, tryOf } from '../src/lib/know/newsgo.js';
import { FEATURE } from '../src/lib/features.js';
import { DAYS } from '../src/lib/play.js';
import DE from '../src/lib/i18n/de/index.js';

const de = { ...DE, ...NEWS_DE };
const own = (s) => String(s).replace(/\|.*$/, '');

/** The problems of one target (an empty list when it is fine). */
function wrong(g) {
  if (g === null) return [];
  if (typeof g === 'string') return FEATURE[g] ? [] : [`no function ${g} in features.js`];
  const bad = [];
  if (typeof g !== 'object') return ['go is neither a function id, an object nor null'];
  if (g.href != null && !/^#\//.test(g.href)) bad.push(`href ${g.href} is no page of the app`);
  if (!g.href && !g.where) bad.push('neither href nor where');
  if (g.steps && !g.steps.length) bad.push('empty steps');
  for (const s of g.steps ?? []) {
    if (!s.sel && !s.text && !s.aria) bad.push('a step without sel, text or aria');
    for (const k of [s.text, s.aria].filter(Boolean)) if (!de[own(k)] && !de[k]) bad.push(`no German for step «${k}»`);
  }
  if (g.where && !de[g.where]) bad.push(`no German for «${g.where}»`);
  if (g.play && !DAYS.includes(g.play)) bad.push(`play ${g.play} is no day of play.js`);
  return bad;
}

describe('news files: every point says where it leads', () => {
  for (const e of NEWS) {
    it(`${e.id}: each point has go, each go is well formed`, () => {
      const miss = e.points.filter((p) => !Object.hasOwn(p, 'go')).map((p) => p.text);
      expect(miss, `add go to these points of src/lib/news/${e.id}.js (see src/lib/news/README.md)`).toEqual([]);
      for (const p of [...e.points, ...(e.small ?? [])]) if (Object.hasOwn(p, 'go')) expect(wrong(p.go), p.text).toEqual([]);
    });
  }
});

describe('older versions: newsgo-map.js', () => {
  const texts = new Set(WHATS_NEW.flatMap((e) => [...e.points, ...(e.small ?? [])].map((p) => p.text)));
  it('every key is the text of a line of whatsnew.js', () => {
    expect(Object.keys(GO).filter((k) => !texts.has(k))).toEqual([]);
  });
  it('every target is well formed', () => {
    const bad = Object.entries(GO).flatMap(([k, g]) => wrong(g).map((w) => `${k}: ${w}`));
    expect(bad).toEqual([]);
  });
});

describe('know/newsgo.js', () => {
  it('reads a function, an object, null and the old href', () => {
    expect(goOf({ text: 'x', go: 'f.merge' })).toEqual({ feature: 'f.merge' });
    expect(goOf({ text: 'x', go: null })).toBe(null);
    expect(goOf({ text: 'x', href: '#/gear' })).toEqual({ href: '#/gear', action: null });
    expect(goOf({ text: 'x' })).toBe(null);
    expect(isExact(goOf({ text: 'x', href: '#/gear' }))).toBe(false);
    expect(isExact({ href: '#/', steps: [{ sel: 'a' }] })).toBe(true);
    expect(hrefOf({ feature: 'f.merge' })).toBe(FEATURE['f.merge'].href);
  });
  it('«Try it» takes the line with the exact place first', () => {
    const e = { points: [{ text: 'a', href: '#/gear' }, { text: 'b', go: 'f.merge' }] };
    expect(tryOf(e).p.text).toBe('b');
  });
});
