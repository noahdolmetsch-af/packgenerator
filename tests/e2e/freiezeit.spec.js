// Idee A3 «Freie Zeit plus gutes Wetter» (Noah 27.10.2026): Planen › Woche shows the next free and dry window
// from the Google calendar (the copy on this device) and the weather at home. Fictional data; Open-Meteo is mocked.
import { test, expect } from '@playwright/test';
import { base, tr } from './home0460-fixture.js';
import { importAndSettle, settle } from './settle.js';

const T = tr('de');
const DAY0 = '2026-11-03'; // a Tuesday; the clock stands at 06:00 Zurich (UTC+1)
const atZ = (date, h) => Date.parse(`${date}T00:00:00Z`) + (h - 1) * 36e5;
function meteo() {
  const time = [];
  for (let d = 0; d < 4; d++) for (let h = 0; h < 24; h++) time.push(Math.round(atZ(`2026-11-0${3 + d}`, h) / 1000));
  const n = time.length;
  const fill = (v) => Array(n).fill(v);
  return {
    latitude: 47.37, longitude: 8.54, elevation: 410, utc_offset_seconds: 3600,
    hourly: { time, temperature_2m: fill(14), apparent_temperature: fill(14), precipitation_probability: fill(5), precipitation: fill(0), weather_code: fill(1), wind_speed_10m: fill(8), wind_gusts_10m: fill(15), wind_direction_10m: fill(200), cape: fill(0), freezing_level_height: fill(2500), visibility: fill(20000), snowfall: fill(0), snow_depth: fill(0) },
    daily: { time: [0, 1, 2, 3].map((d) => Math.round(atZ(`2026-11-0${3 + d}`, 0) / 1000)), sunrise: [0, 1, 2, 3].map((d) => Math.round(atZ(`2026-11-0${3 + d}`, 7) / 1000)), sunset: [0, 1, 2, 3].map((d) => Math.round(atZ(`2026-11-0${3 + d}`, 17) / 1000)), uv_index_max: [1, 1, 1, 1] },
  };
}

test('the week shows the next free and dry window; «Not now» shows the next one', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => (/api\.open-meteo\.com\/v1\/forecast/.test(route.request().url()) ? route.fulfill({ json: meteo() }) : route.abort()));
  await page.clock.setFixedTime(new Date(`${DAY0}T06:00:00+01:00`));
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/');
  const d = structuredClone(base);
  d.tables.settings = [
    { key: 'homePlace', value: { name: 'Heimort', lat: 47.37, lon: 8.54 } },
    { key: 'agenda', value: { calendar: true } },
  ];
  await importAndSettle(page, { name: 'frei.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(d)) });
  // a busy morning in the calendar (the copy on this device is not in backups, so it is written here)
  await page.evaluate(({ start, end }) => new Promise((done, fail) => {
    const req = indexedDB.open('pack-generator');
    req.onerror = fail;
    req.onsuccess = () => {
      const tx = req.result.transaction('gEvents', 'readwrite');
      tx.objectStore('gEvents').put({ id: 'primary|e1', gid: 'e1', cal: 'primary', title: 'Testtermin', allDay: false, day: '2026-11-03', lastDay: '2026-11-03', start, end, busy: true });
      tx.oncomplete = () => { req.result.close(); done(); };
    };
  }), { start: new Date(atZ(DAY0, 7)).toISOString(), end: new Date(atZ(DAY0, 12)).toISOString() });
  await page.goto('./#/week');
  await settle(page);
  const card = page.locator('[data-free-slot]');
  await expect(card).toContainText('12:00–14:00');
  await expect(card).toContainText(T('{day} {from}–{to} free and dry').replace('{day} {from}–{to} ', '').trim());
  await card.getByRole('button', { name: T('Not now') }).click();
  await expect(card).not.toContainText('12:00–14:00');
});
