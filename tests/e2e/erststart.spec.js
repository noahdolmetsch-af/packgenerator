// «Erster Start» (Noah 20.10.2026 «2a … b auch»): a new, empty app asks once «Mit Beispielen starten» or
// «Leer starten». Browser tests normally never see the window (webdriver); this spec asks for it with
// localStorage «firstStart.ask». Fictional data only. On a phone and a computer, in German.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const D0 = '2026-10-20T09:00:00+02:00';

async function open(page, context, hash = '#/', ask = true) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript((a) => {
    localStorage.setItem('lang', 'de');
    if (a) localStorage.setItem('firstStart.ask', '1');
  }, ask);
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`./${hash}`);
  return errors;
}
const win = (page) => page.getByTestId('first-start');
// Closing the window goes one step back in the history (src/lib/ui/backclose.js). A reload while that step is
// still running is aborted (net::ERR_ABORTED, seen in the Playwright image on GitHub), so wait for it first.
const backDone = (page) => page.waitForFunction(() => !history.state?.pgDialog);

test('with examples: a made-up trip shows, «Beispiele entfernen» takes it away again', async ({ page, context }) => {
  const errors = await open(page, context);
  await expect(win(page)).toBeVisible();
  await expect(win(page).getByRole('heading', { name: T('Welcome to the Pack Generator') })).toBeVisible();
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(sw).toBeLessThanOrEqual(page.viewportSize().width);
  await win(page).locator('[data-choice="examples"]').click();
  // Einzelidee Heute 7: the interest check comes first, all three on
  await expect(win(page).locator('[data-interest][aria-pressed="true"]')).toHaveCount(3);
  await win(page).locator('[data-choice="examples-go"]').click();
  // second step: the short tour is offered, never started by itself
  await expect(win(page).locator('[data-choice="tour"]')).toBeVisible();
  await win(page).locator('[data-choice="notour"]').click();
  await expect(win(page)).toBeHidden();
  await expect(page.locator('.tour')).toHaveCount(0);

  await page.goto('./#/trips');
  await expect(page.locator('main').getByText(T('Jura loop (example)')).first()).toBeVisible();
  // the ridden example trip is there too (for Rückblick)
  await page.goto('./#/review');
  await expect(page.locator('main').getByText(T('Lake ride (example)')).first()).toBeVisible();

  // asked once: a reload does not ask again
  await page.reload();
  await expect(page.locator('html[data-ready="1"]')).toBeAttached();
  await expect(win(page)).toHaveCount(0);

  await page.goto('./#/me/data');
  const row = page.locator('[data-row="examples"]');
  await expect(row).toBeVisible();
  await row.click();
  const ask = page.getByTestId('ask-delete');
  await expect(ask).toBeVisible();
  await ask.getByRole('button', { name: T('Remove') }).click();
  await expect(page.getByText(T('Examples removed.'))).toBeVisible();
  await expect(row).toHaveCount(0);
  // and back again with «Beispiele holen»
  await page.locator('[data-row="get-examples"]').click();
  await expect(row).toBeVisible();
  expect(errors).toEqual([]);
});

test('start empty: no examples, the window never comes back; «Später» asks again', async ({ page, context }) => {
  const errors = await open(page, context);
  await expect(win(page)).toBeVisible();
  await win(page).locator('[data-choice="later"]').click();
  await expect(win(page)).toBeHidden();
  await backDone(page);
  await page.reload();
  await expect(win(page)).toBeVisible();
  await win(page).locator('[data-choice="empty"]').click();
  await win(page).locator('[data-choice="notour"]').click();
  await expect(win(page)).toBeHidden();
  await backDone(page);
  await page.reload();
  await expect(page.locator('html[data-ready="1"]')).toBeAttached();
  await expect(win(page)).toHaveCount(0);
  await page.goto('./#/trips');
  await expect(page.locator('main').getByText(T('Jura loop (example)'))).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('the language is chosen in the window, the examples come in it, and the tour starts', async ({ page, context }) => {
  const errors = await open(page, context);
  await expect(win(page)).toBeVisible();
  await win(page).locator('[data-lang="en"]').click();
  await expect(win(page).getByRole('heading', { name: 'Welcome to the Pack Generator' })).toBeVisible();
  await win(page).locator('[data-choice="examples"]').click();
  await win(page).locator('[data-choice="examples-go"]').click();
  await win(page).locator('[data-choice="tour"]').click();
  await expect(win(page)).toBeHidden();
  await expect(page.locator('.tour[data-tour="app"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.goto('./#/trips');
  await expect(page.locator('main').getByText('Jura loop (example)').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('browser tests without the switch never see the window', async ({ page, context }) => {
  await open(page, context, '#/', false);
  await expect(page.locator('html[data-ready="1"]')).toBeAttached();
  await page.waitForTimeout(500);
  await expect(win(page)).toHaveCount(0);
});
