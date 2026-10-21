// Fitbit über Google (mockups G1–G2, approved by Noah 13.10.2026 17:03 «g1-g2 freigeben»): the page «Fitbit»
// (G1) connects through the Google login, the first fetch keeps the daily values, «Daten und Backup» shows
// the light «Fitbit» and the card «Gesundheitsdaten» (G2) with «Werte wählen» and «Trennen». The server
// (packgen-three.vercel.app/api/google) and the Google login are answered by the test; everything else
// outside the preview server is blocked. Fictional values only.
import { test, expect } from '@playwright/test';
import { ready } from './settle.js';

const P = 'test_data_gtp_';
const zurichToday = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const day = (n) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${zurichToday()}T12:00:00Z`));
const shot = async (page, info, name) => {
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
};

const readTable = (page, name) =>
  page.evaluate(
    (name) =>
      new Promise((ok) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const q = r.result.transaction(name).objectStore(name).getAll();
          q.onsuccess = () => (r.result.close(), ok(q.result));
        };
      }),
    name,
  );

test('Fitbit: connect with Google, first fetch, the card on «Daten und Backup», choose values, disconnect', async ({ page, context, baseURL }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const log = [];
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
  await context.route(/packgen-three\.vercel\.app\/api\/google/, async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const url = new URL(req.url());
    const step = url.searchParams.get('step');
    log.push({ step, auth: req.headers().authorization ?? null, from: url.searchParams.get('from'), to: url.searchParams.get('to') });
    const body = (b) => route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify({ ok: true, ...b }) });
    if (step === 'start') return body({ url: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=x&state=y' });
    if (step === 'days')
      return body({
        days: [
          { date: day(-1), steps: 8123, azm: 24, restingHr: 51 },
          { date: day(0), restingHr: 49, hrvMs: 61.2, sleep: { asleepMin: 400, awakeMin: 40, start: '22:40', end: '06:05', deepMin: 60, remMin: 80, lightMin: 260, efficiency: 90 } },
        ],
      });
    if (step === 'disconnect') return body({});
    return route.fulfill({ status: 400, headers: cors, body: '{}' });
  });
  // the Google login: straight back into the app (as api/_lib/google.js callback does)
  await context.route(/accounts\.google\.com\/o\/oauth2/, (route) => route.fulfill({ status: 302, headers: { location: `${baseURL}#/me/fitbit?google=connected` } }));
  await context.addInitScript((key) => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
    localStorage.setItem('pg.strava.key', key);
  }, `${P}key`);
  await page.goto('./');
  await ready(page);

  // «Daten und Backup»: not connected, grey, the way to the page «Fitbit»
  await page.goto('./#/me/data');
  await expect(page.getByRole('heading', { name: 'Gesundheitsdaten' })).toBeVisible();
  await page.getByRole('link', { name: 'Fitbit verbinden' }).click();

  // G1
  await expect(page.getByRole('heading', { level: 1, name: 'Fitbit verbinden' })).toBeVisible();
  await expect(page.getByText('So kommen deine Werte in die App')).toBeVisible();
  await expect(page.getByText('Ruhepuls und HRV')).toBeVisible();
  await shot(page, info, 'G1');
  await page.getByRole('button', { name: 'Mit Google verbinden' }).click();

  // back from the login: the address is clean, the first fetch asked for 90 days with this device's key
  await expect(page.getByRole('heading', { name: 'Gesundheitsdaten' })).toBeVisible();
  expect(page.url()).not.toContain('google=');
  await expect.poll(() => log.find((x) => x.step === 'days')).toMatchObject({ auth: `Bearer ${P}key`, from: day(-89), to: day(0) });
  expect(log.find((x) => x.step === 'start').auth).toBe(`Bearer ${P}key`);
  await expect.poll(async () => (await readTable(page, 'healthDays')).length).toBe(2);
  const card = page.locator('.hcard');
  await expect(card.getByText('letzte Nacht')).toBeVisible();
  await expect(card.locator('li').filter({ hasText: 'Schritte' })).toContainText('bis gestern');

  // G2 on «Daten und Backup»: the light and the card
  await page.goto('./#/me/data');
  await expect(page.locator('li.light').filter({ hasText: 'Fitbit' })).toContainText('verbunden');
  await shot(page, info, 'G2');

  // «Werte wählen»: without steps the next fetch keeps no steps
  await page.locator('.hcard').getByRole('button', { name: 'Werte wählen' }).click();
  await page.getByRole('checkbox', { name: 'Schritte' }).uncheck();
  await expect(page.locator('.hcard li').filter({ hasText: 'Schritte' })).toHaveCount(0);

  // «Trennen» keeps the values unless asked
  await page.locator('.hcard').getByRole('button', { name: 'Trennen' }).first().click();
  await page.getByRole('dialog', { name: 'Trennen' }).getByRole('button', { name: 'Trennen', exact: true }).click();
  await expect(page.locator('li.light').filter({ hasText: 'Fitbit' })).toContainText('nicht verbunden');
  expect(log.some((x) => x.step === 'disconnect')).toBe(true);
  expect((await readTable(page, 'healthDays')).length).toBe(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  expect(errors).toEqual([]);
});

// Noah 21.10.2026 «fitbit tägliche … werde werden nicht korrekt geliefert»: the app said nothing when the
// fetch failed. The reason stays on the card after a reload, with «Google neu verbinden», and a value
// Google did not give is named.
test('Fitbit: a failed fetch stays visible after a reload; a missing value is named', async ({ page, context, baseURL }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  let mode = 'ok';
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
  await context.route(/packgen-three\.vercel\.app\/api\/google/, async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const step = new URL(req.url()).searchParams.get('step');
    const send = (status, b) => route.fulfill({ status, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify(b) });
    if (step === 'start') return send(200, { ok: true, url: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=x&state=y' });
    if (step !== 'days') return send(400, {});
    if (mode === 'login') return send(401, { error: 'google_login_needed', code: 'google_login_needed' });
    return send(200, { ok: true, days: [{ date: day(0), steps: 5000, restingHr: 50 }], missing: mode === 'nosleep' ? ['sleep'] : [] });
  });
  await context.route(/accounts\.google\.com\/o\/oauth2/, (route) => route.fulfill({ status: 302, headers: { location: `${baseURL}#/me/fitbit?google=connected` } }));
  await context.addInitScript((key) => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
    localStorage.setItem('pg.strava.key', key);
  }, `${P}key`);
  await page.goto('./#/me/fitbit');
  await ready(page);
  await page.getByRole('button', { name: 'Mit Google verbinden' }).click();
  const card = page.locator('.hcard');
  await expect(card.getByText('heute', { exact: false }).first()).toBeVisible();
  await expect(card.locator('[data-health-err]')).toHaveCount(0);

  mode = 'login';
  await card.getByRole('button', { name: 'Jetzt holen' }).click();
  await expect(card.locator('[data-health-err]')).toContainText('Google braucht eine neue Anmeldung');
  await expect(card.locator('[data-health-relogin]')).toBeVisible();
  // after a reload (the automatic fetch waits 15 minutes) the reason is still there
  await page.reload();
  await ready(page);
  await expect(card.locator('[data-health-err]')).toContainText('Zuletzt versucht: heute');
  await expect(card.locator('[data-health-relogin]')).toHaveText('Google neu verbinden');

  mode = 'nosleep';
  await card.getByRole('button', { name: 'Jetzt holen' }).click();
  await expect(card.locator('[data-health-err]')).toHaveCount(0);
  await expect(card.locator('[data-health-relogin]')).toHaveCount(0);
  await expect(card.locator('[data-health-gone]')).toContainText('Schlaf');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  expect(errors).toEqual([]);
});

// Noah 21.10.2026: Heute said «Verbinde Fitbit» while Fitbit was connected and only Google refused the values.
test('Fitbit: Heute names the reason when connected Fitbit gives no values', async ({ page, context, baseURL }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
  await context.route(/packgen-three\.vercel\.app\/api\/google/, async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const step = new URL(req.url()).searchParams.get('step');
    const send = (status, b) => route.fulfill({ status, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify(b) });
    if (step === 'start') return send(200, { ok: true, url: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=x&state=y' });
    if (step === 'days') return send(403, { error: 'google_scope', code: 'google_scope' });
    return send(400, {});
  });
  await context.route(/accounts\.google\.com\/o\/oauth2/, (route) => route.fulfill({ status: 302, headers: { location: `${baseURL}#/me/fitbit?google=connected` } }));
  await context.addInitScript((key) => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
    localStorage.setItem('pg.strava.key', key);
  }, `${P}key`);
  await page.goto('./#/me/fitbit');
  await ready(page);
  await page.getByRole('button', { name: 'Mit Google verbinden' }).click();
  await expect(page.locator('.hcard [data-health-err="google_scope"]')).toBeVisible();
  await page.goto('./#/');
  const empty = page.locator('[data-section="body"] [data-fitbit-empty]');
  await expect(empty).toHaveAttribute('data-fitbit-empty', 'failed');
  await expect(empty).toContainText('Google verweigert gerade die Werte');
  await expect(empty.getByRole('link', { name: 'Zu Fitbit' })).toHaveAttribute('href', '#/me/fitbit');
});
