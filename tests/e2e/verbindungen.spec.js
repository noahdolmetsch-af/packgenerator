// «Verbindungen» (Noah 04./05.11.2026, «3b» 23.11.2026): the goal question of the morning page offers to-dos, goals of the week and
// activities as one-tap answers. On a phone and a computer, in German, fixed clock in Europe/Zurich. Fictional data only.
// SHOTS=<folder> saves full-page screenshots.
import { test, expect } from '@playwright/test';
import { ready } from './settle.js';
import { put } from './aktiv-fixture.js';
import { flowSeeded, putWall } from './wall-fixture.js';

const DAY = '2026-10-15';
const FIRST = '2026-11-01'; // monthly questions are on the pages of the 1st

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

test('Verbindungen: the monthly vision question offers the visions of the notes, and says where to write one when there are none', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(`${FIRST}T20:40:00+01:00`) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/');
  await ready(page);
  await flowSeeded(page);
  await putWall(page);
  // the evening window on Heute put today's questions away; none are skipped here. Asking since September: the monthly question of the 1st, 19:00, is on the evening page
  await put(page, { settings: [{ key: 'abfragen', value: { since: '2026-09-01T08:00' } }, { key: 'abfragen.snooze', value: {} }] });
  await page.goto('./#/check/evening'); // not Heute: its window would put the questions away again on a reload
  await page.reload();
  await ready(page);
  const q = page.locator('[data-round-questions="evening"] [data-q="visionen.naeher"]');
  await expect(q).toBeVisible();
  await expect(q.locator('[data-ab-hint]')).toContainText('Noch keine Visionen');
  await shot(page, 'verbindungen-vision-leer');

  await put(page, {
    notes: [
      { id: 'n-v1', title: 'Alpenpässe fahren', text: 'Alpenpässe fahren', status: 'kept', form: { key: 'vision', name: 'Vision', values: { where: 'Alpen' } }, createdAt: '2026-10-01T08:00:00Z', updatedAt: '2026-10-01T08:00:00Z' },
      { id: 'n-v2', title: 'Ein Sommer unterwegs', text: 'Ein Sommer unterwegs', status: 'kept', form: { key: 'vision', name: 'Vision', values: {} }, createdAt: '2026-10-05T08:00:00Z', updatedAt: '2026-10-05T08:00:00Z' },
    ],
  });
  await page.reload(); // rows written straight into IndexedDB reach the page after a reload
  await ready(page);
  await expect(q.locator('[data-links="visions"]').getByRole('button')).toHaveText(['Ein Sommer unterwegs', 'Alpenpässe fahren']);
  await q.locator('[data-links="visions"]').getByRole('button', { name: 'Alpenpässe fahren' }).click();
  await q.getByRole('textbox').fill('Alpenpässe fahren · Karte angeschaut');
  await shot(page, 'verbindungen-vision');
  expect(errors).toEqual([]);
});
