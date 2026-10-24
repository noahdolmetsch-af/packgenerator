// Noah 21.10.2026 (phone screenshot): the question «Auf beiden Geräten geändert» asked about the app's own
// setting «strava.last» with «Wert: geändert» on both sides, and a «Schliessen» bubble covered the text.
// Now: the app's own settings settle by themselves (the newer one wins); since Noah 24.10.2026 a real
// setting does too, and its replaced version waits in the quiet fold under its name. Fictional data only.
import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { importAndSettle } from './settle.js';
import { makeHandler } from '../../api/sync.js';
import { fakeRedis } from '../fakeredis.js';
import { keysOf, recName, seal } from '../../src/lib/sync/code.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const fixture = fileURLToPath(new URL('./fixture.json', import.meta.url));

function syncServer() {
  const r = fakeRedis();
  const handler = makeHandler({ env: () => ({ redisUrl: 'https://redis.test', redisToken: 'r' }), doFetch: async (url, init) => Response.json({ result: r.run(...((a) => [a[0], a.slice(1)])(JSON.parse(init.body))) }) });
  const call = async (step, body) => (await handler(new Request(`https://packgen.test/api/sync?step=${step}`, { method: 'POST', body: JSON.stringify(body) }))).json();
  const attach = (context) =>
    context.route(/packgen-three\.vercel\.app\/api\/sync/, async (route) => {
      const req = route.request();
      const res = await handler(new Request(req.url(), { method: req.method(), body: req.method() === 'POST' ? req.postData() : undefined, headers: { origin: new URL(req.frame().url()).origin, 'content-type': 'application/json' } }));
      await route.fulfill({ status: res.status, headers: Object.fromEntries(res.headers), body: res.status === 204 ? '' : await res.text() });
    });
  return { call, attach };
}

/** Writes settings rows straight into the app's database (before pairing). */
const putSettings = (page, rows) =>
  page.evaluate(
    (rows) =>
      new Promise((ok, fail) => {
        const r = indexedDB.open('pack-generator');
        r.onerror = fail;
        r.onsuccess = () => {
          const tx = r.result.transaction('settings', 'readwrite');
          for (const row of rows) tx.objectStore('settings').put(row);
          tx.oncomplete = () => ok();
          tx.onerror = fail;
        };
      }),
    rows,
  );

test('Abgleich: settings settle by themselves; a real setting waits in the quiet fold under its name, never its key', async ({ browser }, info) => {
  const server = syncServer();
  const code = '7K2M-9QXA-4F8R-T3WD-H6NB-P2CE-5VJY-8GKS';
  const keys = await keysOf(code);
  // the other device (the computer) synced its versions first
  const sealed = async (v, at) => ({ k: await recName(keys, 'settings', v.key), base: 0, e: await seal(keys, { t: 'settings', id: v.key, v, del: false, at, dev: 'computer' }) });
  const done = await server.call('push', {
    token: keys.token,
    items: [await sealed({ key: 'strava.last', value: { at: '2026-10-20T23:58:00.000Z', n: 2 } }, '2026-10-20T23:58:00.000Z'), await sealed({ key: 'riderWeightG', value: 70000 }, '2026-10-20T23:59:00.000Z')],
  });
  expect(done.done).toHaveLength(2);

  const context = await browser.newContext({ ...info.project.use });
  await context.route(/^https?:\/\/(?!localhost[:/])(?!packgen-three\.vercel\.app\/api\/sync)/, (route) => route.abort());
  await server.attach(context);
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  await importAndSettle(page, fixture);
  // written straight into the database: rows this device never changed through the app (no change time)
  await putSettings(page, [
    { key: 'strava.last', value: { at: '2026-10-20T22:18:00.000Z', n: 1 } },
    { key: 'riderWeightG', value: 72000 },
  ]);

  await page.goto(`./#/me/data?koppeln=${code}`);
  const box = page.locator('[data-sync-panel]');
  await box.getByRole('group', { name: T('Pair with this code?') }).getByRole('button', { name: T('Pair') }).click();
  await expect(box.locator('.msg')).toHaveText(T('Paired. From now on both devices keep the same data.'));
  await expect(page.getByRole('dialog')).toHaveCount(0);
  // the weight: the computer's version counts, this one waits in the fold under its name
  const fold = box.locator('[data-sync-history]');
  await fold.locator('summary').click();
  await expect(fold.locator('li')).toHaveCount(1);
  await expect(fold).toContainText(T('Your weight'));
  await expect(fold).not.toContainText('riderWeightG');
  await expect(fold).not.toContainText('strava.last');
  if (process.env.MOCK_OUT) await page.screenshot({ path: `${process.env.MOCK_OUT}/abgleich-intern-${info.project.name}.png` });

  const setting = (key) =>
    page.evaluate(
      (key) =>
        new Promise((ok, fail) => {
          const r = indexedDB.open('pack-generator');
          r.onerror = fail;
          r.onsuccess = () => {
            const g = r.result.transaction('settings').objectStore('settings').get(key);
            g.onsuccess = () => ok(g.result);
            g.onerror = fail;
          };
        }),
      key,
    );
  // the newer Strava summary (of the computer) is in place, and so is the computer's weight
  expect((await setting('strava.last')).value.n).toBe(2);
  expect((await setting('riderWeightG')).value).toBe(70000);
  // «Bring back» returns this device's weight
  await fold.getByRole('button', { name: T('Bring back') }).click();
  await expect.poll(async () => (await setting('riderWeightG')).value).toBe(72000);
  // moving through the app and a reload bring no message
  await page.goto('./#/');
  await page.reload();
  await page.waitForTimeout(1500);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(errors).toEqual([]);
  await context.close();
});
