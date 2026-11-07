// «Schnell öffnen» auf Heute (Noah 01.11.2026 «1a 2a 3b 4a 5a»): the tile with your Quick Links pins, changeable right there.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { readFileSync } from 'node:fs';

const src = (f) => readFileSync(new URL(`../../src/lib/${f}`, import.meta.url), 'utf8');
const STARTER = [...src('quick/quicklinks.js').matchAll(/\{ std: '([^']+)', pins: \[([^\]]+)\] \}/g)].flatMap((m) => [...m[2].matchAll(/'([^']+)'/g)].map((x) => x[1]));

test('Heute: the pins tile shows the suggestions, a tap goes there, the pencil adds, renames, orders, unpins and resets', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  const tile = page.locator('[data-pins-tile]');
  await tile.scrollIntoViewIfNeeded();
  // 4a: about 12 favourites; 3b: all pins show; 5a: the 8 small tiles are gone from the wall
  await expect(tile.locator('[data-pin]')).toHaveCount(STARTER.length);
  await expect(page.locator('.wall [data-tile^="fn:"]')).toHaveCount(0);

  // a tap goes to the function
  await tile.locator('[data-pin="f.heatmap"]').click();
  await expect(page).not.toHaveURL(/#\/$/);

  await page.goto('./#/');
  await tile.scrollIntoViewIfNeeded();
  // 2a: change right here
  await tile.locator('[data-pins-edit]').click();
  const first = tile.locator('[data-pin-row]').first();
  const firstId = await first.getAttribute('data-pin-row');
  // order with the arrow: the first goes down one place
  await first.locator('.sort-ar').nth(1).click();
  await expect(tile.locator('[data-pin-row]').nth(1)).toHaveAttribute('data-pin-row', firstId);

  // add a function from the search
  await tile.locator('[data-pins-add]').click();
  await tile.getByRole('searchbox').fill(T('Race'));
  const hit = tile.locator('.pt-hit').first();
  await expect(hit).toBeVisible();
  await hit.click();
  await expect(tile.locator('[data-pin-row]')).toHaveCount(STARTER.length + 1);

  // back to the suggestions
  await tile.locator('[data-pins-reset]').click();
  await expect(tile.locator('[data-pin-row]')).toHaveCount(STARTER.length);
  await tile.locator('[data-pins-edit]').click();
  await expect(tile.locator('[data-pin]')).toHaveCount(STARTER.length);
});

// Ideen-Doc 05.11.2026 «6a»: a page you open often is suggested right in the tile; «Pin» adds it with Undo, «No, thanks» holds it back.
test('Heute: the pins tile suggests a page you open often; Pin adds it, No thanks hides it', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  // this device opened the calendar on three days in the last two weeks (today is 09.10.2026 in this test)
  await page.evaluate(
    () =>
      new Promise((ok, fail) => {
        const r = indexedDB.open('pack-generator');
        r.onerror = fail;
        r.onsuccess = () => {
          const key = matchMedia('(pointer: coarse)').matches ? 'quickLinks.used.phone' : 'quickLinks.used.computer';
          const value = { start: '2026-10-01', recent: [{ href: '#/calendar', title: 'Kalender', at: '2026-10-09' }], days: { '#/calendar': ['2026-10-05', '2026-10-07', '2026-10-09'] }, used: {}, no: {}, keep: {} };
          const tx = r.result.transaction('settings', 'readwrite');
          tx.objectStore('settings').put({ key, value });
          tx.oncomplete = () => ok();
          tx.onerror = fail;
        };
      }),
  );
  await page.goto('./#/');
  const tile = page.locator('[data-pins-tile]');
  await tile.scrollIntoViewIfNeeded();
  const tip = tile.locator('[data-pins-suggest="#/calendar"]');
  await expect(tip).toBeVisible();
  await expect(tip).toContainText('Kalender');

  // Pin: the page becomes a shortcut and the suggestion is gone; Undo takes it back
  await tip.getByRole('button', { name: T('Pin|quick') }).click();
  await expect(tile.locator('[data-pin="#/calendar"]')).toBeVisible();
  await expect(tip).toHaveCount(0);
  await page.getByRole('button', { name: T('Undo') }).first().click();
  await expect(tile.locator('[data-pin="#/calendar"]')).toHaveCount(0);
  await expect(tip).toBeVisible();

  // No, thanks: the suggestion stays away (it also stays away after a reload)
  await tip.getByRole('button', { name: T('No, thanks') }).click();
  await expect(tip).toHaveCount(0);
  await page.reload();
  await tile.scrollIntoViewIfNeeded();
  await expect(tile.locator('[data-pins-suggest]')).toHaveCount(0);
});
