// «Fehler-Melder» (Noah 21.11.2026 «a»): an error the app does not catch is noted on this device, shown under Ich › Daten,
// can be copied and cleared. Nothing leaves the device. German UI, phone + desktop.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { openData } from './settle.js';

test('Fehler-Melder: an uncaught error is noted, shown with page and time, copied and cleared', async ({ page, context }, info) => {
  await openHome(page, context, info);
  const panel = await openData(page);
  const count = panel.locator('[data-fehler-count]');
  await count.scrollIntoViewIfNeeded();
  await expect(count).toHaveText('Keine Fehler gemerkt');
  await expect(panel.locator('[data-fehler-out]')).toHaveCount(0);

  // an error nobody catches, and an unhandled rejection with a long typed text in it
  await page.evaluate(() => {
    // (not setTimeout: the test clock is fake and a timer would wait for it)
    queueMicrotask(() => {
      throw new Error('Probe: Etwas ist kaputt');
    });
    Promise.reject(new Error('Parse "Ein langer Satz, den die Person selbst getippt hat, mit privatem Inhalt" fehlgeschlagen'));
  });
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('pg.errors') || '[]'));
  await expect.poll(async () => (await stored()).length).toBe(2);
  const entries = await stored();
  expect(entries.map((e) => e.message).sort()).toEqual(['Parse … fehlgeschlagen', 'Probe: Etwas ist kaputt']);
  expect(JSON.stringify(entries)).not.toContain('privatem Inhalt');
  expect(entries[0]).toMatchObject({ page: '#/me/data', version: expect.any(String) });

  // the card shows them after the page is opened again
  const again = await (async () => {
    await page.goto('./#/');
    return openData(page);
  })();
  const out = again.locator('[data-fehler-out]');
  await again.locator('[data-fehler-count]').scrollIntoViewIfNeeded();
  await expect(again.locator('[data-fehler-count]')).toHaveText('2 Fehler gemerkt');
  await expect(out).toContainText('Probe: Etwas ist kaputt');
  await expect(out).toContainText('#/me/data');

  // copy: the text goes to the clipboard
  await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
  await again.locator('[data-fehler-copy]').click();
  const clip = await page.evaluate(() => navigator.clipboard.readText()).catch(() => null);
  if (clip != null) expect(clip).toContain('Probe: Etwas ist kaputt');

  // clear: the list is gone and nothing is stored
  await again.locator('[data-fehler-clear]').click();
  await expect(again.locator('[data-fehler-count]')).toHaveText('Keine Fehler gemerkt');
  await expect(out).toHaveCount(0);
  expect(await stored()).toEqual([]);
});
