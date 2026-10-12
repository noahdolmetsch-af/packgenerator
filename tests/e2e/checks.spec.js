// v0.111.0 «Bausteine bearbeiten» (mockups V1–V6, Noah «v1-v4 ok» and «v5-6 ok», 12.10.2026): the
// evening-before check as a row of «Bis zum Start» on «Gepackt» with its sheet (V1, V2), the editor
// (V3: remove, add, a suggestion from an earlier debrief, only this trip or all of the type), Ich ›
// Checks pro Reiseart (V4), and the after-trip check on «Tour beendet» (V5, V6). Today's evening row
// opens the sheet. Fictional data only (test_data_gtp_ records); the rows are read from the page
// (checks.js imports the app's i18n, which only runs in the app; its lists are unit-tested).
import { test, expect } from '@playwright/test';
import { base, tr, mockWeather } from './home0460-fixture.js';
import { importAndSettle, settle } from './settle.js';

const T = tr('de');
const D0 = '2026-10-14';
// calendar days from D0 (no clock arithmetic in milliseconds)
const day = (n) => {
  const [y, m, d] = D0.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n, 12)).toISOString().slice(0, 10);
};
const ID = (s) => `test_data_gtp_${s}`;
const entries = (n, packed = 0) => base.tables.items.slice(3, 3 + n).map((i, k) => ({ itemId: i.id, slot: 'seat', qty: 1, packed: k < packed }));
const trip = (id, start, extra = {}) => ({
  id: ID(id), title: `test_data_gtp_ ${id}`, domain: 'bikepacking', startDate: start, days: 3, bikeId: 'bike-test', bike: 'test_data_gtp_ Scale',
  setup: { seat: 'bag-TA01', frame: 'bag-TA02', top: 'bag-TA03' }, entries: entries(6, 6), ready: [], status: 'planned', createdAt: `${day(-10)}T08:00:00.000Z`, ...extra,
});
function data(trips, debriefs = []) {
  const d = structuredClone(base);
  d.tables.trips = trips;
  d.tables.debriefs = debriefs;
  d.tables.notes = [];
  d.tables.settings = [{ key: 'homePlace', value: { name: 'test_data_gtp_ Heimort', lat: 47.39, lon: 8.04 } }];
  return d;
}
async function open(page, context, trips, { hour = 9, debriefs = [] } = {}) {
  await context.route(/^https?:\/\/(?!localhost[:/])(?!.*open-meteo)/, (route) => route.abort());
  await mockWeather(context);
  await page.clock.setFixedTime(new Date(`${D0}T${String(hour).padStart(2, '0')}:00:00+02:00`));
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/');
  await importAndSettle(page, { name: 'checks.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data(trips, debriefs))) });
  await page.goto('./#/');
  await settle(page);
}
const stored = (page, store, key) =>
  page.evaluate(([s, k]) => new Promise((done, fail) => {
    const req = indexedDB.open('pack-generator');
    req.onerror = fail;
    req.onsuccess = () => {
      const get = req.result.transaction(s).objectStore(s).get(k);
      get.onsuccess = () => { req.result.close(); done(get.result); };
    };
  }), [store, key]);
const go = async (page, hash) => {
  await page.goto(`./${hash}`);
  await page.reload();
  await settle(page);
};
const labels = (sheet) => sheet.locator('.rows li .nm').allInnerTexts();

test('«Gepackt»: the evening-before check is a row that opens its sheet; ticks are saved on the trip', async ({ page, context }) => {
  await open(page, context, [trip('Alpen', day(1))]);
  await go(page, `#/trip/${ID('Alpen')}/packed`);
  const row = page.locator('main [data-row="check"]');
  await expect(row).toContainText(T('Evening-before check {area}', { area: T('Bikepacking') }));
  await row.click();
  const sheet = page.getByRole('dialog', { name: T('Evening-before check') });
  await expect(sheet).toBeVisible();
  const EVE = await labels(sheet);
  expect(EVE.length).toBeGreaterThan(2);
  await expect(row).toContainText(T('{done} of {n} done', { done: 0, n: EVE.length }));
  await expect(row).toContainText(T('next: {name}', { name: EVE[0] }));
  // weather has its outside page; the note says the app only opens it
  await expect(sheet.getByRole('link', { name: T('MeteoSwiss') })).toHaveAttribute('href', /meteoschweiz/);
  await expect(sheet).toContainText(T('The app does not read these pages, it only opens them.'));
  await sheet.getByRole('checkbox', { name: EVE[0] }).check();
  await expect.poll(async () => (await stored(page, 'trips', ID('Alpen'))).eve?.[0]?.done).toBe(true);
  await expect(sheet.locator('[data-count]')).toHaveText(T('{done} of {n} done', { done: 1, n: EVE.length }));
  await sheet.getByRole('button', { name: T('Later') }).click();
  await expect(sheet).toBeHidden();
  await expect(row).toContainText(T('next: {name}', { name: EVE[1] }));
});

test('«Liste anpassen»: remove, add an own row and a suggestion, for this trip only or for all of the type', async ({ page, context }) => {
  const earlier = trip('Jura', day(-30), { status: 'done', finished: day(-28) });
  const debriefs = [{ tripId: ID('Jura'), status: 'done', doneAt: `${day(-27)}T18:00:00.000Z`, items: {}, missing: [{ id: 'm1', name: 'test_data_gtp_ Ersatzschlauch' }] }];
  await open(page, context, [trip('Alpen', day(1)), earlier], { debriefs });
  await go(page, `#/trip/${ID('Alpen')}/packed`);
  await page.locator('main [data-row="check"]').click();
  const sheet = page.getByRole('dialog', { name: T('Evening-before check') });
  const EVE = await labels(sheet);
  // V2: what was missing on the earlier bikepacking trip, one tap adds it as a row
  await expect(sheet).toContainText(T('«{name}» was missing · add it as a row?', { name: 'test_data_gtp_ Ersatzschlauch' }));
  await sheet.getByRole('button', { name: T('Add|row') }).click();
  await expect(sheet.locator('.rows li').last()).toContainText(T('Pack {name}', { name: 'test_data_gtp_ Ersatzschlauch' }));

  await sheet.getByRole('button', { name: T('Adjust the list') }).click();
  const edit = page.getByRole('dialog', { name: T('Adjust the evening-before check') });
  await expect(edit).toBeVisible();
  await edit.getByRole('button', { name: T('Remove {name} from this list', { name: EVE[1] }) }).click();
  await expect(edit.getByText(T('Suggestion of the app for {area}', { area: T('Bikepacking') }))).toBeVisible();
  await edit.getByRole('textbox', { name: T('Add an own row') }).fill('test_data_gtp_ Brot kaufen');
  await edit.locator('form').getByRole('button', { name: T('Add|row') }).click();
  // sort with the keyboard: the own row one place up
  await edit.getByRole('button', { name: T('Move {name}: arrow keys up and down', { name: 'test_data_gtp_ Brot kaufen' }) }).press('ArrowUp');
  await edit.getByRole('button', { name: T('Only this trip') }).click();
  await edit.getByRole('button', { name: T('Save') }).click();
  await expect(edit).toBeHidden();
  await expect(sheet).toBeVisible();
  const eve = (await stored(page, 'trips', ID('Alpen'))).eve;
  expect(eve.map((r) => T(r.label))).not.toContain(EVE[1]);
  expect(eve.at(-2).label).toBe('test_data_gtp_ Brot kaufen');
  expect(eve[0].done).toBe(false);
  expect(await stored(page, 'settings', 'eveStandard')).toBeUndefined();

  // the second time «Alle Bikepacking-Touren» (the default) saves it as the type's standard too
  await sheet.getByRole('button', { name: T('Adjust the list') }).click();
  await expect(edit.getByRole('button', { name: T('All bikepacking trips') })).toHaveAttribute('aria-pressed', 'true');
  await edit.getByRole('button', { name: T('Save') }).click();
  await expect.poll(async () => (await stored(page, 'settings', 'eveStandard'))?.value?.map((r) => r.label)).toEqual(eve.map((r) => r.label));
});

test('«Tour beendet»: «Bevor du auspackst» with the after-trip check; «Fertig, zum Rückblick» goes on', async ({ page, context }) => {
  await open(page, context, [trip('Jura', day(-3), { status: 'planned', finished: day(-1) })]);
  await go(page, `#/trip/${ID('Jura')}/ended`);
  await expect(page.locator('main')).toContainText(T('Before you unpack'));
  await expect(page.locator('main')).toContainText(T('First the after-trip check, then the debrief, about 3 minutes.'));
  const row = page.locator('main [data-row="check"]');
  await expect(row).toContainText(T('After-trip check {area}', { area: T('Bikepacking') }));
  await row.click();
  const sheet = page.getByRole('dialog', { name: T('After-trip check') });
  const AFTER = await labels(sheet);
  expect(AFTER.length).toBeGreaterThan(2);
  await expect(sheet).toContainText(T('Debrief waiting'));
  await sheet.getByRole('checkbox', { name: AFTER[0] }).check();
  await expect.poll(async () => (await stored(page, 'trips', ID('Jura'))).after?.filter((r) => r.done).length).toBe(1);
  await sheet.getByRole('button', { name: T('Done, to the debrief') }).click();
  await expect(page).toHaveURL(new RegExp(`#/debrief/${ID('Jura')}$`));
  await expect(page.getByRole('dialog', { name: T('After-trip check') })).toHaveCount(0);
});

test('Today at 19:00 the evening before: the reminder opens the check on «Gepackt»', async ({ page, context }) => {
  await open(page, context, [trip('Herbst', day(1))], { hour: 19 });
  const row = page.locator('[data-row="eve"]');
  await expect(row).toContainText(T('Your evening-before check is waiting.'));
  await row.click();
  await expect(page).toHaveURL(new RegExp(`#/trip/${ID('Herbst')}/packed$`));
  await expect(page.getByRole('dialog', { name: T('Evening-before check') })).toBeVisible();
});

test('Ich › Checks pro Reiseart: each type its own lists; «Anpassen» changes the standard of the type', async ({ page, context }) => {
  await open(page, context, [trip('Alpen', day(1))]);
  await go(page, '#/me');
  await page.locator('main').getByRole('link', { name: new RegExp(T('Checks per trip type')) }).click();
  await expect(page).toHaveURL(/#\/me\/checks$/);
  await expect(page.getByRole('heading', { level: 1, name: T('Checks per trip type') })).toBeVisible();
  await page.locator('main .types').getByRole('button', { name: new RegExp(`^${T('Ski touring')}`) }).click();
  const eve = page.locator('main [data-kind="eve"]');
  // the chip tells the number of rows of the evening list
  const n = Number(await page.locator('main .types button[aria-pressed="true"] .n').innerText());
  await expect(eve.locator('li')).toHaveCount(n);
  await expect(eve).toContainText(T('Read the avalanche bulletin'));
  await expect(eve.getByRole('link', { name: T('SLF') })).toHaveAttribute('href', /slf\.ch/);
  await expect(page.locator('main [data-kind="after"]')).toContainText(T('Skins on their foil, to dry'));
  const adjust = page.locator('main').getByRole('button', { name: T('Adjust: {name}', { name: T('The evening before') }) });
  await adjust.click();
  const edit = page.getByRole('dialog', { name: T('Adjust the evening-before check') });
  await edit.getByRole('button', { name: T('Remove {name} from this list', { name: T('Make tea, fill the thermos') }) }).click();
  await edit.getByRole('button', { name: T('Save') }).click();
  await expect.poll(async () => (await stored(page, 'settings', 'eveStandard.ski'))?.value?.length).toBe(n - 1);
  await expect(eve.locator('li')).toHaveCount(n - 1);
  await expect(page.locator('main')).toContainText(T('your own list'));
  // «Vorschlag wiederherstellen» brings the app's list back (the standard goes away)
  await adjust.click();
  await edit.getByRole('button', { name: T('Restore the suggestion') }).click();
  await edit.getByRole('button', { name: T('Save') }).click();
  await expect.poll(async () => await stored(page, 'settings', 'eveStandard.ski')).toBeUndefined();
});
