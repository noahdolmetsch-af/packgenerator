// V6 (Plan 6) «Ich in vier Gruppen»: Daten, Einstellungen, Hilfe und «Mehr»; unter jeder Gruppe ein Satz zum Stand,
// Tennis ist keine eigene Gruppe mehr (seine Zeile steht unter Einstellungen). Fiktive Daten, kein Netz.
import { test, expect } from './clock.js';
import { tr } from './home0460-fixture.js';
import { ready } from './settle.js';

const T = tr('de');

test.beforeEach(async ({ context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
});

test('Ich: vier Gruppen, ein Satz zum Stand, Tennis unter Einstellungen', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/me');
  await ready(page);
  const main = page.locator('main');
  await expect(main.getByRole('heading', { level: 2, name: T('Data'), exact: true })).toBeVisible();
  await expect(main.getByRole('heading', { level: 2, name: T('Settings'), exact: true })).toBeVisible();
  await expect(main.getByRole('heading', { level: 2, name: T('Help|me'), exact: true })).toBeVisible();
  await expect(main.getByRole('heading', { level: 2, name: T('More'), exact: true })).toBeVisible();
  // Tennis is no group of its own
  await expect(main.getByRole('heading', { level: 2, name: T('Tennis'), exact: true })).toHaveCount(0);
  await expect(main.locator('section[aria-labelledby="me-set-h"] a[data-me-row="tennis"]')).toBeVisible();
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
