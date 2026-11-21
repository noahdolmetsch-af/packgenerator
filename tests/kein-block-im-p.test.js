// Guard (21.11.2026, «Was mir gut tut» crashed with «Illegal invocation»): a block element (<details>, <div>, <ul> …)
// inside a <p> makes the browser close the <p> early when the page builds its template. The page's own structure
// then no longer fits what the compiler expects and the page throws. Svelte only warns for a direct child, so a
// <details> inside a <span> inside a <p> slipped through. This test walks every .svelte file and fails for any
// static <p> that holds a block element at any depth (the children of a component are a separate template and do not count).
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const BLOCK = new Set(['address', 'article', 'aside', 'blockquote', 'details', 'dialog', 'div', 'dl', 'fieldset', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'main', 'menu', 'nav', 'ol', 'p', 'pre', 'section', 'table', 'ul']);
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

const files = (dir, out = []) => {
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, f.name);
    if (f.isDirectory()) files(p, out);
    else if (p.endsWith('.svelte')) out.push(p);
  }
  return out;
};

/** Reads one tag starting at `<`: returns { end, name, closing, selfClosing } and skips quotes and {…} inside the attributes. */
function readTag(s, i) {
  let j = i + 1;
  const closing = s[j] === '/';
  if (closing) j++;
  let name = '';
  while (j < s.length && /[\w:.-]/.test(s[j])) name += s[j++];
  let depth = 0;
  let quote = '';
  for (; j < s.length; j++) {
    const c = s[j];
    if (quote) {
      if (c === quote && depth === 0) quote = '';
      continue;
    }
    if (depth > 0) {
      if (c === '{') depth++;
      else if (c === '}') depth--;
      continue;
    }
    if (c === '{') depth++;
    else if (c === '"' || c === "'") quote = c;
    else if (c === '>') return { end: j + 1, name, closing, selfClosing: s[j - 1] === '/' };
  }
  return null;
}

/** [{ line, block }] for every block element found inside a static <p> of one source text. */
export function blocksInP(src) {
  const s = src.replace(/<script[\s\S]*?<\/script>/g, (m) => m.replace(/[^\n]/g, ' ')).replace(/<style[\s\S]*?<\/style>/g, (m) => m.replace(/[^\n]/g, ' ')).replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));
  const stack = []; // names of the open elements; a component or svelte: tag is a wall (its children are another template)
  const hits = [];
  for (let i = 0; i < s.length; i++) {
    if (s[i] !== '<' || !/[A-Za-z/]/.test(s[i + 1] ?? '')) continue;
    const tag = readTag(s, i);
    if (!tag || !tag.name) continue;
    i = tag.end - 1;
    const wall = /^[A-Z]/.test(tag.name) || tag.name.includes(':') || tag.name.includes('.');
    if (tag.closing) {
      const at = stack.lastIndexOf(tag.name);
      if (at >= 0) stack.length = at;
      continue;
    }
    if (BLOCK.has(tag.name)) {
      const wallAt = Math.max(-1, ...stack.map((n, k) => (n === '#wall' ? k : -1)));
      if (stack.slice(wallAt + 1).includes('p')) hits.push({ line: s.slice(0, tag.end).split('\n').length, block: tag.name });
    }
    if (tag.selfClosing || VOID.has(tag.name)) continue;
    stack.push(wall ? '#wall' : tag.name);
  }
  return hits;
}

describe('guard: no block element inside a <p>', () => {
  it('the scanner finds a <details> deep inside a <p>, and leaves a component child alone', () => {
    expect(blocksInP('<p><span><b>x</b><details><summary>a</summary></details></span></p>')).toEqual([{ line: 1, block: 'details' }]);
    expect(blocksInP('<p>text <Help><p>inner</p></Help></p>')).toEqual([]);
    expect(blocksInP('<div><p onclick={() => (a = b > c)}>x</p><details>y</details></div>')).toEqual([]);
  });
  it('no .svelte file of the app has one', () => {
    const found = [];
    for (const f of files(new URL('../src', import.meta.url).pathname)) for (const h of blocksInP(readFileSync(f, 'utf8'))) found.push(`${f.split('/src/')[1]}:${h.line} <${h.block}> in <p>`);
    expect(found).toEqual([]);
  });
});
