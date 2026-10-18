// v0.118.0 «Was ist neu 2» (mockups W1–W3, Noah 13.10.2026 00:02 «w1-w3 freigeben», answers 1a 2a 3a 4a 5a)
// and «KI-Helfer ausblenden» (mockups K1–K4, Noah 12.10.2026 21:50 «k1-k4 ok», answer a ★).
// W1: after an update «New since your last visit» shows every version since then fully open, each line a
// link to its place, the small things in their boxes, «Looos ›» to the first place. W2: Ich › Was ist neu with
// the newest version on top, one row «All functions», all versions open by month. K4: the AI helper is off by
// default; one switch under Ich › KI-Helfer brings every place back, the tile on Today included; the key stays.
// The lists come from the app source. Fictional data only (home0460-fixture, test_data_gtp_ names), the clock
// on Friday 9 October 2026 (Europe/Zurich); SHOTS=<folder> saves screenshots.
import { test, expect } from '@playwright/test';
import { openHome, homeFixture } from './home0460-fixture.js';
import { WHATS_NEW, BOXES, shortVersion } from '../../src/lib/whatsnew.js';
import { READY, HELPER_TILES, wallRecord } from '../../src/lib/home/tiles.js';
import { readFileSync } from 'node:fs';
import { closeDialog } from './settle.js';

const PLACES = [...readFileSync(new URL('../../src/lib/helper/places.js', import.meta.url), 'utf8').matchAll(/\{ key: '(\w+)'/g)].map((m) => m[1]);
const CODE = 'test_data_gtp_code';

async function shot(page, info, name, full = false) {
  if (!process.env.SHOTS) return;
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: full });
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

// v0.127.0 A-U1 (changed on purpose, mockup A-U1, Noah 13.10.2026 answer 3a): the window of W1 became a calm banner
// on Today; every version since the last visit stays fully open under Ich › Was ist neu (W2)
test('W1: after an update a banner names the versions since the last visit, View opens Was ist neu', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info);
  // this device got the update from three versions back (Today checks once when it opens)
  const from = WHATS_NEW[3];
  const since = WHATS_NEW.slice(0, 3);
  await page.goto('./#/me');
  await page.evaluate((v) => localStorage.setItem('whatsnew.seen', v), from.version);
  await page.goto('./#/');
  await expect(page.locator('dialog.news[open]')).toHaveCount(0);
  const banner = page.locator('[data-news-banner]');
  await expect(banner.getByRole('heading', { name: T('New in {v}|banner', { v: shortVersion(since[0].version) }) })).toBeVisible();
  await expect(banner.locator('p')).toHaveText(since.map((e) => T(e.title)).join(' · '));
  await noSideways(page);
  await shot(page, info, 'W1-neu-banner');
  await banner.getByRole('link', { name: T('View|news') }).click();
  await expect.poll(() => new URL(page.url()).hash).toBe('#/me/news');
  // the page holds the newest on top and the versions since then in the open group (SL1: rows by day)
  await expect(page.locator(`article[data-version="${since[0].version}"]`).first()).toBeAttached();
  for (const e of since.slice(1)) await expect(page.locator(`[data-row="${e.version}"], article[data-version="${e.version}"]`).first()).toBeAttached();
  expect(errors).toEqual([]);
});

test('W2 + SL1: Ich, Was ist neu: the newest on top, one row to all functions, the versions by day, a row opens with its boxes', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info);
  await page.goto('./#/me/news');
  await expect(page.getByRole('heading', { level: 1, name: T('What is new') })).toBeVisible();
  await expect(page.locator('main').getByText(new RegExp(T('{n} updates since 0.1 · each with its own text · last {date}', { n: WHATS_NEW.length, date: 'X' }).split('X')[0]))).toBeVisible();
  const top = page.locator('.wn-top');
  await expect(top.getByRole('heading', { level: 2, name: T(WHATS_NEW[0].title) })).toBeVisible();
  await expect(top.locator('.vn-pts a')).toHaveCount(WHATS_NEW[0].points.filter((p) => p.href).length);
  await expect(top.getByRole('link', { name: T('Try it') })).toBeVisible();
  await expect(page.locator('a.wn-allrow')).toHaveAttribute('href', '#/me/news?all&sort=new');

  // SL1 (changed on purpose, Noah 14.10.2026 «SL1–SL4 freigegeben», answers «alle a»): every version after
  // the newest by day, the five newest days a group each, older days one group; only the newest open
  const days = [...new Set(WHATS_NEW.slice(1).map((e) => e.date))];
  const vers = page.locator('.wn-vers');
  await expect(vers.getByText(T('by day, the newest open'))).toBeVisible();
  const groups = vers.locator('[data-group]');
  await expect(groups).toHaveCount(Math.min(days.length, 6));
  expect(await groups.evaluateAll((els) => els.map((x) => x.dataset.group))).toEqual(days.length > 5 ? [...days.slice(0, 5), 'older'] : days);
  await expect(groups.first()).toHaveClass(/open/);
  await expect(vers.locator('[data-group].open')).toHaveCount(1);
  const inDay = WHATS_NEW.slice(1).filter((e) => e.date === days[0]).length;
  await expect(groups.first().locator('.ls-gh')).toContainText(inDay === 1 ? T('{n} update', { n: 1 }) : T('{n} updates', { n: inDay }));
  await expect(groups.first().locator('[data-row]')).toHaveCount(inDay <= 6 ? inDay : 5);
  // a row opens to its points and its small things in their boxes, «Fixed» tinted
  const e = WHATS_NEW.slice(1).find((x) => x.date === days[0]);
  await vers.locator(`[data-row="${e.version}"]`).click();
  const card = vers.locator(`article[data-version="${e.version}"]`);
  await expect(card.locator('.vn-pts li')).toHaveCount(e.points.length);
  await expect(card.locator('.vn-small li')).toHaveCount(e.small?.length ?? 0);
  for (const b of BOXES) {
    const n = (e.small ?? []).filter((s) => s.box === b.key).length;
    if (n) await expect(card.locator(`.vn-small li[data-box="${b.key}"] .vn-kt`).first()).toHaveText(T(b.label));
  }
  // the older group opens on a tap; the very first version is in it
  await groups.last().locator('.ls-gh').click();
  await expect(groups.last()).toHaveClass(/open/);
  if (days.length > 5) {
    const more = groups.last().locator('.ls-more');
    await more.click();
    await expect(groups.last().locator('[data-row="0.1.0"]')).toBeAttached();
  }
  // the search keeps what fits and opens every group with a find
  await page.getByRole('searchbox', { name: T('Find an update') }).fill(e.version);
  await expect(vers.locator('[data-row]')).toHaveCount(1);
  await page.getByRole('searchbox', { name: T('Find an update') }).fill('');
  await noSideways(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot(page, info, 'W2-alle-versionen');

  // a line of an open row leads to its place
  const withHref = WHATS_NEW.slice(1).find((x) => x.date === days[0] && x.points.some((p) => p.href));
  if (withHref) {
    if (withHref.version !== e.version) await vers.locator(`[data-row="${withHref.version}"]`).click();
    await vers.locator(`article[data-version="${withHref.version}"] .vn-pts a`).first().click();
    await expect.poll(() => new URL(page.url()).hash).toBe(withHref.points.find((p) => p.href).href);
  }
  expect(errors).toEqual([]);
});

test('K4: the AI helper is off by default; one switch under Ich brings every place back at once, the key stays', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // the wall has the helper's tile (it stays stored while the helper is off)
  const data = homeFixture();
  const wall = [...READY, ...HELPER_TILES.map((id) => ({ id, size: 's' }))];
  data.tables.settings.push({ key: 'homeWall', value: wallRecord(wall) });
  const T = await openHome(page, context, info, { data });
  const tile = page.locator(`.wall [data-tile="${HELPER_TILES[0]}"]`);
  await expect(page.locator('.wall [data-tile="trip"]')).toBeVisible();
  await expect(tile).toHaveCount(0);

  // Ich: the row says it is off and where to switch it on
  await page.goto('./#/me');
  const row = page.locator('main').getByRole('link', { name: new RegExp(`^${T('AI helper')}`) });
  await expect(row).toContainText(T('off · suggestions from Claude, only if you want'));
  await row.click();
  await expect(page.getByRole('heading', { level: 1, name: T('AI helper') })).toBeVisible();
  const sw = page.getByRole('switch', { name: new RegExp(T('Show the AI helper in the app')) });
  await expect(sw).not.toBeChecked();
  await expect(page.getByText(T('Off: it shows nowhere. Your key and your settings stay stored.'))).toBeVisible();
  await expect(page.getByText(T('{n} places · all hidden now', { n: PLACES.length }))).toBeVisible();
  expect(await page.locator('[data-helper-place]').evaluateAll((els) => els.map((x) => x.dataset.helperPlace))).toEqual(PLACES);
  await expect(page.locator('[data-helper-place] .hp-pill')).toHaveText(PLACES.map(() => T('off|helper')));

  // the key is saved, the helper stays off: nothing shows, the tile stays away
  await page.getByLabel(T('Helper code')).fill(CODE);
  await page.getByRole('button', { name: T('Save code'), exact: true }).click(); // Impeccable Runde 2: the 2-step card
  await expect.poll(async () => (await table(page, 'settings')).find((s) => s.key === 'helper')?.value).toMatchObject({ code: CODE });
  await expect(page.getByRole('heading', { name: T('Setup|helper') })).toBeVisible();
  await expect(page.getByText(T('Key saved'))).toBeVisible();
  await expect(sw).not.toBeChecked();
  await noSideways(page);
  await page.reload(); // with the key saved the setup shows as three closed rows
  await expect(page.getByText(T('Key saved'))).toBeVisible();
  await expect(page.getByLabel(T('Helper code'))).toBeHidden();
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot(page, info, 'K4-ich-ki-helfer');
  await page.evaluate((id) => localStorage.setItem('pack.currentTrip', id), 'test_data_gtp_Herbstrunde');
  await page.goto('./#/pack');
  await expect(page.locator('.list-head').first()).toBeVisible();
  await expect(page.locator('.kh-menu-check, .kh-go-check')).toHaveCount(0);
  await shot(page, info, 'K-packen-ohne-helfer');
  await page.goto('./#/');
  await expect(page.locator('.wall [data-tile="trip"]')).toBeVisible();
  await expect(tile).toHaveCount(0);
  await page.getByRole('button', { name: T('Add a tile') }).click();
  const cat = page.getByRole('dialog', { name: T('Add a tile') });
  await expect(cat.locator('[data-add]').first()).toBeVisible();
  await expect(cat.locator(`[data-add="${HELPER_TILES[0]}"]`)).toHaveCount(0);
  // wait until the dialog took its history entry away, else its step back undoes the next address
  await closeDialog(page);

  // one switch: every place is back at once
  await page.goto('./#/helper');
  await sw.check();
  await expect(sw).toBeChecked();
  await expect.poll(async () => (await table(page, 'settings')).find((s) => s.key === 'helper')?.value).toMatchObject({ code: CODE, show: true });
  await expect(page.getByText(T('{n} places · all shown', { n: PLACES.length }))).toBeVisible();
  await expect(page.locator('[data-helper-place] .hp-pill')).toHaveText(PLACES.map(() => T('on|helper')));
  await page.goto('./#/pack');
  await expect(page.locator('.list-head').first()).toBeVisible();
  await expect(page.locator('.kh-menu-check')).toBeAttached();
  await page.goto('./#/');
  await expect(tile).toBeVisible();

  // off again: hidden, but the wall and the key stay stored
  await page.goto('./#/helper');
  await sw.uncheck();
  await page.goto('./#/');
  await expect(page.locator('.wall [data-tile="trip"]')).toBeVisible();
  await expect(tile).toHaveCount(0);
  const stored = await table(page, 'settings');
  expect(stored.find((s) => s.key === 'homeWall').value.tiles.map((x) => x.id)).toContain(HELPER_TILES[0]);
  expect(stored.find((s) => s.key === 'helper').value).toMatchObject({ code: CODE, show: false });
  expect(errors).toEqual([]);
});

test('English: the window and the switch read in English too', async ({ page, context }, info) => {
  const T = await openHome(page, context, info, { lang: 'en' });
  await page.goto('./#/helper');
  await expect(page.getByRole('heading', { level: 1, name: 'AI helper' })).toBeVisible();
  await expect(page.getByRole('switch', { name: /Show the AI helper in the app/ })).not.toBeChecked();
  await page.goto('./#/me/news');
  await expect(page.locator('.vn-kt').first()).toHaveText(/^(New|Nicer|Fixed|Faster)$/);
  expect(T("Let's go|news")).toBe("Let's go");
});
