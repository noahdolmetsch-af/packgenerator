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
const day = (n = 0) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })}T12:00:00Z`));
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

// v0.46.0 (Noah 16a, 34b): "Good to know" with its 6 tiles and "I know it" is gone from Today; the
// dark card "Tried it yet?" shows one function or tip not used yet, with ONE button and "Next ›".
test('Tried it yet? with one idea and Next; the overview with ticks and progress', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  if (info.project.name === 'phone') await page.setViewportSize({ width: 320, height: 720 });
  await start(page, context, info);
  await page.goto('./#/');
  const card = page.getByRole('region', { name: T('Tried it yet?') });
  await expect(card.locator('.pitch')).not.toBeEmpty();
  await expect(card.locator('.tryb')).toHaveCount(1);
  for (const el of await card.locator('button').all()) expect((await el.boundingBox()).height).toBeGreaterThanOrEqual(44);
  const first = await card.getAttribute('data-try');
  await card.getByRole('button', { name: T('Next idea') }).click();
  await expect(card).not.toHaveAttribute('data-try', first);
  await noSideScroll(page);

  // the overview on #/features: all tips by area, ✓ for used, the count matches
  await page.goto('./#/features');
  await expect(page.getByRole('heading', { name: T('What the app can do'), level: 1 })).toBeVisible();
  const n = Number((await page.locator('.page-sub').textContent()).match(/\d+/)[0]);
  // v0.40.0 (Noah 9a): "Not used yet" as rows, "Already used" folded by area (the areas as before).
  const heads = [...(n < TIPS.length ? [T('Not used yet')] : []), ...(n ? [T('Already used')] : [])];
  await expect(page.locator('main section.grp h2 > span:first-child')).toHaveText(heads);
  if (n) await expect(page.locator('details.area > summary .t').first()).toBeAttached();
  for (const label of await page.locator('details.area > summary .t').allTextContents()) expect(GROUPS.map((g) => T(g.label))).toContain(label);
  await expect(page.locator('[data-feature]')).toHaveCount(TIPS.length);
  await expect(page.locator('[data-feature].used')).toHaveCount(n);
  await expect(page.locator('.page-sub')).toHaveText(T('{n} of {total} used', { n, total: TIPS.length }));
  // the home place is set in the fixture: its tip counts as used
  await expect(page.locator('[data-feature="homeweather"]')).toContainText(T('Used|tips'));
  await noSideScroll(page);

  // v0.40.0 (Noah 9a): a tip is a row; beyond the first six unused ones it waits behind "+ n more",
  // a used one inside its folded area.
  const reveal = async (row) => {
    if (!(await row.isVisible()) && (await page.locator('.morerow').count())) await page.locator('.morerow').click();
    if (!(await row.isVisible())) await page.locator('details.area').filter({ has: row }).locator('> summary').click();
    await expect(row).toBeVisible();
  };
  // each row starts the thing (the whole row): the weigh tab of Gear, marked as used
  const weigh = page.locator('[data-feature="weigh"]');
  await reveal(weigh);
  await weigh.getByRole('link').click();
  await expect(page).toHaveURL(/#\/gear\?tab=weigh$/);
  await expect.poll(async () => (await tipsState(page))?.tapped?.weigh ?? null).not.toBeNull();
  expect(errors).toEqual([]);
});
