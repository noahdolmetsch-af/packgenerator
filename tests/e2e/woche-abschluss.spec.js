// «Planen als verbindende Mitte» 5a: «Woche abschliessen» - open to-dos of past days: move, drop, keep without a day. Fictional data.
import { test, expect } from './clock.js';
import { base, tr } from './home0460-fixture.js';
import { importAndSettle, settle } from './settle.js';

const T = tr('de');
const item = (id, title, day) => ({ id, kind: 'todo', title, day, time: '', done: false });

test('Woche abschliessen: move to today, drop and keep without a day, each with Undo', async ({ page, context }) => {
  await page.clock.setFixedTime(new Date('2026-11-03T06:00:00+01:00'));
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/');
  const d = structuredClone(base);
  d.tables.settings = [
    { key: 'week.items', value: [item('test_data_wa1', 'test_data_wa_ Reifen bestellen', '2026-11-01'), item('test_data_wa2', 'test_data_wa_ Belege ordnen', '2026-11-02'), item('test_data_wa3', 'test_data_wa_ Kette reinigen', '2026-10-31')] },
  ];
  await importAndSettle(page, { name: 'abschluss.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(d)) });
  await page.goto('./#/week');
  await settle(page);
  const card = page.locator('[data-week-close]');
  await expect(card.locator('[data-close-row]')).toHaveCount(3);
  await card.locator('[data-close-row]').filter({ hasText: 'Reifen bestellen' }).locator('[data-close-move]').click();
  await expect(card.locator('[data-close-row]')).toHaveCount(2);
  await expect(page.locator('[data-day="2026-11-03"] [data-entry="test_data_wa1"]')).toBeVisible();
  await card.locator('[data-close-row]').filter({ hasText: 'Belege ordnen' }).locator('[data-close-drop]').click();
  await expect(card.locator('[data-close-row]')).toHaveCount(1);
  await card.locator('[data-close-row]').filter({ hasText: 'Kette reinigen' }).locator('[data-close-keep]').click();
  await expect(card).toHaveCount(0);
  // the one kept without a day waits in «Still to plan» / the list, not lost
  await expect(page.getByText('Kette reinigen').first()).toBeVisible();
  // Undo brings the last one back
  await page.getByRole('button', { name: T('Undo') }).first().click();
  await expect(page.locator('[data-week-close] [data-close-row]')).toHaveCount(1);
});

test('Woche abschliessen: «Später» hides the card', async ({ page, context }) => {
  await page.clock.setFixedTime(new Date('2026-11-03T06:00:00+01:00'));
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/');
  const d = structuredClone(base);
  d.tables.settings = [{ key: 'week.items', value: [item('test_data_wa4', 'test_data_wa_ Reifen bestellen', '2026-11-01')] }];
  await importAndSettle(page, { name: 'abschluss2.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(d)) });
  await page.goto('./#/week');
  await settle(page);
  await page.locator('[data-close-later]').click();
  await expect(page.locator('[data-week-close]')).toHaveCount(0);
});
