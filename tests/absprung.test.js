// «Wegweiser statt Katalog» PR 1 (Noah 01.11.2026 «1a»): every function has a jump from a page of the app,
// not only from the catalogue, the search or Quick Links. The list of functions without one may only get shorter.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { FEATURES } from '../src/lib/features.js';
import { NO_JUMP, withoutJump, jumpPath } from '../src/lib/know/absprung.js';

// 44 on 01.11.2026. Lower it with every package that gives functions a jump; never raise it.
const MAX_NO_JUMP = 44;

const SRC = path.resolve(__dirname, '../src');
function sources() {
  const out = [];
  (function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name);
      if (fs.statSync(p).isDirectory()) walk(p);
      else if (/\.(svelte|js)$/.test(name)) out.push([path.relative(SRC, p).split(path.sep).join('/'), fs.readFileSync(p, 'utf8')]);
    }
  })(SRC);
  return out;
}

describe('every function has a jump from a page (Wegweiser)', () => {
  const missing = withoutJump(FEATURES, sources());

  it('a function without a jump is listed in NO_JUMP (a new function comes with its jump)', () => {
    expect(missing.filter((id) => !NO_JUMP.includes(id)), 'give these a link from the page where you need them').toEqual([]);
  });

  it('a listed function that got its jump leaves the list', () => {
    expect(NO_JUMP.filter((id) => !missing.includes(id)), 'take these out of NO_JUMP in src/lib/know/absprung.js').toEqual([]);
  });

  it('the list names existing functions once and only gets shorter', () => {
    const ids = new Set(FEATURES.map((f) => f.id));
    expect(NO_JUMP.filter((id) => !ids.has(id))).toEqual([]);
    expect(new Set(NO_JUMP).size).toBe(NO_JUMP.length);
    expect(NO_JUMP.length).toBeLessThanOrEqual(MAX_NO_JUMP);
  });

  it('reads a link with or without a query, and skips actions, the start page and placeholders', () => {
    const f = [{ id: 'a', href: '#/x/y' }, { id: 'b', href: '#/x/z?tab=1' }, { id: 'c', href: '#/' }, { id: 'd', run: 'km' }, { id: 'e', href: '#/b/{bike}' }, { id: 'g', href: '#/x' }];
    expect(jumpPath(f[2])).toBe(null);
    expect(jumpPath(f[3])).toBe(null);
    expect(jumpPath(f[4])).toBe(null);
    const src = [['pages/A.svelte', `<a href="#/x/y?open=1">`], ['lib/features.js', `href: '#/x/z'`], ['pages/B.svelte', `href: '#/x/zz'`]];
    // a: linked with a query; b: only in the catalogue; g: '#/x/y' must not count for '#/x'
    expect(withoutJump(f, src)).toEqual(['b', 'g']);
  });
});
