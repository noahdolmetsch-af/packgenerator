// «Spruch zum Einstieg» PR 1 (Noah 07.11.2026 «Bau spruch pr1»): the tile «Spruch» on Heute: a sentence in Bernese German
// from the numbers of the fictional data, «Warum?» shows the number behind it, «Neuer Spruch» gives another one;
// without any number the tile says why it is empty.
import { test, expect } from './clock.js';
import { openHome, homeFixture, day, tr } from './home0460-fixture.js';
import { put } from './aktiv-fixture.js';
import { settle } from './settle.js';

const T = tr('de');
const healthRows = () => Array.from({ length: 15 }, (_, i) => ({ date: day(i - 14), sleep: { asleepMin: 450 }, restingHr: 55, azm: 20, src: 'google' }));

test('Spruch: ein Satz auf Berndeutsch, der Wert dahinter und ein neuer Satz', async ({ page, context }, info) => {
  const d = homeFixture();
  await openHome(page, context, info, { data: d });
  await put(page, { healthDays: healthRows() }); // the watch days, written straight into the database
  await page.reload(); // a fresh start of the app: the sentence is chosen again with them
  await settle(page);
  const tile = page.locator('[data-section="spruch"]');
  await expect(tile).toBeVisible();
  await expect(tile.locator('h2')).toHaveText(T('Saying|tile'));
  const text = tile.locator('[data-spruch]');
  await expect(text).toBeVisible();
  await expect(text).toHaveAttribute('lang', 'gsw');
  expect((await text.textContent()).length).toBeGreaterThan(20);
  // «Warum?» opens the number behind the sentence (German, through t())
  await expect(tile.locator('[data-spruch-why]')).toHaveCount(0);
  await tile.locator('[data-spruch-why-btn]').click();
  await expect(tile.locator('[data-spruch-why]')).toBeVisible();
  // «Neuer Spruch»: another sentence than the one shown
  const first = await text.getAttribute('data-spruch');
  await tile.locator('[data-spruch-new]').click();
  await expect(text).not.toHaveAttribute('data-spruch', first);
  await expect(tile.locator('[data-spruch-why]')).toHaveCount(0); // closed again with the new sentence
  // the tile sits right under «Up now» (the area «Jetzt»), before the bikes
  const order = await page.evaluate(() => [...document.querySelectorAll('[data-section]')].map((e) => e.getAttribute('data-section')));
  expect(order.indexOf('spruch')).toBeGreaterThan(-1);
  expect(order.indexOf('spruch')).toBeLessThan(order.indexOf('bikes'));
});

test('Spruch: ohne Zahlen sagt die Kachel, warum sie leer ist', async ({ page, context }, info) => {
  const d = homeFixture();
  d.tables.trips = [];
  d.tables.debriefs = [];
  d.tables.settings = d.tables.settings.filter((s) => s.key !== 'homePlace');
  await openHome(page, context, info, { data: d });
  const tile = page.locator('[data-section="spruch"]');
  await expect(tile.locator('[data-empty]')).toBeVisible({ timeout: 15_000 }); // after the short wait for the data
  await expect(tile.locator('[data-spruch]')).toHaveCount(0);
  await expect(tile.getByRole('link', { name: T('Plan a trip|saying') })).toBeVisible();
  await expect(tile.getByRole('link', { name: T('Set the weather place') })).toBeVisible();
});
