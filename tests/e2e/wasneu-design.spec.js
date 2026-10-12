// v0.110.0 Design-Refresh P10 «Was ist neu» (I11–I11e; Noah 12.10.2026 «Runde 20 freigegeben»):
// Ich › Was ist neu with the newest version as a card, every function one by one (sortable, with a search),
// all versions by month and the side column; the whole list sorted by «Your top 10» (counted on this device)
// and «Most important 10»; the message after an update («Do not show again» until the next update, «Later»
// only for this start); the tile «New» on top of Today for 14 days. The lists come from the app source.
// Fictional data only (home0460-fixture, test_data_gtp_ names), the clock on Friday 9 October 2026
// (Europe/Zurich); SHOTS=<folder> saves screenshots.
import { test, expect } from '@playwright/test';
import { D0, openHome, tr } from './home0460-fixture.js';
import { WHATS_NEW, shortVersion } from '../../src/lib/whatsnew.js';
import { readFileSync } from 'node:fs';
import { READY } from '../../src/lib/home/tiles.js';

const NEWEST = WHATS_NEW[0];
const V = shortVersion(NEWEST.version);
const BEFORE = WHATS_NEW[1].version;
// the lists of the page, read from the app source (wasneu.js imports the catalogue, which needs the app's runtime)
const SRC = readFileSync(new URL('../../src/lib/know/wasneu.js', import.meta.url), 'utf8');
const BEST = [...SRC.match(/export const BEST = \[([^\]]*)\]/)[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
const SORTS = [...SRC.match(/export const SORTS = \[([\s\S]*?)\n\];/)[1].matchAll(/key: '(\w+)'/g)].map((m) => m[1]);
const num = (name) => Number(SRC.match(new RegExp(`export const ${name} = (\\d+);`))[1]);
const LIST_ROWS = num('LIST_ROWS');
const TILE_DAYS = num('TILE_DAYS');
const USES_KEY = SRC.match(/export const USES_KEY = '([^']+)'/)[1];
const FEATURE_N = (() => {
  const f = readFileSync(new URL('../../src/lib/features.js', import.meta.url), 'utf8');
  const tips = f.match(/const TIP_GROUP = \{([\s\S]*?)\n\};/)[1].match(/\w+: '/g).length;
  const own = f.match(/const OWN = \[([\s\S]*?)\n\];/)[1].match(/\{ id: '/g).length;
  return tips + own;
})();

async function shot(page, info, name) {
  if (!process.env.SHOTS) return;
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
}
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
const ids = (page) => page.locator('.wall [data-tile]').evaluateAll((els) => els.map((e) => e.dataset.tile));
const rows = (page) => page.locator('.wn-rows > li').evaluateAll((els) => els.map((e) => e.dataset.feature));
/** A calendar day n days from D0 (Europe/Zurich has no time in it: plain dates). */
const dayFrom = (n) => {
  const d = new Date(Date.UTC(2026, 9, 9));
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
/** Act as if this device just got the update from the version before. */
async function updated(page) {
  // away from Today first: Today checks once when it opens, so the mark is set while it is closed
  await page.goto('./#/me');
  await page.evaluate((v) => localStorage.setItem('whatsnew.seen', v), BEFORE);
  await page.goto('./#/');
}

test('I11: Ich, Was ist neu: the newest version, every function, all versions and the side column', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info);
  await updated(page);
  await page.locator('dialog.news[open]').getByRole('button', { name: T('Later') }).click();
  await page.goto('./#/me');
  await page.locator('main').getByRole('link', { name: new RegExp(T('What is new')) }).click();
  await expect(page).toHaveURL(/#\/me\/news$/);
  await expect(page.getByRole('heading', { level: 1, name: T('What is new'), exact: true })).toBeVisible();
  await expect(page.locator('main h1:visible')).toHaveCount(1);
  await expect(page.getByRole('navigation', { name: T('Path') }).getByRole('link', { name: T('Me|place') })).toHaveAttribute('href', '#/me');

  // the newest version as a card: name, one sentence, every point, «Try it» and «How to test it»
  const top = page.locator('.wn-top');
  await expect(top).toHaveAttribute('data-newest', NEWEST.version);
  await expect(top.getByRole('heading', { name: T(NEWEST.title) })).toBeVisible();
  await expect(top.getByText(T(NEWEST.lead))).toBeVisible();
  await expect(top.locator('.wn-checks li')).toHaveCount(NEWEST.points.length);
  await expect(top.getByRole('link', { name: T('Try it') })).toHaveAttribute('href', NEWEST.points[0].href);
  await top.getByRole('button', { name: T('How to test it') }).click();
  await expect(page.locator('#wn-test')).toBeInViewport();
  await expect(page.locator('#wn-test li')).toHaveCount(NEWEST.test.length);
  await page.locator('#wn-test input').first().check();
  await page.reload();
  await expect(page.locator('#wn-test input').first()).toBeChecked(); // the ticks stay on this device

  // every function: 10 rows sorted by newest, «All n functions», the six sorts and the search
  await expect(page.getByRole('group', { name: T('Sort') }).getByRole('button')).toHaveCount(SORTS.length);
  await expect(page.getByRole('button', { name: T('Newest'), exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.wn-rows > li')).toHaveCount(LIST_ROWS);
  expect((await rows(page))[0]).toBe('f.news');
  await expect(page.locator('.wn-rows > li[data-feature="f.news"] .wn-new')).toBeVisible();
  await expect(page.getByRole('link', { name: new RegExp(T('All {n} functions', { n: FEATURE_N })) })).toHaveAttribute('href', '#/me/news?all&sort=new');
  await page.getByRole('button', { name: T('Name A–Z'), exact: true }).click();
  await expect(page.locator('.wn-rows > li')).toHaveCount(LIST_ROWS);
  await page.getByRole('searchbox', { name: T('Find a function') }).fill('Diebstahl');
  await expect(page.locator('.wn-rows > li')).toHaveCount(1);
  await expect(page.locator('.wn-rows > li').first()).toHaveAttribute('data-feature', 'f.theft');
  await page.getByRole('searchbox', { name: T('Find a function') }).fill('');

  // all versions by month, the newest month open; a version opens its points
  const vers = page.locator('.wn-vers');
  await expect(vers.getByRole('heading', { name: T('All versions') })).toBeVisible();
  const first = vers.locator(`details[data-version="${NEWEST.version}"]`);
  await first.locator('summary').click();
  await expect(first.locator('.wn-pts li')).toHaveCount(NEWEST.points.length);

  // the side column: the message switch, since your last visit, how to test, planned next
  const sw = page.getByRole('switch', { name: new RegExp(T('Show the message for {v}', { v: V })) });
  await expect(sw).toBeChecked();
  await expect(page.getByRole('heading', { name: T('Since your last visit') })).toBeVisible();
  await expect(page.locator('section[aria-labelledby="wn-since-h"] [data-feature="f.news"]')).toBeVisible();
  await expect(page.getByRole('heading', { name: T('How to test {v}', { v: V }) })).toBeVisible();
  await expect(page.getByRole('heading', { name: T('Planned next') })).toBeVisible();
  await noSideways(page);
  await shot(page, info, 'I11-was-ist-neu');
  expect(errors).toEqual([]);
});

test('I11c and I11d: the whole list by Your top 10 (counted on this device) and Most important 10', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info);
  await page.goto('./#/me/news?all&sort=top');
  await expect(page.getByRole('navigation', { name: T('Path') }).getByRole('link', { name: T('What is new') })).toHaveAttribute('href', '#/me/news');
  await expect(page.getByRole('button', { name: T('Your top 10'), exact: true })).toHaveAttribute('aria-pressed', 'true');
  // nothing counted yet: a calm line, no rows
  await expect(page.locator('.wn-rows > li')).toHaveCount(0);
  await expect(page.getByText(T('Nothing counted yet: open a function with «Go», and it counts here.'))).toBeVisible();

  // «Loslegen» («Go») opens the place and counts once, only in this browser (localStorage)
  await page.getByRole('button', { name: T('Most important 10'), exact: true }).click();
  expect(await rows(page)).toEqual(BEST);
  await expect(page.locator('.wn-rank')).toHaveCount(BEST.length);
  await expect(page.getByRole('heading', { name: T('Two rankings') })).toBeVisible();
  await shot(page, info, 'I11d-wichtigste10');
  await page.locator('.wn-rows > li[data-feature="f.basecheck"]').getByRole('button', { name: T('Go|news') }).click();
  await expect(page).toHaveURL(/#\/ride/);
  await expect.poll(() => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), USES_KEY)).toEqual({ 'f.basecheck': 1 });
  await page.goto('./#/me/news?all&sort=top');
  await expect(page.locator('.wn-rows > li')).toHaveCount(1);
  const row = page.locator('.wn-rows > li[data-feature="f.basecheck"]');
  await expect(row.locator('.wn-n')).toHaveText('1×');
  await expect(row.locator('.wn-bar')).toBeVisible();
  await expect(page.getByText(T('Counted only on this device, how often you open a function. Nothing leaves it.'))).toBeVisible();
  // the other sorts beside the list; one tap sorts
  await expect(page.getByRole('heading', { name: T('Other sorts') })).toBeVisible();
  await page.locator('[data-sort-to="name"]').click();
  await expect(page.getByRole('button', { name: T('Name A–Z'), exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.wn-rows > li')).toHaveCount(FEATURE_N);
  await noSideways(page);
  await shot(page, info, 'I11c-alle');
  expect(errors).toEqual([]);
});

test('I11b: the message after an update: Later for this start, Do not show again until the next update, back on under Ich', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info);
  await updated(page);
  const sheet = page.locator('dialog.news[open]');
  await expect(sheet.getByRole('heading', { name: T('New in {v}: {name}', { v: V, name: T(NEWEST.title) }) })).toBeVisible();
  await expect(sheet.getByText(T('at each start after an update, on computer and phone'))).toBeVisible();
  await expect(sheet.locator('.pts li')).toHaveCount(Math.min(4, NEWEST.points.length));
  await expect(sheet.getByRole('link', { name: T('All news') })).toHaveAttribute('href', '#/me/news');
  await shot(page, info, 'I11b-meldung');
  await noSideways(page);
  // «Later»: gone for this start, also after a reload
  await sheet.getByRole('button', { name: T('Later') }).click();
  await expect(page.locator('dialog.news[open]')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.home')).toBeVisible();
  await expect(page.locator('dialog.news[open]')).toHaveCount(0);

  // the next start (a new tab): it comes again; tick «Do not show again»
  const next = await context.newPage();
  await next.goto('./#/');
  const again = next.locator('dialog.news[open]');
  await expect(again).toBeVisible();
  await again.getByRole('checkbox', { name: new RegExp(T('Do not show again')) }).check();
  await again.getByRole('button', { name: T('Close') }).click();
  await expect(next.locator('dialog.news[open]')).toHaveCount(0);
  expect(await next.evaluate(() => localStorage.getItem('wasneu.mute'))).toBe(NEWEST.version);
  const third = await context.newPage();
  await third.goto('./#/');
  await expect(third.locator('.home')).toBeVisible();
  await expect(third.locator('dialog.news[open]')).toHaveCount(0);

  // switched on again under Ich › Was ist neu: the next start shows it
  await third.goto('./#/me/news');
  const sw = third.getByRole('switch', { name: new RegExp(T('Show the message for {v}', { v: V })) });
  await expect(sw).not.toBeChecked();
  await sw.check();
  await expect(sw).toBeChecked();
  const fourth = await context.newPage();
  await fourth.goto('./#/');
  await expect(fourth.locator('dialog.news[open]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('I11e: the tile New on top of Today for 14 days, Take away and back in its place afterwards', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info);
  expect(await ids(page)).toEqual(READY.map((x) => x.id));
  await updated(page);
  await page.locator('dialog.news[open]').getByRole('button', { name: T('Later') }).click();
  const tile = page.locator('.wall [data-tile="news"]');
  await expect.poll(async () => (await ids(page))[0]).toBe('news');
  await expect(tile).toHaveAttribute('data-size', 'long');
  await expect(tile.getByText(T('New in {v} · {n} days left', { v: V, n: TILE_DAYS }))).toBeVisible();
  await expect(tile.getByRole('heading', { name: T(NEWEST.title) })).toBeVisible();
  await expect(tile.getByRole('link', { name: T('What is new') })).toHaveAttribute('href', '#/me/news');
  await expect(tile.getByRole('link', { name: T('Try it') })).toHaveAttribute('href', NEWEST.points[0].href);
  await noSideways(page);
  await shot(page, info, 'I11e-kachel-heute');

  // after the 14 days (calendar days from the update) it goes back where it stood
  await page.evaluate((at) => {
    const u = JSON.parse(localStorage.getItem('wasneu.update'));
    localStorage.setItem('wasneu.update', JSON.stringify({ ...u, at }));
  }, dayFrom(-TILE_DAYS));
  await page.reload();
  await expect.poll(() => ids(page)).toEqual(READY.map((x) => x.id));
  await expect(tile).toHaveAttribute('data-size', READY.find((x) => x.id === 'news').size);

  // «Take away» takes it off the wall, like × in «Customise»
  await tile.getByRole('button', { name: T('Take away|tile') }).click();
  await expect(page.locator('.wall [data-tile="news"]')).toHaveCount(0);
  expect(D0).toBe('2026-10-09');
  expect(errors).toEqual([]);
});

test('English: the page reads in English too', async ({ page, context }, info) => {
  const T = await openHome(page, context, info, { lang: 'en' });
  await page.goto('./#/me/news');
  await expect(page.getByRole('heading', { level: 1, name: 'What is new', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'All functions' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Your top 10', exact: true })).toBeVisible();
  expect(T('Later')).toBe('Later');
  expect(tr('de')('Later')).toBe('Später');
});
