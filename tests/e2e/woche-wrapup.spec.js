// «Planen 2b» Wochen-Abschluss am Sonntag (Noah 05.11.2026): on Sunday the week page shows three lines (erledigt, offen,
// rutscht) and moves the ticked open tasks to next Monday, with Undo. Fictional data only.
import { test, expect } from './clock.js';
import { base, tr } from './home0460-fixture.js';
import { importAndSettle, settle } from './settle.js';

const T = tr('de');
const item = (id, title, day, extra = {}) => ({ id, kind: 'todo', title, day, time: '', done: false, ...extra });

async function open(page, context, date, items) {
  await page.clock.setFixedTime(new Date(`${date}T18:00:00+01:00`));
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/');
  const d = structuredClone(base);
  d.tables.settings = [{ key: 'week.items', value: items }];
  await importAndSettle(page, { name: 'wrap.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(d)) });
  await page.goto('./#/week');
  await settle(page);
}

test('Sunday: the wrap-up names done and open, and moves the ticked tasks to Monday, with Undo', async ({ page, context }) => {
  await open(page, context, '2026-11-08', [
    item('test_data_wr1', 'test_data_wr_ Reifen bestellen', '2026-11-04'),
    item('test_data_wr2', 'test_data_wr_ Kette reinigen', '2026-11-06', { kind: 'bike', bikeId: 'x', part: 'chain' }),
    item('test_data_wr3', 'test_data_wr_ Belege ordnen', '2026-11-03', { done: true }),
  ]);
  const card = page.locator('[data-week-wrap]');
  await expect(card).toBeVisible();
  await expect(card.locator('[data-wrap-done]')).toContainText('1 Aufgabe');
  await expect(card.locator('[data-wrap-open]')).toContainText('2 Aufgaben');
  await expect(card.locator('[data-wrap-move] li')).toHaveCount(2);
  // untick one: it stays; the button moves the other one
  await card.locator('[data-wrap-pick="test_data_wr2"]').uncheck();
  await card.locator('[data-wrap-move-btn]').click();
  await expect(page.locator('[data-week-wrap] [data-wrap-move] li')).toHaveCount(1);
  await page.getByRole('button', { name: T('Next week'), exact: true }).click();
  await expect(page.locator('[data-day="2026-11-09"] [data-entry="test_data_wr1"]')).toHaveCount(1);
  // Undo brings it back to its day
  await page.getByRole('button', { name: T('Undo') }).first().click();
  await page.getByRole('button', { name: T('This week'), exact: true }).click();
  await expect(page.locator('[data-day="2026-11-04"] [data-entry="test_data_wr1"]')).toHaveCount(1);
});

test('Another day: the wrap-up waits behind «Wochen-Abschluss zeigen»; «Später» hides it', async ({ page, context }) => {
  await open(page, context, '2026-11-05', [item('test_data_wr4', 'test_data_wr_ Reifen bestellen', '2026-11-06')]);
  await expect(page.locator('[data-week-wrap]')).toHaveCount(0);
  await page.locator('[data-wrap-open-btn]').click();
  await expect(page.locator('[data-week-wrap]')).toBeVisible();
  await page.locator('[data-wrap-later]').click();
  await expect(page.locator('[data-week-wrap]')).toHaveCount(0);
});
