// Noah 20.10.2026 «1a 2a 3a 4a 5a»: the tiles of «Heute abhaken» are easy to change.
// 1. «Bearbeiten ›» in the head of «Heute abhaken» leads to the tab «Aktivitäten» (was «Ziele»).
// 2. Delete asks in the app's window: «Verlauf behalten» puts it under «Gelöscht, Verlauf behalten», «Zurückholen» brings it back.
// 3. «Kachel ausblenden» in the ••• window takes the tile off «Heute abhaken»; it waits paused under Aktivitäten.
// 4. «Wi gaht's?» › «Starten» opens the morning questions (#/check/morning), not their settings.
// Fictional data only (the start activities).
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';
import { TABS } from './placetab.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');

async function open(page, context, hash) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`./${hash}`);
  await ready(page);
  return errors;
}

test('Heute abhaken: Bearbeiten, delete with history kept, restore, hide a tile', async ({ page, context }) => {
  const errors = await open(page, context, '#/flow');
  const tick = page.locator('section[aria-labelledby="tick-h"]');
  await expect(tick.locator('[data-act="run"]')).toBeVisible();

  // 1. the edit link
  await tick.locator('[data-sec-edit]').click();
  // «Aktiv neu» (Noah 22.10.2026 «4a»): «Ziele» is «Meine Sportarten»; a row opens the sport, «Bearbeiten» the editor
  await expect(page).toHaveURL(/#\/flow\/sports$/);
  await expect(page.locator('main h1')).toHaveText(T('My sports|tab'));
  await expect(page.locator(TABS).getByRole('link', { name: T('My sports|tab'), exact: true })).toHaveAttribute('aria-current', 'page');

  // 2. delete, keep the history, restore
  await page.locator('[data-sport-row="run"]').click();
  await page.locator('[data-edit-sport]').click();
  await expect(page).toHaveURL(/#\/flow\/edit\/run\?from=sport$/);
  await page.getByText(T('Pause or delete')).click();
  await page.locator('[data-act-delete]').click();
  const ask = page.getByTestId('ask-delete');
  await expect(ask).toBeVisible();
  await ask.getByRole('button', { name: T('Keep the history') }).click();
  await expect(page).toHaveURL(/#\/flow\/sports$/);
  await expect(page.locator('[data-sport-row="run"]')).toHaveCount(0);
  const gone = page.locator('[data-gone-acts]');
  await gone.locator('summary').click();
  await gone.locator('[data-gone="run"] [data-gone-restore]').click();
  await expect(page.locator('[data-sport-row="run"]')).toBeVisible();
  await expect(gone).toHaveCount(0);

  // 3. hide a tile from the ••• window
  await page.goto('./#/flow');
  await ready(page);
  await tick.locator('[data-more="run"]').click();
  await page.locator('[data-tick-hide]').click();
  await expect(tick.locator('[data-act="run"]')).toHaveCount(0);
  await page.goto('./#/flow/sports');
  await ready(page);
  await expect(page.locator('[data-sport-row="run"]')).toContainText(T('paused'));

  // «Wi gaht's?» moved to the start of Auswerten: «Starten» opens the questions, not their settings
  await page.goto('./#/auswerten');
  await ready(page);
  await expect(page.locator('[data-check-start]')).toHaveAttribute('href', '#/check/morning');
  expect(errors).toEqual([]);
});
