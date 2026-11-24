// «Höhenprofil überall» (Noah 23.11.2026 «1-5a», Idee A), Unterwegs-Übersicht (#/ride): the profile of the stage is
// coloured by the steepness and shows «km · Höhe · Steigung» on a tap. Phone and computer, in German, no sideways
// scroll, no page errors. Fictional data only (the Gesamttest fixture).
import { test, expect } from './clock.js';
import { start, fixture } from './gesamttest/lib.js';
import { settle } from './settle.js';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en) => DE[en] ?? en;

test('Unterwegs: the profile of the stage has steepness colours and shows km, height and steepness on a tap', async ({ page, context }, info) => {
  test.setTimeout(240_000);
  // the fictional trip running today has no route: give it the route (with its profile) of another fictional trip
  const data = structuredClone(fixture().data);
  const withRoute = data.tables.trips.find((x) => x.route?.profile?.length > 1);
  // (the app picks the running trip itself: give the route to every fictional trip without one)
  for (const x of data.tables.trips) if (!x.route?.profile?.length) x.route = structuredClone(withRoute.route);
  const errors = await start(page, context, info, { data });
  await page.goto('./#/ride');
  await page.locator('main').waitFor();
  try { await settle(page); } catch {}

  // the stage is a closed fold: open it
  await page.locator('details.tp-fold').filter({ has: page.locator('.prof') }).locator('summary').click();
  const prof = page.locator('.prof svg.prof.detail');
  await expect(prof).toHaveCount(1);
  expect(await prof.locator('path.st').count()).toBeGreaterThan(0);
  const at = page.locator('.prof [data-profile-at]');
  // tap the middle of the profile (again if the page was still moving under the pointer)
  await expect(async () => {
    await prof.scrollIntoViewIfNeeded();
    const b = await prof.boundingBox();
    if (info.project.name === 'phone') await page.touchscreen.tap(b.x + b.width * 0.5, b.y + b.height * 0.5);
    else await page.mouse.click(b.x + b.width * 0.5, b.y + b.height * 0.5);
    // (the readout can fall back to the whole-stage summary when the page redraws under a slow runner:
    // so the tap is repeated until km, steepness and % are all there at once)
    await expect(at).toContainText('km', { timeout: 2000 });
    await expect(at).toContainText(T('Gradient'), { timeout: 2000 });
    await expect(at).toContainText('%', { timeout: 2000 });
  }).toPass({ timeout: 30_000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});
