// «Wetter oben» W2 (Noah 23.11.2026 «b»): three small cards under the weather card on Today: the best day of the week, the
// chain after rain, the ride window. Made-up place and weather (hoehe-fixture.js, with rain yesterday morning and from 15:00 today);
// Open-Meteo is mocked, everything else outside is blocked (openHome).
import { test, expect } from './clock.js';
import { openHome, homeFixture, day } from './home0460-fixture.js';
import { core } from './hoehe-fixture.js';

async function weather(context) {
  const j = core(day(-1));
  // hours counted from day(-1) 00:00 local: yesterday 14–19 drizzle (3 mm all in all), today (index 24+) from 15:00 rain
  j.hourly.time.forEach((s, i) => {
    if (i >= 14 && i < 20) j.hourly.precipitation[i] = 0.5;
    if (i >= 24 + 15 && i < 24 + 19) {
      j.hourly.precipitation[i] = 1;
      j.hourly.precipitation_probability[i] = 80;
    }
  });
  await context.route(/api\.open-meteo\.com\/v1\/forecast\?.*cape/, (r) => r.fulfill({ json: j }));
  await context.route(/api\.open-meteo\.com\/v1\/forecast\?.*cloud_cover_low/, (r) => r.fulfill({ status: 404, body: '{}' }));
  await context.route(/geocoding-api\.open-meteo\.com\//, (r) => r.fulfill({ json: { results: [] } }));
}

test('Today shows the week, the chain after rain and the ride window; Not today puts a card aside for the day', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: homeFixture(), weather });
  await page.goto('./#/');
  const cards = page.locator('[data-heute-karten]');
  await expect(cards).toBeVisible({ timeout: 20_000 });

  // the best day to ride: a day, hours, a temperature and a word
  const week = cards.locator('[data-heute-woche]');
  await expect(week).toContainText('Bester Tag zum Fahren');
  await expect(week).toContainText('°C');

  // it rained 3 mm yesterday afternoon: the chain wants oil, the way leads to the round «After the rain ride»
  const chain = cards.locator('[data-heute-kette]');
  await expect(chain).toContainText('Kette ölen');
  await expect(chain).toContainText('3 mm Regen in den letzten 24 Stunden');
  await expect(chain.locator('a')).toHaveAttribute('href', '#/bikes?tab=care&view=rounds');

  // dry until the rain (the value stamped 15:00 is the rain of 14:00–15:00) and daylight until 17:00 of the made-up place (its clock runs at +2 h, the browser's at Zurich: an hour less in winter)
  const win = cards.locator('[data-heute-fenster]');
  await expect(win).toContainText(/Trocken bis 1[34]:00/);
  await expect(win).toContainText(/Hell bis 1[67]:00/);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: info.outputPath(`heute-karten-${info.project.name}.png`) });

  // «Not today»: the card goes and stays away after a reload; the others stay
  await chain.getByRole('button', { name: 'Heute nicht' }).click();
  await expect(chain).toHaveCount(0);
  await page.reload();
  await expect(cards).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('[data-heute-kette]')).toHaveCount(0);
  await expect(page.locator('[data-heute-fenster]')).toBeVisible();
});
