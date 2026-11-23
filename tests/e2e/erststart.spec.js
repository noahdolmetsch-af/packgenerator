// «Erster Start» (Noah 20.10.2026 «2a … b auch»): a new, empty app asks once «Mit Beispielen starten» or
// «Leer starten». Browser tests normally never see the window (webdriver); this spec asks for it with
// localStorage «firstStart.ask». Fictional data only. On a phone and a computer, in German.
import { openFolds } from './settle.js';
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
  // Noah 23.11.2026 «1-5a» (V1): one window, no interest step and no tour offer; one tap puts everything in
  await expect(win(page).locator('[data-interest], [data-choice="tour"], [data-choice="notour"]')).toHaveCount(0);
  await win(page).locator('[data-choice="examples"]').click();
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
  await openFolds(page);
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
  await expect(win(page)).toBeHidden();
  await backDone(page);
  await page.reload();
  await expect(page.locator('html[data-ready="1"]')).toBeAttached();
  await expect(win(page)).toHaveCount(0);
  await page.goto('./#/trips');
  await expect(page.locator('main').getByText(T('Jura loop (example)'))).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('the language is chosen in the window and the examples come in it', async ({ page, context }) => {
  const errors = await open(page, context);
  await expect(win(page)).toBeVisible();
  await win(page).locator('[data-lang="en"]').click();
  await expect(win(page).getByRole('heading', { name: 'Welcome to the Pack Generator' })).toBeVisible();
  await win(page).locator('[data-choice="examples"]').click();
  await expect(win(page)).toBeHidden();
  await expect(page.locator('.tour')).toHaveCount(0);
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

test('«Ich nutze die App schon auf einem anderen Gerät» (2a): the window closes and the field for the code opens, nothing is chosen', async ({ page, context }) => {
  const errors = await open(page, context);
  await expect(win(page)).toBeVisible();
  await win(page).locator('[data-choice="connect"]').click();
  await expect(win(page)).toBeHidden();
  await expect(page).toHaveURL(/#\/me\/data/);
  await expect(page.locator('#sync-code')).toBeVisible();
  await expect(page).not.toHaveURL(/verbinden/);
  // nothing was chosen: no example data was put in
  await page.goto('./#/trips');
  await expect(page.locator('main').getByText(T('Jura loop (example)'))).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('«Beispiele anpassen» (V1): only the chosen examples come in, what is there stays, «Beispiele entfernen» takes all away', async ({ page, context }) => {
  const errors = await open(page, context);
  await win(page).locator('[data-choice="empty"]').click();
  await expect(win(page)).toBeHidden();
  await page.goto('./#/me/data');
  await openFolds(page);
  const adjust = page.locator('[data-row="examples-adjust"]');
  await adjust.click();
  const dlg = page.getByTestId('adjust-examples');
  await expect(dlg).toBeVisible();
  // all three are ticked as a suggestion; take two away
  await expect(dlg.locator('[data-interest][aria-pressed="true"]')).toHaveCount(3);
  await dlg.locator('[data-interest="nights"]').click();
  await dlg.locator('[data-interest="active"]').click();
  await dlg.locator('[data-choice="examples-go"]').click();
  await expect(dlg).toBeHidden();
  await expect.poll(() => tripIds(page)).toEqual(['ex-past']);
  // open again: «day rides» is there (not clickable), the other two can still be added
  await adjust.click();
  await expect(dlg.locator('[data-interest="days"]')).toBeDisabled();
  await dlg.locator('[data-interest="nights"]').click();
  await dlg.locator('[data-choice="examples-go"]').click();
  await expect(dlg).toBeHidden();
  await expect.poll(() => tripIds(page)).toEqual(['ex-past', 'ex-trip']);
  // «Beispiele entfernen» finds all of them, also the ones from the first round
  await page.locator('[data-row="examples"]').click();
  await page.getByTestId('ask-delete').getByRole('button', { name: T('Remove') }).click();
  await expect(page.getByText(T('Examples removed.'))).toBeVisible();
  await expect.poll(() => tripIds(page)).toEqual([]);
  expect(errors).toEqual([]);
});

const tripIds = (page) =>
  page.evaluate(
    () =>
      new Promise((ok) => {
        const o = indexedDB.open('pack-generator');
        o.onsuccess = () => {
          const q = o.result.transaction('trips').objectStore('trips').getAllKeys();
          q.onsuccess = () => (o.result.close(), ok(q.result));
        };
      })
  );
