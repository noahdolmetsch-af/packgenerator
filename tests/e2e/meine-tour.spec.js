// «Meine Tour» (Plan «ganze App», Schritt 2a, Noah 08.11.2026 «2 a»): the card on Heute for a planned tour. German, phone + desktop.
// Fictional data (Gesamttest fixture plus one planned tour). MEINETOUR_SHOTS=<dir> saves screenshots.
import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { importAndSettle, ready } from './settle.js';

const FIX = fileURLToPath(new URL('../fixtures/gesamttest/test_data_gtp_daten.json', import.meta.url));
const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');
const SHOTS = process.env.MEINETOUR_SHOTS || '';
const TODAY = '2026-10-16';
const START = '2026-10-22';
const ID = 'test_data_mt_jura';

const entries = (n, packed) => Array.from({ length: n }, (_, k) => ({ itemId: `i${k}`, slot: 'seat', qty: 1, packed: k < packed }));

/** The fixture plus one planned tour: 3 days, route and weather known, 24 of 32 packed. */
function base() {
  const data = JSON.parse(readFileSync(FIX, 'utf8'));
  // the fixture has trips around its own dates: only the planned tour below may be near today
  data.tables.trips = data.tables.trips.filter((x) => (x.startDate ?? '') < '2026-10-01');
  return data;
}

function withTour(extra = {}) {
  const data = base();
  data.tables.trips.push({
    id: ID, domain: 'bikepacking', title: 'Jura-Überquerung', startDate: START, days: 3, bikeId: 'test_data_gtp_gravel', bike: 'Gravel Steel',
    entries: entries(32, 24), ready: [], status: 'planned', route: { km: 312 }, wx: { min: 4, max: 12 }, arrival: 'train', createdAt: '2026-10-01T08:00:00.000Z', ...extra,
  });
  return data;
}

async function shot(page, info, name, locator) {
  if (!SHOTS) return;
  const w = info.project.name === 'phone' ? 390 : 1440;
  if (locator) await locator.screenshot({ path: `${SHOTS}/${name}-card-${w}.png` });
  // Heute with the card in view, as Noah sees it
  await locator.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${SHOTS}/${name}-heute-${w}.png` });
}

async function setup(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  await page.clock.setFixedTime(new Date(`${TODAY}T10:00:00+02:00`));
}

async function openToday(page, info, data) {
  const file = info.outputPath('meinetour-daten.json');
  writeFileSync(file, JSON.stringify(data));
  await page.goto('./');
  await importAndSettle(page, file);
  await page.goto('./#/');
  await ready(page);
}

test('Meine Tour: the card stands on top of Heute with the four phases and one next step', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await setup(page, context);
  await openToday(page, info, withTour());

  const card = page.locator('[data-meinetour]');
  await expect(card).toBeVisible();
  await expect(card.locator('h2')).toHaveText(T('My tour'));
  await expect(card).toContainText('Jura-Überquerung');
  await expect(card.locator('[data-meinetour-countdown]')).not.toBeEmpty();
  await expect(card.locator('[data-meinetour-phase]')).toHaveCount(4);
  await expect(card.locator('[data-meinetour-phase]').first()).toContainText(T('Planning|phase'));
  await expect(card.locator('[data-meinetour-phase][aria-current="step"]')).toHaveCount(1);
  // one main button, no «Unterwegs» button (Noah «9 b»)
  await expect(card.locator('[data-meinetour-next]')).toHaveCount(1);
  await expect(card.locator('[data-meinetour-line]')).toContainText(T('Next: {title}').replace('{title}', ''));
  await expect(card.getByText(/Unterwegs-Modus/)).toHaveCount(0);
  // the first tile of the wall (it stands under the greeting and the picture, before the habits and the moment card)
  await expect(page.locator('[data-tile]').first()).toHaveAttribute('data-tile', 'meinetour');
  await shot(page, info, 'meine-tour', card);
  expect(errors).toEqual([]);
});

test('Meine Tour: the big button leads to the next open step, All steps to the Tour path', async ({ page, context }, info) => {
  await setup(page, context);
  await openToday(page, info, withTour());
  const card = page.locator('[data-meinetour]');
  await expect(card).toBeVisible();
  await card.locator('[data-meinetour-all]').click();
  await expect(page).toHaveURL(/#\/trips\/pfad\?t=test_data_mt_jura/);
  await expect(page.locator('[data-tourpfad]')).toBeVisible();
  await page.goBack();
  await expect(card).toBeVisible();
  const href = await card.locator('[data-meinetour-next]').getAttribute('href');
  await card.locator('[data-meinetour-next]').click();
  await expect(page).toHaveURL(new RegExp(href.replace(/[?]/g, '\\?')));
});

test('Meine Tour: no planned tour, no card', async ({ page, context }, info) => {
  await setup(page, context);
  await openToday(page, info, base());
  await expect(page.locator('[data-meinetour]')).toHaveCount(0);
});

test('Meine Tour: a tour that is not riding or already done has no card', async ({ page, context }, info) => {
  await setup(page, context);
  await openToday(page, info, withTour({ skipped: true }));
  await expect(page.locator('[data-meinetour]')).toHaveCount(0);
});
