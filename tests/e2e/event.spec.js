import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// v0.22.1 (Noah 4b, AP16 part): the Excel event preparation shows only for trips marked "Event".
// A short ride tomorrow carries no event load; ticking "Event" brings the dated plan back; an older
// trip that already has a ticked preparation task keeps it. Runs on the new calm Pack (PR #32).
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./preparation-fixture.json', import.meta.url)), 'utf8'));

function fixture(path) {
  const data = structuredClone(base);
  const short = { ...data.tables.trips[0], id: 'test_data_gtp_short', title: 'test_data_gtp_ Kurzfahrt', startDate: '2026-10-08', hours: 2 };
  const old = { ...data.tables.trips[0], id: 'test_data_gtp_old', title: 'test_data_gtp_ Altes Event', startDate: '2026-10-20', prep: { 9001: { result: 'done', date: '2026-10-01', by: 'self' } } };
  data.tables.trips = [short, old];
  data.tables.maintenance = [
    { id: 9001, subject: 'test_data_gtp_ setup', area: 'Preparation', task: 'test_data_gtp_ Bremsen entlüften', leadWeeks: 3, status: 'open' },
    { id: 9002, subject: 'test_data_gtp_ setup', area: 'Preparation', task: 'test_data_gtp_ Akkus laden', leadWeeks: 0, status: 'open' },
  ];
  data.tables.settings = (data.tables.settings ?? []).map((s) => (s.key === 'pack.currentTrip' ? { ...s, value: short.id } : s));
  writeFileSync(path, JSON.stringify(data));
}

test('event preparation only for events', async ({ page, context }, info) => {
  const file = info.outputPath('event-fixture.json');
  fixture(file);
  await page.clock.setFixedTime(new Date('2026-10-07T12:00:00Z'));
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const data = page.locator('details.data');
  // the app opens this panel by itself on an empty start: make sure it ends up open
  await expect(async () => {
    if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
    expect(await data.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  await data.getByLabel('Backup importieren').setInputFiles(file);
  await data.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await expect(data.getByText(/importiert.*alle Daten ersetzt/i)).toBeVisible();

  // Short ride tomorrow: no event load on Home and in Pack.
  await page.goto('./#/');
  await expect(page.getByText('test_data_gtp_ Kurzfahrt').first()).toBeVisible();
  await expect(page.getByText(/Eventvorbereitung/)).toHaveCount(0);
  await page.goto('./#/pack');
  const before = page.locator('.calm-extra').filter({ hasText: 'Vor der Tour' });
  await expect(before.locator('summary')).not.toContainText('Eventvorbereitung');
  await before.locator('summary').click();
  const box = before.getByLabel(/Event \(Rennen oder organisierte Fahrt\)/);
  await expect(box).not.toBeChecked();
  await expect(before.getByText('test_data_gtp_ Bremsen entlüften')).toHaveCount(0);

  // Marked as an event: the dated plan comes back, overdue in words, and it stays after a reload.
  await box.check();
  await expect(before.locator('summary')).toContainText('Eventvorbereitung: 2 offen (1 überfällig)');
  await expect(before.getByText('test_data_gtp_ Bremsen entlüften')).toBeVisible();
  await expect(before).toContainText('überfällig seit');
  await page.reload();
  const again = page.locator('.calm-extra').filter({ hasText: 'Vor der Tour' });
  await expect(again.locator('summary')).toContainText('Eventvorbereitung: 2 offen');

  // An older trip with a ticked task counts as an event; its tick stays visible in Bike care.
  await page.goto('./#/bikes?tab=care');
  await page.getByText('Spätere Touren', { exact: true }).click();
  // v0.31.0: each trip is one folded row.
  const old = page.locator('details.block').filter({ hasText: 'test_data_gtp_ Altes Event' });
  await old.locator('summary').click();
  await expect(old.getByLabel(/Event \(Rennen oder organisierte Fahrt\)/)).toBeChecked();
  await expect(old).toContainText('1 von 2 erledigt');
  await expect(page.evaluate(() => document.documentElement.scrollWidth)).resolves.toBeLessThanOrEqual(page.viewportSize().width);
});
