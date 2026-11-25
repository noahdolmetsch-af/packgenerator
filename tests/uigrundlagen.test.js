// UI-Grundlagen (Noah 20.10.2026 «freigabe für alles was im dokument erarbeitet wurde»; catalogue
// notes/ui-ziele-2026-10-20/ideenkatalog.md, answers 1a–5a by default): the design rules B in the tokens,
// one action colour for every place, the type scale, and the care forecast in days.
import './setup/de.js'; // this test needs the German texts
import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { kmPerDay, daysAt } from '../src/lib/care/last.js';
import { lang } from '../src/lib/i18n.svelte.js';

const css = readFileSync(new URL('../src/app.css', import.meta.url), 'utf8');
const block = (sel) => css.slice(css.indexOf(`${sel} {`), css.indexOf('}', css.indexOf(`${sel} {`)));

afterEach(() => (lang.v = 'en'));

describe('Gestaltungsregeln B in the default palette Salbei', () => {
  const salbei = block(":root[data-palette='salbei']");
  it('cream ground, paper cards, warm lines and text, Salbei as the action colour', () => {
    for (const [k, v] of Object.entries({ ground: '#f6f2ea', paper: '#fffdf9', line: '#e8e0d3', ink: '#26231f', 'ink-2': '#4a443c', 'ink-3': '#6b6358', hi: '#4a7360' })) expect(salbei, k).toContain(`--${k}: ${v};`);
  });
  it('the warm second tone and three group colours exist for every palette (light and dark)', () => {
    for (const k of ['warm', 'warm-soft', 'g1', 'g2', 'g3']) expect(css.match(new RegExp(`--${k}: #`, 'g'))?.length, k).toBeGreaterThanOrEqual(2);
  });
  it('the place colour --pc is the action colour --hi (Heute, Ich and Quick Links keep the palette\'s own)', () => {
    expect(css).toMatch(/:root,\n:root\[data-place\] \{[^}]*--pc: var\(--hi\);[^}]*--tint: var\(--ground\);/);
  });
  it('«Farbe pro Bereich» (Noah 24.11.2026 «1b»): five areas, light and dark, each readable (WCAG 4.5:1) and switchable', () => {
    const lum = (h) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
    for (const area of ['week', 'trips', 'bikes', 'analysis', 'weather']) {
      for (const dark of [false, true]) {
        const sel = `:root:not([data-areacolor='off'])[data-palette]${dark ? "[data-theme='dark']" : ''}[data-place='${area}']`;
        const b = block(sel);
        const v = (k) => b.match(new RegExp(`--${k}: (#[0-9a-f]{6});`))?.[1];
        expect(v('hi'), `${area} ${dark ? 'dark' : 'light'} --hi`).toBeTruthy();
        // text and lines in the colour on paper / ground; the white (dark: near-black) button text on it
        expect(ratio(v('hi'), dark ? '#18201c' : '#fffdf9'), `${area} ${dark ? 'dark' : 'light'} on paper`).toBeGreaterThanOrEqual(4.5);
        expect(ratio(v('hi'), dark ? '#101613' : '#ffffff'), `${area} ${dark ? 'dark' : 'light'} button text`).toBeGreaterThanOrEqual(4.5);
        expect(ratio(v('hi'), v('hi-soft')), `${area} ${dark ? 'dark' : 'light'} on its soft ground`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
  it('buttons are pills, fields keep the soft corner', () => {
    expect(block('.btn')).toContain('border-radius: var(--r-btn);');
    expect(css).toContain('--r-btn: 999px;');
  });
  it('the type scale: section 21 px, a number step for key figures', () => {
    expect(css).toContain('--fs-section: 21px;');
    expect(css).toContain('--fs-num:');
  });
});

describe('care forecast in days (idea 19)', () => {
  const ride = (date, km, bikeId = 'b') => ({ bikeId, kind: 'ride', state: 'counted', date, km });
  it('km per day from the counted rides of the last 4 weeks; too little to go by gives null', () => {
    expect(kmPerDay([ride('2026-10-01', 56), ride('2026-10-10', 56), ride('2026-10-18', 56)], 'b', '2026-10-20')).toBe(6);
    expect(kmPerDay([ride('2026-10-01', 56), ride('2026-10-10', 56)], 'b', '2026-10-20')).toBeNull();
    expect(kmPerDay([ride('2026-09-01', 56), ride('2026-10-10', 56), ride('2026-10-18', 56)], 'b', '2026-10-20')).toBeNull();
    expect(kmPerDay([ride('2026-10-01', 56, 'x'), ride('2026-10-10', 56), ride('2026-10-18', 56)], 'b', '2026-10-20')).toBeNull();
  });
  it('«in about n days» only with a pace and within 120 days', () => {
    lang.v = 'de';
    expect(daysAt(59, 6)).toBe(' · in etwa 10 Tagen');
    expect(daysAt(3, 6)).toBe(' · in etwa 1 Tag');
    expect(daysAt(59, null)).toBe('');
    expect(daysAt(1000, 6)).toBe('');
  });
});
