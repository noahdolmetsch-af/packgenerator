// Paket C «Ruhig und persönlich» (Noah 24.10.2026, 996 Ideen «5a»): Ich › Ruhig und persönlich and its nine
// sub-pages. German, fictional data only, no internet. Phone and desktop.
import { test, expect } from './clock.js';
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
  await expect(page.locator('html')).toHaveAttribute('data-ruhe', '1'); // suggestions, stars, «Neu» rest
  await expect(page.locator('.ph, .an, .stars, .sv-star')).toBeHidden();
  await page.goto('./#/');
  await page.locator('main').waitFor();
  await expect(page.locator('[data-ruhig-line]')).toHaveCount(0); // Heute stays as it is (rule 11)
  await page.goto('./#/gear');
  await line.getByRole('button', { name: T('Done|calm') }).click();
  await expect(page.locator('[data-ruhig-line]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Calm view: «Done» keeps a line, the week shows it', async ({ page, context }) => {
  const errors = await blank(page, context);
  await page.goto('./#/me/ruhig/weniger?open=calm');
  await settle(page);
  await page.locator('[data-calm-what]').fill('Velo putzen');
  await page.locator('[data-calm-what]').press('Enter');
  await page.locator('[data-calm-done]').click();
  await expect(page.locator('[data-calm-week]')).toContainText('1× Velo putzen');
  await page.locator('[data-calm-log-clear]').click();
  await expect(page.locator('[data-calm-week]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Calm view: the words you wrote lead to the matching page', async ({ page, context }) => {
  const errors = await blank(page, context);
  await page.goto('./#/me/ruhig/weniger?open=calm');
  await settle(page);
  await page.locator('[data-calm-what]').fill('Kette prüfen');
  await page.locator('[data-calm-what]').press('Enter');
  await page.goto('./#/gear');
  const open = page.locator('[data-ruhig-line="calm"] [data-calm-open]');
  await expect(open).toHaveAttribute('href', /^#\//);
  await open.click();
  await expect(page.locator('[data-ruhig-line="calm"]')).toContainText('Kette prüfen'); // the strip stays
  expect(errors).toEqual([]);
});

test('Calm view quick starts: one tap starts it, an own start can be added', async ({ page, context }) => {
  const errors = await blank(page, context);
  await page.goto('./#/me/ruhig/weniger?open=calm');
  await settle(page);
  await page.locator('[data-calm-starts-edit]').click();
  await page.locator('[data-kind-new]').fill('Schreibtisch aufräumen');
  await page.locator('[data-kind-new]').press('Enter');
  await expect(page.locator('[data-calm-starts]')).toContainText('Schreibtisch aufräumen');
  await page.locator('[data-calm-start]').filter({ hasText: 'Schreibtisch aufräumen' }).click();
  await expect(page.locator('[data-calm-on]')).toContainText('Schreibtisch aufräumen');
  await expect(page.locator('[data-ruhig-line="calm"]')).toContainText('Schreibtisch aufräumen');
  expect(errors).toEqual([]);
});

test('Calm view on Today: only the one thing, «Show Today anyway», «Done» brings Today back', async ({ page, context }) => {
  const errors = await blank(page, context);
  await page.goto('./#/me/ruhig/weniger?open=calm');
  await settle(page);
  await page.locator('[data-calm-what]').fill('Kette prüfen');
  await page.locator('[data-calm-what]').press('Enter');
  await page.goto('./#/');
  const home = page.locator('[data-calm-home]');
  await expect(home).toContainText('Kette prüfen');
  await expect(page.locator('[data-calm-home-open]')).toHaveAttribute('href', /^#\//);
  await page.locator('[data-calm-home-all]').click();
  await expect(home).toHaveCount(0); // the normal Today for this visit
  await page.goto('./#/gear');
  await page.goto('./#/');
  await expect(page.locator('[data-calm-home]')).toHaveCount(1);
  await page.locator('[data-calm-home-done]').click();
  await expect(page.locator('[data-calm-home]')).toHaveCount(0);
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
