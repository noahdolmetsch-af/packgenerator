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
const bodySize = (page) => page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--fs-body')));

test.beforeEach(async ({ context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
});

test('Ich › Darstellung: font, colour world, size and light, kept after a reload', async ({ page }, info) => {
  await page.goto('./#/me');
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-palette', 'salbei');
  await expect(html).toHaveAttribute('data-font', 'inter');
  await expect(html).toHaveAttribute('data-size', 'normal');
  const row = page.getByRole('link', { name: new RegExp(T('Appearance')) });
  await expect(row).toContainText(`Inter · ${T('Sage|palette')} · ${T('Normal|size')}`);
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

  // the size changes the whole type scale
  const before = await bodySize(page);
  await page.getByRole('group', { name: T('Text size') }).getByRole('button', { name: T('Large|size') }).click();
  await expect(html).toHaveAttribute('data-size', 'large');
  expect(await bodySize(page)).toBeGreaterThan(before);

  // dark stays possible, also for the new worlds (Noah 1a)
  await page.getByRole('group', { name: T('Light or dark') }).getByRole('button', { name: T('Dark|theme') }).click();
  await expect(html).toHaveAttribute('data-theme', 'dark');

  // the preview only where there is room next to the choices
  await expect(page.locator('aside.pv')).toBeVisible({ visible: info.project.name === 'desktop' });
  await noSideways(page);

  await page.reload();
  await expect(html).toHaveAttribute('data-font', 'atkinson');
  await expect(html).toHaveAttribute('data-palette', 'fels');
  await expect(html).toHaveAttribute('data-size', 'large');
  await expect(html).toHaveAttribute('data-theme', 'dark');
  await noSideways(page);
  await page.goto('./#/me');
  await expect(page.getByRole('link', { name: new RegExp(T('Appearance')) })).toContainText(`Atkinson Hyperlegible · ${T('Rock|palette')} · ${T('Large|size')}`);
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
