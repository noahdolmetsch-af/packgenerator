// V6 (Plan 6) «Ich in Gruppen»: Daten, Erinnerungen, Einstellungen, Hilfe und «Mehr» (Ich aufräumen, Noah 24.11.2026: fünf Gruppen);
// unter den drei offenen Gruppen ein Satz zum Stand, Tennis ist keine eigene Gruppe (seine Zeile steht vorläufig unter «Mehr»,
// bis der Sitemap-Schritt «Woche» sie in Woche › Alltag legt). Fiktive Daten, kein Netz.
import { test, expect } from './clock.js';
import { tr } from './home0460-fixture.js';
import { ready } from './settle.js';

const T = tr('de');

test.beforeEach(async ({ context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
});

test('Ich: five groups, a sentence on the state, Tennis under More', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/me');
  await ready(page);
  const main = page.locator('main');
  await expect(main.getByRole('heading', { level: 2, name: T('Data'), exact: true })).toBeVisible();
  await expect(main.getByRole('heading', { level: 2, name: T('Reminders'), exact: true })).toBeVisible();
  await expect(main.getByRole('heading', { level: 2, name: T('Settings'), exact: true })).toBeVisible();
  await expect(main.getByRole('heading', { level: 2, name: T('Help|me'), exact: true })).toBeVisible();
  await expect(main.getByRole('heading', { level: 2, name: T('More'), exact: true })).toBeVisible();
  // Tennis is no group of its own
  await expect(main.getByRole('heading', { level: 2, name: T('Tennis'), exact: true })).toHaveCount(0);
  await page.locator('details.ich-sec.fold > summary', { hasText: /Mehr|More/ }).click();
  await expect(main.locator('details.ich-sec.fold a[data-me-row="tennis"]')).toBeVisible();
  // a sentence on how it stands, under each of the three open groups
  for (const key of ['data', 'settings', 'help']) await expect(main.locator(`[data-stand="${key}"]`)).not.toBeEmpty();
  await expect(main.locator('[data-stand="settings"]')).toContainText('Deutsch');
  // «Wartet auf dich» (or the calm line) comes before the first group
  const before = await main.evaluate((el) => {
    const w = el.querySelector('[data-section="waiting"]');
    const d = el.querySelector('#me-data-h');
    return !!w && !!d && !!(w.compareDocumentPosition(d) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
  expect(before).toBe(true);
  await main.locator('a[data-me-row="tennis"]').click();
  await expect(page).toHaveURL(/#\/me\/tennis$/);
  expect(errors).toEqual([]);
});
