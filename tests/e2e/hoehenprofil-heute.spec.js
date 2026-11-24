// «Höhenprofil überall» (Noah 23.11.2026 «1-5a», Idee A), Heute: the profile in the card of the next tour is coloured by
// the steepness and shows «km · Höhe · Steigung» on a tap. Phone and computer, in German, no sideways scroll, no page
// errors. Phone only (the wide card on the computer has no profile). Fictional data only (the Gesamttest fixture).
import { test, expect } from './clock.js';
import { start, fixture } from './gesamttest/lib.js';
import { settle } from './settle.js';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en) => DE[en] ?? en;

test('Heute: the profile in the card of the tour has steepness colours and shows km, height and steepness on a tap', async ({ page, context }, info) => {
  // the profile sits in the card of the tour on the phone; the wide card on the computer (size «l») shows none
  test.skip(info.project.name !== 'phone', 'the wide card of the computer has no profile');
  test.setTimeout(240_000);
  // give every fictional trip without a route the route (with its profile) of another one
  const data = structuredClone(fixture().data);
  const withRoute = data.tables.trips.find((x) => x.route?.profile?.length > 1 && x.route.km);
  for (const x of data.tables.trips) if (!x.route?.profile?.length) x.route = structuredClone(withRoute.route);
  const errors = await start(page, context, info, { data });
  await page.goto('./#/');
  await page.locator('main').waitFor();
  try { await settle(page); } catch {}

  const prof = page.locator('[data-route] svg.prof.detail');
  await expect(prof).toHaveCount(1);
  expect(await prof.locator('path.st').count()).toBeGreaterThan(0);
  const at = page.locator('[data-route] [data-profile-at]');
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
  // a tap on the profile does not open the tour (it stays on Heute)
  expect(new URL(page.url()).hash).toMatch(/^#\/?$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});
