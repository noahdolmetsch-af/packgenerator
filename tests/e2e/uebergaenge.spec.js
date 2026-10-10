// v0.67.0 «Übergänge 1»: the user never gets stuck between Planen → Packen → Unterwegs → Rückblick.
// Every interstitial (own address, reload, back), the main button by the PHASE of the trip on a fixed
// clock, a day ride (only «Tour beendet» with a short debrief), ending early with its question and Undo,
// the back key closing dialogs first, and «Weitermachen» on Today jumping into the right step.
// Fictional data only (tests/e2e/fixture.json, test_data_gtp_ records). Labels come from the app's
// German texts (src/lib/i18n/de), the button names from phase.js.
import { test, expect } from '@playwright/test';
import { base, tr, mockWeather } from './home0460-fixture.js';

const T = tr('de');
const D0 = '2026-10-14'; // a Wednesday
// calendar days (no 24 h steps): the date at noon UTC plus n days
const day = (n) => {
  const [y, m, d] = D0.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n, 12)).toISOString().slice(0, 10);
};
const ID = (s) => `test_data_gtp_${s}`;
const entries = (n, packed = 0) => base.tables.items.slice(3, 3 + n).map((i, k) => ({ itemId: i.id, slot: 'seat', qty: 1, packed: k < packed }));
const trip = (id, start, extra = {}) => ({
  id: ID(id), title: `test_data_gtp_ ${id}`, domain: 'bikepacking', startDate: start, days: 3, bikeId: 'bike-test', bike: 'test_data_gtp_ Scale',
  setup: { seat: 'bag-TA01', frame: 'bag-TA02', top: 'bag-TA03' }, entries: entries(6, 0), ready: [], status: 'planned', createdAt: `${day(-10)}T08:00:00.000Z`, ...extra,
});
function data(trips, debriefs = []) {
  const d = structuredClone(base);
  d.tables.trips = trips;
  d.tables.debriefs = debriefs;
  d.tables.notes = [];
  d.tables.settings = [{ key: 'homePlace', value: { name: 'test_data_gtp_ Heimort', lat: 47.39, lon: 8.04 } }];
  return d;
}

/** The app on a fixed day and hour (Europe/Zurich), the fictional data imported through «Your data». */
async function open(page, context, info, trips, { date = D0, hour = 9, debriefs = [], current = null } = {}) {
  await context.route(/^https?:\/\/(?!localhost[:/])(?!.*open-meteo)/, (route) => route.abort());
  await mockWeather(context);
  await page.clock.setFixedTime(new Date(`${date}T${String(hour).padStart(2, '0')}:00:00+02:00`));
  await context.addInitScript(([cur]) => {
    localStorage.setItem('lang', 'de');
    if (cur && !sessionStorage.getItem('pg.test.cur')) {
      localStorage.setItem('pack.currentTrip', cur);
      sessionStorage.setItem('pg.test.cur', '1');
    }
  }, [current]);
  await page.goto('./#/gear');
  // as a buffer: the output folder of these tests has «» and → in its name, which a file pick does not read
  const file = { name: 'ueb.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data(trips, debriefs))) };
  await page.goto('./#/');
  const panel = page.locator('details.data');
  await expect(async () => {
    if (!(await panel.evaluate((d) => d.open))) await panel.locator('summary').click();
    expect(await panel.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  await panel.getByLabel(T('Import backup')).setInputFiles(file);
  await panel.getByRole('button', { name: T('Replace all data') }).press('Enter');
  // a trip under way opens On the way (or the last evening its interstitial) right after the import
  await expect(async () => {
    expect((await panel.getByText(/importiert|Imported/).count()) > 0 || !/#\/$/.test(page.url())).toBe(true);
  }).toPass();
  if (current) await page.evaluate((id) => localStorage.setItem('pack.currentTrip', id), current);
}
/** Change a stored trip directly (the import fills an empty list with the old «always» items). */
const patchTrip = (page, id, patch) =>
  page.evaluate(([tid, p]) => new Promise((done, fail) => {
    const req = indexedDB.open('pack-generator');
    req.onerror = fail;
    req.onsuccess = () => {
      const store = req.result.transaction('trips', 'readwrite').objectStore('trips');
      const get = store.get(tid);
      get.onsuccess = () => { store.put({ ...get.result, ...p }).onsuccess = () => done(); };
    };
  }), [id, patch]);
const main = (page) => page.locator('main .mainbar .btn.hi');
const go = async (page, hash) => {
  await page.goto(`./${hash}`);
  await page.reload();
};

test('Packen → «Gepackt»: own address, reload, «Zur Startseite», reminder switch, then the waiting state (U001, U002, Ü3a, Ü4a, U21a, U26b)', async ({ page, context }, info) => {
  await open(page, context, info, [trip('Alpen', day(4))], { current: ID('Alpen') });
  await go(page, '#/pack?day');
  await expect(main(page)).toHaveText(T('Finish packing'));
  await page.getByRole('button', { name: T('Everything is packed') }).click();
  await expect(page.getByRole('button', { name: T('Everything is packed') })).toHaveCount(0); // ticks saved before the next tap
  // U001: one «Weiter» only, «Gute Fahrt!» is not said five days early
  await expect(page.locator('.alldone')).toContainText(T('Everything is in.'));
  await expect(page.locator('.alldone .btn')).toHaveCount(0);
  await main(page).click();
  await expect(page).toHaveURL(new RegExp(`#/trip/${ID('Alpen')}/packed$`));
  await expect(page.getByRole('heading', { level: 1, name: T('Packed') })).toBeVisible();
  await expect(page.locator('.stepbar.light a[aria-current="page"]')).toContainText(T('On the way'));
  await expect(page.getByText(T('Start in {n} days', { n: 4 }))).toBeVisible();
  await page.reload(); // Ü3a: the address holds
  await expect(page.getByRole('heading', { level: 1, name: T('Packed') })).toBeVisible();
  // U21a: the reminder is a switch, on; off stays off
  const sw = page.getByRole('switch');
  await expect(sw).toBeChecked();
  await sw.click();
  await expect(sw).not.toBeChecked();
  await expect(async () => {
    await page.reload();
    await expect(page.getByRole('switch')).not.toBeChecked({ timeout: 1000 });
  }).toPass();
  await expect(main(page)).toHaveText(T('To the start page'));
  await main(page).click();
  await expect(page).toHaveURL(/#\/$/);
  await page.goBack(); // back lands on the interstitial again
  await expect(page).toHaveURL(/\/packed$/);
  // Ü4a: afterwards the trip shows its waiting state, the interstitial does not come again
  await go(page, '#/pack?day');
  await expect(main(page)).toHaveText(T('To the start page'));
  await go(page, '#/ride');
  await expect(page.locator('.wait')).toContainText(T('Start in {n} days', { n: 4 }));
  await expect(main(page)).toHaveText(T('To the start page')); // U002: no «Zurück zum Packen» loop
  await go(page, '#/pack');
  await expect(main(page)).toHaveText(T('To the start page'));
});

test('main button by phase on a fixed clock: under way, ending early asks, Undo and reopen (U004, U005, U008, U25a)', async ({ page, context }, info) => {
  await open(page, context, info, [trip('Jura', day(-1), { entries: entries(6, 6), packedAt: day(-2) })], { current: ID('Jura') }); // day 2 of 3
  await go(page, '#/pack');
  await expect(main(page)).toHaveText(T('Continue to On the way')); // U008: not «Weiter: Packen»
  await go(page, '#/pack?day');
  await expect(main(page)).toHaveText(T('Continue to On the way'));
  await go(page, '#/ride');
  // U004: no «Weiter: Rückblick» before the last day; ending is quiet and asks
  await expect(page.locator('.trip-band .btn.hi')).toHaveCount(0);
  await page.getByRole('button', { name: T('End the trip …') }).click();
  const sheet = page.locator('dialog.endsheet');
  await expect(sheet.getByRole('heading', { name: T('End the trip now?') })).toBeVisible();
  // U25a: «Weiterfahren» first, «Tour beenden» below it
  const btns = sheet.locator('.acts .btn');
  await expect(btns.nth(0)).toHaveText(T('Ride on'));
  await expect(btns.nth(1)).toHaveText(T('End the trip'));
  await btns.nth(0).click();
  await expect(sheet).toBeHidden();
  await expect(page).toHaveURL(/#\/ride$/);
  await page.getByRole('button', { name: T('End the trip …') }).click();
  await sheet.getByRole('button', { name: T('Breakdown') }).click();
  await sheet.getByRole('button', { name: T('End the trip'), exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`#/trip/${ID('Jura')}/ended$`));
  await expect(page.getByRole('heading', { level: 1, name: T('Trip ended') })).toBeVisible();
  await expect(main(page)).toHaveText(T('Continue to Debrief'));
  // Undo for a few seconds
  await page.locator('.toast').getByRole('button', { name: T('Undo') }).click();
  await expect(page).toHaveURL(/#\/ride$/);
  await expect(page.locator('.trip-band .btn.hi')).toHaveCount(0);
  // ended again: «Doch noch unterwegs?» until tomorrow (U005)
  await page.getByRole('button', { name: T('End the trip …') }).click();
  await sheet.getByRole('button', { name: T('End the trip'), exact: true }).click();
  await expect(page).toHaveURL(/\/ended$/);
  await page.reload();
  await expect(page.locator('.toast')).toHaveCount(0); // the Undo shows once, right after
  await page.getByRole('button', { name: T('Still on the way? Reopen the trip') }).click();
  await expect(page).toHaveURL(/#\/ride$/);
  await go(page, '#/pack');
  await expect(main(page)).toHaveText(T('Continue to On the way'));
});

test('the last day: «Letzten Tag abschliessen» without a question in the evening; the evening opens «Tour beendet» once (U22 a+b)', async ({ page, context }, info) => {
  await open(page, context, info, [trip('Emmental', day(-2), { entries: entries(6, 6), packedAt: day(-3) })], { hour: 20, current: ID('Emmental') });
  // U22b: on the last evening Today opens the interstitial by itself, once
  await expect(page).toHaveURL(new RegExp(`#/trip/${ID('Emmental')}/ended$`));
  await expect(page.getByRole('link', { name: T('Still on the way? Back to On the way') })).toBeVisible();
  await page.goto('./#/');
  await page.reload();
  await expect(page.locator('[data-row="last"]')).toBeVisible();
  await expect(page).toHaveURL(/#\/$/);
  await go(page, '#/ride');
  await expect(main(page)).toHaveText(T('Finish the last day'));
  await main(page).click();
  await expect(page.locator('dialog.endsheet')).toHaveCount(0); // U22a: no question at 20:00 on the last day
  await expect(page).toHaveURL(/\/ended$/);
  await main(page).click();
  await expect(page).toHaveURL(new RegExp(`#/debrief/${ID('Emmental')}$`));
});

test('a day ride: no «Gepackt», at 08:00 ending asks, then «Tour beendet» with the short debrief (Ü5a, U004)', async ({ page, context }, info) => {
  await open(page, context, info, [trip('Feierabend', D0, { days: 1, hours: 3 })], { hour: 8, current: ID('Feierabend') });
  await go(page, '#/pack?day');
  await page.getByRole('button', { name: T('Everything is packed') }).click();
  await expect(page.getByRole('button', { name: T('Everything is packed') })).toHaveCount(0); // ticks saved before the next tap
  await main(page).click();
  await expect(page).toHaveURL(/#\/ride$/); // Ü5a: straight on, no «Gepackt»
  await expect(main(page)).toHaveText(T('Finish the trip'));
  await main(page).click();
  const sheet = page.locator('dialog.endsheet');
  await expect(sheet).toBeVisible(); // U004: 08:00, the ride is still ahead
  await sheet.getByRole('button', { name: T('End the trip'), exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`#/trip/${ID('Feierabend')}/ended$`));
  await expect(main(page)).toHaveText(T('All good'));
  await expect(page.getByRole('link', { name: T('Debrief in detail') })).toBeVisible();
  await main(page).click();
  await expect(page.locator('.celebrate.small')).toContainText(T('Debrief saved'));
  await expect(main(page)).toHaveText(T('To the start page'));
});

test('«Rückblick speichern» → «Rückblick fertig»: the loop closes, the trip stays findable (U006)', async ({ page, context }, info) => {
  const past = trip('Napf', day(-6), { entries: entries(6, 6), packedAt: day(-7) });
  const draft = { tripId: ID('Napf'), status: 'draft', weather: 'planned', amount: 'right', bags: 'fine', note: '', items: { [past.entries[0].itemId]: 'unused' }, missing: [{ id: 'm1', name: 'test_data_gtp_ Ersatzschlauch', itemId: null }], applied: [] };
  await open(page, context, info, [past], { debriefs: [draft], current: ID('Napf') });
  await go(page, '#/pack');
  await expect(main(page)).toHaveText(T('Continue to Debrief'));
  await go(page, `#/debrief/${ID('Napf')}`);
  await page.locator('.trip-band').getByRole('button', { name: T('Save debrief') }).click();
  await expect(page).toHaveURL(new RegExp(`#/trip/${ID('Napf')}/debriefed$`));
  await expect(page.getByRole('heading', { level: 1, name: T('Debrief finished|title') })).toBeVisible();
  await expect(page.getByText(T('{name} was missing', { name: 'test_data_gtp_ Ersatzschlauch' }))).toBeVisible();
  await expect(main(page)).toHaveText(T('Back to Trips'));
  await main(page).click();
  await expect(page).toHaveURL(/#\/trips$/);
  await go(page, '#/pack');
  await expect(main(page)).toHaveText(T('Back to Trips'));
});

test('an empty list never says «Alles gepackt, los» (U014); a trip without a bike has no loop (U013)', async ({ page, context }, info) => {
  await open(page, context, info, [trip('Leer', day(3), { entries: [], days: 1 }), trip('Wandern', day(4), { domain: 'hiking', bikeId: null, bike: null, packs: [{ key: 'p1', name: 'Rucksack' }], setup: {}, entries: entries(2, 0).map((e) => ({ ...e, slot: 'p1' })) })], { current: ID('Leer') });
  await patchTrip(page, ID('Leer'), { entries: [] });
  await go(page, '#/pack');
  await expect(main(page)).toHaveText(T('Add material'));
  await expect(page.locator('main')).not.toContainText(T("All packed, let's go"));
  await go(page, '#/pack?day');
  await expect(page.locator('.empty')).toContainText(T('The packing list is still empty. Add gear in Plan first, then pack here.'));
  await page.evaluate((id) => localStorage.setItem('pack.currentTrip', id), ID('Wandern'));
  await go(page, '#/pack?day');
  await page.getByRole('button', { name: T('Everything is packed') }).click();
  await expect(page.getByRole('button', { name: T('Everything is packed') })).toHaveCount(0); // ticks saved before the next tap
  await main(page).click();
  await expect(page).toHaveURL(new RegExp(`#/trip/${ID('Wandern')}/packed$`));
  await go(page, `#/debrief/${ID('Wandern')}`);
  await expect(main(page)).toHaveText(T('To the start page')); // no «Zurück zum Packen» loop
});

test('Today: «Weitermachen» jumps into the right step; from 18:00 the evening before a reminder on top (U007, U24b, Ü6a)', async ({ page, context }, info) => {
  await open(page, context, info, [trip('Herbst', day(1), { entries: entries(6, 2) }), trip('Später', day(9))], { hour: 19 });
  const cont = page.locator('[data-row="continue"]');
  await expect(cont).toContainText('test_data_gtp_ Herbst');
  await expect(cont).toContainText(T('Continue · {step}, step {n} of {total}', { step: T('Pack|stage'), n: 2, total: 4 }));
  await expect(page.locator('[data-row="eve"]')).toContainText(T('Tomorrow it starts: {trip}', { trip: 'test_data_gtp_ Herbst' }));
  await cont.click();
  await expect(page).toHaveURL(/#\/pack\?day$/);
  await expect(page.locator('.trip-band h1')).toContainText('test_data_gtp_ Herbst');
  // the start day: not packed yet, packing is still the step; packed, Weitermachen leads to On the way (U009)
  await page.clock.setFixedTime(new Date(`${day(1)}T07:00:00+02:00`));
  await page.evaluate((v) => localStorage.setItem('ride.autoOpened', v), `${ID('Herbst')}:${day(1)}`); // Today stays
  await go(page, '#/');
  await expect(page.locator('[data-row="continue"]')).toHaveAttribute('data-step', 'pack');
  await patchTrip(page, ID('Herbst'), { entries: entries(6, 6) });
  await go(page, '#/');
  await expect(page.locator('[data-row="continue"]')).toHaveAttribute('data-step', 'ride');
});

test('the back key closes a dialog first and keeps the inputs; the page stays (Ü7a, U070)', async ({ page, context }, info) => {
  await open(page, context, info, [trip('Alpen', day(4))], { current: ID('Alpen') });
  await page.goto('./#/');
  await page.goto('./#/gear');
  await expect(page.locator('main')).not.toBeEmpty();
  const phone = info.project.name === 'phone';
  // v0.71.0 «Fünf Orte»: the round + on a phone, «+ Neu» in the sidebar on a computer
  const plus = () => (phone ? page.locator('button.fab') : page.locator('.side .newbtn'));
  // «Neu» sheet
  await plus().click();
  const sheet = page.locator('dialog.sheet.new');
  await expect(sheet).toBeVisible();
  await page.goBack();
  await expect(sheet).toBeHidden();
  await expect(page).toHaveURL(/#\/gear$/);
  // a note with text: closed, kept (saved), the page stays
  await plus().click();
  await sheet.getByRole('button', { name: T('Note + photo') }).click();
  const note = page.locator('dialog.sheet[aria-labelledby="qn-h"]');
  await expect(note).toBeVisible();
  await note.locator('textarea').fill('test_data_gtp_ Notiz Zurück');
  await page.goBack();
  await expect(note).toBeHidden();
  await expect(page).toHaveURL(/#\/gear$/);
  await page.goto('./#/inbox');
  await expect(page.locator('main')).toContainText('test_data_gtp_ Notiz Zurück');
  // New trip: back closes it (what was typed is kept as for Escape), the page under it stays
  await plus().click();
  await sheet.getByRole('button', { name: T('Plan a trip') }).click();
  const tripDlg = page.locator('dialog.trip-dlg');
  await expect(tripDlg).toBeVisible();
  const at = page.url();
  await page.goBack();
  await expect(tripDlg).toBeHidden();
  expect(page.url()).toBe(at);
  // Edit bike: back keeps the new name
  await page.goto('./#/');
  await page.goto('./#/bikes');
  await page.getByRole('button', { name: T('Edit {bike}', { bike: base.tables.bikes[0].name }) }).click();
  const bike = page.locator('dialog[aria-labelledby="bike-dlg-h"]');
  await expect(bike).toBeVisible();
  await bike.locator('input').first().fill('test_data_gtp_ Scale neu');
  await page.goBack();
  await expect(bike).toBeHidden();
  await expect(page).toHaveURL(/#\/bikes/);
  await expect(page.locator('main')).toContainText('test_data_gtp_ Scale neu');
  // an item: back closes it and keeps the new item
  await page.goto('./#/');
  await page.evaluate(() => {
    localStorage.setItem('gear.add', JSON.stringify({ name: 'test_data_gtp_ Spork' }));
    location.hash = '#/gear';
  });
  const item = page.locator('dialog.sheet[aria-labelledby="item-h"]');
  await expect(item).toBeVisible();
  await page.waitForTimeout(500); // the new item saves itself while typing
  await page.goBack();
  await expect(item).toBeHidden();
  await expect(page).toHaveURL(/#\/gear$/);
  await expect(page.locator('main')).toContainText('test_data_gtp_ Spork');
});
