// Paket K «Unterwegs» (Noah 19.10.2026 «1a und b 2 a und b möglich 4a und kann manuell geändert werden 5a und b», «5a b möglich»):
// on the page Unterwegs the card «Helfer unterwegs» (Nach Hause, Lenker-Ansicht, Vor der Abfahrt, Handschuh-Modus),
// the Ess-Erinnerung, «Bereit für heute?» with the Hör-Tipp, and in «Mehr» Wasser und Essen, Sonne/Mond/Orte,
// Strecke umwandeln and the komoot tour. Fictional data only (test_data_gtp_), the clock on Friday 9 October 2026
// 09:00, every outside address blocked; transport.opendata.ch and Wikipedia are answered by the test.
import { test, expect } from '@playwright/test';
import { openHome, homeFixture, tr, trip, day } from './home0460-fixture.js';

const T = tr('de');
const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const JURA = 'test_data_gtp_Jura-Wochenende';
const noSideways = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const line = Array.from({ length: 30 }, (_, i) => [47.36 + i * 0.002, 7.15 + i * 0.004]);

function data() {
  const d = homeFixture();
  const route = { name: 'test_data_gtp_ Schlaufe', km: 62, gainM: 900, lossM: 900, start: { lat: 47.36, lon: 7.15 }, end: { lat: 47.418, lon: 7.266 }, line, profile: Array.from({ length: 63 }, (_, k) => [k, 450 + Math.round(450 * Math.sin((k / 62) * Math.PI))]), komoot: 'https://www.komoot.com/tour/123456' };
  d.tables.trips = [trip('Jura-Wochenende', day(-1), { days: 3, route }), ...d.tables.trips.filter((x) => !/TEST-Runde/.test(x.title))];
  return d;
}

async function open(page, context, info) {
  await context.addInitScript((id) => localStorage.setItem('pack.currentTrip', id), JURA);
  await openHome(page, context, info, { data: data() });
  await context.route(/transport\.opendata\.ch\/v1\/locations/, (route) => {
    const home = route.request().url().includes('x=47.39');
    return route.fulfill({ json: { stations: [{ id: home ? '8502113' : '8500100', name: home ? 'test_data_gtp_ Heimort' : 'test_data_gtp_ Jura-Dorf', distance: 640 }] } });
  });
  await context.route(/transport\.opendata\.ch\/v1\/connections/, (route) =>
    route.fulfill({ json: { connections: ['10:04', '10:34', '11:04'].map((t) => ({ from: { departure: `${day(0)}T${t}:00+0200`, platform: '2', station: { name: 'test_data_gtp_ Jura-Dorf' } }, to: { arrival: `${day(0)}T12:${t.slice(3)}:00+0200`, station: { name: 'test_data_gtp_ Heimort' } }, duration: '00d02:00:00', transfers: 1, sections: [{ journey: { category: 'IR', number: '16' } }, { journey: { category: 'S', number: '23' } }] })) } }),
  );
  await context.route(/wikipedia\.org/, (route) => route.fulfill({ json: { query: { pages: { 1: { index: 1, title: 'test_data_gtp_ Burg', extract: 'test_data_gtp_ Eine alte Burg am Weg.' } } } } }));
}

test('Unterwegs: helpers, home with 3 trains and Maps, glove mode', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, context, info);
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 47.37, longitude: 7.16 });
  await page.goto('./#/ride');
  const helpers = page.locator('[data-uw-helpers]');
  await expect(helpers).toContainText(T('Helpers on the way'));
  expect(await noSideways(page)).toBe(0);

  await tap(helpers.locator('[data-uw-home]'), info);
  const dlg = page.locator('dialog[data-heimweg]');
  await expect(dlg.locator('[data-trains] li')).toHaveCount(3);
  await expect(dlg).toContainText(T('From {from} to {to}', { from: 'test_data_gtp_ Jura-Dorf', to: 'test_data_gtp_ Heimort' }));
  await expect(dlg.locator('[data-trains] li').first()).toContainText('10:04');
  for (const m of ['transit', 'driving', 'bicycling']) {
    const a = dlg.locator(`[data-maps="${m}"]`);
    await expect(a).toHaveAttribute('target', '_blank');
    expect(await a.getAttribute('href')).toContain(`travelmode=${m}`);
  }
  expect(JSON.stringify(await page.evaluate(() => ({ ...localStorage })))).not.toContain('47.37');
  await dlg.getByRole('button', { name: T('Close') }).click();

  // the glove mode: by hand on, the page gets the big buttons, then back to automatic
  await tap(helpers.getByRole('radio', { name: T('On|switch') }).or(helpers.getByRole('button', { name: T('On|switch'), exact: true })).first(), info);
  await expect(page.locator('html')).toHaveAttribute('data-glove', 'on');
  const h = await helpers.locator('[data-uw-lenker]').evaluate((el) => el.getBoundingClientRect().height);
  expect(h).toBeGreaterThanOrEqual(56);
  await tap(helpers.getByRole('radio', { name: T('Automatic') }).or(helpers.getByRole('button', { name: T('Automatic'), exact: true })).first(), info);
  await expect(page.locator('html')).not.toHaveAttribute('data-glove', 'on');
  expect(errors).toEqual([]);
});

test('Unterwegs: handlebar view with 4 numbers, up to 6 to choose', async ({ page, context }, info) => {
  await open(page, context, info);
  await page.goto('./#/ride');
  await tap(page.locator('[data-uw-lenker]'), info);
  const v = page.locator('[data-lenker]');
  await expect(v.locator('[data-tile]')).toHaveCount(4);
  await expect(v.locator('[data-tile="up"]')).toContainText(/\d{2,}/);
  await tap(v.locator('[data-lenker-choose]'), info);
  await tap(v.getByRole('button', { name: T('Temperature') }), info);
  await tap(v.locator('[data-lenker-choose]'), info);
  await expect(v.locator('[data-tile]')).toHaveCount(5);
  await tap(v.getByRole('button', { name: T('Close') }), info);
  await expect(v).toHaveCount(0);
});

test('Unterwegs: eat reminder, ready card and the folds', async ({ page, context }, info) => {
  await open(page, context, info);
  await page.goto('./#/ride');
  const eat = page.locator('[data-eat]');
  // Paket X «2a»: the soft tone is on and can be switched off
  await expect(eat.locator('[data-eat-sound]')).toBeChecked();
  await tap(eat.locator('[data-eat-start]'), info);
  await expect(eat).toContainText(T('Next in {n} min · at {time}', { n: 45, time: '09:45' }));
  await eat.locator('[data-eat-sound]').uncheck();
  await expect(eat.locator('[data-eat-sound]')).not.toBeChecked();
  await tap(eat.locator('[data-eat-stop]'), info);
  await expect(eat.locator('[data-eat-start]')).toBeVisible();

  await expect(page.locator('[data-bereit]')).toContainText(T('Ready for today?'));
  await expect(page.locator('[data-komoot-tour] a').first()).toHaveAttribute('href', 'https://www.komoot.com/tour/123456');

  const fold = (k) => page.locator(`details[data-fold="${k}"]`);
  await tap(fold('water').locator('summary'), info);
  await expect(fold('water').locator('[data-water]')).toContainText('L');
  await expect(fold('water').locator('[data-water]')).toContainText('kcal');
  await expect(fold('water').locator('[data-water] a[href="#/trips/fuel"]')).toBeVisible();
  await tap(fold('sky').locator('summary'), info);
  await tap(fold('sky').locator('[data-orte-load]'), info);
  await expect(fold('sky')).toContainText('test_data_gtp_ Burg');
  await tap(fold('convert').locator('summary'), info);
  const [dl] = await Promise.all([page.waitForEvent('download'), tap(fold('convert').locator('[data-conv="fit"]'), info)]);
  expect(dl.suggestedFilename()).toMatch(/\.fit$/);
  expect(await noSideways(page)).toBe(0);
});

test('Before you leave: emergency numbers, own contact, PDF', async ({ page, context }, info) => {
  await open(page, context, info);
  await page.goto('./#/ride');
  await tap(page.locator('[data-uw-sheet]'), info);
  const s = page.locator('[data-abfahrt]');
  await expect(s).toContainText('1414');
  await expect(s.locator('svg.map')).toBeVisible();
  await tap(s.locator('[data-contact-add]'), info);
  await s.getByLabel(T('Name'), { exact: true }).fill('test_data_gtp_ Kim');
  await s.getByLabel(T('Phone number')).fill('+41 79 000 00 00');
  await tap(s.getByRole('button', { name: T('Save') }), info);
  await expect(s.locator('a[href="tel:+41790000000"]')).toBeVisible();
  const [dl] = await Promise.all([page.waitForEvent('download'), tap(s.locator('[data-abfahrt-pdf]'), info)]);
  expect(dl.suggestedFilename()).toMatch(/Abfahrt\.pdf$/);
  const wide = await page.evaluate(() => [...document.querySelectorAll('[data-abfahrt] *')].filter((e) => e.getBoundingClientRect().right > document.documentElement.clientWidth + 1).map((e) => `${e.tagName}.${e.className}`).slice(0, 8));
  expect(wide).toEqual([]);
  expect(await noSideways(page)).toBe(0);
});
