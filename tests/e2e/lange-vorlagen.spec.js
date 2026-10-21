// C9 «Lange Vorlagen» (Noah 21.10.2026 «1a»): a template with more than FOLD_FROM items shows its
// single items by category, every category folded; a tap opens it, «Open all» opens every one. A
// template with up to FOLD_FROM items stays one flat list. Fictional data (test_data_c9_), German.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

// The categories and the fold limit, read from their one home (gear.js and view.js import the app's
// i18n, which only runs in the app)
const src = (path) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');
const GEAR = src('../../src/lib/gear.js');
const CATEGORIES = [...GEAR.slice(GEAR.indexOf('STD_CATEGORIES'), GEAR.indexOf('export const CATEGORIES')).matchAll(/\{ key: '(\w+)', name: '([^']+)'/g)].map(([, key, name]) => ({ key, name }));
const FOLD_FROM = Number(src('../../src/lib/tpl/view.js').match(/export const FOLD_FROM = (\d+);/)[1]);

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const BASE = JSON.parse(readFileSync(fileURLToPath(new URL('./templates-fixture.json', import.meta.url)), 'utf8'));

// Five categories of the app (no bags), FOLD_FROM + 10 items spread over them.
const CATS = CATEGORIES.filter((c) => c.key !== 'bags').slice(0, 5);
const LONG_N = FOLD_FROM + 10;
const SHORT_N = 20;
const item = (n) => ({ id: `C9-${String(n).padStart(3, '0')}`, name: `test_data_c9_ Teil ${String(n).padStart(3, '0')}`, category: CATS[n % CATS.length].key, weightG: 100 + n, qty: 1, weightStatus: 'measured', carry: 'luggage', defaultBag: null, ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'] });
const ITEMS = Array.from({ length: LONG_N }, (_, n) => item(n));
const tpl = (id, name, list) => ({ id, name, blocks: [], extras: list.map((i) => ({ itemId: i.id, qty: 1 })), without: {}, setup: {}, ready: [], days: 1, overnight: 'none', domain: 'bikepacking', updatedAt: '2026-10-01T10:00:00.000Z' });

function fixture() {
  const data = structuredClone(BASE);
  data.tables.items.push(...ITEMS);
  const s = data.tables.settings.find((x) => x.key === 'templates');
  s.value.push(tpl('tpl-c9-long', 'test_data_c9_ Lange Vorlage', ITEMS), tpl('tpl-c9-short', 'test_data_c9_ Kurze Vorlage', ITEMS.slice(0, SHORT_N)));
  return Buffer.from(JSON.stringify(data));
}

async function start(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.setFixedTime(new Date('2026-10-09T10:00:00+02:00'));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel(T('Import backup')).setInputFiles({ name: 'c9.json', mimeType: 'application/json', buffer: fixture() });
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  await expect(data.getByText(/importiert/)).toBeVisible();
}

const templates = (page) =>
  page.evaluate(() => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction('settings').objectStore('settings').get('templates');
      q.onsuccess = () => { r.result.close(); ok(q.result.value); };
    };
  }));

test('long template: categories folded, a tap opens one, Open all and Close all, short one unchanged', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context);

  await page.goto('./#/pack/templates/tpl-c9-long');
  const card = page.locator('.ecard');
  const heads = card.locator('[data-fold^="x:"]');
  const rows = card.locator('li.extra');
  await expect(card.getByText(T('Tap a category to open it.'))).toBeVisible();
  await expect(heads).toHaveCount(CATS.length);
  for (let n = 0; n < CATS.length; n++) await expect(heads.nth(n)).toHaveAttribute('aria-expanded', 'false');
  await expect(rows).toHaveCount(0);
  // The head: name, item count and weight
  const first = card.locator(`[data-fold="x:${CATS[0].key}"]`);
  const perCat = ITEMS.filter((i) => i.category === CATS[0].key).length;
  await expect(first).toContainText(T(CATS[0].name));
  await expect(first).toContainText(`${perCat} Teile`);
  await expect(first).toContainText(/kg|g/);
  const box = await first.boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(44);

  // A tap opens one category, editing works inside it
  await first.click();
  await expect(first).toHaveAttribute('aria-expanded', 'true');
  await expect(rows).toHaveCount(perCat);
  const one = ITEMS.find((i) => i.category === CATS[0].key);
  await rows.first().getByRole('button', { name: new RegExp(one.name) }).click();
  await rows.first().getByRole('button', { name: T('More'), exact: true }).click();
  await expect.poll(async () => (await templates(page)).find((x) => x.id === 'tpl-c9-long').extras.find((e) => e.itemId === one.id).qty).toBe(2);
  await first.click();
  await expect(rows).toHaveCount(0);

  // Open all, then Close all
  const all = card.locator('[data-fold-all]');
  await expect(all).toHaveText(T('Open all'));
  await all.click();
  await expect(rows).toHaveCount(LONG_N);
  for (let n = 0; n < CATS.length; n++) await expect(heads.nth(n)).toHaveAttribute('aria-expanded', 'true');
  await expect(all).toHaveText(T('Close all'));
  await all.click();
  await expect(rows).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);

  // Up to FOLD_FROM items: one flat list as before
  await page.goto('./#/pack/templates/tpl-c9-short');
  await expect(page.locator('h1')).toContainText('test_data_c9_ Kurze Vorlage');
  await expect(card.locator('li.extra')).toHaveCount(SHORT_N);
  await expect(card.locator('[data-fold]')).toHaveCount(0);
  await expect(card.locator('[data-fold-all]')).toHaveCount(0);
  await expect(page.getByText(T('Tap a category to open it.'))).toHaveCount(0);
  expect(errors).toEqual([]);
});
