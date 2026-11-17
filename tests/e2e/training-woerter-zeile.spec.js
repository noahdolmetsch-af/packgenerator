// «Wörter und Fragen klarer» (UI-Test Training 17.11.2026, Fund 5): die Zeile «Was die Wörter heissen ?» bleibt eine Zeile,
// die geöffnete Erklärung steht darunter (nicht gequetscht daneben); der Klappteil am Seitenende heisst «Kommt später, wenn es passt».
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en, v) => (DE[en] ?? en).replace(/\{(\w+)\}/g, (_, k) => v?.[k] ?? '');

test('Training: «Was die Wörter heissen» ist eine Zeile, die Erklärung steht darunter', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/flow/training?view=ana');
  await ready(page);
  const words = page.locator('[data-section="week-analyses"] .words');
  await expect(words).toContainText(T('What the words mean'));
  const closed = await words.boundingBox();
  expect(closed.height).toBeLessThan(40); // eine Zeile
  await words.getByRole('button').click();
  const help = words.locator('[data-help]');
  await expect(help).toBeVisible();
  const q = await words.getByRole('button').boundingBox();
  const h = await help.boundingBox();
  expect(h.y).toBeGreaterThanOrEqual(q.y + q.height - 1); // darunter, nicht daneben
  expect(h.x).toBeLessThanOrEqual(closed.x + 2);
  expect(errors).toEqual([]);
});
