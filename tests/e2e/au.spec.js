// v0.127.0 Gesamtprüfung A-U1, A-U2, A-U5 (mockups A-U1, A-U2, A-U5, Noah 13.10.2026 16:04 «A-D1–A-D5 und
// A-U1–A-U5 freigeben»; answers 2a 3a):
// A-U1: after an update a calm banner on top of Today instead of a window: Today can be used at once, «Ansehen»
//       opens Ich › Was ist neu, × closes it until the next update, after 7 calendar days it is gone.
// A-U2: a page that throws shows the error page (Zu Heute, Neu laden, Problem melden), never a white page, and
//       the data stays as it was; empty lists use the one empty building block; calm placeholders while loading.
// A-U5: a new trip fills in the riding hours of similar trips (same days) and the home place, green with «aus …»,
//       always changeable; a name that already exists shows at the field with a free name to take.
// Fictional data only (home0460-fixture, test_data_gtp_ names), the clock on Friday 9 October 2026
// (Europe/Zurich), service workers blocked (config). SHOTS=<folder> saves the screenshots (1440 and 390, light).
import { test, expect } from './clock.js';
import { openHome, homeFixture, trip, day, tr } from './home0460-fixture.js';
import { newButton } from './newbutton.js';
import { WHATS_NEW, shortVersion } from '../../src/lib/whatsnew.js';
import { readFileSync } from 'node:fs';
import { openShort } from './kurz-open.js';

const SRC = readFileSync(new URL('../../src/lib/know/wasneu.js', import.meta.url), 'utf8');
const BANNER_DAYS = Number(SRC.match(/export const BANNER_DAYS = (\d+);/)[1]);
const NEWEST = WHATS_NEW[0];
const BOOM = 'test_data_gtp_ boom';

async function shot(page, info, name) {
  if (!process.env.SHOTS) return;
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png` });
}
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
const table = (page, name) =>
  page.evaluate((s) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(s).objectStore(s).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), name);
/** Act as if this device just got the update from the version before (Today checks once when it opens). */
async function updated(page) {
  await page.goto('./#/me');
  await page.evaluate((v) => localStorage.setItem('whatsnew.seen', v), WHATS_NEW[1].version);
  await page.goto('./#/');
  // Today notes the update once (the banner itself is under Ich since «Heute neu» A)
  await expect.poll(() => page.evaluate(() => localStorage.getItem('wasneu.update'))).not.toBeNull();
}

// «Heute neu» A 5b (Noah 20.10.2026, changed on purpose): the banner «New in …» moved from Today to Ich
test('A-U1: after an update a calm banner under Ich, no window, not on Today; View opens the news, × closes it, gone after 7 days', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info);
  await updated(page);
  await expect(page.locator('div.home')).toBeVisible();
  await expect(page.locator('.wall [data-tile]').first()).toBeVisible();
  // Today stays calm: no banner, no window
  await expect(page.locator('[data-news-banner]')).toHaveCount(0);
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await page.goto('./#/me');
  const banner = page.locator('[data-news-banner]');
  await expect(banner.getByRole('heading', { name: T('New in {v}|banner', { v: shortVersion(NEWEST.version) }) })).toBeVisible();
  await expect(banner.locator('p')).toHaveText(T(NEWEST.title));
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  expect((await banner.boundingBox()).y).toBeLessThan((await page.locator('.ich-cols').boundingBox()).y);
  await noSideways(page);
  await shot(page, info, 'au1-ich-banner');

  // «Ansehen» opens Ich › Was ist neu (the whole news stay there) and closes the banner for this update
  await banner.getByRole('link', { name: T('View|news') }).click();
  await expect.poll(() => new URL(page.url()).hash).toBe('#/me/news');
  await expect(page.getByRole('heading', { level: 1, name: T('What is new'), exact: true })).toBeVisible();
  await shot(page, info, 'au1-was-ist-neu');
  await page.goto('./#/me');
  await expect(page.locator('.ich-cols')).toBeVisible();
  await expect(page.locator('[data-news-banner]')).toHaveCount(0);

  // switched on again under Ich: × closes it, it stays away after a reload
  await page.goto('./#/me/news');
  await openShort(page); // 0.163.0: on a phone the switch sits in a closed line
  await page.getByRole('switch', { name: new RegExp(T('Show the message after updates')) }).check();
  await page.goto('./#/me');
  await expect(banner).toBeVisible();
  await banner.getByRole('button', { name: T('Close the hint') }).click();
  await expect(banner).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.ich-cols')).toBeVisible();
  await expect(page.locator('[data-news-banner]')).toHaveCount(0);

  // on again, but the update is 7 calendar days old: the banner is gone by itself (6 days: still there)
  await page.evaluate(() => localStorage.removeItem('wasneu.mute'));
  const age = async (n) => {
    await page.evaluate((at) => localStorage.setItem('wasneu.update', JSON.stringify({ ...JSON.parse(localStorage.getItem('wasneu.update')), at })), day(-n));
    await page.goto('./#/');
    await page.goto('./#/me');
    await expect(page.locator('.ich-cols')).toBeVisible();
  };
  await age(BANNER_DAYS - 1);
  await expect(banner).toBeVisible();
  await age(BANNER_DAYS);
  await expect(page.locator('[data-news-banner]')).toHaveCount(0);
  expect(day(0)).toBe('2026-10-09');
  expect(errors).toEqual([]);
});

test('A-U2: a page that throws shows the error page with three ways, never white; the data stays', async ({ page, context }, info) => {
  // Look (Ich › Darstellung) throws on purpose: one text call in the built app is replaced by a throw
  // since v0.132.0 «Kleine Apps» the app code is the chunk shared by the four pages: assets/main-….js (before: index-….js);
  // since Tempo «Seiten später laden» (19.10.2026) each page has its own file: change the one that has the text
  await context.route(/\/assets\/[\w~-]+\.js$/, async (route) => {
    // background loads (pages loading ahead) can still run when the test ends: then there is nothing to change
    const res = await route.fetch().catch(() => null);
    if (!res) return;
    // the same for a response that was already disposed when the test ended (seen on CI, phone)
    const text = await res.text().catch(() => null);
    if (text == null) return;
    const body = text.replace(/[\w$]+\(`Sage is new; the earlier ones stay`\)/, `(()=>{throw new Error(${JSON.stringify(BOOM)})})()`);
    await route.fulfill({ response: res, body });
  });
  const T = await openHome(page, context, info);
  const before = { trips: await table(page, 'trips'), items: await table(page, 'items'), bikes: await table(page, 'bikes') };
  await page.goto('./#/me/look');
  const fail = page.locator('[data-error-page]');
  await expect(fail.getByRole('heading', { name: T('Something went wrong here') })).toBeVisible();
  await expect(fail.getByText(T('Your data is safe. The page «{page}» could not be loaded.', { page: T('Me|place') }))).toBeVisible();
  // the bars stay: the way out is always there
  await expect(page.getByRole('link', { name: T('Pack Generator, start page') }).or(page.locator('.side')).first()).toBeVisible();
  await noSideways(page);
  await shot(page, info, 'au2-fehlerseite');

  // «Problem melden»: a note with the error text (it stays on this device)
  await fail.getByRole('button', { name: T('Report a problem (the error text goes along)') }).click();
  const note = page.getByRole('textbox', { name: T('Note') });
  await expect(note).toHaveValue(new RegExp(BOOM));
  await page.keyboard.press('Escape');

  // «Zu Heute»: Today works again
  await fail.getByRole('link', { name: T('To Today') }).click();
  await expect(page.locator('div.home')).toBeVisible();
  await expect(page.locator('[data-error-page]')).toHaveCount(0);
  // another page after the error page: built afresh
  await page.goto('./#/me/look');
  await expect(fail).toBeVisible();
  await page.goto('./#/gear');
  await expect(page.locator('[data-error-page]')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  // «Neu laden» reloads the page (the broken page stays broken, the card comes again)
  await page.goto('./#/me/look');
  await expect(fail).toBeVisible();
  await Promise.all([page.waitForEvent('load'), fail.getByRole('button', { name: T('Reload the newest version') }).click()]);
  await expect(page.locator('[data-error-page]')).toBeVisible();
  // nothing in the data changed (the note above was only opened, not saved)
  expect(await table(page, 'trips')).toEqual(before.trips);
  expect(await table(page, 'items')).toEqual(before.items);
  expect(await table(page, 'bikes')).toEqual(before.bikes);
});

test('A-U2: empty lists use the one empty building block, with the next step', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const data = homeFixture();
  data.tables.trips = [];
  data.tables.debriefs = [];
  const T = await openHome(page, context, info, { data });
  await page.goto('./#/trips');
  const empty = page.locator('[data-empty]');
  await expect(empty.getByText(T('No trips yet'), { exact: true })).toBeVisible();
  await expect(empty.getByText(T('A trip is the packing list for one ride or journey.'))).toBeVisible();
  await expect(empty.getByRole('button', { name: T('Create a trip|first') })).toBeVisible();
  await noSideways(page);
  await shot(page, info, 'au2-leer-touren');
  await page.goto('./#/pack/past');
  await expect(page.locator('[data-empty]').getByText(T('No finished trips yet.'))).toBeVisible();
  // a search with no result in Gear: the same block, with «add» and «reset»
  await page.goto('./#/gear');
  const search = page.locator('main').getByRole('searchbox').filter({ visible: true }).first();
  await search.fill('test_data_gtp_ gibt es nicht');
  const none = page.locator('[data-empty]');
  await expect(none.getByText(T('Nothing found.'))).toBeVisible();
  await expect(none.getByRole('button', { name: T('Reset|filters') })).toBeVisible();
  await shot(page, info, 'au2-leer-material');
  expect(errors).toEqual([]);
});

test('A-U2: while Today reads its data, calm placeholders instead of jumping', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  // hold the database answers for a moment, like a slow phone
  await page.addInitScript(() => {
    const open = IDBFactory.prototype.open;
    IDBFactory.prototype.open = function (...a) {
      const req = open.apply(this, a);
      const set = Object.getOwnPropertyDescriptor(IDBRequest.prototype, 'onsuccess').set;
      Object.defineProperty(req, 'onsuccess', { configurable: true, set(fn) { set.call(this, fn && ((e) => setTimeout(() => fn.call(this, e), 1500))); } });
      return req;
    };
  });
  await page.goto('./#/me');
  await page.reload();
  await page.goto('./#/');
  const skel = page.locator('[data-skeleton]');
  await expect(skel).toBeVisible();
  await expect(skel).toHaveAttribute('aria-label', T('Loading…'));
  await shot(page, info, 'au2-laden');
  await expect(page.locator('.wall [data-tile]').first()).toBeVisible({ timeout: 15_000 });
  await expect(skel).toHaveCount(0);
});

function u5Data() {
  const data = homeFixture();
  const T = data.tables;
  const hb = T.trips.find((x) => x.id === 'test_data_gtp_Herbstrunde');
  hb.hours = 5;
  T.trips.push(trip('Zweitag1', day(-30), { days: 2, hours: 4, status: 'done', overnight: 'outdoor' }), trip('Zweitag2', day(-50), { days: 2, hours: 6, status: 'done', overnight: 'outdoor' }));
  return data;
}

test('A-U5: a new trip fills in hours and start, green with where from, changeable; the name is checked at the field', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info, { data: u5Data() });
  await (await newButton(page, T('New'))).click();
  await page.locator('dialog.new').getByRole('button', { name: new RegExp(`^${T('Plan a trip')}`) }).click();
  const dlg = page.locator('dialog.trip-dlg');
  await expect(dlg).toBeVisible();
  // two days: the hours of the last three two-day trips (4, 5, 6 → 5), green with their origin
  await dlg.getByRole('button', { name: T('2 days'), exact: true }).click();
  const hours = dlg.getByLabel(T('Riding hours per day'));
  await expect(hours).toHaveValue('5');
  await expect(hours).toHaveClass(/\bpre\b/);
  await expect(dlg.locator('#tn-hoursfrom')).toHaveText(T('like your last {n} two-day trips · you can change it', { n: 3 }));
  // the start: the home place, green, with where it comes from
  const place = dlg.getByLabel(T('Start postcode or place'));
  await expect(place).toHaveValue('test_data_gtp_ Heimort, Aargau, Switzerland');
  await expect(place).toHaveClass(/\bpre\b/);
  await expect(dlg.locator('#tn-placefrom')).toHaveText(T('from your home place · you can change it'));
  // VS1 (Noah 14.10.2026): the standard bike comes (not the open trip's), said below the chips
  await expect(dlg.locator('.std-pre')).toContainText(T('is chosen. A tap on another bike counts only for this trip.'));
  // the name: one that exists shows at the field, before saving, with a free one to take
  const name = dlg.getByLabel(T('Name'), { exact: true });
  await name.fill('test_data_gtp_ Jura');
  const msg = dlg.locator('#tn-clash');
  await expect(msg).toContainText(T('This name already exists ({when}).', { when: new Date(`${day(-9)}T12:00:00`).toLocaleDateString('de-CH', { month: 'long', year: 'numeric' }) }));
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  await noSideways(page);
  await shot(page, info, 'au5-neue-tour');
  await hours.scrollIntoViewIfNeeded();
  await shot(page, info, 'au5-stunden');
  await msg.getByRole('button', { name: T('Suggestion: «{name}»', { name: 'test_data_gtp_ Jura (2)' }) }).click();
  await expect(name).toHaveValue('test_data_gtp_ Jura (2)');
  await expect(msg).toHaveCount(0);
  // changeable: typing takes the green away; back to the suggestion for the trip
  await hours.fill('3');
  await expect(hours).not.toHaveClass(/\bpre\b/);
  await expect(dlg.locator('#tn-hoursfrom')).toHaveCount(0);
  await hours.fill('5');
  await dlg.getByRole('button', { name: new RegExp(`^${T('Create trip')}`) }).click();
  await expect(dlg).toHaveCount(0);
  await expect.poll(async () => (await table(page, 'trips')).find((x) => x.title === 'test_data_gtp_ Jura (2)')?.hours).toBe(5);
  // after «Create trip» no «Duration not set»
  await expect(page.getByText(T('Duration not set'))).toHaveCount(0);
  await shot(page, info, 'au5-tour-erstellt');
  expect(errors).toEqual([]);
});
