// «Englische Namen auf Deutsch» (Noah 21.10.2026 «1a»), German UI: Ich › Daten shows the English item
// names with a German suggestion; «Übernehmen» sets the German name (the original stays), «Rückgängig»
// takes it back, «Nicht vorschlagen» is remembered after a reload, the link in Material › ••• leads here.
// Fictional data only; nothing leaves the preview server.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const P = 'test_nd_';
const item = (id, name) => ({ id: `${P}${id}`, name, category: 'bags', carry: 'luggage', weightG: 100, qty: 1, weightStatus: 'measured', ownership: 'owned', defaultBag: null, role: null, sets: [], kits: [], domains: ['bikepacking'] });

async function seed(page, rows) {
  await page.evaluate(
    (list) =>
      new Promise((ok, bad) => {
        const r = indexedDB.open('pack-generator');
        r.onerror = () => bad(r.error);
        r.onsuccess = () => {
          const tx = r.result.transaction('items', 'readwrite');
          for (const row of list) tx.objectStore('items').put(row);
          tx.oncomplete = () => (r.result.close(), ok());
          tx.onerror = () => bad(tx.error);
        };
      }),
    rows,
  );
}
const read = (page, store, key) =>
  page.evaluate(
    ([s, k]) =>
      new Promise((ok, bad) => {
        const r = indexedDB.open('pack-generator');
        r.onerror = () => bad(r.error);
        r.onsuccess = () => {
          const q = r.result.transaction(s).objectStore(s).get(k);
          q.onsuccess = () => (r.result.close(), ok(q.result ?? null));
          q.onerror = () => bad(q.error);
        };
      }),
    [store, key],
  );

test('English names: suggestion, take over, undo, «Do not suggest» remembered', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/me/data');
  await ready(page);
  const twelve = ['Hip bag', 'Frame bag', 'Spare tube', 'Bike lock', 'Rain jacket', 'Sleeping bag', 'Water bottle', 'Front light', 'Rear light', 'Tool bottle', 'Phone mount', 'Seat bag'];
  await seed(page, [item('food', 'Food pouch left'), item('de', 'Rahmentasche'), ...twelve.map((n, k) => item(`x${k}`, n))]);
  await page.reload();
  await ready(page);

  const sec = page.locator('[data-section="names"]');
  await expect(sec.getByRole('heading', { level: 2 })).toHaveText(T('English names'));
  await expect(sec).toContainText(T('Names from your import that are English. Take over the German suggestion or leave it.'));
  // 13 English names (the German one is not there): ten rows first, then «3 weitere zeigen»
  await expect(sec.locator('[data-name-row]')).toHaveCount(10);
  await expect(sec.locator(`[data-name-row="${P}de"]`)).toHaveCount(0);
  await sec.locator('[data-names-more]').click();
  await expect(sec.locator('[data-name-row]')).toHaveCount(13);

  // the suggestion, editable
  const food = sec.locator(`[data-name-row="${P}food"]`);
  await expect(food.locator('[data-name-en]')).toHaveText('Food pouch left');
  await expect(food.locator('[data-name-de]')).toHaveValue('Verpflegungstasche links');

  // take over (edited): the German name is set, the English one stays; Undo takes it back
  await food.locator('[data-name-de]').fill('Verpflegungstasche links klein');
  await food.locator('[data-name-take]').click();
  await expect(page.locator('.rtoast')).toContainText(T('German name «{name}» saved.', { name: 'Verpflegungstasche links klein' }));
  await expect(food).toHaveCount(0);
  expect(await read(page, 'items', `${P}food`)).toMatchObject({ name: 'Food pouch left', nameDe: 'Verpflegungstasche links klein' });
  await page.locator('.rtoast').getByRole('button', { name: T('Undo') }).click();
  await expect(sec.locator(`[data-name-row="${P}food"]`)).toHaveCount(1);
  expect((await read(page, 'items', `${P}food`)).nameDe).toBeUndefined();

  // «Do not suggest»: gone, and still gone after a reload
  await sec.locator(`[data-name-row="${P}x0"] [data-name-skip]`).click();
  await expect(sec.locator(`[data-name-row="${P}x0"]`)).toHaveCount(0);
  expect((await read(page, 'settings', 'namesde.skip')).value).toEqual([`${P}x0`]);
  await page.reload();
  await ready(page);
  await sec.locator('[data-names-more]').click();
  await expect(sec.locator('[data-name-row]')).toHaveCount(12);
  await expect(sec.locator(`[data-name-row="${P}x0"]`)).toHaveCount(0);

  // the German UI shows the German name
  await sec.locator(`[data-name-row="${P}x1"] [data-name-take]`).click();
  expect((await read(page, 'items', `${P}x1`)).nameDe).toBe('Rahmentasche');

  // «Alle übernehmen», then Undo brings them all back
  await sec.locator('[data-names-all]').click();
  await expect(page.locator('.rtoast')).toContainText(T('{n} German names saved.', { n: 11 }));
  await expect(sec.locator('[data-name-row]')).toHaveCount(0);
  expect((await read(page, 'items', `${P}x2`)).nameDe).toBe('Ersatzschlauch');
  await page.locator('.rtoast').getByRole('button', { name: T('Undo') }).click();
  // «weitere zeigen» was tapped before: all eleven rows are back
  await expect(sec.locator('[data-name-row]')).toHaveCount(11);

  // the link in Material › ••• leads to the section
  await page.goto('./#/gear');
  await page.locator('main').waitFor();
  await page.getByRole('button', { name: T('More for Gear') }).or(page.locator('summary[aria-label="' + T('More for Gear') + '"]')).first().click();
  await page.locator('[data-names-link]').click();
  await expect(page).toHaveURL(/#\/me\/data\?names$/);
  await expect(page.locator('[data-section="names"]')).toBeInViewport();
  expect(errors).toEqual([]);
});
