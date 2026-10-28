// Gruppenfahrt für Events (Noah 26.10.2026 «1-5 alle», «6 auch für Rennen bauen 7 8 9», «1a 2b 3a 4a 5a»):
// the maker makes a 3-day group with a night pause and opens its own page; a friend in the browser calls for
// help, is ready, adds an expense and a thing; the maker sees the help call, sets a meeting point and a race
// checkpoint; the costs are split; a thunderstorm on the route warns everyone. The contact card from a QR
// link is kept under Ich › Mit Freunden by event. The group server is the real handler over a fake Redis;
// fictional data only.
import { test, expect } from '@playwright/test';
import { openHome, homeFixture } from './home0460-fixture.js';
import { makeGroupHandler } from '../../api/_lib/spur.js';
import { fakeRedis } from '../fakeredis.js';

const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const noSideways = async (page, where = '') => {
  const d = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(d, where).toBeLessThanOrEqual(1);
};

async function groupServer(context) {
  const r = fakeRedis();
  const env = () => ({ redisUrl: 'https://redis.example.test', redisToken: 'r' });
  const doFetch = async (url, init) => Response.json({ result: r.run(...((a) => [a[0], a.slice(1)])(JSON.parse(init.body))) });
  const handler = makeGroupHandler({ env, doFetch, now: () => new Date('2026-10-09T07:00:00Z') });
  await context.route(/packgen-three\.vercel\.app\/api\/sync\?action=group/, async (route) => {
    const req = route.request();
    const res = await handler(new Request(req.url(), { method: req.method(), headers: { origin: 'http://localhost:5173', 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.5' }, body: req.method() === 'POST' ? req.postData() : undefined }));
    await route.fulfill({ status: res.status, json: await res.json() });
  });
  return r;
}

const NOW = Date.parse('2026-10-09T09:00:00+02:00');
/** Open-Meteo for the storm check: a thunderstorm in one hour at the third place along the route. */
async function stormWeather(context, { storm = true } = {}) {
  await context.route(/api\.open-meteo\.com\/v1\/forecast\?latitude=[\d.]+%2C/, (route) => {
    const n = new URL(route.request().url()).searchParams.get('latitude').split(',').length;
    const one = (i) => ({ hourly: { time: [NOW / 1000, NOW / 1000 + 3600], weather_code: [1, storm && i === 2 ? 95 : 1], cape: [0, 0], precipitation_probability: [0, 0] } });
    return route.fulfill({ json: n > 1 ? [...Array(n).keys()].map(one) : one(0) });
  });
}

const line = Array.from({ length: 41 }, (_, i) => [46.93 + i * 0.002, 7.43 + i * 0.002]);

test('Event group: help with a sound, ready, costs, things, meeting point, race checkpoint, storm', async ({ page, context }, info) => {
  test.setTimeout(120_000);
  const data = homeFixture();
  data.tables.settings.push({ key: 'live-route', value: { name: 'test_data_gtp_ Jura-Event', line, km: 21 } });
  const T = await openHome(page, context, info, { data });
  await groupServer(context);
  await stormWeather(context);
  await context.route(/overpass/, (route) => route.fulfill({ json: { elements: [] } }));
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 46.95, longitude: 7.45, accuracy: 10 });

  // the maker: 3 days, night pause 22–6 (on by itself), invite
  await page.goto('./#/live');
  const panel = page.locator('[data-group-panel]');
  await panel.locator('[data-group-myname]').fill('test_data_gtp_ Sam');
  await tap(panel.locator('[data-group-days="3"]'), info);
  await expect(panel.locator('[data-group-night]')).toBeChecked();
  await tap(panel.locator('[data-group-invite]'), info);
  const url = await panel.locator('[data-group-link]').inputValue();
  expect(url).toMatch(/#\/gruppe\//);
  await expect(panel.locator('[data-group-open-event]')).toBeVisible();
  // «Neue Leute merken»: a reminder for the day after the event waits in Kalender › Merken
  const todos = () =>
    page.evaluate(
      () =>
        new Promise((resolve) => {
          const rq = indexedDB.open('pack-generator');
          rq.onsuccess = () => {
            const g = rq.result.transaction('settings').objectStore('settings').get('merken');
            g.onsuccess = () => resolve(g.result?.value ?? []);
          };
        }),
    );
  await expect.poll(async () => (await todos()).filter((x) => x.src?.startsWith('group-met:')).map((x) => x.text)).toEqual([T('Who did you meet at the event? Keep their contact under Me › With friends › Contact card.')]);

  // a friend in the browser: name, share, and calls for help
  const friend = await context.newPage();
  await friend.clock.setFixedTime(new Date(NOW));
  await friend.goto(url);
  await expect(friend.getByText(T('Night pause {from}–{to}.', { from: '22:00', to: '06:00' }))).toBeVisible();
  await friend.locator('[data-group-name]').fill('test_data_gtp_ Tom');
  await tap(friend.locator('[data-group-share]'), info);
  await expect(friend.locator('[data-group-row="me"]')).toBeVisible();
  // a thunderstorm along the route: everyone sees it on top
  await expect(friend.locator('[data-event-storm]')).toBeVisible();
  await tap(friend.locator('[data-event-storm-hide]'), info);
  await expect(friend.locator('[data-event-storm]')).toHaveCount(0);
  await tap(friend.locator('[data-event-help-open]'), info);
  await tap(friend.locator('[data-event-help-kind="flat"]'), info);
  await friend.locator('[data-event-help-text]').fill('test_data_gtp_ kein Schlauch');
  await tap(friend.locator('[data-event-help-send]'), info);
  await expect(friend.locator('[data-event-help-mine]')).toBeVisible();
  // ready, an expense for everyone, a thing the group needs
  await tap(friend.locator('[data-event-ready]'), info);
  await expect(friend.locator('[data-group-row="me"] [data-group-status="ready"]')).toBeVisible();
  await tap(friend.locator('[data-event-cost-add]'), info);
  await friend.locator('[data-event-cost-what]').fill('test_data_gtp_ Zeltplatz');
  await friend.locator('[data-event-cost-amount]').fill('48');
  await tap(friend.locator('[data-event-cost-save]'), info);
  await expect(friend.locator('[data-event-cost="test_data_gtp_ Zeltplatz"]')).toBeVisible();
  await tap(friend.locator('[data-event-item-mode="need"]'), info);
  await friend.locator('[data-event-item-name]').fill('test_data_gtp_ Kettenöl');
  await tap(friend.locator('[data-event-item-add]'), info);
  await expect(friend.locator('[data-event-item="test_data_gtp_ Kettenöl"] [data-event-item-missing]')).toBeVisible();
  await noSideways(friend, 'friend event page');
  await friend.screenshot({ path: info.outputPath('gruppenevent-freund.png'), fullPage: true });

  // the maker opens the page of the group ride: the help call is on top
  await tap(panel.locator('[data-group-open-event]'), info);
  await expect(page.locator('[data-page="groupride"]')).toBeVisible();
  await expect(page.locator('[data-event-help-alert]')).toContainText('test_data_gtp_ Tom');
  await expect(page.locator('[data-event-help-alert]')).toContainText('test_data_gtp_ kein Schlauch');
  await expect(page.locator('[data-event-count]')).toHaveText(T('{ready} of {total} ready, {camp} in camp.', { ready: 1, total: 1, camp: 0 }));
  // the maker has the chain oil: no longer missing
  await tap(page.locator('[data-event-item="test_data_gtp_ Kettenöl"] [data-event-item-mine]'), info);
  await expect(page.locator('[data-event-item="test_data_gtp_ Kettenöl"] [data-event-item-missing]')).toHaveCount(0);
  // the costs: 48 for two → the maker owes Tom 24
  await expect(page.locator('[data-event-transfer]')).toHaveCount(1);
  await expect(page.locator('[data-event-transfer]')).toContainText('CHF 24.00');
  await tap(page.locator('[data-event-transfer-done]'), info);
  await expect(page.locator('[data-event-settled]')).toBeVisible();
  // a meeting point at km 10 of the route
  await tap(page.locator('[data-event-point-add]'), info);
  await tap(page.locator('[data-event-point-kind="lunch"]'), info);
  await page.locator('[data-event-point-name]').fill('test_data_gtp_ Mittag');
  await tap(page.locator('[data-event-point-atkm]'), info);
  await page.locator('[data-event-point-km]').fill('10');
  await tap(page.locator('[data-event-point-save]'), info);
  await expect(page.locator('[data-event-point="lunch"]')).toContainText('test_data_gtp_ Mittag');
  // race mode with a checkpoint
  await page.locator('[data-event-race]').check();
  await page.locator('[data-event-cp-name]').fill('test_data_gtp_ Col');
  await page.locator('[data-event-cp-km]').fill('8');
  await tap(page.locator('[data-event-cp-add]'), info);
  await expect(page.locator('[data-event-plan-cp]')).toHaveCount(1);
  await expect(page.locator('[data-event-cps] [data-event-cp]')).toHaveCount(2); // the checkpoint and the finish
  await noSideways(page, 'group ride page');
  await page.screenshot({ path: info.outputPath('gruppenevent-macher.png'), fullPage: true });

  // the friend sees the meeting point, the checkpoint, and the help is sorted
  await tap(friend.locator('[data-group-refresh]'), info);
  await expect(friend.locator('[data-event-point="lunch"]')).toContainText(T('set by {name}', { name: 'test_data_gtp_ Sam' }));
  await expect(friend.locator('[data-event-cps] [data-event-cp]')).toHaveCount(2);
  await tap(friend.locator('[data-event-cp-tap="0"]'), info);
  await expect(friend.locator('[data-group-row="me"] [data-group-cp]')).toHaveText('test_data_gtp_ Col');
  await tap(friend.locator('[data-event-help-done]'), info);
  await expect(friend.locator('[data-event-help-open]')).toBeVisible();
  await tap(page.locator('[data-group-refresh]'), info);
  await expect(page.locator('[data-event-help-alert]')).toHaveCount(0);
});

test('The group ride page without a group leads to the live map', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await page.goto('./#/gruppenfahrt');
  await expect(page.locator('[data-gr-to-live]')).toBeVisible();
});

test('Contact card: own QR card, keep a card from its link by event, rename the event, delete the person', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  await page.goto('./#/me/freunde?tab=card');
  await page.locator('[data-card-name]').fill('test_data_gtp_ Sam');
  await page.locator('[data-card-field="insta"]').fill('@test_data_velo');
  await page.locator('[data-card-field="insta"]').blur();
  await expect(page.locator('[data-contact-card] svg').first()).toBeVisible();
  await noSideways(page, 'contact card');

  // someone else's card, as the QR code opens it
  const card = Buffer.from(JSON.stringify({ v: 1, name: 'test_data_gtp_ Lea', insta: '@test_data_lea', note: 'Gravel' })).toString('base64url');
  await page.goto(`./#/karte/${card}`);
  await expect(page.getByRole('heading', { level: 1, name: 'test_data_gtp_ Lea' })).toBeVisible();
  await page.locator('[data-card-event]').fill('test_data_gtp_ Jura-Event');
  await tap(page.locator('[data-card-keep]'), info);
  await expect(page.locator('[data-card-kept]')).toBeVisible();

  await page.goto('./#/me/freunde?tab=card');
  const group = page.locator('[data-people-group="test_data_gtp_ Jura-Event"]');
  await expect(group.locator('[data-person="test_data_gtp_ Lea"]')).toBeVisible();
  // rename the event
  await tap(page.locator('[data-event-rename]'), info);
  const sheet = page.getByRole('dialog');
  await sheet.getByRole('textbox').fill('test_data_gtp_ Jura 2026');
  await tap(sheet.getByRole('button', { name: T('Save') }), info);
  await expect(page.locator('[data-people-group="test_data_gtp_ Jura 2026"] [data-person="test_data_gtp_ Lea"]')).toBeVisible();
  // delete the person: asked first, with Undo
  await tap(page.locator('[data-person="test_data_gtp_ Lea"] [data-person-del]'), info);
  await tap(page.getByRole('dialog').getByRole('button', { name: T('Delete') }), info);
  await expect(page.locator('[data-person]')).toHaveCount(0);
});
