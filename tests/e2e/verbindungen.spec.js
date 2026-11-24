// «Verbindungen» (Noah 04./05.11.2026, «3b» 23.11.2026): the goal question of the morning page offers to-dos, goals of the week and
// activities as one-tap answers. On a phone and a computer, in German, fixed clock in Europe/Zurich. Fictional data only.
// SHOTS=<folder> saves full-page screenshots.
import { test, expect } from '@playwright/test';
import { ready } from './settle.js';
import { put } from './aktiv-fixture.js';
import { flowSeeded, putWall } from './wall-fixture.js';

const DAY = '2026-10-15';

async function shot(page, name) {
  if (!process.env.SHOTS) return;
  const w = page.viewportSize().width;
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${w <= 500 ? 390 : 1440}.png`, fullPage: true });
}

test('Verbindungen: the goal question offers to-dos, goals of the week and activities; a tap fills the sentence', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(`${DAY}T07:52:00+02:00`) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/');
  await ready(page);
  await flowSeeded(page);
  await putWall(page);
  await put(page, {
    settings: [
      { key: 'merken', value: [
        { id: 'td-1', text: 'Kette ölen', due: DAY, remind: null, repeat: null, list: null, created: '2026-10-10T08:00:00Z', doneAt: null },
        { id: 'td-2', text: 'Steuer ordnen', due: '2026-10-10', remind: null, repeat: null, list: null, created: '2026-10-01T08:00:00Z', doneAt: null },
      ] },
      { key: 'flow.weekGoals', value: [{ id: 'km', kind: 'km', of: 150 }] },
    ],
  });
  await page.reload();
  await ready(page);

  await page.goto('./#/check/morning');
  await ready(page);
  const q = page.locator('[data-round-questions="morning"] [data-q="ziele.ziel"]');
  const todos = q.locator('[data-links="todos"]');
  await expect(todos).toContainText('Aus deinen To-dos');
  await expect(todos.getByRole('button')).toHaveText(['Steuer ordnen', 'Kette ölen']);
  await expect(q.locator('[data-links="goals"]').getByRole('button', { name: '150 Velo-km' })).toBeVisible();
  await shot(page, 'verbindungen-frage');

  // a tap fills the sentence, a second one adds, the same one twice changes nothing
  await todos.getByRole('button', { name: 'Kette ölen' }).click();
  await expect(q.getByRole('textbox')).toHaveValue('Kette ölen');
  await q.locator('[data-links="goals"]').getByRole('button', { name: '150 Velo-km' }).click();
  await expect(q.getByRole('textbox')).toHaveValue('Kette ölen · 150 Velo-km');
  await todos.getByRole('button', { name: 'Kette ölen' }).click();
  await expect(q.getByRole('textbox')).toHaveValue('Kette ölen · 150 Velo-km');
  await shot(page, 'verbindungen-getippt');

  // saved at once, kept after a reload
  await page.waitForTimeout(900);
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-round-questions="morning"] [data-q="ziele.ziel"]').getByRole('textbox')).toHaveValue('Kette ölen · 150 Velo-km');
  expect(errors).toEqual([]);
});
