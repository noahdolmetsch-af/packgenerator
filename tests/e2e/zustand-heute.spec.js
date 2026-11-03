// «Ist alles in Ordnung?» auf Heute (Noah 02.11.2026): only when something is not right. Fictional data only.
// The browser's answers are made up with an init script. SHOTS=<folder> saves pictures.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';
import { put } from './aktiv-fixture.js';

const T = (en, v) => (DE[en] ?? en).replace(/\{(\w+)\}/g, (m, k) => v?.[k] ?? m);
async function shot(page, info, name, loc) {
  if (!process.env.SHOTS) return;
  await page.waitForTimeout(300);
  await (loc ?? page).screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png` });
}
const open = async (page, context, full) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript((full) => {
    localStorage.setItem('lang', 'de');
    Object.defineProperty(navigator, 'storage', {
      configurable: true,
      value: { estimate: async () => ({ usage: full ? 90 : 10, quota: 100 }), persisted: async () => !full, persist: async () => true },
    });
  }, full);
  await page.goto('./#/');
  await ready(page);
  await put(page, { items: [{ id: 'test_i1', name: 'test_data_gtp_ Cap', nameDe: 'test_data_gtp_ Kappe', ownership: 'owned' }] });
  await page.reload();
  await ready(page);
};

test('Today says nothing when all is well', async ({ page, context }) => {
  await open(page, context, false);
  await expect(page.locator('[data-row="z"]')).toHaveCount(0);
});

test('Today says it when space is low and the browser does not keep the data', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, context, true);
  const rows = page.locator('[data-row="z"]');
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toContainText(T('Space is running low').slice(0, 5));
  await shot(page, info, 'heute-zustand', rows.first().locator('xpath=ancestor::section[1]'));
  // the button asks the browser to keep the data: the line goes away
  await page.getByRole('button', { name: T('Keep my data') }).first().click();
  await expect(rows).toHaveCount(1);
  expect(errors).toEqual([]);
});
