// «Beat your Ghost» (Noah 03.11.2026, Cockpit-Idee 4): the card on a ride compares it with an earlier ride of
// the same route (the fictional ride 3001 and its three earlier rides on the same route from leistung-data.js);
// another ghost can be picked, the card says how alike the two rides are. German; everything outside the preview
// server is blocked.
import { test, expect } from './clock.js';
import { ready } from './settle.js';
import { P, GEAR, ZONES, day, routeStrava, seedActivities } from './leistung-data.js';

async function open(page, context, baseURL) {
  await routeStrava(context, { log: [], app: baseURL });
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.goto('./');
  await ready(page);
  await seedActivities(page, { weight: { entries: [{ day: day(-30), kg: 72 }] } });
  await page.evaluate(
    ({ gear, zones }) =>
      new Promise((ok, bad) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const tx = r.result.transaction('settings', 'readwrite');
          tx.objectStore('settings').put({ key: 'strava', value: { gear, lastSync: new Date().toISOString() } });
          tx.objectStore('settings').put({ key: 'strava.zones', value: { hr: zones, at: new Date().toISOString() } });
          tx.oncomplete = () => (r.result.close(), ok());
          tx.onerror = () => bad(tx.error);
        };
      }),
    { gear: GEAR, zones: ZONES },
  );
  await page.goto('./#/flow/training/a/3001');
  await page.reload();
  await ready(page);
  await expect(page.getByRole('heading', { level: 1, name: `${P}Abendrunde Hügel` })).toBeVisible();
}

test('Schlag deinen Geist: Vergleich mit der Fahrt auf derselben Strecke', async ({ page, context, baseURL }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, context, baseURL);
  const card = page.locator('[data-ana="ghost"]');
  await expect(card.getByRole('heading', { name: 'Schlag deinen Geist' })).toBeVisible();
  // the most alike ride comes first: the same route, 15 days ago (182 W at 142 bpm against 188 W at 138 bpm)
  await expect(card.locator('[data-ghost-pick] option').first()).toContainText('gleiche Strecke');
  await expect(card.locator('[data-ghost-verdict]')).toHaveAttribute('data-ghost-verdict', 'samepower-less');
  await expect(card.locator('[data-ghost-verdict]')).toHaveText('Gleiche Leistung wie dein Geist, 4 Schläge weniger Puls.');
  await expect(card.locator('[data-ghost-result]')).toHaveAttribute('data-ghost-result', 'beat');
  await expect(card.locator('[data-ghost-result]')).toContainText('Geist geschlagen');
  await expect(card.locator('[data-ghost-row="hr"] .ck')).toHaveCount(1);
  // the result also stands in one line under the numbers; a tap lights the card
  const strip = page.locator('[data-ghost-strip]');
  await expect(strip).toContainText('Geist geschlagen');
  await expect(strip).toContainText('Gleiche Leistung wie am');
  await strip.click();
  await expect(card).toHaveAttribute('data-spot-on', 'ghost');
  await expect(card.locator('[data-ghost-row="hr"]')).toContainText('138');
  await expect(card.locator('[data-ghost-row="hr"]')).toContainText('142');
  await expect(card.locator('[data-ghost-row="hr"]')).toContainText('−4');
  await expect(card.locator('[data-ghost-alike]')).toHaveAttribute('data-ghost-alike', 'good');
  await expect(card.locator('[data-ghost-check="route"]')).toContainText('Gleiche Strecke');
  await expect(card.locator('[data-ghost-check="wind"]')).toContainText('Wind: nicht bekannt');
  // another ghost can be picked; the open link follows it
  const first = await card.locator('[data-ghost-open]').getAttribute('href');
  await card.locator('[data-ghost-pick]').selectOption({ index: 1 });
  await expect(card.locator('[data-ghost-open]')).not.toHaveAttribute('href', first);
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/ghost-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
  expect(errors).toEqual([]);
});

test('Ausprobieren bei «Schlag deinen Geist» öffnet eine Fahrt und lässt die Karte leuchten', async ({ page, context, baseURL }, info) => {
  await open(page, context, baseURL);
  // a ride other than the one open now: start from Me › What is new
  await page.goto('./#/me/news');
  await ready(page);
  await page.getByRole('searchbox', { name: 'Update oder Funktion suchen' }).fill('Schlag deinen Geist');
  await page.locator('[data-row]').filter({ hasText: 'Schlag deinen Geist' }).first().click();
  await page.locator('.wn-vopen').getByRole('link', { name: 'Die App wählt die ähnlichste frühere Fahrt', exact: false }).first().click();
  await expect(page).toHaveURL(/#\/flow\/training\/a\//);
  const card = page.locator('[data-ana="ghost"]');
  await expect(card).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('[data-spot-note]').first()).toContainText('Neu hier');
  if (process.env.SHOTS) {
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${process.env.SHOTS}/ausprobieren-${info.project.name === 'phone' ? 390 : 1440}.png` });
  }
});
