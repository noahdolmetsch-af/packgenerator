// «Hinweise lernen aus dem Wegtippen» (S5, Noah 21.11.2026 «4a»): after «Not today» on three days the question «Make this hint
// quieter?» stands where the rest-day line stood. «Yes» switches the kind off (Undo), «Keep it» is remembered.
// Fictional data only; the days are written into the settings (the clock stands on 9 October 2026).
import { test, expect } from './clock.js';
import { mkdirSync } from 'node:fs';
import { openHome, homeFixture, tr, day, D0 } from './home0460-fixture.js';

const T = tr('de');
const SHOTS = process.env.SHOTS_DIR ?? null;
const shot = async (page, info, name) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await page.locator('[data-leiser]').screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? '390' : '1440'}.png` });
};
const tap = (loc, info) => (info.project.name === 'phone' ? loc.tap() : loc.click());
const stored = (page, key) =>
  page.evaluate(
    (k) =>
      new Promise((ok) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const q = r.result.transaction('settings').objectStore('settings').get(k);
          q.onsuccess = () => (r.result.close(), ok(q.result?.value ?? null));
        };
      }),
    key,
  );

function data(extra = {}) {
  const d = homeFixture();
  d.tables.settings.push({ key: 'hintSkips', value: { ruhetag: { days: [day(-5), day(-2), D0], no: null }, ...extra } });
  d.tables.settings.push({ key: 'flow.ruhetagNo', value: D0 });
  return d;
}

test('Three days «Not today»: the question appears, «Yes, quieter» switches the tips off and Undo brings them back', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: data(), hour: 9 });
  await page.goto('./#/flow');
  const q = page.locator('[data-leiser="ruhetag"]');
  await expect(q).toBeVisible({ timeout: 20000 });
  await expect(q).toContainText(T('Make this hint quieter?'));
  await expect(q).toContainText('3 verschiedenen Tagen');
  await expect(q).toContainText('Ich › Darstellung › Vorschläge › Leistungstipps');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  await shot(page, info, 'S5-leiser-frage');

  await tap(q.locator('[data-leiser-yes]'), info);
  await expect(q).toHaveCount(0);
  expect(await stored(page, 'suggestOff')).toContain('performance');
  // Undo (the note stays 8 s): the tips are on again
  await tap(page.getByRole('button', { name: /Rückgängig|Undo/ }).first(), info);
  await expect.poll(() => stored(page, 'suggestOff')).not.toContain('performance');
  expect(errors).toEqual([]);
});

test('Keep it: the question goes away and is not asked again for a while', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: data(), hour: 9 });
  await page.goto('./#/flow');
  const q = page.locator('[data-leiser="ruhetag"]');
  await expect(q).toBeVisible({ timeout: 20000 });
  await tap(q.locator('[data-leiser-keep]'), info);
  await expect(q).toHaveCount(0);
  const s = await stored(page, 'hintSkips');
  expect(s.ruhetag.no).toBe(D0);
  expect(await stored(page, 'suggestOff')).toBeNull();
  expect(errors).toEqual([]);
});
