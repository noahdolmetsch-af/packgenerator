// Kleine Apps (Noah 14.10.2026 «eigene kleinere Apps, zum Beispiel Meditation, Packliste oder
// Velo-Pflege», «bitte freigegeben. bitte umsetzen»): …/apps/<key>/ opens the same app as a small app.
// On a phone and a computer, in German: each small app starts on its first tab, has its own manifest
// (own icon), shows only its tabs and «Ganze App» at the bottom (no five places, no sidebar), every tab
// opens its page, «Ganze App» leads to the big app with the five places. A note written in the big app
// is seen from the small app (one database). No sideways scroll, no page errors. Fictional data only.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { MINI_APPS } from '../../src/lib/miniapps.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');

async function prep(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

for (const app of MINI_APPS) {
  test(`small app ${app.key}: own start, own manifest, only its tabs`, async ({ page, context }) => {
    const errors = await prep(page, context);
    await page.goto(`./apps/${app.key}/`);
    await ready(page);
    await expect(page).toHaveURL(new RegExp(`/apps/${app.key}/${app.tabs[0].href.replace(/[?]/g, '\\?')}$`));
    const manifests = await page.locator('link[rel="manifest"]').evaluateAll((ls) => ls.map((l) => l.getAttribute('href')));
    expect(manifests).toEqual([expect.stringContaining(`apps/${app.key}/manifest.webmanifest`)]);
    const bar = page.locator(`nav.mini[data-mini="${app.key}"]`);
    await expect(bar).toBeVisible();
    await expect(page.locator('nav.bottom')).toHaveCount(0);
    await expect(page.locator('aside.side')).toHaveCount(0);
    await expect(bar.locator('a')).toHaveText([...app.tabs.map((tb) => T(tb.label)), T('Whole app')]);
    for (const tb of app.tabs) {
      await bar.locator(`a[data-tab="${tb.key}"]`).click();
      await expect(bar.locator(`a[data-tab="${tb.key}"]`)).toHaveAttribute('aria-current', 'page');
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    }
    await bar.locator('a[data-tab="whole"]').click();
    await expect(page).toHaveURL(/\/packgenerator\/#\/$/);
    await expect(page.locator('nav.mini')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test('one database: what the big app saved is there in a small app', async ({ page, context }) => {
  const errors = await prep(page, context);
  const idb = (op) =>
    page.evaluate(async (op) => {
      const open = indexedDB.open('pack-generator');
      const db = await new Promise((r) => (open.onsuccess = () => r(open.result)));
      const tx = db.transaction('settings', op === 'put' ? 'readwrite' : 'readonly');
      const req = op === 'put' ? tx.objectStore('settings').put({ key: 'e2e-miniapp', value: 'gleiche Daten' }) : tx.objectStore('settings').get('e2e-miniapp');
      const out = await new Promise((r) => (req.onsuccess = () => r(req.result)));
      db.close();
      return out?.value ?? out;
    }, op);
  await page.goto('./#/notes');
  await ready(page);
  await idb('put');
  await page.goto('./apps/meditation/');
  await ready(page);
  expect(await idb('get')).toBe('gleiche Daten');
  expect(errors).toEqual([]);
});

// Ich › Handbuch and Ich › Kleine Apps (mockup HB2, Noah 14.10.2026 «1b 2b», «hb freigeben»).
test('Ich › Handbuch: every function folded, with how to switch it on and an example', async ({ page, context }) => {
  const errors = await prep(page, context);
  await page.goto('./#/me');
  await ready(page);
  // «Alles finden 2» (Noah 22.10.2026 «3a», changed on purpose): Ich › «Hilfe und Funktionen» › Handbuch
  await page.locator('a.ich-row[href="#/features"]').click();
  await page.locator('main [data-block="help"] a[href="#/me/handbook"]').click();
  await expect(page.getByRole('heading', { level: 1, name: T('Handbook') })).toBeVisible();
  const { FEATURES } = await import('../../src/lib/features.js').catch(() => ({ FEATURES: null }));
  const rows = page.locator('[data-hb]');
  if (FEATURES) await expect(rows).toHaveCount(FEATURES.length);
  // Impeccable Runde 2: on a phone the sections are folded (with their count); the first one opens with a tap
  const firstGroup = page.locator('details.hb-grp').first();
  if (!(await firstGroup.evaluate((d) => d.open))) await firstGroup.locator(':scope > summary').click();
  const first = rows.first();
  await first.locator('summary').click();
  await expect(first.locator('.hb-body')).toBeVisible();
  await expect(first.locator('.hb-body')).toContainText(T('Switch on:'));
  await expect(first.locator('.hb-ex')).not.toBeEmpty();
  // the search: the hits stay, the rest steps aside
  await page.getByRole('searchbox', { name: T('Search the handbook') }).fill('Backup');
  await expect(rows.first()).toBeVisible();
  expect(await rows.count()).toBeLessThan(FEATURES ? FEATURES.length : 1000);
  await page.getByRole('searchbox', { name: T('Search the handbook') }).fill('zzqxv');
  await expect(rows).toHaveCount(0);
  await expect(page.locator('main .hb-none')).toContainText(T('Nothing found for "{q}".').replace('{q}', 'zzqxv'));
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});

test('Ich › Kleine Apps: each small app with icon, steps and «Öffnen» to its own address', async ({ page, context }) => {
  const errors = await prep(page, context);
  await page.goto('./#/me');
  await ready(page);
  await page.locator('a.ich-row[href="#/me/apps"]').click();
  for (const app of MINI_APPS) {
    const card = page.locator(`.ma-app[data-app="${app.key}"]`);
    await expect(card).toBeVisible();
    await expect(card.locator('img')).toHaveJSProperty('complete', true);
    expect(await card.locator('img').evaluate((i) => i.naturalWidth)).toBeGreaterThan(0);
    await expect(card.locator('a.btn')).toHaveAttribute('href', `/packgenerator/apps/${app.key}/`);
  }
  await page.locator('.ma-app[data-app="meditation"] a.btn').click();
  await expect(page.locator('nav.mini[data-mini="meditation"]')).toBeVisible();
  expect(errors).toEqual([]);
});
