// «Spruch zum Einstieg» PR 1 to 4 (Noah 07.11.2026 «Bau spruch pr1», «bau spruch pr2», «bau spruch pr3 und 4»): the tile «Spruch» on Heute: a sentence in Bernese German
// from the numbers of the fictional data, «Warum?» shows the number behind it, «Neuer Spruch» gives another one;
// without any number a quote of «Kissenzeit» comes; with every quote switched off the tile says why it is empty.
import { test, expect } from './clock.js';
import { openHome, homeFixture, day, tr } from './home0460-fixture.js';
import { put } from './aktiv-fixture.js';
import { settle } from './settle.js';
import { QUOTES, QUOTES_KEY } from '../../src/lib/flowquotes.js';

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

test('Spruch: ohne Zahlen kommt ein Zitat aus der Kissenzeit auf Hochdeutsch', async ({ page, context }, info) => {
  const d = homeFixture();
  d.tables.trips = [];
  d.tables.debriefs = [];
  d.tables.settings = d.tables.settings.filter((s) => s.key !== 'homePlace');
  await openHome(page, context, info, { data: d });
  const tile = page.locator('[data-section="spruch"]');
  const text = tile.locator('[data-spruch]');
  await expect(text).toBeVisible({ timeout: 15_000 }); // after the short wait for the data
  await expect(text).toHaveAttribute('lang', 'de');
  await expect(text).toHaveAttribute('data-spruch', /^z\./);
  await expect(tile.locator('[data-empty]')).toHaveCount(0);
  await tile.locator('[data-spruch-why-btn]').click();
  await expect(tile.locator('[data-spruch-why]')).toContainText('Kissenzeit');
});

test('Spruch: ohne Zahlen und ohne Zitate sagt die Kachel, warum sie leer ist', async ({ page, context }, info) => {
  const d = homeFixture();
  d.tables.trips = [];
  d.tables.debriefs = [];
  d.tables.settings = d.tables.settings.filter((s) => s.key !== 'homePlace');
  d.tables.settings.push({ key: QUOTES_KEY, value: { off: QUOTES.map((q) => q.id), add: [], own: [] } });
  await openHome(page, context, info, { data: d });
  const tile = page.locator('[data-section="spruch"]');
  await expect(tile.locator('[data-empty]')).toBeVisible({ timeout: 15_000 }); // after the short wait for the data
  await expect(tile.locator('[data-spruch]')).toHaveCount(0);
  await expect(tile.getByRole('link', { name: T('Plan a trip|saying') })).toBeVisible();
  await expect(tile.getByRole('link', { name: T('Set the weather place') })).toBeVisible();
});

test('Spruch: Nicht mehr solche schaltet den Satz ab, Rueckgaengig bringt ihn zurueck', async ({ page, context }, info) => {
  const d = homeFixture();
  await openHome(page, context, info, { data: d });
  await put(page, { healthDays: healthRows() });
  await page.reload();
  await settle(page);
  const tile = page.locator('[data-section="spruch"]');
  const text = tile.locator('[data-spruch]');
  await expect(text).toBeVisible();
  const first = await text.getAttribute('data-spruch');
  const base = first.split('~')[0];
  const said = await text.textContent();
  await tile.locator('[data-spruch-nomore]').click();
  await expect(text).not.toHaveAttribute('data-spruch', first);
  expect((await text.getAttribute('data-spruch')).split('~')[0]).not.toBe(base); // not even the other wording
  const row = await page.evaluate(async () => {
    const r = await new Promise((res) => {
      const rq = indexedDB.open('pack-generator');
      rq.onsuccess = () => {
        const tx = rq.result.transaction('settings').objectStore('settings').get('home.spruch');
        tx.onsuccess = () => res(tx.result?.value ?? null);
      };
    });
    return r;
  });
  expect(row.off).toContain(base);
  await page.locator('.rtoast').getByRole('button', { name: T('Undo') }).click();
  await expect(text).toHaveText(said); // the sentence is back on the tile
});

test('Spruch: Fenster Alle Sprueche, Ton waehlen, Quelle abschalten', async ({ page, context }, info) => {
  const d = homeFixture();
  await openHome(page, context, info, { data: d });
  await put(page, { healthDays: healthRows() });
  await page.reload();
  await settle(page);
  const tile = page.locator('[data-section="spruch"]');
  await expect(tile.locator('[data-spruch]')).toBeVisible();
  await tile.locator('[data-spruch-all]').click();
  const sheet = page.locator('dialog[data-spruch-sheet]');
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('h2')).toHaveText(T('All sayings'));
  // every source has its switch, every sentence its own
  await expect(sheet.locator('[data-spruch-source]')).toHaveCount(10); // nine sources and the own sayings
  await expect(sheet.locator('[data-spruch-template]')).toHaveCount(25);
  // the tone «Calm»: the sentence of the tile changes to a calm one when the window closes
  await sheet.locator('[data-spruch-tones] button', { hasText: T('Calm|saying') }).click();
  await sheet.locator('[data-spruch-done]').click();
  await expect(sheet).toHaveCount(0);
  await expect(tile.locator('[data-spruch-ton]')).toHaveAttribute('data-spruch-ton', 'ruhig');
  // a source switched off: no sentence of it comes any more, however often «New» is tapped
  await tile.locator('[data-spruch-all]').click();
  await sheet.locator('[data-spruch-tones] button', { hasText: T('Mix|saying') }).click();
  await sheet.locator('[data-spruch-src-switch="azm"]').uncheck();
  await expect(sheet.locator('[data-spruch-source="azm"] [data-spruch-template]').first()).toBeDisabled();
  await sheet.locator('[data-spruch-done]').click();
  for (let i = 0; i < 6; i++) {
    await tile.locator('[data-spruch-new]').click();
    await expect(tile.locator('[data-spruch]')).not.toHaveAttribute('data-spruch', /^a\./);
  }
});

test('Spruch: eigene Sprueche schreiben, aendern und loeschen mit Rueckgaengig', async ({ page, context }, info) => {
  const d = homeFixture();
  d.tables.trips = [];
  d.tables.debriefs = [];
  d.tables.settings = d.tables.settings.filter((s) => s.key !== 'homePlace');
  d.tables.settings.push({ key: QUOTES_KEY, value: { off: QUOTES.map((q) => q.id), add: [], own: [] } });
  await openHome(page, context, info, { data: d });
  const tile = page.locator('[data-section="spruch"]');
  await expect(tile.locator('[data-empty]')).toBeVisible({ timeout: 15_000 }); // nothing to say yet
  // write one in the window «All sayings»
  await tile.locator('[data-spruch-all]').click();
  const sheet = page.locator('dialog[data-spruch-sheet]');
  await expect(sheet.locator('[data-spruch-own-empty]')).toBeVisible();
  const add = sheet.locator('[data-spruch-own-add]');
  await expect(add.locator('[data-spruch-own-save]')).toBeDisabled(); // an empty text is not saved
  await add.locator('[data-spruch-own-text]').fill('Mein erster Spruch');
  await add.locator('button', { hasText: T('Funny|saying') }).click();
  await add.locator('[data-spruch-own-save]').click();
  await expect(sheet.locator('[data-spruch-own] li')).toHaveCount(1);
  await expect(sheet.locator('[data-spruch-own] li')).toContainText('Mein erster Spruch');
  await expect(add.locator('[data-spruch-own-text]')).toHaveValue('');
  // change it
  await sheet.locator('[data-spruch-own-edit]').click();
  const row = sheet.locator('[data-spruch-own] li');
  await row.locator('[data-spruch-own-text]').fill('Mein zweiter Spruch');
  await row.locator('[data-spruch-own-save]').click();
  await expect(row).toContainText('Mein zweiter Spruch');
  await sheet.locator('[data-spruch-done]').click();
  await expect(sheet).toHaveCount(0);
  // the tile shows it as written, with the tag «Own»
  const text = tile.locator('[data-spruch]');
  await expect(text).toHaveText('Mein zweiter Spruch');
  await expect(text).toHaveAttribute('data-spruch', /^o\./);
  await expect(tile.locator('[data-spruch-ton]')).toHaveAttribute('data-spruch-ton', 'lustig');
  await expect(tile.getByText(T('Own|saying'), { exact: true })).toBeVisible();
  // delete it: the question, then Undo brings it back
  await tile.locator('[data-spruch-all]').click();
  await sheet.locator('[data-spruch-own-delete]').click();
  await page.getByTestId('ask-delete').getByRole('button', { name: T('Delete'), exact: true }).click();
  await expect(sheet.locator('[data-spruch-own] li')).toHaveCount(0);
  await page.locator('.rtoast').getByRole('button', { name: T('Undo') }).last().click();
  await expect(sheet.locator('[data-spruch-own] li')).toHaveCount(1);
  await expect(sheet.locator('[data-spruch-own] li')).toContainText('Mein zweiter Spruch');
});
