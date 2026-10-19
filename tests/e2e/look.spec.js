// v0.97.0 Design-Refresh R1 «Darstellung» (G1 neu, Noah 11.10 23:10 «Runde 1 alles ★ und G1–G12
// freigegeben»; 12.10 «1a 2a»): Ich › Darstellung chooses the font, the colour world, the text size and
// light or dark; every choice stays after a reload; the old default Gletscher becomes Salbei once.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { readFileSync } from 'node:fs';

// the fonts from the app source (theme.svelte.js uses runes, so it is read, not imported)
const FONTS = [...readFileSync(new URL('../../src/lib/theme.svelte.js', import.meta.url), 'utf8').matchAll(/family: "'([^']+)'"/g)].map((m) => m[1]);

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
const zoomOf = (page) => page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).zoom));

test.beforeEach(async ({ context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
});

test('Ich › Darstellung: font, colour world, size and light, kept after a reload', async ({ page }, info) => {
  await page.goto('./#/me');
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-palette', 'salbei');
  await expect(html).toHaveAttribute('data-font', 'inter');
  expect(await zoomOf(page)).toBe(1);
  const row = page.getByRole('link', { name: new RegExp(T('Appearance')) });
  await expect(row).toContainText(`Inter · ${T('Sage|palette')} · 100 %`);
  await row.click();
  await expect(page).toHaveURL(/#\/me\/look$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(T('Appearance'));

  // four fonts first, the chosen one marked; «All 8 fonts» shows the rest
  const fonts = page.getByRole('group', { name: T('Font'), exact: true });
  await expect(fonts.getByRole('button')).toHaveCount(4);
  await expect(fonts.getByRole('button', { name: /^Inter/ })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: T('All {n} fonts', { n: FONTS.length }) }).click();
  await expect(fonts.getByRole('button')).toHaveCount(FONTS.length);
  await fonts.getByRole('button', { name: /^Atkinson Hyperlegible/ }).click();
  await expect(html).toHaveAttribute('data-font', 'atkinson');
  expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toContain('Atkinson Hyperlegible');

  // the colour worlds: the five calm ones and the earlier three (Noah 2a)
  const worlds = page.getByRole('group', { name: T('Colour world') });
  await expect(worlds.getByRole('button')).toHaveCount(7);
  await worlds.getByRole('button', { name: T('Rock|palette') }).click();
  await expect(html).toHaveAttribute('data-palette', 'fels');

  // «Grösse» (Noah 1b 2b): one slider zooms the whole app; − and + go in steps of 5; «Kompakt» takes away space
  const slider = page.getByRole('slider', { name: T('Size|scale') });
  await expect(slider).toHaveValue('100');
  await slider.fill('120');
  await expect(page.locator('[data-scale-shown]')).toHaveText('120 %');
  expect(await zoomOf(page)).toBeCloseTo(1.2);
  await page.getByRole('button', { name: T('Smaller') }).click();
  await expect(slider).toHaveValue('115');
  expect(await zoomOf(page)).toBeCloseTo(1.15);
  // vh and vw are divided back (scripts/viewport-zoom.mjs), so a sheet stays inside the screen while zoomed
  expect(await page.evaluate(() => [...document.styleSheets].some((sh) => { try { return [...sh.cssRules].some((r) => r.cssText.includes('vh / var(--ui-zoom')); } catch { return false; } }))).toBe(true);
  const gap = () => page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sp-4')));
  expect(await gap()).toBe(16);
  await page.getByRole('switch', { name: new RegExp(T('Compact|size')) }).check();
  await expect(html).toHaveAttribute('data-dense', '1');
  expect(await gap()).toBeLessThan(16);

  // dark stays possible, also for the new worlds (Noah 1a)
  await page.getByRole('group', { name: T('Light or dark') }).getByRole('button', { name: T('Dark|theme') }).click();
  await expect(html).toHaveAttribute('data-theme', 'dark');

  // the preview only where there is room next to the choices
  await expect(page.locator('aside.pv')).toBeVisible({ visible: info.project.name === 'desktop' });
  await noSideways(page);

  await page.reload();
  await expect(html).toHaveAttribute('data-font', 'atkinson');
  await expect(html).toHaveAttribute('data-palette', 'fels');
  expect(await zoomOf(page)).toBeCloseTo(1.15);
  await expect(html).toHaveAttribute('data-dense', '1');
  await expect(html).toHaveAttribute('data-theme', 'dark');
  await noSideways(page);
  await page.goto('./#/me');
  await expect(page.getByRole('link', { name: new RegExp(T('Appearance')) })).toContainText(`Atkinson Hyperlegible · ${T('Rock|palette')} · 115 % · ${T('Compact|size')}`);
  await noSideways(page);
  // «Zurück auf 100 %» brings the normal size back
  await page.goto('./#/me/look');
  await page.getByRole('button', { name: T('Back to {n} %', { n: 100 }) }).click();
  expect(await zoomOf(page)).toBe(1);
});

test('the old default Gletscher becomes Salbei once; chosen again, it stays', async ({ page }) => {
  await page.goto('./#/me/look');
  await page.evaluate(() => {
    localStorage.setItem('theme.palette', 'gletscher');
    localStorage.removeItem('theme.refresh97');
  });
  await page.reload();
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-palette', 'salbei');
  await page.getByRole('group', { name: T('Colour world') }).getByRole('button', { name: T('Glacier|palette'), exact: true }).click();
  await expect(html).toHaveAttribute('data-palette', 'gletscher');
  await page.reload();
  await expect(html).toHaveAttribute('data-palette', 'gletscher');
});
