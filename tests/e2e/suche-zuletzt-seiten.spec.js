// «Zuletzt geöffnet in der Suche» (Noah 05.11.2026 «7a»): the empty search lists the last pages this device opened,
// a tap opens one, «Liste vergessen» clears the list with Undo. Fictional data only (home0460 fixture).
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

/** The pages this device has counted so far (the record of Quick Links, read from the browser's own database). */
const counted = (page) =>
  page.evaluate(async () => {
    const name = (await indexedDB.databases()).map((d) => d.name).find((n) => n === 'pack-generator');
    return new Promise((ok) => {
      const req = indexedDB.open(name);
      req.onerror = () => ok([]);
      req.onsuccess = () => {
        const g = req.result.transaction('settings').objectStore('settings').getAll();
        g.onsuccess = () => ok(g.result.filter((x) => /^quickLinks\.used\./.test(x.key)).flatMap((x) => x.value.recent.map((r) => r.href)));
      };
    });
  });

/** Open a page and wait until the app has counted it (the title must stand still for a moment). */
async function visit(page, hash, title) {
  await page.goto(`./${hash}`);
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
  await expect.poll(() => counted(page), { timeout: 15000 }).toContain(hash);
}
const openSearch = (page) => page.evaluate(() => window.dispatchEvent(new CustomEvent('pg:search', { detail: '' })));

test('Search: opened lately, a tap opens the page, forget with Undo', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  await visit(page, '#/trips', T('Trips|place'));
  await visit(page, '#/bikes', T('Bikes|place'));
  await visit(page, '#/gear', T('Gear|place'));

  // the page you are on is not in the list; the others are, newest first
  await openSearch(page);
  const list = page.locator('[data-search-places]');
  await expect(list).toBeVisible();
  const rows = list.locator('li a');
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toHaveAttribute('href', '#/bikes');
  await expect(rows.nth(1)).toHaveAttribute('href', '#/trips');
  // the list stands before the commands to try
  const order = await page.evaluate(() => {
    const a = document.querySelector('[data-search-places]');
    const b = document.querySelector('[data-try]');
    return !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
  expect(order).toBe(true);

  // a tap opens the page and closes the search
  await rows.nth(1).click();
  await expect(page).toHaveURL(/#\/trips$/);
  await expect(list).toHaveCount(0);

  // forget: the list is gone, Undo brings it back
  await openSearch(page);
  await page.locator('[data-search-forget]').click();
  await expect(page.locator('[data-search-places]')).toHaveCount(0);
  await page.getByRole('button', { name: T('Undo') }).first().click();
  await openSearch(page); // the tap on «Undo» is outside the search: it closed
  await expect(page.locator('[data-search-places] li a').first()).toBeVisible();
});
