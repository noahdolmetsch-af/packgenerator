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

const PLACES = [...readFileSync(new URL('../../src/lib/helper/places.js', import.meta.url), 'utf8').matchAll(/\{ key: '(\w+)'/g)].map((m) => m[1]);
const CODE = 'test_data_gtp_code';
const month = (e) => e.date.slice(0, 7);

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

test('W1: after an update every version since the last visit is open, each line leads to its place, Looos to the first', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info);
  // this device got the update from three versions back (Today checks once when it opens)
  const from = WHATS_NEW[3];
  const since = WHATS_NEW.slice(0, 3);
  await page.goto('./#/me');
  await page.evaluate((v) => localStorage.setItem('whatsnew.seen', v), from.version);
  await page.goto('./#/');
  const sheet = page.locator('dialog.news[open]');
  await expect(sheet.getByRole('heading', { name: T('New since your last visit') })).toBeVisible();
  const points = since.reduce((n, e) => n + e.points.length, 0);
  const small = since.reduce((n, e) => n + (e.small?.length ?? 0), 0);
  await expect(sheet.locator('.vd-sub')).toHaveText(
    [T('{n} updates', { n: 3 }), T('{from} to {to}|versions', { from: shortVersion(since[2].version), to: shortVersion(since[0].version) }), T('{n} news items', { n: points }) + (small ? ` ${T('and a few small things')}` : '')].join(' · '),
  );
  // every version open, newest first, each with its own title and sentence
  await expect(sheet.locator('article[data-version]')).toHaveCount(3);
  expect(await sheet.locator('article[data-version]').evaluateAll((els) => els.map((x) => x.dataset.version))).toEqual(since.map((e) => e.version));
  for (const e of since) {
    const v = sheet.locator(`article[data-version="${e.version}"]`);
    await expect(v.getByRole('heading', { name: T(e.title) })).toBeAttached();
    await expect(v.getByText(T(e.lead))).toBeAttached();
    // the main points: each a row with › to its place (or plain when it has none)
    await expect(v.locator('.vn-pts li')).toHaveCount(e.points.length);
    await expect(v.locator('.vn-pts a')).toHaveCount(e.points.filter((p) => p.href).length);
    // the small things in their boxes
    const boxes = (e.small ?? []).map((s) => T(BOXES.find((b) => b.key === s.box).label));
    expect(await v.locator('.vn-small .vn-kt').allTextContents()).toEqual(boxes);
  }
  // no «n more», nothing folded
  await expect(sheet.locator('details')).toHaveCount(0);
  // the buttons: «Looos» only here; on a phone over the whole width above the other two
  const go = sheet.getByRole('button', { name: T("Let's go|news") });
  const all = sheet.getByRole('link', { name: T('All news') });
  await expect(all).toHaveAttribute('href', '#/me/news');
  await expect(sheet.getByRole('button', { name: T('Later') })).toBeVisible();
  const [g, a] = [await go.boundingBox(), await all.boundingBox()];
  if (info.project.name === 'phone') {
    expect(g.y).toBeLessThan(a.y);
    expect(g.width).toBeGreaterThan(a.width * 1.8);
  } else expect(g.x).toBeGreaterThan(a.x);
  await noSideways(page);
  await shot(page, info, 'W1-neu-fenster');

  // a line of an older version: the window closes, its place opens
  const line = since[1].points.find((p) => p.href);
  await sheet.locator(`article[data-version="${since[1].version}"] .vn-pts a`).first().click();
  await expect(page.locator('dialog.news[open]')).toHaveCount(0);
  await expect.poll(() => new URL(page.url()).hash).toBe(line.href);

  // the next start: «Looos» opens the first place of the newest version
  const next = await context.newPage();
  await next.goto('./#/');
  await next.locator('dialog.news[open]').getByRole('button', { name: T("Let's go|news") }).click();
  await expect.poll(() => new URL(next.url()).hash).toBe(WHATS_NEW[0].points.find((p) => p.href).href);
  expect(errors).toEqual([]);
});

test('W2: Ich, Was ist neu: the newest on top, one row to all functions, every version open by month with its boxes', async ({ page, context }, info) => {
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

  // every version after the newest, open, grouped by month; the months newest first
  const months = [...new Set(WHATS_NEW.slice(1).map(month))];
  const vers = page.locator('.wn-vers');
  await expect(vers.getByText(T('each with its own text, all open, by month'))).toBeVisible();
  expect(await vers.locator('.wn-month').evaluateAll((els) => els.map((x) => x.dataset.month))).toEqual(months);
  const inMonth = WHATS_NEW.filter((e) => month(e) === months[0]).length;
  await expect(vers.locator('.wn-month').first().locator('.wn-mh')).toContainText(T('{n} updates', { n: inMonth }));
  await expect(vers.locator('article[data-version]')).toHaveCount(WHATS_NEW.length - 1);
  await expect(vers.locator('details')).toHaveCount(0);
  // every small thing sits in one of the four boxes, «Fixed» tinted
  const smalls = WHATS_NEW.slice(1).flatMap((e) => e.small ?? []);
  await expect(vers.locator('.vn-small li')).toHaveCount(smalls.length);
  for (const b of BOXES) {
    const n = smalls.filter((s) => s.box === b.key).length;
    await expect(vers.locator(`.vn-small li[data-box="${b.key}"] .vn-kt`)).toHaveCount(n);
    if (n) await expect(vers.locator(`.vn-small li[data-box="${b.key}"] .vn-kt`).first()).toHaveText(T(b.label));
  }
  await expect(vers.locator('.vn-small li[data-box="fixed"] .vn-kt.fix').first()).toBeVisible();
  // the very first version is there too, without a place to go
  await expect(vers.locator('article[data-version="0.1.0"] a')).toHaveCount(0);
  await noSideways(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot(page, info, 'W2-alle-versionen');

  // a line of a card leads to its place
  const e = WHATS_NEW[1];
  await vers.locator(`article[data-version="${e.version}"] .vn-pts a`).first().click();
  await expect.poll(() => new URL(page.url()).hash).toBe(e.points.find((p) => p.href).href);
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
  await expect(row).toContainText(T('off · switch on under Me › AI helper'));
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
  await page.getByRole('button', { name: T('Save'), exact: true }).first().click();
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
  await page.keyboard.press('Escape');

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
