// «Kursblick» (Noah 22.11.2026): the small app for the daily prices, German UI, phone and desktop. The price service is
// answered here with invented series (tests/e2e/kursblick-data.js); every other outside request is blocked.
// Gold card with reference day and sale value, SMI, periods (also an own one), the sale calculator keeps the deduction,
// an offline start shows the last prices, the way in from the currency tool, the small app with its own tabs.
// KURS_SHOTS=<folder> saves the screenshots for the pull request.
import { test, expect } from './clock.js';
import { mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { answer, FIXTURE } from './kursblick-data.js';
import { goldChfKg, verkaufswert, vergleich, verglichenMit, PERIODS } from '../../src/lib/kurse/rechnen.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z0-9]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const SHOTS = process.env.KURS_SHOTS;
const GOLD = goldChfKg(FIXTURE.gold.points, FIXTURE.usdchf.points);
const lastGold = GOLD[GOLD.length - 1][1];
// de-CH writes 95’784 (a typographic apostrophe); the browser and Node may differ, so any of them matches
const num = (n) => new RegExp(String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "['’ ]?"));
const digits = (s) => s.replace(/\D/g, '');

async function start(page, context, { down = false } = {}) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.route('https://packgen-three.vercel.app/api/lake?action=kurse*', (route) => {
    if (down) return route.fulfill({ status: 503, body: '{}' });
    const id = new URL(route.request().url()).searchParams.get('id');
    return FIXTURE[id] ? route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(answer(id)) }) : route.fulfill({ status: 400, body: '{}' });
  });
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}
async function shot(page, info, name) {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'desktop' ? '1440' : '390'}.png`, fullPage: true });
}

test('Kursblick: gold with reference and sale value, the SMI, periods, the calculator, offline, the way in', async ({ page, context }, info) => {
  const errors = await start(page, context);

  // the way in: a link at the end of the currency tool (no block above the content)
  await page.goto('./#/me/tools/money');
  await page.locator('[data-kursblick-link] a').click();
  await expect(page).toHaveURL(/#\/kurse$/);

  await expect(page.getByRole('heading', { level: 1, name: 'Kursblick' })).toBeVisible();
  const gold = page.locator('[data-gold]');
  await expect(gold.locator('[data-gold-preis]')).toBeVisible();
  expect(digits(await gold.locator('[data-gold-preis]').innerText())).toContain(String(Math.round(lastGold)));
  await expect(gold).toContainText(T('Close of {day}', { day: '' }).trim());
  const ref = vergleich(GOLD, '2026-11-01');
  expect(ref.from[0]).toBe('2026-10-30'); // the Sunday reference counts as the Friday before
  await expect(gold.locator('[data-gold-ref]')).toContainText(`${ref.pct > 0 ? '+' : '−'}${Math.abs(ref.pct).toLocaleString('de-CH', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`);
  await expect(gold).toContainText(T('The reference day had no trading, so the close of {day} counts.', { day: '' }).split('{')[0].trim().slice(0, 20));
  // the sale value: price minus 2 %
  await expect(gold.locator('[data-verkauf]')).toContainText(num(verkaufswert(lastGold, 2)));
  await expect(page.locator('[data-smi]')).toBeVisible();
  await expect(page.locator('[data-stand-zeit]')).toBeVisible();
  await shot(page, info, 'kursblick-heute');

  // a period: the year, then an own one of 45 days
  const year = verglichenMit(GOLD, PERIODS.find((p) => p.key === 'year'));
  await page.locator('[data-zeitraum]').getByRole('button', { name: T('Year'), exact: true }).click();
  await expect(gold).toContainText(`${year.pct > 0 ? '+' : '−'}${Math.abs(year.pct).toLocaleString('de-CH', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`);
  await page.locator('[data-zeitraum]').getByRole('button', { name: T('Own period') }).click();
  await page.locator('[data-eigen] input').fill('45');
  await page.locator('[data-eigen] select').selectOption('d');
  await page.locator('[data-eigen] button').click();
  await expect(gold).toContainText(`45 ${T('days')}`);
  await expect(page.locator('[data-verlauf]')).toBeVisible();
  await shot(page, info, 'kursblick-zeitraum');

  // Gold: the calculator keeps the deduction after a reload
  await page.goto('./#/kurse/gold');
  await expect(page.locator('[data-rechner]')).toBeVisible();
  await page.locator('[data-abschlag]').fill('5');
  await page.locator('[data-abschlag]').press('Tab');
  await expect(page.locator('[data-netto]')).toContainText(num(verkaufswert(lastGold, 5)));
  await page.getByRole('button', { name: T('Coins') }).click(); // the form suggests 4 %
  await expect(page.locator('[data-netto]')).toContainText(num(verkaufswert(lastGold, 4)));
  await page.reload();
  await expect(page.locator('[data-abschlag]')).toHaveValue('4');
  await expect(page.locator('[data-alle] tbody tr')).toHaveCount(PERIODS.length);
  await expect(page.locator('[data-ref-text]')).toBeVisible();
  await shot(page, info, 'kursblick-gold');

  // Sources: every price says its day; with the service down the last answer stays, marked as older
  await page.goto('./#/kurse/quellen');
  await expect(page.locator('[data-stand="gold"]')).toContainText('Stooq');
  await expect(page.locator('[data-stand="smi"]')).toContainText('Yahoo');
  await context.unroute('https://packgen-three.vercel.app/api/lake?action=kurse*');
  await context.route('https://packgen-three.vercel.app/api/lake?action=kurse*', (route) => route.fulfill({ status: 503, body: '{}' }));
  await page.getByRole('button', { name: T('Fetch prices again') }).click();
  await expect(page.locator('[data-stand="gold"]')).toContainText(T('older, the server did not answer'));
  await shot(page, info, 'kursblick-quellen');

  // nothing runs off the side on a small phone
  const size = page.viewportSize();
  for (const w of [320, 390]) {
    await page.setViewportSize({ width: w, height: size.height });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(w);
  }
  expect(errors).toEqual([]);
});

test('Kursblick: without a service and without saved prices the page says so and offers to try again', async ({ page, context }, info) => {
  await start(page, context, { down: true });
  await page.goto('./#/kurse');
  await expect(page.getByText(T('No prices right now'))).toBeVisible();
  await expect(page.getByRole('button', { name: T('Try again') })).toBeVisible();
  await shot(page, info, 'kursblick-leer');
});

test('Kursblick: the small app opens on its own page with its own tabs', async ({ page, context }) => {
  await start(page, context);
  await page.goto('./apps/kursblick/');
  await expect(page.locator('[data-gold]')).toBeVisible();
  const tabs = page.getByRole('navigation').getByRole('link', { name: T('Gold'), exact: true });
  await expect(tabs.first()).toBeVisible();
  await tabs.first().click();
  await expect(page.locator('[data-rechner]')).toBeVisible();
});
