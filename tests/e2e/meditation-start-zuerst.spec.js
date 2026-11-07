// «Meditation › Neue Sitzung: Start zuerst» (Durchklick Etappe 5, Bericht Frage 3a, Noah 06.11.2026): der Knopf «Starten»
// steht vor der Karte «Als Vorlage speichern?», nicht darunter. Erfundene Daten, kein echtes Netz.
import { test, expect } from './clock.js';
import { ready } from './settle.js';

test('Neue Sitzung: «Starten» steht über der Karte «Als Vorlage speichern?»', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/flow/act/meditation/timer?new=1');
  await ready(page);
  const start = page.locator('[data-start="timer"]');
  const card = page.locator('[data-save-card]');
  await expect(start).toBeVisible();
  await expect(card).toBeVisible();
  const [a, b] = await Promise.all([start.boundingBox(), card.boundingBox()]);
  expect(a.y + a.height, 'Start ends above the template card').toBeLessThanOrEqual(b.y + 1);
  await start.click();
  expect(errors).toEqual([]);
});
