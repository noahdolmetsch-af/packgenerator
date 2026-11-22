// «Ein Abenteuer im Monat» (Träume und Neuland N12, Noah 07.11.2026 «ok N12»): with a home place Heute shows one quiet line
// «Abenteuer im Monat: …», a tap opens Touren › Träume; there «Not this month» closes it (also on Heute) and «Show again» brings
// it back; an own adventure is added, renamed and deleted (Undo brings it back); the line on Heute can be switched off.
import { test, expect } from './clock.js';
import { mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const P = 'test_data_gtp_';
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z ]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const SHOTS = process.env.SHOTS_DIR ?? null;
const shot = async (loc, info, name) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await loc.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? '390' : '1440'}.png` });
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

async function put(page, store, rows) {
  await page.evaluate(
    ([name, list]) =>
      new Promise((ok, bad) => {
        const r = indexedDB.open('pack-generator');
        r.onerror = () => bad(r.error);
        r.onsuccess = () => {
          const tx = r.result.transaction(name, 'readwrite');
          for (const row of list) tx.objectStore(name).put(row);
          tx.oncomplete = () => (r.result.close(), ok());
          tx.onerror = () => bad(tx.error);
        };
      }),
    [store, rows],
  );
}

test('One adventure a month: line on Today, card on Dreams, not this month, own adventure', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  await ready(page);
  // without a home place: no line (the built-in kinds start from home)
  await expect(page.locator('[data-month-adventure]')).toHaveCount(0);
  await put(page, 'settings', [{ key: 'homePlace', value: { name: `${P}Zuhause`, lat: 47.3769, lon: 8.5417 } }]);
  await page.reload();
  await ready(page);

  // 1. the line on Today names the adventure; a tap opens Dreams
  const line = page.locator('[data-month-adventure]');
  await expect(line).toContainText(T('Adventure of the month: {name}', { name: '' }).trim().split(':')[0], { timeout: 20000 });
  await noSideways(page);
  await shot(line, info, 'MA1-heute');
  await line.locator('a').click();
  await expect.poll(() => page.evaluate(() => location.hash)).toBe('#/trips/dreams');

  // 2. the card on Dreams names the same adventure; «Show me» works
  const card = page.locator('[data-month-adv]');
  await card.scrollIntoViewIfNeeded();
  const now = card.locator('[data-month-adv-now]');
  await expect(now).toBeVisible();
  await card.locator('[data-month-adv-show]').click();
  await shot(card, info, 'MA2-karte');

  // 3. «Not this month» closes it here and on Today; «Show again» brings it back
  await card.locator('[data-month-adv-skip]').click();
  await expect(card.locator('[data-month-adv-skipped]')).toBeVisible();
  await page.goto('./#/');
  await ready(page);
  await expect(page.locator('[data-month-adventure]')).toHaveCount(0);
  await page.goto('./#/trips/dreams');
  await ready(page);
  await page.locator('[data-month-adv] [data-month-adv-back]').click();
  await expect(page.locator('[data-month-adv] [data-month-adv-now]')).toBeVisible();

  // 4. an own adventure: add, rename, delete with Undo
  await card.locator('[data-month-adv-kinds]').click();
  await card.locator('[data-month-adv-new]').fill(`${P}Am See schlafen`);
  await card.locator('[data-month-adv-add]').click();
  const own = card.locator('[data-month-adv-item]').filter({ hasText: `${P}Am See schlafen` });
  await expect(own).toHaveCount(1);
  await own.locator('[data-month-adv-edit]').click();
  const dlg = page.getByRole('dialog', { name: T('Rename adventure') });
  await dlg.getByRole('textbox').fill(`${P}Am Fluss schlafen`);
  await dlg.getByRole('button', { name: T('Save') }).click();
  const own2 = card.locator('[data-month-adv-item]').filter({ hasText: `${P}Am Fluss schlafen` });
  await expect(own2).toHaveCount(1);
  await shot(card, info, 'MA3-arten');
  await own2.locator('[data-month-adv-del]').click();
  await expect(own2).toHaveCount(0);
  await page.getByRole('button', { name: T('Undo') }).first().click();
  await expect(own2).toHaveCount(1);

  // 5. the line on Today can be switched off
  await card.locator('[data-month-adv-today]').uncheck();
  await page.goto('./#/');
  await ready(page);
  await expect(page.locator('[data-month-adventure]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
