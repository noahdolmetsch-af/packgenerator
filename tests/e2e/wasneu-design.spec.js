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
import { READY, HEAD_0155, HELPER_TILES, tripUp } from '../../src/lib/home/tiles.js';
import { openShort } from './kurz-open.js';

// v0.155.0 «Heute neu geordnet» (4b, changed on purpose): the fixture's trip starts tomorrow, so its card stands
// right under the day card; the helper's tile rests while the AI helper is off
const SHOWN = tripUp(READY.filter((x) => !HELPER_TILES.includes(x.id)), true);

const NEWEST = WHATS_NEW[0];
// the newest function (highest since-version) and whether the newest version brought it
const SINCE_ALL = [...readFileSync(new URL('../../src/lib/know/wasneu.js', import.meta.url), 'utf8').matchAll(/'?([\w.]+)'?: '(\d+\.\d+\.\d+)'/g)].map((m) => [m[1], m[2]]);
const vnum = (v) => v.split('.').reduce((a, n) => a * 1000 + Number(n), 0);
const NEW_V = SINCE_ALL.reduce((a, b) => (vnum(b[1]) > vnum(a[1]) ? b : a))[1];
// v0.125.0 Tagespaket: one version can bring several functions (f.tripstate, f.yeargoals); among them the page sorts by name
const NEW_FNS = SINCE_ALL.filter(([, v]) => v === NEW_V).map(([id]) => id);
// how many rows «Since your last visit» shows, from the page source
const SINCE_ROWS = Number(readFileSync(new URL('../../src/pages/WasNeu.svelte', import.meta.url), 'utf8').match(/since\.slice\(0, (\d+)\)/)[1]);
const NEW_IN_NEWEST = SINCE_ALL.some(([, v]) => v === NEWEST.version);
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
  // v0.127.0 A-U1 (changed on purpose): a banner on Today instead of the window, nothing to close first
  await expect(page.locator('[data-news-banner]')).toBeVisible();
  await page.goto('./#/me');
  await page.locator('main').getByRole('link', { name: new RegExp(T('What is new')) }).click();
  await expect(page).toHaveURL(/#\/me\/news$/);
  await expect(page.getByRole('heading', { level: 1, name: T('What is new'), exact: true })).toBeVisible();
  await expect(page.locator('main h1:visible')).toHaveCount(1);
  await expect(page.getByRole('navigation', { name: T('Path') }).getByRole('link', { name: T('Me|place') })).toHaveAttribute('href', '#/me');

  // the newest version as a card: name, one sentence, every point, «Try it» and «How to test it»
  // v0.118.0 «Was ist neu 2» (W2, changed on purpose): the points as rows to their place, the small things in boxes
  const top = page.locator('.wn-top');
  await expect(top).toHaveAttribute('data-newest', NEWEST.version);
  await expect(top.getByRole('heading', { name: T(NEWEST.title) })).toBeVisible();
  await expect(top.getByText(T(NEWEST.lead))).toBeVisible();
  await expect(top.locator('.vn-pts li')).toHaveCount(NEWEST.points.length);
  await expect(top.locator('.vn-small li')).toHaveCount(NEWEST.small?.length ?? 0);
  await expect(top.getByRole('link', { name: T('Try it') })).toHaveAttribute('href', NEWEST.points[0].href);
  await top.getByRole('button', { name: T('How to test it') }).click();
  await expect(page.locator('#wn-test')).toBeInViewport();
  await expect(page.locator('#wn-test li')).toHaveCount(NEWEST.test.length);
  await page.locator('#wn-test input').first().check();
  await page.reload();
  await openShort(page); // 0.163.0: on a phone the side parts are closed lines
  await expect(page.locator('#wn-test input').first()).toBeChecked(); // the ticks stay on this device

  // every function: v0.118.0 (W2, changed on purpose) one row «All functions» to the whole list, which is unchanged:
  // sorted by newest, the six sorts and the search
  const allRow = page.locator('a.wn-allrow');
  await expect(allRow).toHaveAttribute('href', '#/me/news?all&sort=new');
  await expect(allRow).toContainText(T('{n} · sortable, with a search', { n: FEATURE_N }));
  await expect(page.locator('.wn-rows')).toHaveCount(0);
  await allRow.click();
  await expect(page).toHaveURL(/#\/me\/news\?all&sort=new$/);
  await expect(page.getByRole('group', { name: T('Sort') }).getByRole('button')).toHaveCount(SORTS.length);
  await expect(page.getByRole('button', { name: T('Newest'), exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.wn-rows > li')).toHaveCount(FEATURE_N);
  expect(LIST_ROWS).toBeLessThan(FEATURE_N);
  // the function of the newest version first, marked «new»
  expect(NEW_FNS).toContain((await rows(page))[0]);
  expect((await rows(page)).slice(0, NEW_FNS.length).sort()).toEqual([...NEW_FNS].sort());
  // «New» marks the functions of the newest version only (v0.114.0 brings none of its own)
  if (NEW_IN_NEWEST) for (const id of NEW_FNS) await expect(page.locator(`.wn-rows > li[data-feature="${id}"] .wn-new`)).toBeVisible();
  else await expect(page.locator('.wn-rows .wn-new')).toHaveCount(0);
  await page.getByRole('button', { name: T('Name A–Z'), exact: true }).click();
  await expect(page.locator('.wn-rows > li')).toHaveCount(FEATURE_N);
  await page.getByRole('searchbox', { name: T('Find a function') }).fill('Diebstahl');
  await expect(page.locator('.wn-rows > li')).toHaveCount(1);
  await expect(page.locator('.wn-rows > li').first()).toHaveAttribute('data-feature', 'f.theft');
  await page.getByRole('searchbox', { name: T('Find a function') }).fill('');
  await page.goBack();
  await expect(page).toHaveURL(/#\/me\/news$/);

  // SL1 (changed on purpose, Noah 14.10.2026 «SL1–SL4 freigegeben», answers «alle a»): the versions by day,
  // only the newest day open with its rows, a row opens to its points
  const vers = page.locator('.wn-vers');
  await expect(vers.getByRole('heading', { name: T('All versions') })).toBeVisible();
  await expect(vers.locator('[data-group]').first()).toHaveClass(/open/);
  await expect(vers.locator(`[data-row="${NEWEST.version}"]`)).toHaveCount(0);
  const first = vers.locator(`[data-row="${WHATS_NEW[1].version}"]`);
  await expect(first).toContainText(T(WHATS_NEW[1].title));
  await first.click();
  await expect(vers.locator(`article[data-version="${WHATS_NEW[1].version}"] .vn-pts li`)).toHaveCount(WHATS_NEW[1].points.length);

  // the side column: the message switch, since your last visit, how to test, planned next
  await openShort(page); // 0.163.0: on a phone each is a closed line, open here
  const sw = page.getByRole('switch', { name: new RegExp(T('Show the message after updates')) });
  await expect(sw).toBeChecked();
  await expect(page.getByRole('heading', { name: T('Since your last visit') })).toBeVisible();
  // the functions newer than the version before (none when the newest version brings no function of its own)
  const newer = (a, b) => { const x = a.split('.').map(Number), y = b.split('.').map(Number); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i]; return false; };
  const sinceIds = [...SRC.matchAll(/'?([\w.]+)'?: '([\d.]+)'/g)].filter((m) => newer(m[2], BEFORE)).map((m) => m[1]);
  const sinceSec = page.locator('section[aria-labelledby="wn-since-h"], [data-group="wn-since"]');
  await expect(sinceSec.getByText(sinceIds.length === 1 ? T('{n} new function since {v}', { n: 1, v: shortVersion(BEFORE) }) : T('{n} new functions since {v}', { n: sinceIds.length, v: shortVersion(BEFORE) }))).toBeVisible();
  // Paket 2 (0.135.0 brings six functions): the column shows at most SINCE_ROWS of them (read from the page source)
  if (sinceIds.includes(NEW_FNS[0])) {
    const rowsShown = sinceSec.locator('[data-feature]');
    await expect(rowsShown).toHaveCount(Math.min(SINCE_ROWS, sinceIds.length));
    const shownIds = await rowsShown.evaluateAll((els) => els.map((e) => e.dataset.feature));
    // newest first: with more new functions than rows, every row is one of the newest version's functions
    for (const id of shownIds) expect(NEW_FNS.length >= SINCE_ROWS ? NEW_FNS : sinceIds).toContain(id);
    if (NEW_FNS.length <= SINCE_ROWS) for (const id of NEW_FNS) await expect(sinceSec.locator(`[data-feature="${id}"]`)).toBeVisible();
  }
  else await expect(sinceSec.locator('[data-feature]')).toHaveCount(0);
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

// v0.127.0 A-U1 (changed on purpose, mockup A-U1, Noah 13.10.2026 answer 3a): the window became a calm banner on
// Today (tests/e2e/au.spec.js covers it in full); here the switch under Ich that brings it back
test('I11b: the message after an update: the banner closes with × until the next update, back on under Ich', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info);
  await updated(page);
  await expect(page.locator('dialog.news[open]')).toHaveCount(0);
  const banner = page.locator('[data-news-banner]');
  await expect(banner.getByRole('heading', { name: T('New in {v}|banner', { v: V }) })).toBeVisible();
  await expect(banner.getByText(T(NEWEST.title))).toBeVisible();
  await shot(page, info, 'I11b-meldung');
  await noSideways(page);
  await banner.getByRole('button', { name: T('Close the hint') }).click();
  await expect(page.locator('[data-news-banner]')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('wasneu.mute'))).toBe(NEWEST.version);
  // the next start (a new tab): it stays away
  const next = await context.newPage();
  await next.goto('./#/');
  await expect(next.locator('.home')).toBeVisible();
  await expect(next.locator('[data-news-banner]')).toHaveCount(0);

  // switched on again under Ich › Was ist neu: the next start shows it
  await next.goto('./#/me/news');
  await openShort(next);
  const sw = next.getByRole('switch', { name: new RegExp(T('Show the message after updates')) });
  await expect(sw).not.toBeChecked();
  await sw.check();
  await expect(sw).toBeChecked();
  const third = await context.newPage();
  await third.goto('./#/');
  await expect(third.locator('[data-news-banner]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('I11e: the tile New on top of Today for 14 days, Take away and back in its place afterwards', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info);
  await expect.poll(() => ids(page)).toEqual(SHOWN.map((x) => x.id));
  await updated(page);
  await expect(page.locator('[data-news-banner]')).toBeVisible(); // v0.127.0 A-U1: the banner, no window
  const tile = page.locator('.wall [data-tile="news"]');
  // A-U1 (Noah «Nur das Banner ★», 13.10.2026): one «new» on Today; while the banner shows, the tile waits
  await expect(tile).toHaveCount(0);
  await page.locator('[data-news-banner]').getByRole('button', { name: T('Close the hint') }).click();
  await expect(page.locator('[data-news-banner]')).toHaveCount(0);
  // v0.155.0 (changed on purpose): on top right under the head tiles (meditation, day card, Important today)
  await expect.poll(async () => (await ids(page)).filter((id) => id !== 'trip').indexOf('news')).toBe(HEAD_0155.length);
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
  await expect.poll(() => ids(page)).toEqual(SHOWN.map((x) => x.id));
  await expect(tile).toHaveAttribute('data-size', READY.find((x) => x.id === 'news').size);

  // «Take away» takes it off the wall; v0.155.0 (changed on purpose): back in its place it is a small tile
  // without the button, so × in «Customise» does it
  await page.getByRole('button', { name: T('Customise the start page') }).click();
  await page.getByRole('button', { name: T('Take {name} off the start page', { name: T('New in the app') }) }).click();
  await expect(page.locator('.wall [data-tile="news"]')).toHaveCount(0);
  expect(D0).toBe('2026-10-09');
  expect(errors).toEqual([]);
});

test('English: the page reads in English too', async ({ page, context }, info) => {
  const T = await openHome(page, context, info, { lang: 'en' });
  await page.goto('./#/me/news');
  await expect(page.getByRole('heading', { level: 1, name: 'What is new', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: NEWEST.title, level: 2 })).toBeVisible();
  await expect(page.locator('a.wn-allrow')).toContainText('All functions');
  await page.goto('./#/me/news?all&sort=new');
  await expect(page.getByRole('heading', { name: 'All functions' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Your top 10', exact: true })).toBeVisible();
  expect(T('Later')).toBe('Later');
  expect(tr('de')('Later')).toBe('Später');
});
