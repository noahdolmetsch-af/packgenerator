// v0.97.0 Design-Refresh R1 «Darstellung» (G1 neu, Noah 11.10 23:10; 12.10 «1a 2a»): font, colour
// world, text size and light or dark under Ich › Darstellung, only on this device.
import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { lang, t } from '../src/lib/i18n.svelte.js';
import { theme, PALETTES, FONTS, SIZES, MODES, DEFAULT_PALETTE, DEFAULT_FONT, DEFAULT_SIZE, paletteOf, fontOf, sizeOf, refreshPalette, lookLine } from '../src/lib/theme.svelte.js';
import { pageOf, placeOf } from '../src/lib/nav.js';

afterEach(() => {
  lang.v = 'en';
  Object.assign(theme, { palette: DEFAULT_PALETTE, font: DEFAULT_FONT, size: DEFAULT_SIZE });
});

const css = readFileSync(new URL('../src/app.css', import.meta.url), 'utf8');
const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');

describe('the choices', () => {
  it('Salbei, Inter and normal by default; an unknown stored value gives the default', () => {
    expect([DEFAULT_PALETTE, DEFAULT_FONT, DEFAULT_SIZE]).toEqual(['salbei', 'inter', 'normal']);
    expect(paletteOf('lila')).toBe('salbei');
    expect(fontOf('comic')).toBe('inter');
    expect(sizeOf(null)).toBe('normal');
    expect(fontOf('atkinson')).toBe('atkinson');
    expect(sizeOf('large')).toBe('large');
  });
  it('the five calm worlds first, the three earlier ones stay (Noah 2a); eight fonts', () => {
    expect(PALETTES.map((p) => p.key)).toEqual(['salbei', 'fels', 'sand', 'gletscher-sanft', 'gletscher', 'sandstein', 'klassisch']);
    expect(FONTS).toHaveLength(8);
    expect(SIZES.map((z) => z.key)).toEqual(['small', 'normal', 'large']);
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
    for (const z of SIZES.filter((x) => x.key !== DEFAULT_SIZE)) expect(css, z.key).toContain(`[data-size='${z.key}']`);
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
  it('the row on Ich says font · world · size, in German too', () => {
    expect(lookLine(t)).toBe('Inter · Sage · Normal');
    Object.assign(theme, { palette: 'gletscher', font: 'fira', size: 'large' });
    lang.v = 'de';
    expect(lookLine(t)).toBe('Fira Sans · Gletscher · Gross');
  });
});
