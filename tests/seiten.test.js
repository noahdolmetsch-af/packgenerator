// «Die Suche findet Seiten» (thread «Navigation ohne Sackgassen»): every place, tab and chip of the map of the app can be found by its name.
import { describe, it, expect } from 'vitest';
import { searchAll } from '../src/lib/search.js';
import { mapPages } from '../src/lib/nav/seiten.js';

const pageRows = (q) => searchAll(q, {}).find((g) => g.kind === 'page')?.rows ?? [];

describe('mapPages', () => {
  it('has a row for the chips of a tab, with their place and tab', () => {
    const rest = mapPages().find((m) => m.href === '#/flow/rest');
    expect(rest).toMatchObject({ label: 'Recovery|tab', place: 'Plan|place', tab: 'Training|tab' });
  });
  it('every address is there once', () => {
    const hrefs = mapPages().map((m) => m.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(hrefs.length).toBeGreaterThan(30);
  });
});

describe('the search finds the pages of the map', () => {
  it('«Recovery» opens Week › Training › Recovery', () => {
    expect(pageRows('recovery').map((r) => r.href)).toContain('#/flow/rest');
  });
  it('the row says where the page is', () => {
    const r = pageRows('recovery').find((x) => x.href === '#/flow/rest');
    expect(r.sub).toBe('Plan › Training');
  });
  it('a page that has a hand-written row is not listed twice', () => {
    const hrefs = pageRows('heatmap').map((r) => r.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
  it('every tab and chip can be found by its own name', () => {
    for (const m of mapPages()) {
      const word = m.label.replace(/\|[a-z]+$/, '');
      if (word.length < 2) continue;
      const found = searchAll(word, {}).flatMap((g) => g.rows).some((r) => r.href === m.href);
      // the list shows at most four pages per search: a name that many pages share may sit behind «more»
      const more = searchAll(word, {}).find((g) => g.kind === 'page')?.more ?? 0;
      expect(found || more > 0, `${m.label} (${m.href})`).toBe(true);
    }
  });
});
