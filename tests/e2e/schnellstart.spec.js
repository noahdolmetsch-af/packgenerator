// v0.119.0 «Schnellstart» (mockups Q1–Q3, Noah 13.10.2026 00:05 «Q1–Q3 freigegeben», answers «1-5a»):
// Q1  Today's suggestion has the button «Schnellstart» (it replaces «Tagestour starten»).
// Q2a One click makes a trip for today, 2.5 h, on the suggested bike, with the standard items only and
//     the weather of the home forecast; it is called by the time stamp YYYYMMDDHHmm. Noah stays on
//     Today; a green card says «Tour geplant: …» with «Öffnen» and «Rückgängig» (deletes the trip).
// Q3  A trip name field marks its whole name when it gets the focus (Tab, click, tap); a second click
//     into the field places the caret.
// Fictional data only (test_data_gtp_), the clock on Friday 9 October 2026 09:00 (Europe/Zurich),
// Open-Meteo mocked. SHOTS=<folder> saves the screenshots (1440 and 390, light).
import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { D0, openHome } from './home0460-fixture.js';
import { settle } from './settle.js';

const STAMP = `${D0.replaceAll('-', '')}0900`; // 09:00 on D0, local time
/** A text with one unknown part (§) as a pattern. */
const pattern = (text) => new RegExp(text.split('§').map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.+'));

async function shot(page, info, name) {
  if (!process.env.SHOTS) return;
  mkdirSync(process.env.SHOTS, { recursive: true });
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png` });
}

/** The trips in the database (the app's own IndexedDB). */
const dbTrips = (page) =>
  page.evaluate(
    () =>
      new Promise((ok, no) => {
        const r = indexedDB.open('pack-generator');
        r.onerror = () => no(r.error);
        r.onsuccess = () => {
          const q = r.result.transaction('trips').objectStore('trips').getAll();
          q.onsuccess = () => (r.result.close(), ok(q.result));
        };
      }),
  );

test('Q1 Q2a: Schnellstart makes a trip for today, Noah stays on Today; Undo deletes it; Open goes to it', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info, { hour: 9 });
  const before = (await dbTrips(page)).length;

  // Q1: the suggestion of today with the one button
  // «Heute neu» A (0.165.0, changed on purpose): the suggestion is one row of «Up now»
  const sugg = page.locator('[data-section="today"] li[data-row="idea"]');
  await expect(sugg).toContainText(pattern(T('Idea: ride up to {h} h with the {bike}, today', { h: '2,5', bike: '§' })));
  const go = sugg.getByRole('button', { name: T('Quick start'), exact: true });
  await expect(go).toBeVisible();
  await expect(page.getByRole('button', { name: T('Start day ride') })).toHaveCount(0);
  await shot(page, info, 'Q1-heute-schnellstart');

  // Q2a: one click, no dialog, still on Today
  await go.click();
  const card = page.locator('[data-quick-made]');
  await expect(card).toBeVisible();
  expect(new URL(page.url()).hash).toBe('#/');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(card).toContainText(T('Trip planned: {name}', { name: STAMP }));
  await expect(card).toContainText(pattern(T('Today · {h} h · {weather} · listed under Trips › Planned', { h: '2,5', weather: '§' })));
  await expect(card).toContainText(/7–16 °C/); // the mocked forecast for today
  await expect(card).toContainText(/Vorhersage test_data_gtp_ Heimort/);
  const made = (await dbTrips(page)).find((x) => x.title === STAMP);
  expect(made).toBeTruthy();
  expect(made).toMatchObject({ startDate: D0, hours: 2.5, days: 1, overnight: 'none', wxFrom: 'forecast' });
  expect(made.copiedFrom ?? null).toBeNull();
  // the suggestion goes away: there is a trip today now
  await expect(page.locator('[data-section="today"] li[data-row="idea"]')).toHaveCount(0);
  await shot(page, info, 'Q2a-heute-tour-geplant');

  // «Rückgängig» deletes the new trip
  await card.getByRole('button', { name: T('Undo'), exact: true }).click();
  await expect(card).toHaveCount(0);
  await expect.poll(async () => (await dbTrips(page)).some((x) => x.title === STAMP)).toBe(false);
  expect((await dbTrips(page)).length).toBe(before);

  // again, then «Öffnen» goes to the trip
  await page.locator('[data-section="today"] li[data-row="idea"]').getByRole('button', { name: T('Quick start'), exact: true }).click();
  await expect(card).toContainText(STAMP);
  // a second quick start in the same minute would get « (2)»: the Touren list shows this one
  await card.getByRole('link', { name: T('Open'), exact: true }).click();
  await expect(page).not.toHaveURL(/#\/$/);
  await settle(page);
  await expect(page.getByText(STAMP).first()).toBeVisible();
  await page.goto('./#/trips');
  await expect(page.getByText(STAMP).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('Q3: a trip name field marks the whole name on focus; a second click places the caret', async ({ page, context }, info) => {
  const phone = info.project.name === 'phone';
  const T = await openHome(page, context, info, { hour: 9 });
  await page.locator('[data-section="today"] li[data-row="idea"]').getByRole('button', { name: T('Quick start'), exact: true }).click();
  await page.locator('[data-quick-made]').getByRole('link', { name: T('Open'), exact: true }).click();
  await settle(page);
  const sel = (loc) => loc.evaluate((el) => [el.selectionStart, el.selectionEnd, el.value.length]);
  const press = (loc) => (phone ? loc.tap() : loc.click());

  // the name in the trip band: a tap on it opens the field with the whole name marked
  await press(page.locator('[data-trip-title] button'));
  const band = page.getByRole('textbox', { name: T('Trip name') });
  await expect(band).toBeFocused();
  expect(await sel(band)).toEqual([0, STAMP.length, STAMP.length]);
  await band.press('Escape');

  // the Trip details window: Tab, click and tap mark the whole name
  // (a trip of today opens in «Packen»; its details are in «Planen», «…» › «Tour bearbeiten»)
  await page.getByRole('navigation', { name: T('Steps of this trip') }).getByRole('link').first().click();
  await page.getByLabel(T('More: other trip, edit trip, templates, print')).click();
  await page.locator('.list-menu-content').getByRole('button', { name: T('Edit trip'), exact: true }).click();
  const dlg = page.getByRole('dialog', { name: T('Trip details') });
  const name = dlg.getByLabel(T('Name'), { exact: true });
  await expect(name).toBeVisible();
  const len = (await name.inputValue()).length;
  expect(len).toBeGreaterThan(0);
  // keyboard: from the next field back with Shift+Tab
  await dlg.getByLabel(T('Start date')).focus();
  await page.keyboard.press('Shift+Tab');
  await expect(name).toBeFocused();
  expect(await sel(name)).toEqual([0, len, len]);
  // click or tap from outside
  await dlg.locator('#trip-h').click();
  await press(name);
  await expect(name).toBeFocused();
  expect(await sel(name)).toEqual([0, len, len]);
  await shot(page, info, 'Q3-name-markiert');
  // a second click into the focused field places the caret (nothing marked). A click on the phone too:
  // Chromium's touch emulation keeps any marked text on a tap into a focused field, also without the app.
  const box = await name.boundingBox();
  await name.click({ position: { x: box.width - 12, y: box.height / 2 } });
  const [a, b] = await sel(name);
  expect(a).toBe(b);
  // typing after a fresh focus writes over the name
  await dlg.locator('#trip-h').click();
  await press(name);
  await page.keyboard.type('test_data_gtp_ Neu');
  await expect(name).toHaveValue('test_data_gtp_ Neu');
});
