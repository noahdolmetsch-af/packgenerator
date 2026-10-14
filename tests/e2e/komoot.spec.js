// SN1b–SN1d «Tour aus komoot» (mockups SN1b, SN1c, SN1d; Noah 13.10.2026 «freigabe», answers 1a 2b 3b 4a):
// - Unterwegs: «Tour aus komoot» is a quiet last row in «Mehr»; it opens komoot's suggestions in a new tab
//   (target _blank, rel noopener noreferrer, «öffnet woanders»); the location only in the link, rounded;
//   offline it opens nothing and says so;
// - Touren › «Neue Tour»: the same quiet row next to the templates;
// - a shared GPX without times opens the sheet «Tour aus komoot übernehmen» (also from #/debrief/ride/shared):
//   today preselected, the bike of the last trip, the hint about the running trip, the komoot link folded;
//   «Als geplante Tour anlegen» makes the planned trip with «In komoot öffnen» in its head and on Touren;
// - the real share target (service worker): without times the sheet, with times still «Fahrt hochladen».
// Fictional data only (test_data_gtp_), generic komoot links, the clock on Friday 9 October 2026 09:00,
// every outside address blocked (komoot answered by the test). SHOTS=<folder>: screenshots 1440 and 390.
// The test names stay plain: their output folder holds the imported file (home0460-fixture.js openHome).
import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { openHome, homeFixture, tr, trip, day, D0 } from './home0460-fixture.js';
import { makeGpx } from '../test_data_gtp_gpx.js';

const T = tr('de');
const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const LINK = 'https://www.komoot.com/tour/123456';
const JURA = 'test_data_gtp_Jura-Wochenende';

/** A planned route as komoot shares it: track points with height, no times. */
const routeGpx = (name = 'test_data_gtp_ Doubs-Schlaufe') => {
  const pts = Array.from({ length: 60 }, (_, i) => `<trkpt lat="${(47.36 + Math.sin(i / 9) * 0.05).toFixed(5)}" lon="${(7.15 + Math.sin(i / 6) * 0.08 + i * 0.002).toFixed(5)}"><ele>${450 + Math.round(Math.sin(i / 5) * 160)}</ele></trkpt>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="test_data_gtp_"><metadata><name>${name}</name></metadata><trk><name>${name}</name><trkseg>\n${pts}\n</trkseg></trk></gpx>`;
};

/** The fictional data: a three-day trip running since yesterday (today is its day 2), later trips, past ones. */
function data() {
  const d = homeFixture();
  d.tables.trips = [trip('Jura-Wochenende', day(-1), { days: 3 }), ...d.tables.trips.filter((x) => !/TEST-Runde/.test(x.title))];
  return d;
}

async function open(page, context, info) {
  await context.addInitScript((id) => localStorage.setItem('pack.currentTrip', id), JURA);
  await openHome(page, context, info, { data: data() });
  // komoot answers with an empty page (registered after the block, so it runs first)
  await context.route(/komoot\.com/, (route) => route.fulfill({ contentType: 'text/html', body: '<title>komoot</title>' }));
}

/** Leaves a shared file in the Cache, as the service worker does. */
const putShared = (page, text, said = '') =>
  page.evaluate(
    async ([body, s]) => {
      const cache = await caches.open('pg-shared-ride');
      await cache.put(new URL('shared-ride', location.href).href, new Response(body, { headers: { 'Content-Type': 'application/gpx+xml', 'X-File-Name': encodeURIComponent('test_data_gtp_route.gpx'), 'X-Share-Text': encodeURIComponent(s) } }));
    },
    [text, said],
  );
const sharedLeft = (page) => page.evaluate(async () => !!(await (await caches.open('pg-shared-ride')).match(new URL('shared-ride', location.href).href)));

const trips = (page) =>
  page.evaluate(() => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction('trips').objectStore('trips').getAll();
      q.onsuccess = () => (r.result.close(), ok(q.result));
    };
  }));
const noSideways = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

async function shot(page, info, name, el = null) {
  if (!process.env.SHOTS) return;
  mkdirSync(process.env.SHOTS, { recursive: true });
  const path = `${process.env.SHOTS}/${name}-${phone(info) ? 390 : 1440}.png`;
  await (el ? el.screenshot({ path }) : page.screenshot({ path, fullPage: true }));
}

async function outside(a) {
  await expect(a).toHaveAttribute('target', '_blank');
  await expect(a).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(a).toContainText(T('(opens elsewhere)'));
}

test('Unterwegs: Tour aus komoot in Mehr, the location only in the link, offline nothing opens', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, context, info);
  await page.goto('./#/ride');
  const more = page.locator('section.more');
  const row = more.locator('[data-komoot-find]');
  await expect(row).toBeVisible();
  await expect(row).toContainText(T('Tour from komoot'));
  await expect(row).toContainText(T('Suggestions near you, {sport} · opens komoot', { sport: 'Gravel' }));
  await outside(row);
  // the last row of the card, not a second main button; the line about the location under the card
  await expect(more.locator('.mlist > :last-child [data-komoot-find]')).toHaveCount(1);
  await expect(more).toContainText(T('The app asks for your location only when you tap. It goes only in the link to komoot and is not stored.'));
  expect(await noSideways(page)).toBe(0);
  await more.scrollIntoViewIfNeeded();
  await shot(page, info, 'SN1b-unterwegs-komoot', more);

  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 47.376887, longitude: 8.541694 });
  const [tab] = await Promise.all([context.waitForEvent('page'), tap(row, info)]);
  await expect.poll(() => tab.url()).toContain('komoot.com/discover/');
  expect(tab.url()).toContain('@47.38,8.54/tours?sport=mtb_easy');
  expect(tab.url()).not.toContain('47.3768');
  await tab.close();
  // nothing about the place was stored
  expect(JSON.stringify(await page.evaluate(() => ({ ...localStorage })))).not.toContain('47.38');

  await context.setOffline(true);
  let opened = false;
  context.on('page', () => (opened = true));
  await tap(row, info);
  await expect(more.getByRole('status')).toHaveText(T('Offline, komoot does not open. A tour shared as GPX is taken over offline too.'));
  expect(opened).toBe(false);
  await context.setOffline(false);
  expect(errors).toEqual([]);
});

test('Neue Tour: Tour aus komoot next to the templates', async ({ page, context }, info) => {
  await open(page, context, info);
  await page.goto('./#/trips');
  await tap(page.getByRole('button', { name: new RegExp(`^${esc(T('New trip'))}`) }), info);
  const dlg = page.locator('dialog.trip-dlg');
  await expect(dlg).toBeVisible();
  const row = dlg.locator('[data-komoot-find]');
  await expect(row).toBeVisible();
  await outside(row);
  await expect(row).toHaveAttribute('href', /^https:\/\/www\.komoot\.com\/discover\?sport=/);
  // right after «Vorlage wählen»
  await expect(dlg.locator('.tplbox + .kmbox [data-komoot-find]')).toHaveCount(1);
  await expect(dlg).toContainText(T('The app asks for your location only when you tap. It goes only in the link to komoot and is not stored.'));
  await row.scrollIntoViewIfNeeded();
  await shot(page, info, 'SN1b-neue-tour-komoot', dlg);
});

test('a shared GPX without times: the sheet, then the planned trip with In komoot oeffnen', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, context, info);
  await putShared(page, routeGpx(), `test_data_gtp_ Schau dir diese Tour an: ${LINK}?ref=wtd`);
  // the ride upload hands a file without times over to the sheet
  await page.goto('./#/debrief/ride/shared');
  await expect(page).toHaveURL(/#\/trips$/);
  const sheet = page.locator('dialog[data-komoot-sheet]');
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole('heading', { name: T('Take over a tour from komoot') })).toBeVisible();
  await expect(sheet).toContainText('test_data_gtp_ Doubs-Schlaufe');
  await expect(sheet).toContainText(/\d+(\.\d)? km · ↑ [\d’']+ m · etwa \d+ (h|min)/);
  await expect(sheet.getByLabel(T('Name'))).toHaveValue('test_data_gtp_ Doubs-Schlaufe');
  // answer 2b: today is chosen (Friday 9 October), the bike of the last trip too; both are suggestions
  const pressed = sheet.locator('.km-chips button[aria-pressed="true"]');
  await expect(pressed.first()).toContainText(T('Today'));
  await expect(pressed.first()).toContainText('9. Okt');
  await expect(sheet.getByRole('button', { name: 'test_data_gtp_ Scale' })).toHaveAttribute('aria-pressed', 'true');
  await expect(sheet).toContainText(T('Suggestion: the bike of your last trip.'));
  // today is day 2 of the running trip: a quiet hint, both may stand
  await expect(sheet.locator('[data-komoot-clash]')).toContainText(T('On {day} you are still on {name} (day {n}). Both may stand.', { day: 'Fr., 9. Okt.', name: 'test_data_gtp_ Jura-Wochenende', n: 2 }));
  // «komoot-Link» and «Mehr Angaben» folded; the link came with the file
  const linkFold = sheet.getByRole('button', { name: new RegExp(esc(T('komoot link'))) });
  await expect(linkFold).toHaveAttribute('aria-expanded', 'false');
  await expect(linkFold).toContainText(T('stays in the trip'));
  await expect(sheet.getByRole('button', { name: new RegExp(esc(T('More details'))) })).toHaveAttribute('aria-expanded', 'false');
  await expect(sheet).toContainText(T('The file stays on your device. Nothing goes back to komoot.'));
  expect(await noSideways(page)).toBe(0);
  await shot(page, info, 'SN1c-komoot-geteilt', page.locator('dialog[data-komoot-sheet]'));
  await tap(linkFold, info);
  await expect(sheet.getByRole('textbox', { name: T('komoot link') })).toHaveValue(`${LINK}?ref=wtd`);
  // another day: tomorrow, then the clash hint is about day 3
  await tap(sheet.getByRole('button', { name: T('Tomorrow') }), info);
  await expect(sheet.locator('[data-komoot-clash]')).toContainText(T('On {day} you are still on {name} (day {n}). Both may stand.', { day: 'Sa., 10. Okt.', name: 'test_data_gtp_ Jura-Wochenende', n: 3 }));
  await tap(sheet.getByRole('button', { name: new RegExp(`^${esc(T('Today'))}`) }), info);

  await tap(sheet.getByRole('button', { name: T('Create as planned trip') }), info);
  await expect(page).toHaveURL(/#\/pack$/);
  await expect(sheet).toBeHidden();
  const made = (await trips(page)).find((x) => x.fromKomoot);
  expect(made).toMatchObject({ title: 'test_data_gtp_ Doubs-Schlaufe', startDate: D0, status: 'planned', bikeId: 'bike-test' });
  expect(made.route.komoot).toBe(`${LINK}?ref=wtd`);
  expect(made.route.km).toBeGreaterThan(0);
  // «Mehr Angaben › Packliste» untouched: the suggested list (the last trip on this bike), nothing packed
  expect(made.entries.length).toBeGreaterThan(0);
  expect(made.entries.some((e) => e.packed)).toBe(false);
  expect(made.place).toMatchObject({ lat: made.route.start.lat, lon: made.route.start.lon });
  expect(await sharedLeft(page)).toBe(false);
  // SN1d: «In komoot öffnen» in the trip's head, quiet, in a new tab
  const head = page.locator('.trip-band .meta [data-komoot-open]');
  await expect(head).toHaveText(new RegExp(`^${esc(T('Open in komoot'))}`));
  await expect(head).toHaveAttribute('href', `${LINK}?ref=wtd`);
  await outside(head);
  await shot(page, info, 'SN1d-tour-komoot-link');
  // answer 3b: the small sign in the Touren row
  await page.goto('./#/trips');
  const sign = page.locator(`[data-planned] li.pc[data-trip="${made.id}"] [data-komoot-open]`);
  await expect(sign).toBeVisible();
  await expect(sign).toHaveAttribute('aria-label', T('Open in komoot: {name}', { name: made.title }));
  await expect(sign).toHaveAttribute('href', `${LINK}?ref=wtd`);
  await outside(sign);
  // a trip without a komoot link has no sign
  await expect(page.locator(`[data-planned] li.pc[data-trip="${JURA}"] [data-komoot-open]`)).toHaveCount(0);
  expect(await noSideways(page)).toBe(0);
  await shot(page, info, 'SN1d-touren-komoot', page.locator(`[data-planned] li.pc[data-trip="${made.id}"]`));
  expect(errors).toEqual([]);
});

test('the sheet: Abbrechen keeps nothing, a wrong link is not taken, Mehr Angaben sets days and start', async ({ page, context }, info) => {
  await open(page, context, info);
  await putShared(page, routeGpx('test_data_gtp_ Abbruch'));
  await page.goto('./#/komoot/shared');
  const sheet = page.locator('dialog[data-komoot-sheet]');
  await expect(sheet).toContainText('test_data_gtp_ Abbruch');
  await expect(sheet.getByRole('button', { name: new RegExp(esc(T('komoot link'))) })).toContainText(T('none yet|link'));
  await tap(sheet.getByRole('button', { name: T('Cancel') }), info);
  await expect(sheet).toBeHidden();
  expect(await sharedLeft(page)).toBe(false);
  expect((await trips(page)).some((x) => x.fromKomoot)).toBe(false);

  await putShared(page, routeGpx('test_data_gtp_ Mehr'));
  await page.goto('./#/komoot/shared');
  await expect(sheet).toContainText('test_data_gtp_ Mehr');
  await tap(sheet.getByRole('button', { name: new RegExp(esc(T('komoot link'))) }), info);
  await sheet.getByRole('textbox', { name: T('komoot link') }).fill('https://example.org/tour/1');
  await tap(sheet.getByRole('button', { name: new RegExp(esc(T('More details'))) }), info);
  await sheet.getByLabel(T('Days')).fill('2');
  await sheet.getByLabel(T('Start time')).fill('08:30');
  await tap(sheet.getByRole('button', { name: T('Start empty') }), info);
  await tap(sheet.getByRole('button', { name: T('Create as planned trip') }), info);
  await expect(sheet.getByRole('alert')).toHaveText(T('This is not a komoot link. Leave the field empty, or paste the link from komoot.'));
  await sheet.getByRole('textbox', { name: T('komoot link') }).fill('');
  await tap(sheet.getByRole('button', { name: T('Create as planned trip') }), info);
  await expect(page).toHaveURL(/#\/pack$/);
  const made = (await trips(page)).find((x) => x.fromKomoot);
  expect(made).toMatchObject({ days: 2, rideStart: { 0: '08:30' }, entries: [] });
  expect(made.route.komoot).toBe(null);
  await expect(page.locator('.trip-band [data-komoot-open]')).toHaveCount(0);
});

test.describe('Android share target (service worker)', () => {
  test.use({ serviceWorkers: 'allow' });
  test('a GPX without times opens the sheet, with times still Fahrt hochladen', async ({ page, context }, info) => {
    test.skip(phone(info), 'one browser is enough for the worker');
    await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
    await context.addInitScript(() => localStorage.setItem('lang', 'de'));
    await page.goto('./#/debrief/ride');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller), { timeout: 20_000 }).toBe(true);
    const post = async (name, body, text = '') => {
      const file = info.outputPath(name);
      writeFileSync(file, body);
      await page.evaluate((said) => {
        const f = document.createElement('form');
        f.method = 'POST';
        f.enctype = 'multipart/form-data';
        f.action = 'share-target';
        f.id = 'share';
        f.innerHTML = '<input type="file" name="ride"><input name="text">';
        f.querySelector('[name=text]').value = said;
        document.body.append(f);
      }, text);
      await page.locator('#share input[type=file]').setInputFiles(file);
      await page.evaluate(() => document.getElementById('share').submit());
    };
    await post('test_data_gtp_route.gpx', routeGpx('test_data_gtp_ geteilt'), `test_data_gtp_ ${LINK}`);
    await expect(page).toHaveURL(/#\/trips$/);
    const sheet = page.locator('dialog[data-komoot-sheet]');
    await expect(sheet).toContainText('test_data_gtp_ geteilt');
    await expect(sheet.getByRole('button', { name: new RegExp(esc(T('komoot link'))) })).toContainText(T('stays in the trip'));
    await tap(sheet.getByRole('button', { name: T('Cancel') }), info);
    await expect(sheet).toBeHidden();

    await post('test_data_gtp_ride.gpx', makeGpx({ name: 'test_data_gtp_ gefahren', start: `${day(-2)}T07:00:00Z`, legs: [{ km: 12, kmh: 20 }] }));
    await expect(page).toHaveURL(/#\/debrief\/ride\/shared$/);
    await expect(page.getByRole('heading', { name: /test_data_gtp_ gefahren/ })).toBeVisible();
    await expect(page.locator('dialog[data-komoot-sheet]')).toHaveCount(0);
  });
});
