// v0.30.0 (Noah 1a, 2a, 3a): Good to know is 6 tiles with tips "Did you know?"; "I know it" hides a
// tip for good; the overview «Was die App alles kann» lists all tips by area with ✓ and progress.
// Fictional fixture (pf-fixture.json); the internet is blocked.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
// tips.js (unit-tested) reads Svelte state through i18n: its numbers here
const TIPS = { length: 28 };
const GROUPS = ['Plan|tips', 'Packing & on the way', 'Looking back', 'Gear|tips', 'Bikes|tips', 'Your data|tips'].map((label) => ({ label }));
const RAW = readFileSync(fileURLToPath(new URL('./pf-fixture.json', import.meta.url)), 'utf8');
const day = (n = 0) => new Date(Date.now() + n * 864e5).toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
// the fixture's relative dates ("@+10" = in ten days) filled in, as in pf.spec.js
const fixture = RAW.replace(/"@([+-]\d+)"/g, (m, n) => `"${day(Number(n))}"`);

async function start(page, context, info) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const file = info.outputPath('tips-fixture.json');
  writeFileSync(file, fixture);
  const panel = page.locator('details.data');
  await expect(async () => {
    if (!(await panel.evaluate((d) => d.open))) await panel.locator('summary').click();
    expect(await panel.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  await panel.getByLabel(T('Import backup')).setInputFiles(file);
  await panel.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await expect(panel.getByText(/importiert|Imported/)).toBeVisible();
}

const tipsState = (page) =>
  page.evaluate(() => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction('settings').objectStore('settings').get('tips');
      q.onsuccess = () => { r.result.close(); ok(q.result?.value ?? null); };
    };
  }));
const noSideScroll = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

test('6 tiles with tips, "I know it" for good, the overview with ticks and progress', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  if (info.project.name === 'phone') await page.setViewportSize({ width: 320, height: 720 });
  await start(page, context, info);
  await page.goto('./#/');
  const know = page.locator('main section.know');
  await expect(know.getByRole('heading', { name: T('Good to know') })).toBeVisible();
  const tiles = know.locator('[data-card], [data-tip]');
  if (info.project.name === 'phone') {
    // the phone shows the important cards and at least one tip; the rest behind "Show {n} more"
    await expect(know.locator('[data-tip]').first()).toBeVisible();
    const shown = await tiles.count();
    expect(shown).toBeLessThan(6);
    await know.locator('.morebtn').click();
    await expect(know.locator('.morebtn')).toHaveText(T('Show less'));
  }
  await expect(tiles).toHaveCount(6);
  const tips = know.locator('[data-tip]');
  expect(await tips.count()).toBeGreaterThanOrEqual(3);
  // each tip: an icon, one sentence, ONE button and "I know it"; buttons and links at least 44 px high
  for (const tip of await tips.all()) {
    await expect(tip.locator('.ico svg')).toHaveCount(1);
    await expect(tip.locator('.say')).not.toBeEmpty();
    await expect(tip.locator('.go')).toHaveCount(1);
    for (const el of await tip.locator('a, button').all()) expect((await el.boundingBox()).height).toBeGreaterThanOrEqual(44);
  }
  await noSideScroll(page);
  // the tips of today are remembered (the same all day)
  await expect.poll(async () => (await tipsState(page))?.day?.ids?.length ?? 0).toBeGreaterThanOrEqual(3);

  // "I know it": the tip goes, another one takes its place; still gone after a reload
  const first = await tips.first().getAttribute('data-tip');
  await tips.first().getByRole('button', { name: new RegExp(`^${T('I know it')}`) }).click();
  await expect(know.locator(`[data-tip="${first}"]`)).toHaveCount(0);
  await expect(tiles).toHaveCount(6);
  expect((await tipsState(page)).known[first]).toBeTruthy();
  await page.reload();
  await expect(know.locator('[data-card], [data-tip]').first()).toBeVisible();
  if (info.project.name === 'phone') await know.locator('.morebtn').click();
  await expect(know.locator('[data-card], [data-tip]')).toHaveCount(6);
  await expect(know.locator(`[data-tip="${first}"]`)).toHaveCount(0);

  // the row at the foot opens the overview: all tips by area, ✓ for used, the count matches
  const row = know.getByRole('link', { name: new RegExp(T('What the app can do')) });
  await expect(row).toContainText(new RegExp(T('{n} of {total} used', { n: '\\d+', total: TIPS.length })));
  const n = Number((await row.locator('.cnt').textContent()).match(/\d+/)[0]);
  await row.click();
  await expect(page).toHaveURL(/#\/features$/);
  await expect(page.getByRole('heading', { name: T('What the app can do'), level: 1 })).toBeVisible();
  await expect(page.locator('main section.grp h2')).toHaveText(GROUPS.map((g) => T(g.label)));
  await expect(page.locator('[data-feature]')).toHaveCount(TIPS.length);
  await expect(page.locator('[data-feature].used')).toHaveCount(n);
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(n));
  // the known tip is listed, with ✓ "You know it"
  await expect(page.locator(`[data-feature="${first}"]`)).toContainText(T('You know it'));
  // the home place is set in the fixture: its tip counts as used
  await expect(page.locator('[data-feature="homeweather"]')).toContainText(T('Used|tips'));
  await noSideScroll(page);

  // each row has its one button that starts the thing: the weigh tab of Gear, marked as used
  const weigh = page.locator('[data-feature="weigh"]');
  await weigh.getByRole('link', { name: T('Start weighing') }).click();
  await expect(page).toHaveURL(/#\/gear\?tab=weigh$/);
  await expect.poll(async () => (await tipsState(page))?.tapped?.weigh ?? null).not.toBeNull();
  expect(errors).toEqual([]);
});
