// Paket M «Aus Touren lernen»: the Chronik-Karte and #/chronik (#1027), «Was die App gelernt hat» #/gelernt
// (#38) and «Dein Jahr als Bildgeschichte» #/jahr (#208). Phone and computer, in German, no sideways scroll,
// no page errors. Fictional data only: the Gesamttest fixture plus tests/e2e/lernen-fixture.js around today.
import { test, expect } from '@playwright/test';
import { start, fixture, day, tr } from './gesamttest/lib.js';
import { settle } from './settle.js';
import { lernenData, P } from './lernen-fixture.js';

const T = tr('de');

async function go(page, hash) {
  await page.goto('./' + hash);
  await page.locator('main').waitFor();
  try {
    await settle(page);
  } catch {
    /* a page without the settle marker */
  }
}
const noSideScroll = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);

function data() {
  const base = fixture().data;
  const L = lernenData(day()).tables;
  const tables = { ...base.tables };
  for (const k of ['trips', 'debriefs', 'rides', 'learnings', 'items']) tables[k] = [...(base.tables[k] ?? []), ...L[k]];
  tables.settings = [...base.tables.settings.filter((s) => s.key !== 'pace'), ...L.settings];
  return { ...base, tables };
}

test('Chronik, Gelernt and the year story', async ({ page, context }, info) => {
  test.setTimeout(240_000);
  const F = lernenData(day());
  const errors = await start(page, context, info, { data: data() });

  // #1027: the Chronik-Karte on #/chronik: this day one year ago, the small map, Tag / Monat
  await go(page, '#/chronik');
  const card = page.locator('[data-section="chronik"]');
  await expect(card.getByRole('heading', { name: T('Earlier at this time') })).toBeVisible();
  await expect(card.locator(`[data-chronik-entry="${P}jura"]`)).toBeVisible();
  await expect(card.locator(`[data-chronik-entry="${P}jura"]`)).toContainText('Zu viel Werkzeug dabei.');
  await expect(card.locator('svg[data-chronik-map] path').first()).toBeVisible();
  await expect(card.locator(`[data-chronik-entry="${P}seen"]`)).toHaveCount(0);
  await card.getByRole('button', { name: new RegExp(`^${T('Month|chronik')}`) }).click();
  await expect(card.locator(`[data-chronik-entry="${P}seen"]`)).toBeVisible();
  await noSideScroll(page);

  // the time line: filter «Pflege» shows only bike care; «Alle» again; the month arrows
  const chips = page.getByRole('group', { name: T('Show') });
  await chips.getByRole('button', { name: T('Care|chronik') }).click();
  const rows = page.locator('section.day [data-kind]');
  await expect(rows.first()).toBeVisible();
  expect(new Set(await rows.evaluateAll((els) => els.map((e) => e.dataset.kind)))).toEqual(new Set(['care']));
  await chips.getByRole('button', { name: T('All|chronik') }).click();
  await expect(page.getByRole('button', { name: T('Older month') })).toBeEnabled();
  await page.getByRole('button', { name: T('Older month') }).click();
  await expect(page).toHaveURL(/#\/chronik\/\d{4}-\d\d$/);
  await noSideScroll(page);

  // a tap on the trip opens its Rückblick
  await page.locator(`[data-chronik-entry="${P}jura"]`).click();
  await expect(page).toHaveURL(new RegExp(`#/debrief/${P}jura`));

  // #38: the Monatskarte of the month of «Herbstrunde», then the Jahresbrief of its year
  const ym = F.days.c3.slice(0, 7);
  await go(page, `#/gelernt/${ym}`);
  const mc = page.locator('[data-monthcard]');
  await expect(mc.locator('[data-line="trips"]')).toBeVisible();
  await expect(mc.locator('[data-line="learnings"]')).toBeVisible();
  await expect(mc.locator('[data-line="templates"]')).toBeVisible();
  await noSideScroll(page);
  const y = F.days.c2.slice(0, 4);
  await go(page, `#/gelernt/${y}`);
  const letter = page.locator('[data-letter]');
  await expect(letter.getByRole('heading', { name: T('Your year {year}', { year: y }) })).toBeVisible();
  await expect(letter).toContainText(`${P}Passfahrt`);
  await expect(page.getByRole('button', { name: T('Print') })).toBeVisible();
  await noSideScroll(page);

  // #208: the story of that year: cover, on with the arrow key, a trip slide, Escape closes
  await page.getByRole('link', { name: T('Year as pictures') }).click();
  const story = page.locator('[data-story]');
  await expect(story.getByRole('heading', { name: T('Your year of trips {year}', { year: y }) })).toBeVisible();
  const dashes = await story.locator('.dashes i').count();
  expect(dashes).toBeGreaterThan(3);
  await page.keyboard.press('ArrowRight');
  await expect(story).toHaveAttribute('data-slide', 'trip');
  await story.getByRole('button', { name: T('Next|story') }).click();
  await expect(story.locator('.dashes i.on')).toHaveCount(3);
  await noSideScroll(page);
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/#\/debrief$/);

  expect(errors).toEqual([]);
});
