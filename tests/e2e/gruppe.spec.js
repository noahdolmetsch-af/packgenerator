// Gruppen-Live-Karte (Noah 25.10.2026 «b»): on the live map «Invite the group» makes a link; a friend opens it in
// a second tab (no app data needed), writes a name and shares the location; both see each other in the list;
// the friend stops sharing and is gone; the maker ends the group and the friend's page says it has ended.
// The group server (/api/sync?action=group) is the real handler over a small fake Redis; fictional data only.
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

test('Group ride: invite, a friend shares in the browser, both see each other, leave, end', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  const redis = await groupServer(context);
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 46.95, longitude: 7.45, accuracy: 10 });

  await page.goto('./#/live');
  const panel = page.locator('[data-group-panel]');
  await expect(panel.getByRole('heading', { name: T('Group ride') })).toBeVisible();
  await panel.locator('[data-group-myname]').fill('test_data_gtp_ Fahrer');
  await tap(panel.locator('[data-group-invite]'), info);
  const linkBox = panel.locator('[data-group-link]');
  await expect(linkBox).toHaveValue(/#\/gruppe\/[A-Za-z0-9_-]{22}\/[A-Za-z0-9_-]{43}$/);
  const url = await linkBox.inputValue();
  await expect(panel.locator('[data-group-whatsapp]')).toHaveAttribute('href', /^https:\/\/wa\.me\/\?text=.*%23%2Fgruppe%2F/);
  await expect(panel.locator('[data-group-sms]')).toHaveAttribute('href', /^sms:/);
  // before the ride nobody shares yet (the maker shares only while riding)
  await expect(panel.locator('[data-group-empty]')).toBeVisible();
  await noSideways(page, 'live, group made');
  // the server keeps only sealed text: no name, no title
  const kept = JSON.stringify([...redis.kv].map(([k, v]) => [k, v instanceof Map ? [...v] : v]));
  expect(kept).not.toMatch(/Fahrer/);

  // a friend: the link in a new tab, without the app's pages around it
  const friend = await context.newPage();
  await friend.clock.setFixedTime(new Date('2026-10-09T09:00:00+02:00'));
  await friend.goto(url);
  await expect(friend.locator('[data-group-page]')).toBeVisible();
  await expect(friend.locator('nav.tabbar, [data-nav]')).toHaveCount(0);
  await expect(friend.getByText(T('Nobody sees you until you tap «Share my location». You can stop at any time.'))).toBeVisible();
  // a name first
  await tap(friend.locator('[data-group-share]'), info);
  await expect(friend.getByRole('alert')).toHaveText(T('Write your name first, so the others know who you are.'));
  await friend.locator('[data-group-name]').fill('test_data_gtp_ Freundin');
  await tap(friend.locator('[data-group-share]'), info);
  await expect(friend.locator('[data-group-sharing]')).toBeVisible();
  const me = friend.locator('[data-group-row="me"]');
  await expect(me).toContainText('test_data_gtp_ Freundin');
  await expect(me.locator('[data-group-seen]')).toHaveText(T('seen just now'));
  await noSideways(friend, 'friend page');
  await friend.screenshot({ path: info.outputPath('gruppe-freund.png') });

  // the maker sees the friend
  await tap(panel.locator('[data-group-refresh]'), info);
  await expect(panel.locator('[data-group-row="friend"]')).toContainText('test_data_gtp_ Freundin');

  // the friend stops: gone from the list
  await tap(friend.locator('[data-group-stop]'), info);
  await expect(friend.locator('[data-group-msg]')).toHaveText(T('You no longer share your location. Your place is deleted.'));
  await expect(friend.locator('[data-group-row]')).toHaveCount(0);
  await tap(panel.locator('[data-group-refresh]'), info);
  await expect(panel.locator('[data-group-row]')).toHaveCount(0);

  // the maker ends the group: asked first, then the link no longer works
  await tap(panel.locator('[data-group-end]'), info);
  const ask = page.getByRole('dialog', { name: T('End the group?') });
  await tap(ask.getByRole('button', { name: T('End the group') }), info);
  await expect(panel.locator('[data-group-invite]')).toBeVisible();
  await expect(panel.locator('[data-group-msg]')).toHaveText(T('The group ride has ended. The places are deleted.'));
  await tap(friend.locator('[data-group-refresh]'), info);
  await expect(friend.locator('[data-group-ended]')).toBeVisible();
});

test('Group ride: a broken or ended link says so', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  await groupServer(context);
  await page.goto('./#/gruppe/short/key');
  await expect(page.getByText(T('This link is not complete. Ask for it again.'))).toBeVisible();
  await page.goto(`./#/gruppe/${'a'.repeat(22)}/${'B'.repeat(43)}`);
  await expect(page.locator('[data-group-ended]')).toBeVisible();
});

test('Group ride: while riding the maker shares and sees the group in the sheet; stopping the ride ends it', async ({ page, context }, info) => {
  await openHome(page, context, info);
  const redis = await groupServer(context);
  await context.route(/tiles\.openfreemap\.org|wmts\.geo\.admin\.ch|tile\.openstreetmap\.org|opentopomap|rainviewer/, (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64') }),
  );
  await context.route(/overpass/, (route) => route.fulfill({ json: { elements: [] } }));
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 46.95, longitude: 7.45, accuracy: 8 });
  await page.goto('./#/live');
  const before = page.locator('[data-group-panel]');
  await before.locator('[data-group-myname]').fill('test_data_gtp_ Fahrer');
  await tap(before.locator('[data-group-invite]'), info);
  await expect(before.locator('[data-group-link]')).toHaveValue(/#\/gruppe\//);
  await tap(page.locator('[data-live-start]'), info);
  await expect(page.locator('[data-live-full]')).toBeVisible();
  await tap(page.locator('[data-live-sheet-toggle]'), info);
  const panel = page.locator('[data-live-full] [data-group-panel]');
  await panel.scrollIntoViewIfNeeded();
  // the first fix is sent at once: the maker is in the list
  await expect(panel.locator('[data-group-row="me"]')).toContainText('test_data_gtp_ Fahrer');
  await noSideways(page, 'riding with a group');
  await page.locator('[data-live-stop]').scrollIntoViewIfNeeded();
  await tap(page.locator('[data-live-stop]'), info);
  await tap(page.locator('[data-live-end-yes]'), info); // «Fahrt beenden?» asks once (M9)
  await expect(page.locator('[data-live-group-ended]')).toBeVisible();
  expect([...redis.kv.keys()].filter((k) => k.startsWith('grp:') && !k.startsWith('grp:rate:'))).toEqual([]);
  await expect(page.locator('[data-group-panel] [data-group-invite]')).toBeVisible();
});

// Für Events (Noah 26.10.2026 «1-5 alle»): with a route the friend can wait, load the stops along it and save it as GPX
test('Group ride for events: I am waiting here, stops along the route, route as GPX', async ({ page, context }, info) => {
  const data = homeFixture();
  const line = Array.from({ length: 41 }, (_, i) => [46.93 + i * 0.002, 7.43 + i * 0.002]);
  data.tables.settings.push({ key: 'live-route', value: { name: 'test_data_gtp_ Runde', line, km: 21 } });
  const T = await openHome(page, context, info, { data });
  await groupServer(context);
  await context.route(/overpass/, (route) =>
    route.fulfill({ json: { elements: [{ type: 'node', id: 7, lat: 46.962, lon: 7.4615, tags: { amenity: 'drinking_water', name: 'test_data_gtp_ Brunnen' } }, { type: 'node', id: 8, lat: 46.966, lon: 7.466, tags: { amenity: 'fuel', name: 'test_data_gtp_ Tankstelle' } }] } }),
  );
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 46.95, longitude: 7.45, accuracy: 10 });
  await page.goto('./#/live');
  const panel = page.locator('[data-group-panel]');
  await panel.locator('[data-group-myname]').fill('test_data_gtp_ Fahrer');
  await tap(panel.locator('[data-group-invite]'), info);
  const url = await panel.locator('[data-group-link]').inputValue();
  expect(url).toMatch(/#\/gruppe\//);

  const friend = await context.newPage();
  await friend.clock.setFixedTime(new Date('2026-10-09T09:00:00+02:00'));
  await friend.goto(url);
  await expect(friend.getByRole('heading', { level: 1, name: 'test_data_gtp_ Runde' })).toBeVisible();
  await friend.locator('[data-group-name]').fill('test_data_gtp_ Freundin');
  await tap(friend.locator('[data-group-share]'), info);
  await expect(friend.locator('[data-group-row="me"]')).toBeVisible();
  // km along the route
  await expect(friend.locator('[data-group-row="me"]')).toContainText(/km \d/);
  // I am waiting here: the tag for me, and the maker sees it too
  await tap(friend.locator('[data-group-waithere]'), info);
  await expect(friend.locator('[data-group-waiting]')).toBeVisible();
  await expect(friend.locator('[data-group-row="me"] [data-group-wait]')).toHaveText(T('waiting'));
  await tap(panel.locator('[data-group-refresh]'), info);
  await expect(panel.locator('[data-group-row="friend"] [data-group-wait]')).toBeVisible();
  // the stops ahead along the route
  await tap(friend.locator('[data-group-stops-load]'), info);
  await expect(friend.locator('[data-group-stop-row]').first()).toBeVisible();
  await expect(friend.getByText('test_data_gtp_ Brunnen')).toBeVisible();
  // the route as a GPX file
  const [file] = await Promise.all([friend.waitForEvent('download'), tap(friend.locator('[data-group-gpx]'), info)]);
  expect(file.suggestedFilename()).toMatch(/\.gpx$/);
  const { readFileSync } = await import('node:fs');
  expect(readFileSync(await file.path(), 'utf8')).toMatch(/<trkpt lat="46\.9/);
  await noSideways(friend, 'friend page with stops');
  await friend.screenshot({ path: info.outputPath('gruppe-event-freund.png'), fullPage: true });
  // riding on more than 300 m ends the waiting by itself
  await context.setGeolocation({ latitude: 46.96, longitude: 7.46, accuracy: 10 });
  await expect(friend.locator('[data-group-waiting]')).toHaveCount(0, { timeout: 10_000 });
});
