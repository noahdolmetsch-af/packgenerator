// «Höhenprofil überall» (Noah 23.11.2026 «1-5a», Idee A), Fahrt-Seite: the profile of a ride is coloured by the
// steepness, and a tap or the mouse shows «km · Höhe · Steigung» of the spot in one line over it. Phone and
// computer, in German, no sideways scroll, no page errors. Fictional data only (the Gesamttest fixture).
import { test, expect } from './clock.js';
import { start, fixture } from './gesamttest/lib.js';
import { settle } from './settle.js';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en) => DE[en] ?? en;

test('Ride page: the profile has steepness colours and shows km, height and steepness on a tap', async ({ page, context }, info) => {
  test.setTimeout(240_000);
  const data = fixture().data.tables;
  const errors = await start(page, context, info);
  const ride = data.rides.find((r) => r.profile?.length > 1);
  expect(ride).toBeTruthy();
  await page.goto(`./#/debrief/ride/${ride.id}`);
  await page.locator('main').waitFor();
  try { await settle(page); } catch {}

  const prof = page.locator('#st-h').locator('xpath=ancestor::section').locator('svg.prof.detail');
  await expect(prof).toHaveCount(1);
  // coloured by the steepness: at least one steepness path, the legend in German
  expect(await prof.locator('path.st').count()).toBeGreaterThan(0);
  const box = prof.locator('xpath=ancestor::div[contains(@class,"rprof")]');
  await expect(box.locator('[data-profile-colours]')).toHaveText(T('Green is flat, yellow to dark red is steeper, blue is downhill.'));
  // before a tap the line says what the whole route is
  await expect(box.locator('[data-profile-at]')).toContainText(T('Whole route'));
  // a tap in the middle: km, height and steepness
  await prof.scrollIntoViewIfNeeded();
  const b = await prof.boundingBox();
  // a finger lifts after the tap: the spot stays (only a mouse leaving the profile clears it)
  if (info.project.name === 'phone') await page.touchscreen.tap(b.x + b.width * 0.5, b.y + b.height * 0.5);
  else await page.mouse.click(b.x + b.width * 0.5, b.y + b.height * 0.5);
  const at = box.locator('[data-profile-at]');
  await expect(at).toContainText('km');
  await expect(at).toContainText(T('Height'));
  await expect(at).toContainText(T('Gradient'));
  await expect(at).toContainText('%');
  // the arrow keys move it, Escape clears it
  await prof.focus();
  await page.keyboard.press('ArrowRight');
  await expect(at).toContainText('%');
  await page.keyboard.press('Escape');
  await expect(at).toContainText(T('Whole route'));
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});
