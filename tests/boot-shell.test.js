// «Sofort ein Bild» (Noah 23.11.2026): the quiet frame of index.html. Its colours come from app.css, its choice of colour world and
// light or dark follows initTheme, and start.js takes it away after the app is drawn.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { bootShell, colorCss, rootBlocks, resolve, PALETTES, TOKENS } from '../scripts/boot-shell.mjs';

const read = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const APP_CSS = read('src/app.css');
const HTML = read('index.html');
const THEME = read('src/lib/theme.svelte.js');

describe('boot frame: colours', () => {
  it('has one line per colour world, light and dark, with every colour', () => {
    const css = colorCss(APP_CSS);
    for (const p of PALETTES) {
      for (const dark of [false, true]) {
        const line = css.split('\n').find((l) => l.startsWith(`html[data-palette='${p}']${dark ? "[data-theme='dark']" : '{'}`));
        expect(line, `${p} ${dark}`).toBeTruthy();
        for (const t of TOKENS) expect(line).toMatch(new RegExp(`--b-${t}:#[0-9a-f]{6}`));
      }
    }
  });
  it('takes the colours from app.css, not from a second copy', () => {
    const blocks = rootBlocks(APP_CSS);
    expect(resolve(blocks, 'salbei', false).ground).toBe(/:root\[data-palette='salbei'\]\s*\{[^}]*--ground:\s*(#[0-9a-f]{6})/.exec(APP_CSS)[1]);
    expect(resolve(blocks, 'salbei', true).ground).toBe(/:root\[data-palette='salbei'\]\[data-theme='dark'\]\s*\{[^}]*--ground:\s*(#[0-9a-f]{6})/.exec(APP_CSS)[1]);
    expect(resolve(blocks, 'klassisch', false).ground).toBe('#eceee8'); // the base :root
  });
  it('knows exactly the colour worlds of the app', () => {
    const keys = [...THEME.match(/export const PALETTES = \[([\s\S]*?)\n\];/)[1].matchAll(/key: '([a-z-]+)'/g)].map((m) => m[1]);
    expect([...PALETTES].sort()).toEqual([...keys].sort());
    for (const k of keys) expect(HTML, k).toContain(`'${k}'`);
  });
  it('puts the style inline into index.html', () => {
    const out = bootShell().transformIndexHtml.handler(HTML);
    expect(out).toContain('<style id="boot-css">');
    expect(out).not.toContain('<!--boot-css-->');
    expect(out).toContain('#boot');
  });
});

describe('boot frame: index.html', () => {
  const script = /<script>\s*([\s\S]*?)<\/script>/.exec(HTML)[1];
  const run = ({ store = {}, dark = false, broken = false } = {}) => {
    const dataset = {};
    const ctx = {
      document: { documentElement: { dataset } },
      localStorage: broken ? { getItem() { throw new Error('private'); } } : { getItem: (k) => store[k] ?? null },
      matchMedia: () => ({ matches: dark }),
    };
    vm.runInNewContext(script, ctx);
    return dataset;
  };
  it('chooses the world and light or dark like initTheme', () => {
    expect(run()).toEqual({ palette: 'salbei', theme: 'light' });
    expect(run({ dark: true }).theme).toBe('dark');
    expect(run({ store: { 'theme.mode': 'light' }, dark: true }).theme).toBe('light');
    expect(run({ store: { 'theme.mode': 'dark' } }).theme).toBe('dark');
    expect(run({ store: { 'theme.palette': 'fels' } }).palette).toBe('fels');
    expect(run({ store: { 'theme.palette': 'gletscher' } }).palette).toBe('salbei'); // until the one-time move to Salbei is done
    expect(run({ store: { 'theme.palette': 'gletscher', 'theme.refresh97': '1' } }).palette).toBe('gletscher');
    expect(run({ store: { 'theme.palette': 'nonsense' } }).palette).toBe('salbei');
  });
  it('still works when the browser has no storage (private mode)', () => {
    expect(run({ broken: true }).palette).toBe('salbei');
  });
  it('is hidden from screen readers, has no real text but the logo and no landmark of its own', () => {
    const frame = /<div id="boot"[\s\S]*?<div id="app">/.exec(HTML)[0];
    expect(frame).toContain('aria-hidden="true"');
    expect(frame).not.toMatch(/<(main|nav|h1|button|a)\b/);
    expect(frame.indexOf('<div id="boot"')).toBeLessThan(frame.indexOf('<div id="app">'));
  });
  it('goes away after the app is drawn (start.js)', () => {
    const start = read('src/start.js');
    expect(start.indexOf("mount(App, { target: document.getElementById('app') });")).toBeGreaterThan(-1);
    expect(start.indexOf("document.getElementById('boot')?.remove();")).toBeGreaterThan(start.indexOf("mount(App, { target: document.getElementById('app') });"));
  });
});
