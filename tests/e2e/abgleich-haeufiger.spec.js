// Noah 10.11.2026 «sofort»: ein Haken auf einem Geraet steht nach wenigen Sekunden auf dem anderen (2 s bis zum Senden,
// dann fragt das andere Geraet alle 20 s nach), und bei «Heute abhaken» steht «Abgeglichen vor ...».
// Zwei Browser-Kontexte sind zwei Geraete, der Server ist der echte Handler mit falschem Redis. Erfundene Daten.
import { test, expect } from './clock.js';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { importAndSettle, settle, openFolds } from './settle.js';
import { makeHandler } from '../../api/sync.js';
import { fakeRedis } from '../fakeredis.js';

const T = (en) => DE[en] ?? en;
const fixture = fileURLToPath(new URL('./fixture.json', import.meta.url));
const shot = (page, name) => (process.env.MOCK_OUT ? page.screenshot({ path: `${process.env.MOCK_OUT}/${name}.png` }) : null);

function syncServer() {
  const r = fakeRedis();
  const handler = makeHandler({ env: () => ({ redisUrl: 'https://redis.test', redisToken: 'r' }), doFetch: async (url, init) => Response.json({ result: r.run(...((a) => [a[0], a.slice(1)])(JSON.parse(init.body))) }) });
  const attach = async (context) =>
    context.route(/packgen-three\.vercel\.app\/api\/sync/, async (route) => {
      const req = route.request();
      const res = await handler(new Request(req.url(), { method: req.method(), body: req.method() === 'POST' ? req.postData() : undefined, headers: { origin: new URL(req.frame().url()).origin, 'content-type': 'application/json' } }));
      await route.fulfill({ status: res.status, headers: Object.fromEntries(res.headers), body: res.status === 204 ? '' : await res.text() });
    });
  return { attach };
}

async function device(browser, info, server) {
  const context = await browser.newContext({ ...info.project.use, baseURL: info.project.use.baseURL ?? test.info().project.use.baseURL });
  await context.route(/^https?:\/\/(?!localhost[:/])(?!packgen-three\.vercel\.app\/api\/sync)/, (route) => route.abort());
  await server.attach(context);
  await context.addInitScript(() => {
    localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return { context, page, errors };
}

test('Ein Haken auf dem einen Geraet steht kurz danach auf dem anderen, und die Abgleich-Zeile steht bei Heute abhaken', async ({ browser }, info) => {
  test.setTimeout(180_000);
  const server = syncServer();
  const size = info.project.name === 'phone' ? 390 : 1440;
  const a = await device(browser, info, server);
  await a.page.goto('./');
  await importAndSettle(a.page, fixture);
  await a.page.goto('./#/me/data');
  await openFolds(a.page);
  const box = a.page.locator('[data-sync-panel]');
  await box.getByRole('button', { name: T('Switch on sync') }).click();
  const code = (await box.locator('[data-sync-code]').textContent()).trim();
  const b = await device(browser, info, server);
  await b.page.goto(`./#/me/data?koppeln=${code}`);
  await b.page.locator('[data-sync-panel]').getByRole('group', { name: T('Pair with this code?') }).getByRole('button', { name: T('Pair') }).click();
  await expect(b.page.locator('[data-sync-panel]').getByRole('status')).toContainText(T('Paired. From now on both devices keep the same data.'));
  await settle(b.page);

  // both devices show «Heute abhaken»
  await a.page.goto('./#/flow');
  await b.page.goto('./#/flow');
  const tileA = a.page.locator('[data-act="tennis"]').first();
  const tileB = b.page.locator('[data-act="tennis"]').first();
  await expect(tileA).toBeVisible();
  await expect(tileB).toBeVisible();
  await expect(tileB).toHaveAttribute('aria-pressed', 'false');
  // the quiet line under the tiles
  const line = a.page.locator('[data-sync-line]');
  await expect(line).toBeVisible();
  await expect(line).toContainText(T('Synced {ago} ago').split('{ago}')[0].trim());
  await shot(a.page, `S1-zeile-${size}`);

  // a tick on A: B shows it without any tap, within the poll rhythm (20 s) and the 2 s before sending
  await tileA.click();
  await expect(tileA).toHaveAttribute('aria-pressed', 'true');
  await expect(tileB).toHaveAttribute('aria-pressed', 'true', { timeout: 60_000 });
  await shot(b.page, `S2-angekommen-${size}`);

  // and the other way round: taking it back on B reaches A
  await tileB.click();
  await expect(tileB).toHaveAttribute('aria-pressed', 'false');
  await expect(tileA).toHaveAttribute('aria-pressed', 'false', { timeout: 60_000 });
  expect([...a.errors, ...b.errors]).toEqual([]);
  await a.context.close();
  await b.context.close();
});
