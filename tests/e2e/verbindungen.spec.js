// Package G «Daten kommen von selbst»: the page Ich › Verbindungen (#155), Strava ticks Aktiv with
// «Erst vorschlagen» (#156), the lake card (#9) and the tours as .ics (#84). The servers are answered by
// the test; everything else outside the preview server is blocked. Fictional values only.
import { test, expect } from './clock.js';
import { ready } from './settle.js';

const zurichToday = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const day = (n) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${zurichToday()}T12:00:00Z`));

const idb = (page, fn, arg) =>
  page.evaluate(
    ([fn, arg]) =>
      new Promise((ok, fail) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const db = r.result;
          const [name, mode, rec] = arg;
          const tx = db.transaction(name, mode);
          const store = tx.objectStore(name);
          const q = fn === 'put' ? store.put(rec) : store.getAll();
          q.onsuccess = () => tx.commit?.();
          tx.oncomplete = () => (db.close(), ok(q.result));
          tx.onerror = () => fail(tx.error);
        };
      }),
    [fn, arg],
  );

test('Verbindungen: all connections, Strava suggests first, the lake, tours as .ics', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
  await context.route(/packgen-three\.vercel\.app\/api\/lake/, (route) =>
    route.fulfill({
      status: 200,
      headers: { ...cors, 'content-type': 'application/json' },
      body: JSON.stringify({
        ok: true,
        at: `${day(0)}T09:00:00.000Z`,
        now: { at: `${day(0)}T08:50:00.000Z`, water: 17.4, air: 12.1 },
        days: [day(-2), day(-1), day(0)].map((d, i) => ({ day: d, min: 16 + i * 0.3, max: 17 + i * 0.3, mean: 16.5 + i * 0.3, n: 144 })),
        forecast: [{ day: day(1), water: 17.6, min: 17.4, max: 17.8 }],
        sources: { measurement: 'ok', forecast: 'ok' },
      }),
    }),
  );
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });

  // Aktiv first: the start activities are there; the lake card (on the weather page since «Aktiv neu», 22.10.2026) shows the measurement
  await page.goto('./#/flow');
  await ready(page);
  await page.goto('./#/wetter');
  await ready(page);
  await expect(page.getByText('17.4', { exact: false }).or(page.getByText('17,4', { exact: false })).first()).toBeVisible();

  // a fictional Strava run of yesterday
  await idb(page, 'put', ['activities', 'readwrite', { id: 'e2e-run-1', day: day(-1), time: '07:00', start: `${day(-1)}T05:00:00Z`, name: 'Morgenrunde', type: 'Run', kind: 'run', km: 8, movingS: 2700 }]);

  // Ich › Verbindungen
  await page.goto('./#/me');
  await page.locator('a[data-row="connections"]').click();
  await expect(page.getByRole('heading', { level: 1, name: 'Verbindungen' })).toBeVisible();
  for (const k of ['strava', 'fitbit', 'agenda', 'mail', 'lake']) await expect(page.locator(`a[data-conn="${k}"]`)).toBeVisible();

  // «Erst vorschlagen»: the run waits; «Zählen» ticks «Laufen» for yesterday
  const ticks = page.locator('[data-section="strava-ticks"]');
  await ticks.getByRole('button', { name: 'Erst vorschlagen' }).click();
  await expect(ticks.getByRole('heading', { name: 'Von Strava: 1 Aktivität zählen?' })).toBeVisible();
  await ticks.getByRole('button', { name: 'Zählen', exact: true }).click();
  await expect(ticks.locator('[data-section="strava-suggest"]')).toHaveCount(0);
  await expect.poll(async () => (await idb(page, 'all', ['flowLog', 'readonly'])).filter((e) => e.via === 'strava').map((e) => [e.actId, e.day])).toEqual([['run', day(-1)]]);

  // the tours as a calendar file
  const dl = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Touren als .ics speichern' }).click();
  expect((await dl).suggestedFilename()).toMatch(/^touren-\d{4}-\d{2}-\d{2}\.ics$/);

  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  expect(errors).toEqual([]);
});

test('#226 Heute im Blick: the fixed date of Aktiv › Woche and a Google appointment of today, by time', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.goto('./#/flow');
  await ready(page);
  // weekday of today in Zurich: 1 Monday … 7 Sunday
  const wd = ((new Date(`${zurichToday()}T12:00:00Z`).getUTCDay() + 6) % 7) + 1;
  await idb(page, 'put', ['settings', 'readwrite', { key: 'flow.fixed', value: [{ id: 'e2e-fix', actId: 'run', wd, time: '18:15', minutes: 45 }] }]);
  await idb(page, 'put', ['gEvents', 'readwrite', { id: 'e2e-ev', day: day(0), cal: 'primary', title: 'Testtermin Muster', allDay: false, start: `${day(0)}T07:30:00Z` }]);
  await page.goto('./#/check/morning');
  const rows = page.locator('[data-row="appt"]');
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText('Testtermin Muster');
  await expect(rows.nth(0)).toContainText('Google Kalender');
  await expect(rows.nth(1)).toContainText('18:15');
  await expect(rows.nth(1)).toContainText('fester Termin');
  expect(errors).toEqual([]);
});
