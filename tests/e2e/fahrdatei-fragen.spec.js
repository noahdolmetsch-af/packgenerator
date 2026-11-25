// R2 «Fragen aus der Fahrdatei» (Noah 23.11.2026): a ride file with cold temperature asks «Did you freeze?» and a yes keeps a
// weather rule. Fictional ride (tests/test_data_gtp_gpx.js); nothing leaves the preview.
import { test, expect } from './clock.js';
import { writeFileSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { makeGpx } from '../test_data_gtp_gpx.js';

const T = (en, vars) => {
  const text = DE[en] ?? en;
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const stored = (page, table) =>
  page.evaluate((name) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(name).objectStore(name).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result ?? []); };
    };
  }), table);

test('Ride file: three hours below 5 °C asks «Did you freeze?» and a yes keeps a rule for packing', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  const gpx = info.outputPath('test_data_gtp_cold.gpx');
  writeFileSync(gpx, makeGpx({ name: 'test_data_gtp_ cold ride', legs: [{ km: 60, kmh: 20 }], sensors: true, temp: 2 }));
  await page.goto('./#/debrief/ride');
  await page.locator('.pickbtn input[type=file]').setInputFiles(gpx);
  await page.getByRole('button', { name: T('Save ride') }).click();
  await expect(page).toHaveURL(/#\/debrief\/ride\/ride-/);
  const question = T('{time} h below {t} °C. Did you freeze?', { time: '3', t: 5 });
  const learn = page.getByRole('list', { name: new RegExp(T('Learnings from this ride')) });
  await expect(learn.getByText(question)).toBeVisible();
  expect((await stored(page, 'learnings')).filter((l) => l.rideId)).toEqual([]);
  expect((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth))).toBeLessThanOrEqual(0);
  if (process.env.BAGSHOT_DIR) await learn.screenshot({ path: `${process.env.BAGSHOT_DIR}/r2-question-${info.project.name}.png` });
  await learn.getByRole('group', { name: question }).getByRole('button', { name: T('Yes, remember') }).click();
  await expect(learn.getByText(T('Remembered'))).toBeVisible();
  const kept = (await stored(page, 'learnings')).filter((l) => l.rideId);
  expect(kept.map((l) => l.topic)).toEqual(['Weather']);
  expect(kept[0].rule).toContain('5 °C');
  expect(errors).toEqual([]);
});
