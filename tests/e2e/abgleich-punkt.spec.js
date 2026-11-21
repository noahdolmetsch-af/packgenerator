// Noah 21.11.2026 «1-5a»: the dot at «Ich» and the line on Heute say how the sync stands (sync/health.js).
// Off with data: orange dot and a line «Sync is off»; after switching on: a green dot. Fictional fixture data only.
import { test, expect } from './clock.js';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { importAndSettle, settle, openFolds } from './settle.js';
import { makeHandler } from '../../api/sync.js';
import { fakeRedis } from '../fakeredis.js';
import { keysOf, recName, seal } from '../../src/lib/sync/code.js';

const T = (en) => DE[en] ?? en;
const fixture = fileURLToPath(new URL('./fixture.json', import.meta.url));
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


test('The dot at Me and the line on Today: off first, green after switching on', async ({ browser }, info) => {
  const server = syncServer();
  const size = info.project.name === 'phone' ? 390 : 1440;
  const a = await device(browser, info, server);
  await a.page.goto('./');
  await importAndSettle(a.page, fixture);
  await a.page.goto('./#/');
  await settle(a.page);
  await expect(a.page.locator('[data-sync-dot="off"]').first()).toBeVisible();
  await expect(a.page.getByText(T('The sync is off. What you change here does not reach your other device.'))).toBeVisible();
  const line = a.page.getByText(T('The sync is off. What you change here does not reach your other device.'));
  await line.evaluate((el) => el.closest('section').scrollIntoView({ block: 'center' }));
  await a.page.waitForTimeout(800);
  await shot(a.page, `P1-aus-${size}`);
  await a.page.goto('./#/me/data');
  await openFolds(a.page);
  await syncBox(a.page).getByRole('button', { name: T('Switch on sync') }).click();
  await expect(syncBox(a.page).locator('[data-sync-state="ok"]')).toBeVisible();
  await a.page.goto('./#/');
  await settle(a.page);
  await expect(a.page.locator('[data-sync-dot="ok"]').first()).toBeVisible();
  await expect(a.page.getByText(T('The sync is off. What you change here does not reach your other device.'))).toHaveCount(0);
  await shot(a.page, `P2-an-${size}`);
  expect(a.errors).toEqual([]);
  await a.context.close();
});
