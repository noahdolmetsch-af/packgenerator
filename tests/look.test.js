// v0.97.0 Design-Refresh R1 «Darstellung» (G1 neu, Noah 11.10 23:10; 12.10 «1a 2a»): font, colour
// world, text size and light or dark under Ich › Darstellung, only on this device.
import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { lang, t } from '../src/lib/i18n.svelte.js';
import { theme, PALETTES, FONTS, MODES, DEFAULT_PALETTE, DEFAULT_FONT, DEFAULT_SCALE, SCALE_MIN, SCALE_MAX, paletteOf, fontOf, scaleOf, refreshPalette, lookLine } from '../src/lib/theme.svelte.js';
import { unzoomUnits } from '../scripts/viewport-zoom.mjs';
import { pageOf, placeOf } from '../src/lib/nav.js';

afterEach(() => {
  lang.v = 'en';
  Object.assign(theme, { palette: DEFAULT_PALETTE, font: DEFAULT_FONT, scale: DEFAULT_SCALE, dense: false });
});

const css = readFileSync(new URL('../src/app.css', import.meta.url), 'utf8');
const main = readFileSync(new URL('../src/start.js', import.meta.url), 'utf8');

describe('the choices', () => {
  it('Salbei, Inter and 100 % by default; an unknown stored value gives the default', () => {
    expect([DEFAULT_PALETTE, DEFAULT_FONT, DEFAULT_SCALE]).toEqual(['salbei', 'inter', 100]);
    expect(paletteOf('lila')).toBe('salbei');
    expect(fontOf('comic')).toBe('inter');
    expect(fontOf('atkinson')).toBe('atkinson');
  });
  it('«Grösse» (Noah 1b): 80 to 130 % in steps of 5; the old three sizes become 90, 100 and 115 %', () => {
    expect([SCALE_MIN, SCALE_MAX]).toEqual([80, 130]);
    expect(scaleOf(null)).toBe(100);
    expect(scaleOf('abc')).toBe(100);
    expect(scaleOf('110')).toBe(110);
    expect(scaleOf(112)).toBe(110);
    expect(scaleOf(50)).toBe(80);
    expect(scaleOf(200)).toBe(130);
    expect([scaleOf('small'), scaleOf('normal'), scaleOf('large')]).toEqual([90, 100, 115]);
  });
  it('the whole app zooms with --ui-zoom; vh and vw are divided back when built; «Kompakt» has its own steps', () => {
    expect(css).toMatch(/html \{\s*zoom: var\(--ui-zoom, 1\);/);
    expect(css).toContain(':root[data-dense]');
    expect(unzoomUnits('max-height: 88vh')).toBe('max-height: calc(88vh / var(--ui-zoom, 1))');
    expect(unzoomUnits('min(520px, 100vw - 24px)')).toBe('min(520px, calc(100vw / var(--ui-zoom, 1)) - 24px)');
    expect(unzoomUnits('height: 100dvh')).toBe('height: calc(100dvh / var(--ui-zoom, 1))');
    expect(unzoomUnits('clamp(30px, 2.4vw + 20px, 40px)')).toBe('clamp(30px, calc(2.4vw / var(--ui-zoom, 1)) + 20px, 40px)');
    expect(unzoomUnits('url(#a1vh) 12px')).toBe('url(#a1vh) 12px');
  });
  it('the five calm worlds first, the three earlier ones stay (Noah 2a); eight fonts', () => {
    expect(PALETTES.map((p) => p.key)).toEqual(['salbei', 'fels', 'sand', 'gletscher-sanft', 'gletscher', 'sandstein', 'klassisch']);
    expect(FONTS).toHaveLength(8);
    expect(MODES.map((m) => m.key)).toEqual(['system', 'light', 'dark']);
    for (const p of PALETTES) expect(p.swatches, p.key).toHaveLength(4);
  });
  it('every world has a light and a dark version in app.css (Noah 1a), every font one rule and a face', () => {
    for (const p of PALETTES) {
      expect(css, p.key).toMatch(new RegExp(`data-palette='${p.key}'\\]\\[data-theme='dark'\\]`));
      expect(css, p.key).toMatch(new RegExp(`data-palette='${p.key}'\\]`));
    }
    for (const f of FONTS.filter((x) => x.key !== DEFAULT_FONT)) expect(css, f.key).toContain(`[data-font='${f.key}']`);
    for (const f of FONTS) expect(main, f.name).toContain(`@fontsource/${f.name.toLowerCase().replace(/ /g, '-')}/`);
  });
});

describe('the move to the new look', () => {
  it('a stored Glacier (the old default) becomes Salbei once; any other choice stays; later Glacier stays', () => {
    expect(refreshPalette('gletscher', false)).toBe('salbei');
    expect(refreshPalette(null, false)).toBe('salbei');
    expect(refreshPalette('sandstein', false)).toBe('sandstein');
    expect(refreshPalette('klassisch', false)).toBe('klassisch');
    expect(refreshPalette('gletscher', true)).toBe('gletscher');
  });
});

describe('Ich › Darstellung', () => {
  it('has its own address under «Ich»', () => {
    expect(pageOf('#/me/look')).toBe('look');
    expect(pageOf('#/me')).toBe('me');
    expect(placeOf('look')).toBe('me');
  });
  it('the row on Ich says font · world · size (· Compact), in German too', () => {
    expect(lookLine(t)).toBe('Inter · Sage · 100 %');
    Object.assign(theme, { palette: 'gletscher', font: 'fira', scale: 115, dense: true });
    lang.v = 'de';
    expect(lookLine(t)).toBe('Fira Sans · Gletscher · 115 % · Kompakt');
  });
});
