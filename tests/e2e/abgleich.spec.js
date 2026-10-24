// P8 «Automatischer Abgleich» (Noah 18.10.2026 «1b und a möglich 2b 3b»): Ich › Daten und Backup ›
// «Abgleich einschalten» on one device, the pairing link on the other, and the question when both
// changed the same entry (3b). Two browser contexts are two devices; the server is the real handler
// (api/sync.js) with a fake Redis in this test. Fictional fixture data only.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { importAndSettle, settle } from './settle.js';
import { makeHandler } from '../../api/sync.js';
import { fakeRedis } from '../fakeredis.js';
import { keysOf, recName, seal } from '../../src/lib/sync/code.js';

const T = (en) => DE[en] ?? en;
const fixture = fileURLToPath(new URL('./fixture.json', import.meta.url));
const [item, item2] = JSON.parse(readFileSync(fixture, 'utf8')).tables.items;
const shot = (page, name) => (process.env.MOCK_OUT ? page.screenshot({ path: `${process.env.MOCK_OUT}/${name}.png` }) : null);

/** One fake server per test, shared by both devices. */
function syncServer() {
  const r = fakeRedis();
  const handler = makeHandler({ env: () => ({ redisUrl: 'https://redis.test', redisToken: 'r' }), doFetch: async (url, init) => Response.json({ result: r.run(...((a) => [a[0], a.slice(1)])(JSON.parse(init.body))) }) });
  const call = async (step, body) => (await handler(new Request(`https://packgen.test/api/sync?step=${step}`, { method: 'POST', body: JSON.stringify(body) }))).json();
  const attach = async (context) =>
    context.route(/packgen-three\.vercel\.app\/api\/sync/, async (route) => {
      const req = route.request();
      const res = await handler(new Request(req.url(), { method: req.method(), body: req.method() === 'POST' ? req.postData() : undefined, headers: { origin: new URL(req.frame().url()).origin, 'content-type': 'application/json' } }));
      await route.fulfill({ status: res.status, headers: Object.fromEntries(res.headers), body: res.status === 204 ? '' : await res.text() });
    });
  return { call, attach };
}

async function device(browser, info, server) {
  const context = await browser.newContext({ ...info.project.use, baseURL: info.project.use.baseURL ?? test.info().project.use.baseURL });
  await context.route(/^https?:\/\/(?!localhost[:/])(?!packgen-three\.vercel\.app\/api\/sync)/, (route) => route.abort());
  await server.attach(context);
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return { context, page, errors };
}

const syncBox = (page) => page.locator('[data-sync-panel]');
const yourData = (page) => page.locator('section[aria-labelledby="yd-h"]');

test('Switch on on one device, pair the other with the link: both have the same data', async ({ browser }, info) => {
  const server = syncServer();
  const size = info.project.name === 'phone' ? 390 : 1440;
  const a = await device(browser, info, server);
  await a.page.goto('./');
  await importAndSettle(a.page, fixture);
  await a.page.goto('./#/me/data');
  const box = syncBox(a.page);
  await expect(box.getByRole('heading', { name: T('Sync automatically') })).toBeVisible();
  await box.scrollIntoViewIfNeeded();
  await shot(a.page, `A1-aus-${size}`);
  await box.getByRole('button', { name: T('Switch on sync') }).click();
  // the pairing view: QR code, the code and the steps
  await expect(box.getByRole('img', { name: T('QR code to pair') })).toBeVisible();
  const code = (await box.locator('[data-sync-code]').textContent()).trim();
  expect(code).toMatch(/^([0-9A-Z]{4}-){7}[0-9A-Z]{4}$/);
  await expect(box.locator('[data-sync-state="ok"]')).toContainText(T('On · last synced {when}.').split('{when}')[0].trim());
  await shot(a.page, `A2-koppeln-${size}`);

  // the other device opens the link
  const b = await device(browser, info, server);
  await b.page.goto(`./#/me/data?koppeln=${code}`);
  const ask = syncBox(b.page).getByRole('group', { name: T('Pair with this code?') });
  await expect(ask).toBeVisible();
  await expect(ask.locator('[data-sync-code]')).toHaveText(code);
  expect(b.page.url()).not.toContain(code); // the code leaves the address at once
  await syncBox(b.page).scrollIntoViewIfNeeded();
  await shot(b.page, `A3-link-${size}`);
  await ask.getByRole('button', { name: T('Pair') }).click();
  await expect(syncBox(b.page).getByRole('status')).toHaveText(T('Paired. From now on both devices keep the same data.'));
  await settle(b.page);
  await expect(yourData(b.page).locator('.csum .num')).toHaveText(await yourData(a.page).locator('.csum .num').textContent());
  await expect(syncBox(b.page).getByRole('button', { name: T('Sync now') })).toBeVisible();
  await shot(b.page, `A4-gekoppelt-${size}`);

  // switch off asks first and can empty the server
  await syncBox(b.page).getByRole('button', { name: T('Switch off|sync') }).click();
  const off = syncBox(b.page).getByRole('group', { name: T('Switch off sync?') });
  await expect(off.getByRole('button', { name: T('Switch off and empty the server') })).toBeVisible();
  await off.getByRole('button', { name: T('Only switch off') }).click();
  await expect(syncBox(b.page).getByRole('button', { name: T('Switch on sync') })).toBeVisible();
  expect([...a.errors, ...b.errors]).toEqual([]);
  await a.context.close();
  await b.context.close();
});

/** One item as stored in the app's database. */
const storedItem = (page, id) =>
  page.evaluate(
    (id) =>
      new Promise((ok, fail) => {
        const r = indexedDB.open('pack-generator');
        r.onerror = fail;
        r.onsuccess = () => {
          const g = r.result.transaction('items').objectStore('items').get(id);
          g.onsuccess = () => ok(g.result);
          g.onerror = fail;
        };
      }),
    id,
  );

// Noah 24.10.2026 (phone screenshot «805 Einträge auf beiden Geräten geändert»): no sync message ever
// shows in the app. An entry changed on both devices settles by itself (the newer change counts), and the
// replaced version waits quietly in Ich › Daten und Backup › «Von selbst abgeglichen».
test('Changed on both devices: nothing asks, anywhere; the newer change counts; the other version can come back', async ({ browser }, info) => {
  const server = syncServer();
  const size = info.project.name === 'phone' ? 390 : 1440;
  // the phone synced its own (older) version of the first two items (fictional)
  const code = '7K2M-9QXA-4F8R-T3WD-H6NB-P2CE-5VJY-8GKS';
  const keys = await keysOf(code);
  const theirs = { ...item, name: `${item.name} (Handy)`, weightG: (item.weightG ?? 0) + 25 };
  const theirs2 = { ...item2, weightG: (item2.weightG ?? 0) + 10 };
  const sealed = async (v, at) => ({ k: await recName(keys, 'items', v.id), base: 0, e: await seal(keys, { t: 'items', id: v.id, v, del: false, at, dev: 'phone' }) });
  const done = await server.call('push', { token: keys.token, items: [await sealed(theirs, '2026-10-18T17:25:00.000Z'), await sealed(theirs2, '2026-10-18T17:26:00.000Z')] });
  expect(done.done).toHaveLength(2);

  const a = await device(browser, info, server);
  await a.page.goto('./');
  await importAndSettle(a.page, fixture);
  await a.page.goto(`./#/me/data?koppeln=${code}`);
  await syncBox(a.page).getByRole('group', { name: T('Pair with this code?') }).getByRole('button', { name: T('Pair') }).click();
  await expect(syncBox(a.page).locator('.msg')).toHaveText(T('Paired. From now on both devices keep the same data.'));
  // no question: not in the panel, not as a window, not as a hint
  await expect(a.page.getByRole('dialog')).toHaveCount(0);
  await expect(a.page.getByText(/beiden Geräten geändert|changed on both devices/i)).toHaveCount(0);
  // this device changed them later (the import just now): its versions stay
  expect(await storedItem(a.page, item.id)).toMatchObject({ name: item.name });
  // the phone's versions wait in the quiet fold
  const fold = syncBox(a.page).locator('[data-sync-history]');
  await expect(fold.locator('summary')).toContainText(`${T('Settled by itself')} (2)`);
  await fold.locator('summary').click();
  await expect(fold.locator('li')).toHaveCount(2);
  await expect(fold).toContainText(theirs.name);
  await fold.scrollIntoViewIfNeeded();
  await shot(a.page, `A6-von-selbst-${size}`);
  // moving through the app and a reload bring no message either
  await a.page.goto('./#/');
  await a.page.reload();
  await a.page.waitForTimeout(1500);
  await expect(a.page.getByRole('dialog')).toHaveCount(0);
  await expect(a.page.getByText(/beiden Geräten geändert|changed on both devices/i)).toHaveCount(0);
  // «Bring back»: the phone's version is in place again, and the one it replaced waits in the fold
  await a.page.goto('./#/me/data');
  await syncBox(a.page).locator('[data-sync-history] summary').click();
  await syncBox(a.page).locator('[data-sync-history] li').filter({ hasText: theirs.name }).getByRole('button', { name: T('Bring back') }).click();
  await expect(syncBox(a.page).locator('.msg')).toHaveText(T('Brought back. The other device gets it with the next sync.'));
  await expect.poll(async () => (await storedItem(a.page, item.id))?.name).toBe(theirs.name);
  expect((await storedItem(a.page, item.id)).weightG).toBe(theirs.weightG);
  await expect(syncBox(a.page).locator('[data-sync-history] li').filter({ hasText: item.name })).toHaveCount(1);
  expect(a.errors).toEqual([]);
  await a.context.close();
});

test('Pairing: «Syncing …» while it runs, no question after the first round, and an error shows in the panel', async ({ browser }, info) => {
  const server = syncServer();
  const code = '3H7P-K2QM-9WXA-F4TR-6DNB-C8EJ-Y5VS-2GKZ';
  const keys = await keysOf(code);
  const theirs = { ...item, weightG: (item.weightG ?? 0) + 40 };
  const sealed = async (v, at) => ({ k: await recName(keys, 'items', v.id), base: 0, e: await seal(keys, { t: 'items', id: v.id, v, del: false, at, dev: 'phone' }) });
  await server.call('push', { token: keys.token, items: [await sealed(theirs, '2026-10-19T04:20:00.000Z')] });

  const a = await device(browser, info, server);
  // a slow server: the line shows while it pairs
  await a.context.route(/packgen-three\.vercel\.app\/api\/sync/, async (route) => {
    await new Promise((ok) => setTimeout(ok, 700));
    await route.fallback();
  });
  await a.page.goto('./');
  await importAndSettle(a.page, fixture);
  await a.page.goto(`./#/me/data?koppeln=${code}`);
  await syncBox(a.page).getByRole('group', { name: T('Pair with this code?') }).getByRole('button', { name: T('Pair') }).click();
  await expect(syncBox(a.page).getByText(T('Syncing …'))).toBeVisible();
  await expect(syncBox(a.page).locator('.msg')).toHaveText(T('Paired. From now on both devices keep the same data.'));
  await expect(a.page.getByRole('dialog')).toHaveCount(0);

  // switched off, and pairing again while the server cannot be reached: the panel says so
  await syncBox(a.page).getByRole('button', { name: T('Switch off|sync') }).click();
  await syncBox(a.page).getByRole('group', { name: T('Switch off sync?') }).getByRole('button', { name: T('Only switch off') }).click();
  await a.context.unrouteAll({ behavior: 'ignoreErrors' });
  await a.context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await syncBox(a.page).getByRole('button', { name: T('I have a code') }).click();
  await syncBox(a.page).getByLabel(T('Code from the other device')).fill(code);
  await syncBox(a.page).getByRole('button', { name: T('Pair') }).click();
  await expect(syncBox(a.page).locator('.msg')).toHaveText(T('No network right now. The sync catches up later.'));
  // outside the panel, nothing about it
  await a.page.goto('./#/');
  await a.page.waitForTimeout(800);
  await expect(a.page.getByRole('dialog')).toHaveCount(0);
  expect(a.errors).toEqual([]);
  await a.context.close();
});
