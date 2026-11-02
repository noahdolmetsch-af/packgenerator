// «Ein Link wird ein Traum» (Träume und Neuland N13, Noah 27.10.2026 «1-5 a»): on Touren › Träume a pasted Ride with
// GPS link makes a dream with name, km, climb and map; in a dream, «Read from the link» reads a page's numbers.
// The app's own server is faked; fictional data only, no real network.
import { test, expect } from './clock.js';
import { mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const P = 'test_data_gtp_';
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z ]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const SHOTS = process.env.SHOTS_DIR ?? null;
const shot = async (page, info, name, part = null) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  const path = `${SHOTS}/${name}-${info.project.name === 'phone' ? '390' : '1440'}.png`;
  await (part ? part.screenshot({ path }) : page.screenshot({ path }));
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
// a fictional route of 6 points: about 35 km north, 85 m of climbing
const GPX = `<?xml version="1.0"?><gpx><trk><name>${P}Jura-Querung</name><trkseg>${[[47.0, 7.1, 500], [47.06, 7.12, 540], [47.12, 7.15, 530], [47.18, 7.18, 565], [47.24, 7.2, 560], [47.3, 7.22, 570]]
  .map(([a, b, e]) => `<trkpt lat="${a}" lon="${b}"><ele>${e}</ele></trkpt>`)
  .join('')}</trkseg></trk></gpx>`;
const PAGE = `<html><head><meta property="og:title" content="${P}Seeuferweg | komoot"><meta property="og:description" content="Distanz 45,2 km · 610 Hm"></head></html>`;

test('A link becomes a dream: Ride with GPS with map, a page with its numbers', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/packgen-three\.vercel\.app\/api\/lake/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ gpx: GPX, file: 'r.gpx' }) }));
  await context.route(/packgen-three\.vercel\.app\/api\/linkcheck/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ url: 'https://www.komoot.com/tour/1', html: PAGE }) }));
  await context.route(/^https?:\/\/(?!localhost[:/])(?!packgen-three\.vercel\.app\/api\/(?:lake|linkcheck))/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/trips/dreams');
  await ready(page);

  // 1. paste a Ride with GPS link and add: name, km, climb, and a map in the dream
  const field = page.getByRole('textbox', { name: T('New dream tour') });
  await field.fill('https://ridewithgps.com/routes/987');
  await page.locator('[data-dream-add]').click();
  const row = page.locator('[data-dream]').filter({ hasText: `${P}Jura-Querung` });
  await expect(row).toContainText('35 km');
  await expect(row).toContainText(T('{m} m up', { m: 85 }));
  await expect(page.getByRole('status').filter({ hasText: T('«{name}» added from the link: {what}.', { name: `${P}Jura-Querung`, what: '' }).slice(0, 10) })).toBeVisible();
  await noSideways(page);
  await page.evaluate(() => scrollTo(0, 0));
  await shot(page, info, 'LT1-liste');
  await row.locator('button.open').click();
  await expect(page.locator('[data-dream-map]')).toBeVisible();
  await page.getByRole('button', { name: T('Done') }).click();

  // 2. a dream with an own name and a komoot link: «Read from the link» takes its km and climb, the name stays
  await field.fill(`${P}Am See entlang`);
  await page.locator('[data-dream-add]').click();
  await page.locator('[data-dream]').filter({ hasText: `${P}Am See entlang` }).locator('button.open').click();
  const sheet = page.locator('dialog.dsheet[open]');
  await sheet.locator('input[type="url"]').fill('https://www.komoot.com/tour/1');
  await sheet.locator('[data-dream-read]').click();
  await expect(sheet.locator('[data-dream-read-ok]')).toContainText('45.2 km');
  await expect(sheet.locator('[data-dream-read-ok]')).toContainText(T('{m} m up', { m: 610 }));
  await shot(page, info, 'LT2-traum');
  await sheet.getByRole('button', { name: T('Done') }).click();
  const lake = page.locator('[data-dream]').filter({ hasText: `${P}Am See entlang` });
  await expect(lake).toContainText('45.2 km');
  // opened again: the numbers stay with the dream
  await lake.locator('button.open').click();
  await expect(sheet.locator('[data-dream-facts]')).toContainText(T('{m} m up', { m: 610 }));
  await sheet.getByRole('button', { name: T('Done') }).click();
  expect(errors).toEqual([]);
});
