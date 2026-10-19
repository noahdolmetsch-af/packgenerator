// v0.151.0 Höhenprofil HP1–HP5 (mockups HP1–HP5, Noah 14.10.2026 «1a 2a 3a hp1-hp5 freigeben»): the ridden
// profile is back in the Rückblick («Letzte Fahrt», the saved debrief), a ride shows its profile and, in
// «Geplant gegen echt», the planned route dashed over it, a planned trip with a route shows a small profile on
// its Touren tile, and Vergangene Touren shows a small profile per trip with a GPX ride. Phone and computer,
// in German, no sideways scroll, no page errors. Fictional data only (the Gesamttest fixture).
import { test, expect } from '@playwright/test';
import { start, fixture } from './gesamttest/lib.js';
import { settle } from './settle.js';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en) => DE[en] ?? en;
const P = 'test_data_gtp_';

async function go(page, hash) {
  await page.goto('./' + hash);
  await page.locator('main').waitFor();
  try { await settle(page); } catch {}
}
const noSideScroll = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);

test('Elevation profile: debrief, saved debrief, ride, Touren tile, past trips', async ({ page, context }, info) => {
  test.setTimeout(240_000);
  const data = fixture().data.tables;
  const errors = await start(page, context, info);
  const rides = data.rides.filter((r) => r.profile?.length > 1);
  expect(rides.length).toBeGreaterThan(2);

  // HP1: «Letzte Fahrt» draws the profile of its GPX ride
  await go(page, '#/debrief');
  const last = page.locator('.rv-box.lastride');
  // UI-Regeln Teil 2 (Noah 14.10.2026 «a», on purpose): on a phone «Letzte Fahrt» starts closed, one tap opens it
  if (info.project.name === 'phone') await page.getByRole('button', { name: new RegExp(`^${T('Last ride')}`) }).click();
  // SN2: the numbers of the last ride are folded; open them
  await last.locator('button.fold-btn').click();
  await expect(last.locator('svg.prof')).toHaveCount(1);
  await expect(last.locator('svg.prof')).toHaveAttribute('aria-label', new RegExp(T('Elevation of the ride')));
  await noSideScroll(page);

  // HP2: the saved debrief of a trip with a ride and a route: ridden + planned dashed + legend
  const both = data.trips.find((x) => x.route?.profile?.length > 1 && data.rides.some((r) => r.tripId === x.id && r.profile?.length > 1) && data.debriefs.some((d) => d.tripId === x.id && d.status === 'done'));
  await go(page, `#/debrief/${both.id}`);
  // SN2x: the profile sits in the section «Strecke» (data-route)
  const saved = page.locator('section[data-route]');
  await expect(saved.locator('svg.prof path.plan')).toHaveCount(1);
  await expect(saved.getByText(T('ridden (GPX)'))).toBeVisible();
  await expect(saved.getByText(T('planned'), { exact: true })).toBeVisible();
  await noSideScroll(page);

  // HP3: the ride page: profile under «Zahlen», planned and ridden under «Geplant gegen echt»
  const ride = data.rides.find((r) => r.tripId === both.id);
  await go(page, `#/debrief/ride/${ride.id}`);
  await expect(page.locator('#st-h').locator('xpath=ancestor::section').locator('svg.prof')).toHaveCount(1);
  const cmp = page.locator('#cmp-h').locator('xpath=ancestor::section');
  if (await cmp.count()) await expect(cmp.locator('svg.prof path.plan')).toHaveCount(1);
  await noSideScroll(page);

  // HP4: a planned trip with a route has a small profile on its tile, one without a route has none
  const planned = data.trips.find((x) => x.startDate > fixture().summary.today && x.route?.profile?.length > 1);
  await go(page, '#/trips');
  // SN4g: «Geplant» is a short list of cards (data-planned); open all of them
  const more = page.locator('[data-planned] button.more');
  if (await more.count()) await more.click();
  const tile = page.locator(`[data-planned] li.pc[data-trip="${planned.id}"]`);
  await expect(tile.locator('.mprof svg.prof.small')).toHaveCount(1);
  await expect(tile.locator('.mprof .ms')).toContainText('km');
  const bare = data.trips.find((x) => x.startDate > fixture().summary.today && !x.route?.profile);
  if (bare) await expect(page.locator(`[data-planned] li.pc[data-trip="${bare.id}"] .mprof`)).toHaveCount(0);
  await noSideScroll(page);

  // HP5: Vergangene Touren: a small profile under each trip with a GPX ride
  await go(page, '#/pack/past');
  const first = data.trips.find((x) => x.id === rides[0].tripId);
  const row = page.locator('tbody tr').filter({ hasText: first.title.replace(P, '').trim() });
  await expect(row.first().locator('.mprof svg.prof.small')).toHaveCount(1);
  await noSideScroll(page);

  expect(errors).toEqual([]);
});
