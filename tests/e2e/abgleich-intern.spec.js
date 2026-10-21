// Noah 21.10.2026 (phone screenshot): the question «Auf beiden Geräten geändert» asked about the app's own
// setting «strava.last» with «Wert: geändert» on both sides, and a «Schliessen» bubble covered the text.
// Now: the app's own settings settle by themselves (the newer one wins); a real setting is asked with its
// name and its values; a window that opens by itself shows no bubble. Fictional data only.
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

test('Abgleich: the app\'s own settings ask nothing; a real setting shows its name and values; no bubble over the window', async ({ browser }, info) => {
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
  await putSettings(page, [
    { key: 'strava.last', value: { at: '2026-10-20T22:18:00.000Z', n: 1 } },
    { key: 'riderWeightG', value: 72000 },
  ]);

  await page.goto(`./#/me/data?koppeln=${code}`);
  const box = page.locator('[data-sync-panel]');
  await box.getByRole('group', { name: T('Pair with this code?') }).getByRole('button', { name: T('Pair') }).click();
  // only the weight is a question; «strava.last» settled by itself
  const first = box.getByRole('group', { name: T('Which device has the right state?') });
  await expect(first).toContainText(T('{n} entry is different on the two devices. The answer counts for it.').replace('{n}', '1'));
  await first.getByRole('button', { name: T('Decide one by one') }).click();
  const dlg = page.getByRole('dialog', { name: T('Changed on both devices') });
  await expect(dlg).toBeVisible();
  await dlg.getByRole('button', { name: T('Decide later') }).click();
  await expect(dlg).toBeHidden();
  // «Later» means quiet for an hour: moving through the app and a reload do not bring it back
  await page.goto('./#/');
  await page.reload();
  await page.waitForTimeout(1500);
  await expect(dlg).toBeHidden();
  expect(await page.evaluate(() => Number(localStorage.getItem('pg.sync.later')) - Date.now())).toBeGreaterThan(50 * 60_000);

  // an hour later (a restart): the window opens by itself, with the focus on its X but no bubble over the text
  await page.evaluate(() => localStorage.removeItem('pg.sync.later'));
  await page.reload();
  await expect(dlg).toBeVisible();
  await expect(dlg.locator('.entry')).toContainText(T('Your weight'));
  await expect(dlg).not.toContainText('riderWeightG');
  await expect(dlg).not.toContainText('strava.last');
  await expect(dlg.locator('[data-choice="mine"]')).toContainText(/72.000 g/);
  await expect(dlg.locator('[data-choice="theirs"]')).toContainText(/70.000 g/);
  await expect(dlg.locator('.ver li b')).not.toHaveText([T('changed|sync'), T('changed|sync')]);
  await page.waitForTimeout(600); // the window has slid in
  await expect(page.locator('.xtip.on')).toHaveCount(0);
  if (process.env.MOCK_OUT) await page.screenshot({ path: `${process.env.MOCK_OUT}/abgleich-intern-${info.project.name}.png` });

  // the newer Strava summary (of the computer) is in place
  const last = await page.evaluate(
    () =>
      new Promise((ok, fail) => {
        const r = indexedDB.open('pack-generator');
        r.onerror = fail;
        r.onsuccess = () => {
          const g = r.result.transaction('settings').objectStore('settings').get('strava.last');
          g.onsuccess = () => ok(g.result);
          g.onerror = fail;
        };
      }),
  );
  expect(last.value.n).toBe(2);
  expect(errors).toEqual([]);
  await context.close();
});
