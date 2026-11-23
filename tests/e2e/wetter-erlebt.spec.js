// «Erlebtes Wetter im Rückblick» (Wetter-Ausbau E, Noah 22.11.2026 «a»): the answer «Weather» of the debrief is filled in from what came.
// Fictional trip; the backup is imported first (as a copy of real data would be); Open-Meteo is mocked, everything else outside is blocked.
import { test, expect } from './clock.js';
import { openHome, homeFixture, trip, day } from './home0460-fixture.js';

const ID = 'test_data_gtp_Rueckweg';
const data = () => {
  const d = homeFixture();
  d.tables.trips = [trip('Rueckweg', day(-3), { days: 2, wx: { min: 6, max: 14, rain: 'none' }, place: { lat: 47.39, lon: 8.04, name: 'test_data_gtp_ Start' } })];
  d.tables.debriefs = [];
  return d;
};
// the two days of the tour came cold: 1–6 °C and 2–7 °C, wet on the second day
const mockCame = (context) => context.route(/open-meteo\.com\/v1\/forecast\?.*start_date=/, (route) => route.fulfill({ json: {
  daily: { time: [day(-3), day(-2)], temperature_2m_min: [1, 2], temperature_2m_max: [6, 7], precipitation_sum: [0, 4.2], wind_speed_10m_max: [14, 28], wind_gusts_10m_max: [22, 40] },
  hourly: { time: [] },
} }));

test('The debrief fills in colder from what came, shows it, and a tapped answer stays', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: data() });
  await mockCame(context);
  await page.goto(`./#/debrief/${ID}`);
  await page.locator('details.how-fold > summary').click();
  const line = page.locator('[data-debrief-lived]');
  await expect(line).toBeVisible({ timeout: 20_000 });
  await expect(line).toContainText('Gekommen: 1–7 °C');
  await expect(line).toContainText('4.2 mm Regen');
  await expect(line).toContainText('Wind bis 28 km/h');
  await expect(line).toContainText('Vorgeschlagen');
  const wx = page.getByRole('group', { name: 'Wetter' });
  await expect(wx.getByRole('button', { name: 'Kälter' })).toHaveAttribute('aria-pressed', 'true');
  // one tap changes it; the suggestion note goes and the answer stays after a reload
  await wx.getByRole('button', { name: 'Wie geplant' }).click();
  await expect(wx.getByRole('button', { name: 'Wie geplant' })).toHaveAttribute('aria-pressed', 'true');
  await expect(line).not.toContainText('Vorgeschlagen');
  await page.reload();
  await page.locator('details.how-fold > summary').click();
  await expect(page.getByRole('group', { name: 'Wetter' }).getByRole('button', { name: 'Wie geplant' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-debrief-lived]')).toBeVisible();
});

test('Without the weather service the answer stays as planned and nothing is shown', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: data() });
  await context.route(/open-meteo\.com\/v1\/forecast\?.*start_date=/, (route) => route.abort());
  await page.goto(`./#/debrief/${ID}`);
  await page.locator('details.how-fold > summary').click();
  await expect(page.getByRole('group', { name: 'Wetter' }).getByRole('button', { name: 'Wie geplant' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-debrief-lived]')).toHaveCount(0);
});
