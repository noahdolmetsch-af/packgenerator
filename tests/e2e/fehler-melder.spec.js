// «Fehler-Melder» (Noah 21.11.2026 «a»): an error the app does not catch is noted on this device, shown in the improvement log as «Fehler»
// (L1b: the card under Ich › Daten is gone). Nothing leaves the device. German UI, phone + desktop.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { ready } from './settle.js';

// SHOTS=<folder> saves pictures (Handy 390 / Computer 1440), fictional data only
const SHOTS = process.env.SHOTS || '';
async function shot(page, info, name) {
  if (!SHOTS) return;
  const w = info.project.name === 'phone' ? 390 : 1440;
  await page.waitForTimeout(700);
  await page.evaluate(() => window.scrollTo(0, 0));
  const vp = page.viewportSize();
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: vp.width, height: Math.max(vp.height, h) });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SHOTS}/${name}-${w}.png`, fullPage: true });
  await page.setViewportSize(vp);
}

test('Fehler-Melder: an uncaught error is noted, then the log shows it as an entry «Fehler» with page, and nothing is left in the note', async ({ page, context }, info) => {
  await openHome(page, context, info);
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('pg.errors') || '[]'));
  expect(await stored()).toEqual([]);

  // an error nobody catches, and an unhandled rejection with a long typed text in it
  await page.evaluate(() => {
    // (not setTimeout: the test clock is fake and a timer would wait for it)
    queueMicrotask(() => {
      throw new Error('Probe: Etwas ist kaputt');
    });
    Promise.reject(new Error('Parse "Ein langer Satz, den die Person selbst getippt hat, mit privatem Inhalt" fehlgeschlagen'));
  });
  await expect.poll(async () => (await stored()).length).toBe(2);
  const entries = await stored();
  expect(entries.map((e) => e.message).sort()).toEqual(['Parse … fehlgeschlagen', 'Probe: Etwas ist kaputt']);
  expect(JSON.stringify(entries)).not.toContain('privatem Inhalt');
  expect(entries[0]).toMatchObject({ page: '#/', version: expect.any(String) });

  // the log takes them over when it opens: two entries of the kind «Fehler», noted by the app, with the page
  await page.goto('./#/me/logbuch');
  await ready(page);
  const rows = page.locator('[data-lb-entry][data-art="fehler"]');
  await expect(rows).toHaveCount(2);
  await expect(rows.filter({ hasText: 'Probe: Etwas ist kaputt' })).toHaveCount(1);
  await expect(rows.first().locator('[data-lb-auto]')).toBeVisible();
  await expect(rows.first()).toContainText('#/');
  await shot(page, info, 'fehler-liste');
  await expect.poll(async () => (await stored()).length).toBe(0); // handed over, nothing left in the note
});
