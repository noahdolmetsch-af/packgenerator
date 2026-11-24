// «Tourenvorschläge» (Noah 05.11.2026 «1a 2a 3a»; 23.11.2026 100 Touren): the page with its tours, filters (canton, kind, fitness, skill, time),
// one tour with map, profile and «Why this suggestion?», «Not for me» with Undo. Independent of the month: snow only moves tours
// between two groups. The expected counts come from the app's own data (not from its rules: plain specs never import *.svelte.js).
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import TOURS from '../../src/lib/vorschlaege/data/netz.js';
import { anreiseOf, withinTravel } from '../../src/lib/vorschlaege/anreise.js';
import { ready } from './settle.js';
import { cellOf, cellsOf, addDays } from '../../src/lib/vorschlaege/wetter.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');
const hard = TOURS.filter((x) => x.cond === 'difficult');
const FIRST = [...hard].sort((a, b) => a.dz - b.dz)[0].id; // nearest hard tour from Zurich main station (no home place)

test('Tour suggestions: 200 tours, filters, one tour, hide and undo', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));

  // the way in: Touren › Träume has the button
  await page.goto('./#/trips/dreams');
  await ready(page);
  await page.locator('[data-dreams-suggest]').click();
  await page.locator('[data-vs-view="list"]').click();
  await expect(page.locator('[data-page="vorschlaege"] h1')).toHaveText(T('Tour suggestions'));
  const tours = page.locator('[data-vs-tour]');
  expect(TOURS.length).toBe(200);
  await expect(tours).toHaveCount(hard.length); // only hard for fitness at the start
  await expect(page.locator('[data-vs-filters] [data-vs-cond="difficult"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-vs-filters] [data-vs-cond="medium"]')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('[data-vs-filters] [data-vs-tech="any"]')).toHaveAttribute('aria-pressed', 'true');
  // nearest first: the first card is the nearest hard tour (from Zurich main station without a home place)
  await expect(tours.first()).toHaveAttribute('data-vs-tour', FIRST);

  // canton, fitness and skill filters
  await page.locator('[data-vs-region="gr"]').click();
  await expect(tours).toHaveCount(hard.filter((x) => x.region === 'gr').length);
  await page.locator('[data-vs-region="gr"]').click();
  await page.locator('[data-vs-cond="medium"]').click();
  await page.locator('[data-vs-cond="easy"]').click();
  await expect(tours).toHaveCount(TOURS.length);
  await page.locator('[data-vs-tech="difficult"]').click();
  await expect(tours).toHaveCount(TOURS.filter((x) => x.tech === 'difficult').length);
  await page.locator('[data-vs-tech="any"]').click();
  await page.locator('[data-vs-region="zh"]').click();
  await page.locator('[data-vs-cond="medium"]').click();
  await page.locator('[data-vs-cond="easy"]').click();
  await page.locator('[data-vs-tech="difficult"]').click();
  await expect(page.getByText(T('No tour fits these filters.'))).toBeVisible(); // Zurich has no tour hard for skill
  await page.getByRole('button', { name: T('Reset filters') }).click();
  await expect(tours).toHaveCount(hard.length);

  // the journey: a line on every card; «up to 1 h» keeps the tours whose journey (there or back) is that short; the car is quicker
  await expect(tours.first().locator('[data-vs-trip]')).toBeVisible();
  const within = (mode, max) => hard.filter((x) => withinTravel(anreiseOf(x, null, mode), max)).length;
  await page.locator('[data-vs-travel-max="60"]').click();
  await expect(tours).toHaveCount(within('pt', 60));
  await page.locator('[data-vs-mode="car"]').click();
  await expect(tours).toHaveCount(within('car', 60));
  expect(within('car', 60)).toBeGreaterThanOrEqual(within('pt', 60));
  await page.locator('[data-vs-mode="pt"]').click();
  await page.locator('[data-vs-travel-max="any"]').click();
  await expect(tours).toHaveCount(hard.length);

  // «For you»: the line says what is known; «Doable today» starts off, and without a free window or a form answer it keeps every tour
  await expect(page.locator('[data-vs-you]')).toBeVisible();
  await expect(page.locator('[data-vs-you-line]')).not.toBeEmpty();
  await expect(page.locator('[data-vs-today]')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('[data-vs-today]').click();
  await expect(page.locator('[data-vs-today]')).toHaveAttribute('aria-pressed', 'true');
  await expect(tours.first()).toBeVisible();
  await page.locator('[data-vs-today]').click();
  await expect(tours).toHaveCount(hard.length);

  // time and kind (all fitness levels, so that the short downhill is in)
  await page.locator('[data-vs-cond="medium"]').click();
  await page.locator('[data-vs-cond="easy"]').click();
  await page.locator('[data-vs-hours="2"]').click();
  await expect(tours).toHaveCount(1);
  await page.locator('[data-vs-hours="any"]').click();
  await page.locator('[data-vs-art="downhill"]').click();
  await expect(tours).toHaveCount(1);
  await page.locator('[data-vs-art="downhill"]').click();
  await expect(page.locator('[data-vs-start]')).toContainText(T('Set your home place and you can choose how far the start may be.'));
  await page.locator('[data-vs-cond="medium"]').click();
  await page.locator('[data-vs-cond="easy"]').click();
  await expect(tours).toHaveCount(hard.length);

  // the map: the same tours, one dot each, a tap on a dot opens the tour, a tap on a canton filters
  await page.locator('[data-vs-view="map"]').click();
  await expect(page.locator('[data-vs-karte] svg')).toBeVisible();
  await expect(page.locator('[data-vs-karte] a[href^="#/trips/vorschlaege/"]')).toHaveCount(hard.length);
  // the hover card (Noah 23.11.2026): the mouse over a dot shows title, km, time and climb; on a phone the first tap shows it and does not open the tour yet
  const near = TOURS.find((x) => x.id === FIRST);
  const dot = page.locator(`[data-vs-dot="${FIRST}"]`);
  await dot.scrollIntoViewIfNeeded();
  if (info.project.name === 'phone') {
    await dot.tap({ force: true }); // a real touch tap (it also focuses the link): the first tap shows the card
  } else {
    await dot.hover({ force: true });
  }
  const tip = page.locator('[data-vs-tip]');
  await expect(tip).toBeVisible();
  await expect(tip).toHaveAttribute('data-vs-tip', FIRST);
  await expect(tip).toContainText(near.title);
  await expect(tip).toContainText('km');
  await expect(tip).toContainText(`+`);
  await expect(tip.locator('a.topen')).toHaveAttribute('href', `#/trips/vorschlaege/${FIRST}`);
  expect(await page.evaluate(() => location.hash)).toBe('#/trips/vorschlaege');
  if (info.project.name !== 'phone') {
    await page.mouse.move(2, 2);
    await expect(tip).toHaveCount(0);
  }
  // «map on top»: in the map view the map stands above the filters (Noah 23.11.2026: big and well visible)
  const yMap = (await page.locator('[data-vs-karte]').boundingBox()).y;
  const yFilters = (await page.locator('[data-vs-filters]').boundingBox()).y;
  expect(yMap).toBeLessThan(yFilters);
  await page.locator('[data-vs-view="list"]').click();
  expect((await page.locator('[data-vs-filters]').boundingBox()).y).toBeLessThan((await page.locator('[data-vs-tour]').first().boundingBox()).y);
  await page.locator('[data-vs-view="map"]').click();
  await page.locator('[data-vs-kt="gr"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-vs-karte] a[href^="#/trips/vorschlaege/"]')).toHaveCount(hard.filter((x) => x.region === 'gr').length);
  await page.locator('[data-vs-kt="gr"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-vs-karte] a[href^="#/trips/vorschlaege/"]')).toHaveCount(hard.length);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.locator('[data-vs-view="list"]').click();

  // one tour: the hardest of the pilot, with warning, profile and the reasons
  await page.locator('[data-vs-tour="sm-332"] a.tl').click();
  await expect(page.locator('[data-page="vorschlaege"] h1')).toContainText('Davos');
  await expect(page.locator('[data-vs-map]')).toBeVisible();
  // the line stands out (thick, strong colour, km marks) and the ground is a visible choice under the map
  await expect(page.locator('[data-vs-map] svg.over.strong path.line')).toHaveCount(1);
  await expect(page.locator('[data-vs-map] svg.over .kmt').first()).toBeAttached();
  await expect(page.locator('[data-vs-grounds]')).toBeVisible();
  await page.locator('[data-vs-ground="swissimage"]').click();
  await expect(page.locator('[data-vs-ground="swissimage"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-vs-ground="auto"]')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('[data-vs-ground="auto"]').click();
  await expect(page.locator('[data-vs-warn]')).toBeVisible();
  // the shared profile (steepness colours) and the ground strip under it; the profile and the map show the same place
  await expect(page.locator('[data-profile] svg').first()).toBeVisible();
  await expect(page.locator('[data-vs-ground-strip]')).toBeVisible();
  await expect(page.locator('[data-map-marker]')).toHaveCount(0);
  await page.locator('[data-profile-box]').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-vs-map] [data-map-marker]')).toHaveCount(1);
  // the steepest pieces: tap one, it is lit on the map and the profile zooms in; tap again, back to the whole tour
  await expect(page.locator('[data-vs-steep]')).toBeVisible();
  const items = page.locator('[data-vs-steep-item]');
  expect(await items.count()).toBeGreaterThan(0);
  expect(await items.count()).toBeLessThanOrEqual(3);
  await expect(page.locator('[data-map-lit]')).toHaveCount(0);
  await items.first().click();
  await expect(items.first()).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-vs-map] [data-map-lit]')).toHaveCount(1);
  await expect(page.locator('[data-profile-whole]')).toBeEnabled();
  await items.first().click();
  await expect(page.locator('[data-map-lit]')).toHaveCount(0);
  await expect(page.locator('[data-vs-why]')).toContainText(T('Why this suggestion?'));
  await expect(page.locator('[data-vs-facts]')).toContainText('33 km');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

  // choose the lines: «Snow» off, the line is gone
  await page.locator('[data-vs-lines] summary').click();
  await page.locator('[data-vs-line="snow"]').uncheck();
  await expect(page.locator('[data-vs-why] li')).toHaveCount(4); // time, journey, difficulty and the distance from Zurich are left
  await page.locator('[data-vs-line="snow"]').check();

  // keep as a dream
  await page.locator('[data-vs-dream]').click();
  await expect(page.getByRole('status').filter({ hasText: T('Open Dreams') })).toBeVisible();

  // not for me, then undo
  await page.locator('[data-vs-hide]').click();
  await expect(page).toHaveURL(/#\/trips\/vorschlaege$/);
  await expect(tours).toHaveCount(hard.length - 1);
  await page.getByRole('button', { name: T('Undo') }).click();
  await expect(tours).toHaveCount(hard.length);
  expect(errors).toEqual([]);
  void info;
});

// «Wetter» (Noah 24.11.2026 «a»): the forecast of one request for all starts; the tour next to Zurich gets heavy rain today, all others a good week
test('Tour suggestions: weather light on every tour, best day, filter by day, the week on a tour', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/');
  const today = await page.evaluate(() => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Zurich' }));
  const cells = cellsOf(TOURS);
  const rainy = cells.indexOf(cellOf(TOURS.find((x) => x.id === FIRST)));
  const times = Array.from({ length: 19 }, (_, i) => addDays(today, i - 2));
  await context.route(/^https?:\/\/(?!localhost[:/])(?!api\.open-meteo\.com\/v1\/forecast)/, (r) => r.abort());
  // the hourly forecast of a tour start (the weather core): cold, dry, rain from 13:00 today
  const off = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich', timeZoneName: 'longOffset' }).formatToParts(new Date()).find((p) => p.type === 'timeZoneName').value.replace('GMT', '') || '+00:00';
  const t0 = Date.parse(`${addDays(today, -1)}T00:00:00${off}`) / 1000;
  const hrs = Array.from({ length: 24 * 19 }, (_, i) => t0 + i * 3600);
  const wetHour = (s) => s >= Date.parse(`${today}T13:00:00${off}`) / 1000 && s < Date.parse(`${today}T20:00:00${off}`) / 1000;
  const core = () => ({
    latitude: 47, longitude: 8, elevation: 500, utc_offset_seconds: (off === '+02:00' ? 7200 : 3600),
    hourly: { time: hrs, temperature_2m: hrs.map(() => 6), apparent_temperature: hrs.map(() => 5), precipitation_probability: hrs.map((s) => (wetHour(s) ? 90 : 5)), precipitation: hrs.map((s) => (wetHour(s) ? 1.5 : 0)), weather_code: hrs.map((s) => (wetHour(s) ? 63 : 3)), wind_speed_10m: hrs.map(() => 10), wind_gusts_10m: hrs.map(() => 20), wind_direction_10m: hrs.map(() => 270), cape: hrs.map(() => 0), freezing_level_height: hrs.map(() => 2500), visibility: hrs.map(() => 20000), snowfall: hrs.map(() => 0), snow_depth: hrs.map(() => 0), snowfall_height: hrs.map(() => null) },
    daily: { time: Array.from({ length: 19 }, (_, i) => t0 + i * 86400), sunrise: Array.from({ length: 19 }, (_, i) => t0 + i * 86400 + 7 * 3600), sunset: Array.from({ length: 19 }, (_, i) => t0 + i * 86400 + 17 * 3600), uv_index_max: Array.from({ length: 19 }, () => 2) },
  });
  await context.route(/api\.open-meteo\.com\/v1\/forecast/, (route) => {
    const q = new URL(route.request().url()).searchParams;
    if (q.get('hourly')) return route.fulfill({ json: core() });
    const n = q.get('latitude').split(',').length;
    const place = (i) => ({
      elevation: 500,
      daily: {
        time: times,
        weather_code: times.map(() => 3),
        temperature_2m_max: times.map(() => 14),
        temperature_2m_min: times.map(() => 5),
        precipitation_sum: times.map((d) => (i === rainy && d === today ? 12 : 0)),
        precipitation_probability_max: times.map(() => 10),
        wind_gusts_10m_max: times.map(() => 20),
      },
    });
    return route.fulfill({ json: Array.from({ length: n }, (_, i) => place(i)) });
  });
  await page.goto('./#/trips/vorschlaege');
  await ready(page);
  await page.locator('[data-vs-view="list"]').click();
  const tours = page.locator('[data-vs-tour]');
  await expect(tours).toHaveCount(hard.length);
  const first = page.locator(`[data-vs-tour="${FIRST}"]`);
  // the light: today bad (rain), tomorrow and the day after fit; the best day is tomorrow
  await expect(first.locator('[data-vs-wx]')).toContainText(`${T('Today|tour')} ${T('Rain|wx')}`);
  await expect(first.locator('[data-vs-wx] [data-wx-level="bad"]')).toHaveCount(1);
  await expect(first.locator('[data-vs-wx] [data-wx-level="good"]')).toHaveCount(2);
  await expect(first.locator('[data-vs-wx-best]')).toContainText(T('Best day: {day}').replace(' {day}', ''));
  // every tour has its light line (all starts were in the one answer)
  await expect(page.locator('[data-vs-wx]')).toHaveCount(hard.length);

  // the filter «Today»: the tour with heavy rain is gone, the others stay; «Any» brings it back
  await page.locator('[data-vs-wday="today"]').click();
  await expect(first).toHaveCount(0);
  await expect(tours.first()).toBeVisible();
  const n = await tours.count();
  expect(n).toBeGreaterThan(0);
  expect(n).toBeLessThan(hard.length);
  await page.locator('[data-vs-wday="tomorrow"]').click();
  await expect(first).toHaveCount(1);
  await page.locator('[data-vs-wday="any"]').click();
  await expect(tours).toHaveCount(hard.length);

  // the map: a ring around each dot with the light of today (the same traffic light as in the list)
  await page.locator('[data-vs-view="map"]').click();
  await expect(page.locator('[data-vs-ring="bad"]')).toHaveCount(1);
  expect(await page.locator('[data-vs-ring="good"]').count()).toBeGreaterThan(0);
  await expect(page.locator('[data-vs-ring-key]')).toBeVisible();
  await page.locator('[data-vs-view="list"]').click();

  // one tour: the week with the best day, and the line in «Why this suggestion?»
  await first.locator('a.tl').click();
  const week = page.locator('[data-vs-wx-week]');
  await expect(week).toBeVisible();
  await expect(week.locator('li')).toHaveCount(7);
  await expect(week.locator('li').first()).toHaveAttribute('data-wx-level', 'bad');
  await expect(week.locator('[data-vs-wx-best]')).toContainText(T('Best day: {day}').replace(' {day}', ''));
  // start time (the hourly forecast: dry in the morning, rain from 13:00) and what to wear (cold: gloves)
  await expect(week.locator('[data-vs-wx-starts] li')).toHaveCount(3);
  await expect(week.locator('[data-vs-wx-start="best"]')).toHaveCount(1);
  await expect(week.locator('[data-vs-wx-wear]')).toBeVisible();
  await expect(week.locator('[data-vs-wx-wear] a')).toHaveAttribute('href', '#/wardrobe');
  await expect(page.locator('[data-vs-why] li').filter({ hasText: T('Today: {what}.').replace(' {what}.', '') })).toHaveCount(1);
  expect(errors).toEqual([]);
});
