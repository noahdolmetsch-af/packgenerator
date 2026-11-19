// «Zonen ändern» springt zum Formular (UI-Test Training 17.11.2026, Fund 1): #/flow/training?zones=1 öffnet das
// Formular der Pulszonen und bringt es ins Bild, statt oben zu bleiben. Erfundene Daten, kein echtes Netz.
import { test, expect } from './clock.js';
import { ready } from './settle.js';

test('Zonen ändern: das Formular steht im Bild', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/flow/training?zones=1');
  await ready(page);
  const first = page.locator('[data-bound="0"]');
  await expect(first).toBeVisible();
  await expect(first).toBeInViewport();
  await expect(page.locator('[data-bound="3"]')).toBeInViewport();
  expect(errors).toEqual([]);
});
