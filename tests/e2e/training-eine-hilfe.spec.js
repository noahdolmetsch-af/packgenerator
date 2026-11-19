// «Eine Hilfe-Zeile» (UI-Test Training 17.11.2026, Fund 2): auf Training bleibt nach dem Einklappen der Einstiegskarte
// nur die Zeile «Was du hier tun kannst»; die zweite Zeile «So geht's» steht nicht mehr darunter.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en;

test('Training: nach dem Einklappen bleibt eine Hilfe-Zeile', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/flow/training');
  await ready(page);
  const card = page.locator('[data-intro="training"][data-open="true"]');
  await expect(card).toBeVisible(); // erster Besuch: die Einstiegskarte ist offen
  await card.getByRole('button', { name: T('Fold') }).click();
  await expect(page.locator('[data-intro="training"]')).toHaveCount(0);
  await expect(page.locator('[data-seiteninhalt-line]')).toHaveCount(1);
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-intro="training"]')).toHaveCount(0);
  await expect(page.locator('[data-seiteninhalt-line]')).toHaveCount(1);
  expect(errors).toEqual([]);
});
