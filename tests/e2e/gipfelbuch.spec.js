// v0.165.0 «Gipfelbuch für alle» (mockup GB1, Noah 15.10.2026 «1a 2a 3a 4a und manuelle eingabe möglich?
// 5b»): Aktiv › Aktivität › «Gipfelbuch»; a ride over a fictional pass is found, confirmed with a typed
// name and earns «Erster Pass über 2000 m»; a hall without a height is entered by hand; the stars show in
// the showcase. On a phone and a computer, in German. No sideways scroll, no page errors. Fictional data only.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { TODAY, D0, addDays, put } from './aktiv-fixture.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};

async function open(page, context, hash) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`./${hash}`);
  return errors;
}
async function fits(page, where) {
  const w = page.viewportSize().width;
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(sw, `${where}: no sideways scroll`).toBeLessThanOrEqual(w);
}

/** A fictional Strava ride over a pass (900 m up to 2150 m) and an indoor ride that never counts. */
const day = addDays(TODAY, -3);
const acts = [
  { id: 'test_gb_pass', type: 'Ride', kind: 'ride', day, name: 'Testrunde Nord', hm: 1300, prof: { pts: [[0, 900], [40, 1500], [80, 2150], [120, 1000]] } },
  { id: 'test_gb_indoor', type: 'Ride', kind: 'ride', day: addDays(TODAY, -2), name: 'Rolle', trainer: true, prof: { pts: [[0, 900], [30, 2500]] } },
];

test('Gipfelbuch: found in a ride, confirmed, a hall by hand, stars in the showcase', async ({ page, context }) => {
  const errors = await open(page, context, '#/flow/activity');
  await expect(page.locator('main')).toBeVisible();
  await put(page, { activities: acts });
  await page.reload();
  const main = page.locator('main');

  // the row under «Mehr» on Aktivität leads to the book
  const row = main.locator('a[href="#/flow/gipfelbuch"]').first();
  await expect(row).toContainText(T('Summit book'));
  await row.click();
  await expect(page).toHaveURL(/#\/flow\/gipfelbuch$/);
  await expect(main.getByRole('heading', { level: 1 })).toHaveText(T('Summit book'));

  // the empty book, and one suggestion: the pass, not the indoor ride
  await expect(main.locator('[data-gb-empty]')).toBeVisible();
  const found = main.locator('[data-gb-found]');
  await expect(found.locator('[data-gb-sugg]')).toHaveCount(1);
  await expect(found.locator('[data-gb-sugg="act:test_gb_pass"]')).toContainText(/2.150 m/);
  await fits(page, 'empty book with a suggestion');

  // confirm: the name is typed by you
  await found.locator('[data-gb-confirm]').click();
  const sheet = page.locator('[data-place-sheet]');
  await expect(sheet).toBeVisible();
  await sheet.locator('[data-gb-save]').click();
  await expect(sheet.locator('.err')).toHaveText(T('Give it a name.'));
  await sheet.locator('[data-gb-name]').fill('Testpass Nord');
  await sheet.locator('[data-gb-save]').click();
  await expect(sheet).toBeHidden();
  await expect(main.locator('[data-gb-found]')).toHaveCount(0);
  await expect(main.locator('[data-gb-empty]')).toHaveCount(0);

  const place = main.locator('[data-gb-place="Testpass Nord"]');
  await expect(place).toBeVisible();
  await expect(place).toContainText(`★ ${T('first 2000 m')}`);
  await place.click();
  const det = main.locator('[data-gb-detail]');
  await expect(det.getByRole('heading', { level: 2 })).toHaveText('Testpass Nord');
  await expect(det).toContainText(T('First pass over 2000 m'));
  await expect(det).toContainText(/1.300 Hm/);

  // a hall by hand: «Andere», no height needed (5b)
  await main.locator('button', { hasText: T('Enter a place by hand') }).click();
  await expect(sheet).toBeVisible();
  await sheet.locator('[data-gb-name]').fill('Testhalle West');
  await sheet.locator('[data-gb-sport="other"]').click();
  await sheet.locator('[data-gb-label]').fill('Tennis');
  await sheet.locator('[data-gb-save]').click();
  await expect(sheet).toBeHidden();
  await expect(main.locator('[data-gb-place="Testhalle West"]')).toBeVisible();
  await expect(main.locator('[data-gb-chip="other"]')).toContainText('1');
  await fits(page, 'book with two places');

  // the stars in the showcase, as their own area
  await page.goto('./#/flow/trophies?area=gipfelbuch');
  const area = main.locator('[data-area="gipfelbuch"]');
  await expect(area).toBeVisible();
  await expect(area).toContainText(T('First pass over 2000 m'));
  await fits(page, 'showcase');

  expect(errors).toEqual([]);
});

// «Aktiv neu» (Noah 22.10.2026 «1a»): the summit book of a sport is its own part of the sport's page; its link
// opens the whole book with the chip of that sport on. Fictional places only.
test('Gipfelbuch on the page of a sport: the last places and the link to the whole book', async ({ page, context }) => {
  const errors = await open(page, context, '#/flow/sports');
  await expect(page.locator('main')).toBeVisible();
  const book = {
    places: [
      { id: 'gbp_t1', name: 'Testpass Ost', sport: 'bike', ele: 2050, lat: null, lon: null, label: '', note: '', createdAt: `${TODAY}T08:00:00.000Z` },
      { id: 'gbp_t2', name: 'Testgipfel', sport: 'hike', ele: 2300, lat: null, lon: null, label: '', note: '', createdAt: `${TODAY}T08:00:00.000Z` },
    ],
    visits: [
      { id: 'gbv_t1', placeId: 'gbp_t1', day: addDays(TODAY, -5) },
      { id: 'gbv_t2', placeId: 'gbp_t2', day: addDays(TODAY, -4) },
    ],
    dismissed: [],
  };
  await put(page, { settings: [{ key: 'gipfelbuch', value: book }] });
  await page.goto('./#/flow/sport/trip%3Acycling');
  const slot = page.locator('[data-gipfel-slot="trip:cycling"]');
  await expect(slot.getByRole('heading', { name: T('Summit book') })).toBeVisible();
  await expect(slot.locator('[data-gb-place="gbp_t1"]')).toContainText('Testpass Ost');
  await expect(slot.locator('[data-gb-place="gbp_t2"]')).toHaveCount(0); // the hike stays on its own page
  await fits(page, 'sport page');
  await slot.locator('[data-gb-all]').click();
  await expect(page).toHaveURL(/#\/flow\/gipfelbuch\?sport=bike$/);
  await expect(page.locator('[data-gb-chip="bike"]')).toHaveAttribute('aria-pressed', 'true');
  expect(errors).toEqual([]);
});

// «Eine Seite pro Gipfel» (Noah 24.11.2026 «alle 1-5 zusammen»): #/flow/gipfelbuch/<id> shows the visits of a place
// with the temperature and the time up of the Strava ride, the fastest time on top, a note that stays, and an unknown
// place says so with a way back. Fictional data only.
test('Gipfelbuch: the page of one place with visits, time up and a note', async ({ page, context }) => {
  const errors = await open(page, context, '#/flow/gipfelbuch');
  await expect(page.locator('main')).toBeVisible();
  const d1 = addDays(TODAY, -20);
  const d2 = addDays(TODAY, -3);
  const book = {
    places: [{ id: 'gbp_ort', name: 'Testpass Mitte', sport: 'bike', ele: 2150, lat: null, lon: null, label: '', note: 'Test-Notiz zum Ort', createdAt: `${d1}T08:00:00.000Z` }],
    visits: [
      { id: 'gbv_o1', placeId: 'gbp_ort', day: d1, ref: 'act:test_ort_1', hm: 1200 },
      { id: 'gbv_o2', placeId: 'gbp_ort', day: d2, ref: 'act:test_ort_2', hm: 1250 },
    ],
    dismissed: [],
  };
  const ortActs = [
    { id: 'test_ort_1', type: 'Ride', kind: 'ride', day: d1, name: 'Testrunde Eins', tempMin: 4, tempMax: 17, climbs: [{ name: 'Testpass Mitte Nordrampe', s: 4200 }] },
    { id: 'test_ort_2', type: 'Ride', kind: 'ride', day: d2, name: 'Testrunde Zwei', climbs: [{ name: 'Testpass Mitte Nordrampe', s: 3900 }] },
  ];
  await put(page, { settings: [{ key: 'gipfelbuch', value: book }], activities: ortActs });
  await page.reload();
  const main = page.locator('main');

  // from the book: the place, its detail and the link to its own page
  await main.locator('[data-gb-place="Testpass Mitte"]').click();
  await main.locator('[data-gb-own]').click();
  await expect(page).toHaveURL(/#\/flow\/gipfelbuch\/gbp_ort$/);
  await expect(main.getByRole('heading', { level: 1 })).toHaveText('Testpass Mitte');
  await expect(main.locator('[data-gp-visit]')).toHaveCount(2);
  await expect(main.locator('[data-core-line]')).toContainText('1:05:00'); // the faster of 70:00 and 65:00
  await expect(main.locator('[data-gp-visit="gbv_o1"] [data-gp-wx]')).toContainText('4 – 17 °C');
  await expect(main.locator('[data-gp-visit="gbv_o2"] [data-gp-up]')).toContainText(T('fastest'));
  await expect(main).toContainText('Test-Notiz zum Ort');
  await fits(page, 'place page');

  // a note on a visit stays after a reload
  const v2 = main.locator('[data-gp-visit="gbv_o2"]');
  await v2.locator('[data-gp-note-open]').click();
  await v2.locator('[data-gp-note-input]').fill('Test: Nebel am Gipfel');
  await v2.getByRole('button', { name: T('Save') }).click();
  await expect(v2.locator('[data-gp-note]')).toHaveText('Test: Nebel am Gipfel');
  await page.reload();
  await expect(page.locator('[data-gp-visit="gbv_o2"] [data-gp-note]')).toHaveText('Test: Nebel am Gipfel');

  // an unknown place says so and leads back
  await page.goto('./#/flow/gipfelbuch/gbp_gibtsnicht');
  await expect(page.locator('[data-gp-missing]')).toBeVisible();
  await expect(page.locator('[data-gp-missing] a[href="#/flow/gipfelbuch"]')).toBeVisible();
  expect(errors).toEqual([]);
});

// «Gipfelbuch ausbauen» (Noah 24.11.2026 «alle 1-5 zusammen», ideas 1 and 4): a Strava ride over a pass of the app's list is
// found with its name and goes into the book with one tap; the collection «Pässe über 2000 m» counts it; own lists can be
// added, changed and deleted with Undo. Fictional ride, real geography.
test('Gipfelbuch: a pass found on a ride by name, a collection counts it, an own list', async ({ page, context }) => {
  const errors = await open(page, context, '#/flow/gipfelbuch');
  await expect(page.locator('main')).toBeVisible();
  const act = { id: 'test_gb_furka', type: 'Ride', kind: 'ride', day: addDays(TODAY, -4), name: 'Testrunde Furka', hm: 1500, line: '_z`{G_vcr@wjEs{EgjD{wE', prof: { pts: [[0, 900], [60, 1500], [120, 900]] } };
  await put(page, { activities: [act] });
  await page.reload();
  const main = page.locator('main');

  // the pass is found by its name, one tap puts it in the book
  const found = main.locator('[data-gb-found]');
  await expect(found.locator('[data-gb-sugg="act:test_gb_furka"]').first()).toContainText('Furkapass');
  await found.locator('[data-gb-add]').first().click();
  await expect(main.locator('[data-gb-place="Furkapass"]')).toBeVisible();
  await expect(main.locator('.undo')).toContainText('Furkapass');

  // the collection counts it, without a goal
  const coll = main.locator('[data-gb-coll="paesse2000"]');
  await coll.locator('summary').click();
  await expect(coll.locator('summary small')).toContainText(/^1 /);
  await expect(coll.locator('a.have', { hasText: 'Furkapass' })).toBeVisible();
  await fits(page, 'collections');

  // an own list: add, change, delete
  await main.locator('[data-gb-list-new]').click();
  const sheet = page.locator('[data-list-sheet]');
  await sheet.locator('[data-gbl-save]').click();
  await expect(sheet.locator('.err')).toHaveText(T('Give it a name.'));
  await sheet.locator('[data-gbl-name]').fill('Testliste');
  await sheet.locator('[data-gbl-items]').fill('Furkapass\nNiemalshorn');
  await sheet.locator('[data-gbl-save]').click();
  await expect(sheet).toBeHidden();
  const own = main.locator('[data-gb-colls] details', { hasText: 'Testliste' });
  await expect(own.locator('summary small')).toContainText(/^1 /);
  await own.locator('summary').click();
  await own.locator('[data-gb-list-edit]').click();
  await sheet.locator('[data-gbl-delete]').click();
  await expect(main.locator('[data-gb-colls] details', { hasText: 'Testliste' })).toHaveCount(0);
  await main.locator('.undo button').click();
  await expect(main.locator('[data-gb-colls] details', { hasText: 'Testliste' })).toHaveCount(1);
  expect(errors).toEqual([]);
});

// «Gipfel-Karte mit Lücken» (Noah 24.11.2026 «alle 1-5 zusammen», idea 2): #/flow/gipfelbuch/karte shows the summits and passes
// as dots, the gaps near the home place with «Touren dorthin» from the tour suggestions, and «Ich war da» puts a place in the book.
test('Gipfelbuch: the map with the gaps near home and a tour toward one', async ({ page, context }) => {
  const errors = await open(page, context, '#/flow/gipfelbuch');
  await expect(page.locator('main')).toBeVisible();
  await put(page, { settings: [{ key: 'homePlace', value: { name: 'Testort Zürich', lat: 47.3779, lon: 8.5403 } }] });
  await page.goto('./#/flow/gipfelbuch/karte');
  const main = page.locator('main');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText(T('Map of summits and passes'));
  await expect(main.locator('svg.nmap circle.dot').first()).toBeVisible();
  await expect(main.locator('[data-gk-legend]')).toContainText(T('near you, not yet'));
  await fits(page, 'map');

  // the nearest gap from Zürich is the Üetliberg; a tour of the suggestions leads over it
  const gaps = main.locator('[data-gk-gaps]');
  const first = gaps.locator('[data-gk-row]').first();
  await expect(first).toContainText('Üetliberg');
  await first.locator('[data-gk-tours]').click();
  await expect(gaps.locator('[data-gk-tourlist] a[href^="#/trips/vorschlaege/"]').first()).toBeVisible({ timeout: 20000 });

  // «I was there»: into the book, and the dot is yours
  await first.locator('[data-gk-there]').click();
  const sheet = page.locator('[data-place-sheet]');
  await expect(sheet.locator('[data-gb-name]')).toHaveValue('Üetliberg');
  await sheet.locator('[data-gb-save]').click();
  await expect(sheet).toBeHidden();
  await expect(main.locator('.undo')).toContainText('Üetliberg');
  await expect(gaps.locator('[data-gk-row]').filter({ hasText: 'Üetliberg' })).toHaveCount(0);

  // a filter and the way back
  await main.locator('[data-gk-chip="vier"]').click();
  await expect(main.locator('svg.nmap')).toBeVisible();
  await main.locator('a[href="#/flow/gipfelbuch"]').first().click();
  await expect(page).toHaveURL(/#\/flow\/gipfelbuch$/);
  expect(errors).toEqual([]);
});
