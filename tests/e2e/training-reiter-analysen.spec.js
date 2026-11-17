// «Reiter Analysen» (UI-Test Training 17.11.2026, Fund 4): Training hat drei Ansichten. «Woche» plant und schaut zurück,
// «Aktivitäten» ist die Liste, «Analysen» hat die Auswertungen über die Wochen, die Pulszonen und die FTP.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en;

test('Training: Reiter Woche, Aktivitäten, Analysen', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/flow/training');
  await ready(page);
  // Woche: planen und Rückblick, keine Auswertungen und keine Zonen darunter
  await expect(page.locator('[data-section="week-plan"]')).toBeVisible();
  await expect(page.locator('[data-section="week-analyses"]')).toHaveCount(0);
  await expect(page.locator('[data-section="zones"]')).toHaveCount(0);
  await expect(page.locator('[data-section="ftp"]')).toHaveCount(0);
  // der Sprung «Leistung und Analysen» führt in den Reiter
  await page.locator('[data-quick-links]').getByRole('link', { name: T('Power and analyses') }).click();
  await expect(page).toHaveURL(/view=ana/);
  await expect(page.locator('[data-section="week-analyses"]')).toBeVisible();
  await expect(page.locator('[data-section="zones"]')).toBeVisible();
  await expect(page.locator('[data-section="ftp"]')).toBeVisible();
  await expect(page.locator('[data-section="week-plan"]')).toHaveCount(0);
  // der Reiter Woche bringt Plan und Rückblick zurück
  await page.getByRole('button', { name: T('Week|training'), exact: true }).click();
  await expect(page.locator('[data-section="week-plan"]')).toBeVisible();
  // «Zonen ändern» (?zones=1) öffnet den Reiter Analysen mit dem Formular
  await page.goto('./#/flow/training?zones=1');
  await expect(page.locator('[data-bound="0"]')).toBeVisible();
  expect(errors).toEqual([]);
});
