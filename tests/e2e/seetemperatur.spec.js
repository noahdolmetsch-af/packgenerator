// Thread «Seetemperatur und Sauna» (Noah 20.10.2026 «1a 2a 3a 4a 5a»): the lake card in Aktiv says
// «Zürisee», shows the cold-water scale, «Sauna und See heute?» ticks the sauna and the swim (a second
// tap takes it back), each swim keeps its water temperature, the limits change and the block can be
// hidden and shown again. The server is answered by the test; fictional values only.
import { test, expect } from '@playwright/test';
import { ready } from './settle.js';
import de from '../../src/lib/i18n/de/seetemperatur.js';

const zurichToday = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const day = (n) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${zurichToday()}T12:00:00Z`));

const flowLog = (page) =>
  page.evaluate(
    () =>
      new Promise((ok, fail) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const tx = r.result.transaction('flowLog', 'readonly');
          const q = tx.objectStore('flowLog').getAll();
          tx.oncomplete = () => (r.result.close(), ok(q.result));
          tx.onerror = () => fail(tx.error);
        };
      }),
  );

test('Zürisee: scale, Sauna und See heute, swims with their temperature', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.route(/packgen-three\.vercel\.app\/api\/lake/, (route) =>
    route.fulfill({
      status: 200,
      headers: { 'access-control-allow-origin': '*', 'content-type': 'application/json' },
      body: JSON.stringify({
        at: new Date().toISOString(),
        now: { at: new Date(Date.now() - 20 * 60000).toISOString(), water: 17.8, air: 12.9 },
        days: [day(-2), day(-1), day(0)].map((d, i) => ({ day: d, min: 18 - i * 0.2, max: 18.4 - i * 0.2, mean: 18.2 - i * 0.2, n: 144 })),
        forecast: [{ day: day(1), water: 17.6, min: 17.4, max: 17.8 }],
        sources: { measurement: true, forecast: true },
      }),
    }),
  );
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });

  await page.goto('./#/wetter'); // «Aktiv neu» (Noah 22.10.2026): the lake card moved from Aktiv to the weather page
  await ready(page);
  const card = page.locator('[data-card="lake"]').first();
  await expect(card.getByRole('heading', { name: 'Zürisee' })).toBeVisible();
  await expect(card.locator('.lk-hint')).toHaveAttribute('data-tone', 'fresh');
  await expect(card.locator('.lk-hint')).toContainText(/Frisch: 15[.,]0 bis 20[.,]0 °C/);

  // «Sauna und See heute?» with water, scale and air
  const ss = card.locator('[data-sauna-see]');
  await expect(ss).toContainText(de['Sauna and lake today?']);
  await expect(ss).toContainText(/Wasser 17[.,]8 °C/);
  await expect(ss).toContainText('frisch');
  await expect(ss).toContainText(/Luft 12[.,]9 °C/);

  // one tap ticks the swim (the activity is made when missing), the swim keeps the water temperature
  const swim = ss.locator('[data-tick="swim"]');
  await swim.click();
  await expect(swim).toHaveAttribute('aria-pressed', 'true');
  await expect(ss.locator('[data-swims]')).toContainText('1 Bad seit 1. September');
  await expect(ss.locator('[data-swims]')).toContainText(/kältestes 17[.,]8 °C/);
  await expect.poll(async () => (await flowLog(page)).filter((e) => e.day === zurichToday()).length).toBe(1);

  // the sauna too; a second tap takes it back
  const sauna = ss.locator('[data-tick="sauna"]');
  await sauna.click();
  await expect(sauna).toHaveAttribute('aria-pressed', 'true');
  await sauna.click();
  await expect(sauna).toHaveAttribute('aria-pressed', 'false');

  // the scale is changeable: cold under 18 → «kalt»
  await card.locator('summary', { hasText: de['Cold-water scale'] }).click();
  await card.locator('input[data-limit="cold"]').fill('18');
  await card.locator('input[data-limit="cold"]').blur();
  await expect(card.locator('.lk-hint')).toHaveAttribute('data-tone', 'cold');

  // hide «Sauna und See» and show it again
  await ss.getByRole('button', { name: 'Ausblenden', exact: true }).click();
  await expect(card.locator('[data-sauna-see]')).toHaveCount(0);
  await card.locator('[data-sauna-see-toggle]').check();
  await expect(card.locator('[data-sauna-see]')).toBeVisible();

  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  expect(errors).toEqual([]);
});
