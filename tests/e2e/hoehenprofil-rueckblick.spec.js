// «Höhenprofil überall» (Noah 23.11.2026 «1-5a», Idee A), Rückblick: the profile of the last tour and of a saved tour
// is coloured by the steepness and shows «km · Höhe · Steigung» on a tap. Phone and computer, in German, no sideways
// scroll, no page errors. Fictional data only (the Gesamttest fixture).
import { test, expect } from './clock.js';
import { start, fixture } from './gesamttest/lib.js';
import { settle } from './settle.js';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en) => DE[en] ?? en;

test('Rueckblick: the profile of the last tour has steepness colours and shows km, height and steepness on a tap', async ({ page, context }, info) => {
  test.setTimeout(240_000);
  // the newest entry of the debrief is a ride with a GPX profile (fictional ride, the day before the fixture's «today»)
  const data = structuredClone(fixture().data);
  const ride = data.tables.rides.find((r) => !r.tripId && r.profile?.length > 1);
  ride.date = '2026-11-17';
  const errors = await start(page, context, info, { data });
  await page.goto('./#/debrief');
  await page.locator('main').waitFor();
  try { await settle(page); } catch {}

  // the numbers of the last ride are a fold; the profile sits in it
  // (on the phone the whole card «Last ride» is a fold first)
  const fold = page.locator('button[aria-controls="last-all"]');
  const group = page.locator('#g-rv-last button.ls-gh');
  await expect(fold.or(group)).toBeVisible();
  if (!(await fold.isVisible())) {
    await group.scrollIntoViewIfNeeded();
    if ((await group.getAttribute('aria-expanded')) !== 'true') await group.click();
  }
  await fold.scrollIntoViewIfNeeded();
  if ((await fold.getAttribute('aria-expanded')) !== 'true') await fold.click();
  const prof = page.locator('.lprof svg.prof.detail');
  await expect(prof).toHaveCount(1);
  expect(await prof.locator('path.st').count()).toBeGreaterThan(0);
  const at = page.locator('.lprof [data-profile-at]');
  await expect(at).toContainText(T('Whole route'));
  await expect(async () => {
    await prof.scrollIntoViewIfNeeded();
    const b = await prof.boundingBox();
    if (info.project.name === 'phone') await page.touchscreen.tap(b.x + b.width * 0.5, b.y + b.height * 0.5);
    else await page.mouse.click(b.x + b.width * 0.5, b.y + b.height * 0.5);
    await expect(at).toContainText('km', { timeout: 2000 });
  }).toPass({ timeout: 20_000 });
  await expect(at).toContainText(T('Gradient'));
  await expect(at).toContainText('%');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});
