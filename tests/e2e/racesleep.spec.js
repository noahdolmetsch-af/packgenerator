// Paket U4 «Schlafplätze im Rennen» (Noah 20.10.2026 «1a 2a 3a 4a 5a», «6a 7a 8a»): in the sample race
// «Where do I sleep tonight?» with its kind chips, the hotels for tonight with the sentence in the
// language of the place, the power nap timer, the boxes switched off and on, a list of places to sleep
// loaded from a GPX file (fictional, test_data_gtp_) and shown as «From a list», then deleted with Undo.
// Every outside request is blocked (openHome); nothing scrolls sideways on the phone.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const noSideways = async (page, where = '') => {
  const over = await page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    const bad = [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right + scrollX > w + 1);
    return { d: document.documentElement.scrollWidth - w, bad: bad.slice(0, 6).map((e) => `${e.tagName}.${e.className} ${Math.round(e.getBoundingClientRect().right)}`) };
  });
  expect(over.d, `${where} ${over.bad.join(' | ')}`).toBeLessThanOrEqual(1);
};
// a point on the line of the sample race at about km 151 (src/lib/race/sample.js)
const SPOT = { lat: 47.19915, lon: 9.1675 };
const GPX = `<?xml version="1.0"?><gpx version="1.1" creator="test"><wpt lat="${SPOT.lat}" lon="${SPOT.lon}"><name>test_data_gtp_ Scheune</name><sym>Lodging</sym></wpt><wpt lat="46.0" lon="6.0"><name>test_data_gtp_ Weit weg</name></wpt></gpx>`;

test('Sleep spots in a race: where to sleep tonight, hotels late, power nap, lists of others', async ({ page, context }, info) => {
  const T = await openHome(page, context, info, { hour: 15 });
  await page.goto('./#/race');
  await page.locator('[data-race-sample-open]').click();
  await expect(page).toHaveURL(/#\/race\/race-sample$/);

  // a list of places to sleep from a file, under «Along the route»
  await tap(page.locator('[data-race-tab="route"]'), info);
  const lists = page.locator('[data-race-box="sleep-lists"]');
  await lists.scrollIntoViewIfNeeded();
  await lists.locator('[data-sleep-file]').setInputFiles({ name: 'test_data_gtp_ Veranstalter.gpx', mimeType: 'application/gpx+xml', buffer: Buffer.from(GPX) });
  await expect(lists.locator('[data-sleep-list-msg]')).toContainText('test_data_gtp_ Veranstalter');
  await expect(lists.locator('[data-sleep-src]')).toHaveCount(1);
  await expect(lists.locator('[data-sleep-src]')).toContainText(T('{n} places, {m} of them near this route', { n: 2, m: 1 }));
  await expect(page.locator('[data-race-box="night-wx"]')).toBeVisible();
  await noSideways(page, 'along the route');

  // race mode at km 130
  await tap(page.locator('[data-race-tab="ride"]'), info);
  await page.locator('[data-race-km]').fill('130');
  await page.locator('[data-race-km]').press('Tab');
  const spots = page.locator('[data-race-box="ride-spots"]');
  await spots.scrollIntoViewIfNeeded();
  await expect(spots.locator('[data-sleep-row]').first()).toBeVisible();
  // the campsite of the sample at km 139 comes first
  await expect(spots.locator('[data-sleep-row]').first()).toHaveAttribute('data-sleep-row', 'camp');
  await expect(spots.locator('[data-sleep-row="list"]')).toContainText('test_data_gtp_ Scheune');
  await expect(spots.locator('[data-sleep-row="list"]')).toContainText(T('From the list «{name}»', { name: 'test_data_gtp_ Veranstalter' }));
  // only the lists: one row; all again
  for (const k of ['hotel', 'camp', 'hut', 'bus', 'waiting', 'bivouac', 'night', 'own']) await tap(spots.locator(`[data-sleep-kind="${k}"]`), info);
  await expect(spots.locator('[data-sleep-row]')).toHaveCount(1);
  await expect(spots.locator('[data-sleep-kind="list"]')).toHaveAttribute('aria-pressed', 'true');
  for (const k of ['hotel', 'camp']) await tap(spots.locator(`[data-sleep-kind="${k}"]`), info);
  await expect(spots.locator('[data-sleep-row="hotel"]').first()).toBeVisible();

  // hotels for tonight: at 15:00 they show, with the sentence in German and in French
  const hotels = page.locator('[data-race-box="ride-hotels"]');
  await hotels.scrollIntoViewIfNeeded();
  await expect(hotels.locator('[data-sleep-target]')).toBeVisible();
  await expect(hotels.locator('[data-sleep-text]')).toHaveAttribute('data-sleep-text', 'de');
  await expect(hotels.locator('[data-sleep-text]')).toContainText('mit dem Velo');
  await tap(hotels.locator('[data-sleep-lang="fr"]'), info);
  await expect(hotels.locator('[data-sleep-text]')).toContainText('à vélo');

  // power nap: start, the alarm warning, «awake already» goes into the sleep log
  const nap = page.locator('[data-race-box="ride-nap"]');
  await nap.scrollIntoViewIfNeeded();
  await expect(nap.locator('[data-nap-warn]')).toContainText(T('The alarm only rings while the app stays open and the screen is on. To be safe, also set the alarm on your phone:'));
  await tap(nap.locator('[data-nap-start="20"]'), info);
  await expect(nap.locator('[data-nap-left]')).toHaveText('20:00');
  await tap(nap.locator('[data-nap-cancel]'), info);
  await expect(nap.locator('[data-nap-start="10"]')).toBeVisible();
  await tap(nap.locator('[data-nap-start="10"]'), info);
  await tap(nap.locator('[data-nap-done]'), info);
  await expect(page.locator('[data-race-box="ride-sleep"] .rc-list li')).toHaveCount(1);
  await expect(page.locator('[data-race-box="ride-sleep"] .rc-list li')).toContainText(T('{n} min', { n: 10 }));
  await noSideways(page, 'race mode');

  // switch «Hotels for tonight» off and on again
  const off = page.locator('[data-race-sleep-on="hotels"]');
  await off.scrollIntoViewIfNeeded();
  await off.uncheck();
  await expect(hotels).toHaveCount(0);
  await off.check();
  await expect(hotels).toBeVisible();

  // delete the list: asked first, then Undo brings it back
  await tap(page.locator('[data-race-tab="route"]'), info);
  await lists.scrollIntoViewIfNeeded();
  await tap(lists.locator('[data-sleep-src] .rc-icon'), info);
  await page.locator('dialog[open]').getByRole('button', { name: T('Delete'), exact: true }).click();
  await expect(lists.locator('[data-sleep-src]')).toHaveCount(0);
  await page.getByRole('button', { name: T('Undo') }).first().click();
  await expect(lists.locator('[data-sleep-src]')).toHaveCount(1);
});
