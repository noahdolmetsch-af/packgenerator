// Etappe 6 (Querschnitt, E6-001): the back key closes an open window FIRST, and the page under it stays
// (rule U8, src/lib/ui/backclose.js). Heute's «Was ziehe ich an?», the row menu in Material and the big
// contact card were windows without it: Back left the page and the window went with it. Every <dialog> in
// the app carries `use:backClose`, except the two below, which are meant to work differently.
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** Windows that must not close with the back key, and why. The list may only get shorter. */
const OTHER_WAY = {
  'src/lib/spur/RecordView.svelte': 'the recording window: Escape and back must not stop a recording by accident (oncancel is prevented)',
  'src/pages/Live.svelte': 'the «Nearby» panel beside the live map is not modal (show(), not showModal()); the map stays usable',
};

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* files(p);
    else if (p.endsWith('.svelte')) yield p;
  }
}

/** The opening <dialog …> tags of a file; a `>` inside {…} (an arrow function) does not end the tag. */
export function dialogTags(text) {
  const out = [];
  for (let at = text.indexOf('<dialog'); at !== -1; at = text.indexOf('<dialog', at + 1)) {
    if (!/[\s>]/.test(text[at + 7] ?? '')) continue;
    let depth = 0;
    let i = at;
    for (; i < text.length; i++) {
      const c = text[i];
      if (c === '{') depth++;
      else if (c === '}') depth--;
      else if (c === '>' && depth === 0) break;
    }
    out.push(text.slice(at, i + 1));
  }
  return out;
}

describe('every window closes with the back key', () => {
  it('finds a > inside an arrow function', () => {
    expect(dialogTags('<dialog onclose={() => (open = false)} use:backClose>x</dialog>')).toEqual(['<dialog onclose={() => (open = false)} use:backClose>']);
  });

  it('has a backClose on every <dialog>, except the listed ones', () => {
    const missing = [];
    for (const f of files('src')) {
      const tags = dialogTags(readFileSync(f, 'utf8'));
      const bad = tags.filter((t) => !/use:backClose/.test(t));
      if (bad.length && !OTHER_WAY[f.replaceAll('\\', '/')]) missing.push(`${f}: ${bad.length} <dialog> without use:backClose`);
    }
    expect(missing, 'add `use:backClose` (src/lib/ui/backclose.js) to the window, or list it in OTHER_WAY with the reason').toEqual([]);
  });

  it('lists only windows that still lack it (the list never keeps a stale name)', () => {
    for (const f of Object.keys(OTHER_WAY)) {
      const tags = dialogTags(readFileSync(f, 'utf8'));
      expect(tags.some((t) => !/use:backClose/.test(t)), `${f} now has backClose: remove it from OTHER_WAY`).toBe(true);
    }
  });
});
