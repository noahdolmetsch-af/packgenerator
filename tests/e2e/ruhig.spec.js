// Paket C «Ruhig und persönlich» (Noah 24.10.2026, 996 Ideen «5a»): Ich › Ruhig und persönlich and its nine
// sub-pages. German, fictional data only, no internet. Phone and desktop.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { SUBS } from '../../src/lib/ruhig/subs.js';
import { settle } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');

async function blank(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}
const noSideScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test('Ich leads to the overview; every sub-page opens without errors and fits the screen', async ({ page, context }) => {
  const errors = await blank(page, context);
  await page.goto('./#/me');
  await page.locator('main').waitFor();
  await page.locator('a[data-row="ruhig"]').click();
  await expect(page).toHaveURL(/#\/me\/ruhig$/);
  const hub = page.locator('[data-ruhig-hub]');
  await expect(hub.locator('a[data-sub]')).toHaveCount(SUBS.length);
  for (const s of SUBS) {
    await page.goto(`./#/me/ruhig/${s.key}`);
    await expect(page.locator(`[data-ruhig="${s.key}"]`)).toBeVisible();
    await expect(page.locator('main .rh-card').first()).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: T(s.title) })).toBeVisible();
    expect(await noSideScroll(page), s.key).toBeLessThanOrEqual(0);
  }
  expect(errors).toEqual([]);
});

test('Calm view: the strip shows only what you do, not on Heute, until «Fertig»', async ({ page, context }) => {
  const errors = await blank(page, context);
  await page.goto('./#/me/ruhig/weniger?open=calm');
  await settle(page);
  await page.locator('[data-calm-what]').fill('Velo putzen');
  await page.locator('[data-calm-what]').press('Enter');
  await expect(page.locator('[data-calm-on]')).toContainText('Velo putzen');
  await page.goto('./#/gear');
  const line = page.locator('[data-ruhig-line="calm"]');
  await expect(line).toContainText('Velo putzen');
  await page.goto('./#/');
  await page.locator('main').waitFor();
  await expect(page.locator('[data-ruhig-line]')).toHaveCount(0); // Heute stays as it is (rule 11)
  await page.goto('./#/gear');
  await line.getByRole('button', { name: T('Done|calm') }).click();
  await expect(page.locator('[data-ruhig-line]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('A letter for a date stays closed until its day', async ({ page, context }) => {
  const errors = await blank(page, context);
  await page.goto('./#/me/ruhig/spaeter');
  await settle(page);
  await page.locator('[data-letter-when]').selectOption('date');
  await page.locator('[data-letter-text]').fill('Für später: Es wird gut.');
  await page.locator('[data-letter-add]').click();
  const closed = page.locator('[data-letters-closed] li');
  await expect(closed).toHaveCount(1);
  await expect(closed).not.toContainText('Es wird gut'); // the text stays closed
  expect(errors).toEqual([]);
});

test('An experiment with an end: start it and tick today', async ({ page, context }) => {
  const errors = await blank(page, context);
  await page.goto('./#/me/ruhig/versuche');
  await settle(page);
  await page.locator('[data-exp-q]').fill('Schlafe ich besser ohne Handy am Abend?');
  await page.locator('[data-exp-add]').click();
  const exp = page.locator('[data-exp]');
  await expect(exp).toHaveCount(1);
  await expect(exp).toHaveAttribute('data-state', 'running');
  await exp.locator('[data-exp-yes]').click();
  await expect(exp.locator('[data-exp-yes]')).toHaveAttribute('aria-pressed', 'true');
  expect(errors).toEqual([]);
});

test('Own marks: add one, it can be found on the meaning page', async ({ page, context }) => {
  const errors = await blank(page, context);
  await page.goto('./#/me/ruhig/bedeutung?open=meaning');
  await settle(page);
  const card = page.locator('[data-part="meaning"]');
  await card.getByRole('button', { name: T('Change the marks') }).click();
  const fresh = card.locator('[data-kind-new]');
  await fresh.fill('Mit dem Club');
  await fresh.press('Enter');
  await expect(card.locator('[data-kinds]')).toContainText('Mit dem Club');
  expect(errors).toEqual([]);
});
