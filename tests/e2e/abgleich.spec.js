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
const item = JSON.parse(readFileSync(fixture, 'utf8')).tables.items[0];
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

test('Changed on both devices: the app asks which version counts, and the chosen one stays', async ({ browser }, info) => {
  const server = syncServer();
  const size = info.project.name === 'phone' ? 390 : 1440;
  // the phone already synced its own version of the first item (fictional)
  const code = '7K2M-9QXA-4F8R-T3WD-H6NB-P2CE-5VJY-8GKS';
  const keys = await keysOf(code);
  const theirs = { ...item, name: `${item.name} (Handy)`, weightG: (item.weightG ?? 0) + 25 };
  const done = await server.call('push', { token: keys.token, items: [{ k: await recName(keys, 'items', item.id), base: 0, e: await seal(keys, { t: 'items', id: item.id, v: theirs, del: false, at: '2026-10-18T17:25:00.000Z', dev: 'phone' }) }] });
  expect(done.done).toHaveLength(1);

  const a = await device(browser, info, server);
  await a.page.goto('./');
  await importAndSettle(a.page, fixture);
  await a.page.goto(`./#/me/data?koppeln=${code}`);
  await syncBox(a.page).getByRole('group', { name: T('Pair with this code?') }).getByRole('button', { name: T('Pair') }).click();
  const dlg = a.page.getByRole('dialog', { name: T('Changed on both devices') });
  await expect(dlg).toBeVisible();
  await expect(dlg).toContainText(item.name);
  await expect(dlg.locator('[data-choice="theirs"]')).toContainText(`${theirs.weightG} g`);
  await expect(dlg.locator('[data-choice="mine"]')).toContainText(`${item.weightG} g`);
  await expect(dlg.locator('[data-choice="theirs"]')).toContainText(T('Phone'));
  await shot(a.page, `A5-frage-${size}`);
  // «Later» keeps both; the panel and the light say what is open
  await dlg.getByRole('button', { name: T('Decide later') }).click();
  await expect(dlg).toBeHidden();
  await expect(syncBox(a.page).locator('[data-sync-asks]')).toContainText(T('{n} entry changed on both devices.').replace('{n}', '1'));
  await shot(a.page, `A6-offen-${size}`);
  await syncBox(a.page).locator('[data-sync-asks]').getByRole('button', { name: T('Decide') }).click();
  await expect(dlg).toBeVisible();
  await dlg.locator('[data-choice="theirs"]').click();
  await expect(dlg).toBeHidden();
  await expect(syncBox(a.page).locator('[data-sync-asks]')).toHaveCount(0);
  // the other version is in place now
  const stored = await a.page.evaluate(
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
    item.id,
  );
  expect(stored).toMatchObject({ name: theirs.name, weightG: theirs.weightG });
  expect(a.errors).toEqual([]);
  await a.context.close();
});
