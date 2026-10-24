// «Alles finden 2» (Noah 22.10.2026 «1a»): every tab has an icon and one sentence for the «Alle n» window,
// and every sentence has its German text.
import { describe, it, expect } from 'vitest';
import { PLACE_TABS } from '../src/lib/nav.js';
import { TAB_INFO, tabInfo } from '../src/lib/nav/tabinfo.js';
import { readFileSync } from 'node:fs';
import DE from '../src/lib/i18n/de/index.js';

// the icon names PlaceTabs.svelte knows (its ICON map), read from the source
const SRC = readFileSync(new URL('../src/lib/nav/PlaceTabs.svelte', import.meta.url), 'utf8');
const ICONS = [...SRC.match(/const ICON = \{([^}]*)\}/)[1].matchAll(/(\w+):/g)].map((m) => m[1]);

describe('the tiles of «Alle n»', () => {
  it('has an icon and a sentence for every tab of every place', () => {
    for (const [place, tabs] of Object.entries(PLACE_TABS)) for (const x of tabs) expect(tabInfo(place, x.key), `${place}:${x.key}`).toBeTruthy();
  });
  it('knows every icon and has every sentence in German', () => {
    for (const [k, [icon, text]] of Object.entries(TAB_INFO)) {
      expect(ICONS, k).toContain(icon);
      expect(DE[text], k).toBeTruthy();
    }
  });
});

describe('ski tours move up in the season', () => {
  it('puts «Ski tours» among the first four tabs of Touren from December to April only', async () => {
    const { seasonTabs, PLACE_TABS, PHONE_TABS } = await import('../src/lib/nav.js');
    const tabs = PLACE_TABS.trips;
    for (const m of [11, 0, 1, 2, 3]) expect(seasonTabs('trips', tabs, m).slice(0, PHONE_TABS).map((x) => x.key)).toContain('ski');
    for (const m of [4, 6, 9, 10]) expect(seasonTabs('trips', tabs, m)).toBe(tabs);
    expect(seasonTabs('week', PLACE_TABS.week, 0)).toBe(PLACE_TABS.week);
    expect(seasonTabs('trips', tabs, 0)).toHaveLength(tabs.length);
  });
});
