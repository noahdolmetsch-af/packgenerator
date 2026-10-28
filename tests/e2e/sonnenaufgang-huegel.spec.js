// «Sonnenaufgang auf dem Hügel» (Träume und Neuland N9, Noah 27.10.2026 «1-5 a»): with a (faked) clear forecast
// the next clear sunrise and sunset near the (fictional) home show with «Leave …»; an own «View» point is named
// with its km. Cloudy everywhere: one quiet line. No real network.
import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const P = 'test_data_gtp_';
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z ]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const SHOTS = process.env.SHOTS_DIR ?? null;
const shot = async (loc, info, name) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await loc.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? '390' : '1440'}.png` });
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const plus = (n) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${today()}T12:00:00Z`));
const METEO = (cloud) => {
  const time = Array.from({ length: 7 }, (_, i) => plus(i - 1));
  const hours = time.flatMap((d) => Array.from({ length: 24 }, (_, h) => `${d}T${String(h).padStart(2, '0')}:00`));
  return {
    daily: { time, temperature_2m_min: time.map(() => 4), temperature_2m_max: time.map(() => 14), precipitation_sum: time.map(() => 0), precipitation_probability_max: time.map(() => 5) },
    hourly: { time: hours, temperature_2m: hours.map(() => 8), precipitation_probability: hours.map(() => 0), cloud_cover: hours.map(() => cloud) },
  };
};

async function put(page, store, rows) {
  await page.evaluate(
    ([name, list]) =>
      new Promise((ok, bad) => {
        const r = indexedDB.open('pack-generator');
        r.onerror = () => bad(r.error);
        r.onsuccess = () => {
          const tx = r.result.transaction(name, 'readwrite');
          for (const row of list) tx.objectStore(name).put(row);
          tx.oncomplete = () => (r.result.close(), ok());
          tx.onerror = () => bad(tx.error);
        };
      }),
    [store, rows],
  );
}

test('Sunrise on the hill: clear morning and evening, the view point, cloudy says so', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  let cloud = 10;
  await context.route(/api\.open-meteo\.com\/v1\/forecast/, (r) => r.fulfill({ json: METEO(cloud) }));
  await context.route(/^https?:\/\/(?!localhost[:/])(?!api\.open-meteo\.com)/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/trips/dreams');
  await ready(page);
  await expect(page.locator('[data-sun-tip]')).toHaveCount(0);

  await put(page, 'settings', [{ key: 'homePlace', value: { name: `${P}Zürich`, lat: 47.3769, lon: 8.5417 } }]);
  await page.reload();
  await ready(page);

  // 1. clear: the next sunrise and sunset, «a hill nearby» and the hint
  const sec = page.locator('[data-sun-tip]');
  await expect(sec.locator('[data-st="rise"]')).toContainText(T('Clear morning {day}: sunrise {at}').split('{')[0].trim());
  await expect(sec.locator('[data-st="set"]')).toBeVisible();
  await expect(sec.locator('[data-st="rise"]')).toContainText(T('Leave {at} for a hill nearby').split('{')[0].trim());
  await expect(sec.locator('[data-st-hint]')).toBeVisible();

  // 2. an own view point: named with its km
  await put(page, 'settings', [{ key: 'own-points', value: { points: [{ id: `${P}v`, kind: 'view', name: `${P}Aussicht`, note: '', lat: 47.4, lon: 8.56, createdAt: '2026-09-01T10:00:00Z' }] } }]);
  await page.reload();
  await ready(page);
  await expect(sec.locator('[data-st="rise"]')).toContainText(`${P}Aussicht`);
  await expect(sec.locator('[data-st-hint]')).toHaveCount(0);
  await noSideways(page);
  await shot(sec, info, 'SH1-sonne');

  // 3. cloudy everywhere (a fresh forecast): one quiet line
  cloud = 95;
  await page.evaluate(
    () =>
      new Promise((ok) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const tx = r.result.transaction('meta', 'readwrite');
          tx.objectStore('meta').clear();
          tx.oncomplete = () => (r.result.close(), ok());
        };
      }),
  );
  await page.reload();
  await ready(page);
  await expect(sec.locator('[data-st-none]')).toBeVisible();
  expect(errors).toEqual([]);
});
