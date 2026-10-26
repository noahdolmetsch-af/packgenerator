// Paket R «Andere Menschen und Geld» (Noah 19.10.2026 «1b 2a oder b 3a und b vorbereiten 4a 5 keine
// inhalte von anderen»), German UI:
// - Ich › Daten und Backup: the two ways (without an account, or «Mit Google anmelden»); back from Google
//   the sync switches on and shows the account (the server is the real /api/sync with a fake Redis; the
//   sign-in answers are faked, nothing leaves the test);
// - Ich › Datenschutz und Nutzung shows its sections;
// - Ich › Velomech und Guide: add a contact, prepare a request mail, delete with Undo.
// Fictional fixture data only.
import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { importAndSettle } from './settle.js';
import { makeHandler } from '../../api/sync.js';
import { fakeRedis } from '../fakeredis.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const fixture = fileURLToPath(new URL('./fixture.json', import.meta.url));
const CODE = '0123-4567-89AB-CDEF-GHJK-MNPQ-RSTV-WXYZ';
const TICKET = 'testticket_0123456789abcdef';

async function fakeServer(context) {
  const r = fakeRedis();
  const sync = makeHandler({ env: () => ({ redisUrl: 'https://redis.test', redisToken: 'r' }), doFetch: async (url, init) => Response.json({ result: r.run(...((a) => [a[0], a.slice(1)])(JSON.parse(init.body))) }) });
  const steps = [];
  await context.route(/^https?:\/\/(?!localhost[:/])(?!packgen-three\.vercel\.app\/api\/sync)/, (route) => route.abort());
  await context.route(/packgen-three\.vercel\.app\/api\/sync/, async (route) => {
    const req = route.request();
    const res = await sync(new Request(req.url(), { method: req.method(), body: req.method() === 'POST' ? req.postData() : undefined, headers: { origin: new URL(req.frame().url()).origin, 'content-type': 'application/json' } }));
    await route.fulfill({ status: res.status, headers: Object.fromEntries(res.headers), body: res.status === 204 ? '' : await res.text() });
  });
  await context.route(/packgen-three\.vercel\.app\/api\/sync\?area=account/, async (route) => {
    const req = route.request();
    const step = new URL(req.url()).searchParams.get('step');
    const body = JSON.parse(req.postData() || '{}');
    steps.push([step, body]);
    const app = new URL(req.frame().url());
    // instead of Google's page: straight back into the app with a ticket, as the callback does
    const answer = step === 'start' ? { url: `${app.origin}${app.pathname}#/me/data?konto=${TICKET}` } : step === 'redeem' ? { code: CODE, email: 'velo@example.test', known: false, session: 'sess-test' } : { ok: true };
    await route.fulfill({ status: 200, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' }, body: JSON.stringify(answer) });
  });
  return steps;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('lang', 'de'));
});

test('Sign in with Google switches on the sync and shows the account', async ({ page, context }) => {
  const steps = await fakeServer(context);
  await page.goto('./');
  await importAndSettle(page, fixture);
  await page.goto('./#/me/data');
  const box = page.locator('[data-sync-panel]');
  await expect(box.getByText(T('Without an account'))).toBeVisible();
  await expect(box.getByText(T('Or with your Google account'))).toBeVisible();
  await box.locator('[data-sync-google]').click();
  // Einzelidee 28 (Noah 26.10.2026 «2a»): first the app says what happens, then «Go on to Google»
  await box.locator('[data-sync-before]').getByRole('button', { name: T('Go on to Google') }).click();
  await expect(box.locator('[data-sync-account]')).toContainText('velo@example.test');
  await expect(page.locator('[data-sync-panel]')).toHaveAttribute('data-sync-on', 'on');
  expect(steps.map((s) => s[0])).toEqual(['start', 'redeem']);
  expect(steps[1][1].ticket).toBe(TICKET);
  expect(steps[1][1].code).toMatch(/^([0-9A-Z]{4}-){7}[0-9A-Z]{4}$/);
  expect(page.url()).not.toContain('konto=');
  // signing out keeps the sync on
  await box.getByRole('button', { name: T('Sign out of Google') }).click();
  await expect(box.locator('[data-sync-account]')).toHaveCount(0);
  await expect(page.locator('[data-sync-panel]')).toHaveAttribute('data-sync-on', 'on');
});

test('Privacy page and the contact list with a request and Undo', async ({ page, context }) => {
  await fakeServer(context);
  await page.goto('./');
  await importAndSettle(page, fixture);
  await page.goto('./#/me');
  await page.getByRole('link', { name: new RegExp(T('Privacy and terms')) }).first().click();
  await expect(page.locator('[data-privacy]')).toBeVisible();
  for (const h of ['On your device', 'Only when you switch it on', 'Costs', 'Daily limit of the server', 'Terms of use']) await expect(page.getByRole('heading', { name: T(h) })).toBeVisible();

  // Klick-Rundgang Q05 (Noah 22.10.2026 «3a», changed on purpose): «App verkaufen» is dropped, Ich no longer lists this page; it opens by its address
  await page.goto('./#/me/pros');
  await expect(page.locator('[data-pros]')).toBeVisible();
  await page.getByRole('button', { name: T('Add contact') }).click();
  const form = page.locator('[data-pro-form]');
  await form.locator('#pf-name').fill('test_data_gtp_ Veloladen');
  await form.locator('#pf-mail').fill('shop@example.test');
  await form.getByRole('button', { name: T('Save') }).click();
  const row = page.locator('[data-pro]').first();
  await expect(row).toContainText('test_data_gtp_ Veloladen');
  await row.getByRole('button', { name: T('Request') }).click();
  await page.locator('#pa-when').fill('Di Vormittag');
  const mail = row.getByRole('link', { name: T('Write the mail') });
  await expect(mail).toHaveAttribute('href', /^mailto:shop@example\.test\?subject=/);
  expect(decodeURIComponent(await mail.getAttribute('href'))).toContain('Di Vormittag');

  await row.getByRole('button', { name: T('Delete {name}', { name: 'test_data_gtp_ Veloladen' }) }).click();
  await page.getByRole('dialog').getByRole('button', { name: T('Delete') }).click();
  await expect(page.locator('[data-pro]')).toHaveCount(0);
  await page.getByRole('button', { name: T('Undo') }).click();
  await expect(page.locator('[data-pro]')).toHaveCount(1);
});
