// Kleine Apps (Noah 14.10.2026): the small apps, their addresses and tabs (src/lib/miniapps.js).
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { MINI_APPS, miniAppOf, wholeAppPath, miniStart, miniTabOf, miniAppPath } from '../src/lib/miniapps.js';
import de from '../src/lib/i18n/de/index.js';

describe('small apps', () => {
  it('finds the small app of an address, on GitHub Pages and on a preview', () => {
    expect(miniAppOf('/packgenerator/apps/meditation/')?.key).toBe('meditation');
    expect(miniAppOf('/apps/velopflege/index.html')?.key).toBe('velopflege');
    expect(miniAppOf('/packgenerator/')).toBeNull();
    expect(miniAppOf('/packgenerator/apps/unknown/')).toBeNull();
  });
  it('leads back to the whole app and to each small app', () => {
    expect(wholeAppPath('/packgenerator/apps/packliste/')).toBe('/packgenerator/');
    expect(wholeAppPath('/apps/packliste/')).toBe('/');
    expect(miniAppPath('meditation', '/packgenerator/')).toBe('/packgenerator/apps/meditation/');
    expect(miniAppPath('meditation', '/packgenerator/index.html')).toBe('/packgenerator/apps/meditation/');
  });
  it('starts on its first tab and keeps an address it was opened with', () => {
    for (const a of MINI_APPS) {
      expect(miniStart(a, '')).toBe(a.tabs[0].href);
      expect(miniStart(a, '#/')).toBe(a.tabs[0].href);
      expect(miniStart(a, '#/notes')).toBe('#/notes');
    }
  });
  it('every tab matches its own address and only that one', () => {
    for (const a of MINI_APPS) for (const tb of a.tabs) expect(miniTabOf(a, tb.href)).toBe(tb.key);
    const care = MINI_APPS.find((a) => a.key === 'velopflege');
    expect(miniTabOf(care, '#/bikes?tab=care&view=strava')).toBe('care');
    expect(miniTabOf(care, '#/notes')).toBeNull();
  });
  it('every small app has its page, manifest and icons, and German words', () => {
    for (const a of MINI_APPS) {
      const html = readFileSync(`apps/${a.key}/index.html`, 'utf8');
      expect(html).toContain(`/apps/${a.key}/manifest.webmanifest`);
      const m = JSON.parse(readFileSync(`public/apps/${a.key}/manifest.webmanifest`, 'utf8'));
      expect(m.start_url).toBe('./');
      expect(m.scope).toBe('./');
      for (const ic of m.icons) expect(existsSync(`public/apps/${a.key}/${ic.src}`)).toBe(true);
      const vite = readFileSync('vite.config.js', 'utf8');
      expect(vite).toContain(`apps/${a.key}/index.html`);
      for (const k of [a.name, ...a.tabs.map((tb) => tb.label), 'Whole app']) expect(de[k], k).toBeTruthy();
    }
  });
});
