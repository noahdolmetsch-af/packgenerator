// v0.30.0 (Noah 1a, 2a, 3a): Good to know is 6 tiles with tips "Did you know?"; "I know it" hides a
// tip for good; the overview «Was die App alles kann» lists all tips by area with ✓ and progress.
// Fictional fixture (pf-fixture.json); the internet is blocked.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
// tips.js (unit-tested) reads Svelte state through i18n: its numbers here
const TIPS = { length: 28 };
// v0.96.0: the groups of «What the app can do», read from the app source (features.js)
const FSRC = readFileSync(fileURLToPath(new URL('../../src/lib/features.js', import.meta.url)), 'utf8');
const FGROUPS = [...FSRC.slice(FSRC.indexOf('FEATURE_GROUPS = ['), FSRC.indexOf('];', FSRC.indexOf('FEATURE_GROUPS = ['))).matchAll(/label: '([^']+)'/g)].map((m) => m[1]);
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
  const panel = await openData(page);
  await panel.getByLabel(T('Import backup')).setInputFiles(file);
  await panel.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page); // the tidy-up after the import done, Today decided
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

  // v0.96.0 «F1 Alles finden» (mockup A): the overview on #/features: every function in 6 groups by
  // situation, never used first, ✓ for used, the count matches; each row has «Take me there».
  await page.goto('./#/features');
  await expect(page.getByRole('heading', { name: T('What the app can do'), level: 1 })).toBeVisible();
  await expect(page.locator('section[data-group] h2')).toHaveText(FGROUPS.map((l) => T(l)));
  // Design-Refresh P9 (I7): the head with the path back (VeloHead), its line under the title is .vsub
  const [total, n] = (await page.locator('.vhead .vsub').textContent()).match(/\d+/g).map(Number);
  expect(total).toBeGreaterThan(TIPS.length);
  // per group: the never used rows come before the used ones
  for (const g of await page.locator('section[data-group]').all()) {
    const used = await g.locator('[data-feature]').evaluateAll((els) => els.map((e) => e.classList.contains('used')));
    expect(used.indexOf(true) === -1 || !used.slice(used.indexOf(true)).includes(false)).toBe(true);
  }
  // «All n» opens a whole group; then every function is there
  const alls = page.locator('section[data-group] .fall');
  while (await alls.count()) await alls.first().click();
  await expect(page.locator('[data-feature]')).toHaveCount(total);
  await expect(page.locator('[data-feature].used')).toHaveCount(n);
  // the home place is set in the fixture: its tip counts as used
  await expect(page.locator('[data-feature="homeweather"]')).toContainText(T('Used|tips'));
  await noSideScroll(page);
  // «Take me there» starts the thing: the weigh tab of Gear, marked as used
  const weigh = page.locator('[data-feature="weigh"]');
  await weigh.getByRole('link', { name: T('Take me there') }).click();
  await expect(page).toHaveURL(/#\/gear\?tab=weigh$/);
  await expect.poll(async () => (await tipsState(page))?.tapped?.weigh ?? null).not.toBeNull();
  expect(errors).toEqual([]);
});
