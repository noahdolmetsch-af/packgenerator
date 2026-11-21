// «Zwift und Indoor sichtbar» (Noah 19.11.2026 «3a»): Training › Aktivitäten zeigt Fahrten in Zwift und auf der Rolle mit dem
// Wort «Indoor / Zwift», der Filter zeigt nur diese. Erfundene Fahrten. Bilder mit SHOTS=<Ordner>.
import { test, expect } from './clock.js';
import { ready } from './settle.js';
import { seedActivities, activities, day } from './leistung-data.js';

test('Training › Aktivitäten: Indoor / Zwift in der Liste und im Filter', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  await ready(page);
  const mk = (id, back, name, type) => ({ ...activities()[1], id, name, type, start: `${day(-back)}T18:00:00Z`, startLocal: `${day(-back)}T19:00:00Z`, km: 28.4, hm: 0, movingS: 3600, elapsedS: 3700, gearId: null, wAvg: 182, wMax: 420, wDevice: true, wNorm: 195 });
  const acts = [...activities().slice(0, 8), mk('9001', 1, 'Zwift - Gruppenfahrt Muster auf Watopia', 'VirtualRide'), mk('9002', 3, 'Rolle Grundlage', 'VirtualRide')];
  await seedActivities(page, { acts });
  await page.goto('./#/flow/training?view=list');
  await page.reload();
  await ready(page);
  const rows = page.locator('[data-section="activities"] a[data-activity]');
  await expect(rows.first()).toBeVisible();
  const total = await rows.count();
  await expect(page.locator('[data-activity="9001"] .nm small')).toHaveText('Indoor / Zwift');
  await expect(page.locator('[data-activity="9002"] .nm small')).toHaveText('Indoor / Zwift');
  const chip = page.locator('[data-indoor-filter]');
  await expect(chip).toContainText('2');
  await page.locator('[data-activity="9001"]').scrollIntoViewIfNeeded();
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/zwift-liste-${info.project.name}.png` });
  await chip.click();
  await expect(rows).toHaveCount(2);
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/zwift-filter-${info.project.name}.png` });
  await chip.click();
  await expect(rows).toHaveCount(total);
  await page.locator('[data-activity="9001"]').click();
  await expect(page.getByText('Indoor / Zwift').first()).toBeVisible();
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/zwift-fahrt-${info.project.name}.png` });
  expect(errors).toEqual([]);
});
