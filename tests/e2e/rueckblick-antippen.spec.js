// v0.92.0 «Rückblick antippen» (App einfach C, Noah 4a, mockup C): the debrief starts with the packed
// items as chips; a tap marks one as not needed and the tally counts it with its weight. «What was
// missing?», «How was it?» and the rest are rows below; «Fertig» saves. Fictional fixture
// (test_data_gtp_), German UI, nothing leaves the preview.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { importAndSettle } from './settle.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const day = (n) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })}T12:00:00Z`));
const ID = 'test_data_gtp_rb1';

function fixture(path) {
  const data = structuredClone(base);
  const bike = data.tables.bikes[0];
  const items = data.tables.items.slice(3, 9);
  const entries = items.map((i) => ({ itemId: i.id, slot: 'seat', qty: 1, packed: true }));
  data.tables.trips = [{ id: ID, domain: 'bikepacking', title: 'test_data_gtp_ Jura Runde', startDate: day(-2), days: 2, bikeId: bike.id, bike: bike.name, setup: bike.setup, entries, ready: [], status: 'planned' }];
  data.tables.debriefs = [];
  writeFileSync(path, JSON.stringify(data));
  return items;
}

test('Rueckblick antippen: chips on top, the rest below, Fertig', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('dialog', (d) => d.accept());
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  const file = info.outputPath('rueckblick-fixture.json');
  const items = fixture(file);
  await page.goto('./');
  await importAndSettle(page, file);
  await page.goto(`./#/debrief/${ID}`);

  const card = page.getByRole('region', { name: T('What did you not need?') });
  await expect(card).toBeVisible();
  const chips = card.getByRole('group', { name: T('What did you not need?') }).getByRole('button');
  await expect(chips).toHaveCount(items.length);
  await expect(card.getByRole('status')).toHaveText(T('Nothing tapped: everything counts as used.'));
  // The first chip is the first thing on the page below the band: no scrolling to «not needed».
  const top = await chips.first().boundingBox();
  expect(top.y + top.height).toBeLessThan(page.viewportSize().height);

  // One tap: not needed (pressed, struck through); the tally names it with its weight.
  const first = items.find((i) => i.weightG) ?? items[0];
  const chip = chips.filter({ hasText: first.nameDe ?? first.name }).first();
  await chip.click();
  await expect(chip).toHaveAttribute('aria-pressed', 'true');
  await expect(card.getByRole('status')).toContainText(T('{n} not used', { n: 1 }));
  // A second tap takes it back; a third leaves it not needed for saving.
  await chip.click();
  await expect(chip).toHaveAttribute('aria-pressed', 'false');
  await chip.click();

  // The rest are rows with «Mehr»: «Wie war's?» opens the weather and the km.
  const how = page.locator('details.how-fold');
  const howSum = how.locator(':scope > summary');
  await expect(howSum).toContainText(T('How was it?'));
  await howSum.click();
  await expect(page.getByRole('group', { name: T('Weather') })).toBeVisible();
  await expect(page.locator('details.miss-fold > summary')).toContainText(T('What was missing?'));

  // No sideways scroll, and «Fertig» saves.
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await page.locator('.trip-band .go').click();
  await expect.poll(() => page.evaluate(async () => {
    const req = indexedDB.open('pack-generator');
    const db = await new Promise((r) => (req.onsuccess = () => r(req.result)));
    const tx = db.transaction('debriefs').objectStore('debriefs').getAll();
    const all = await new Promise((r) => (tx.onsuccess = () => r(tx.result)));
    db.close();
    return all.map((d) => ({ status: d.status, items: d.items }));
  })).toEqual([{ status: 'done', items: { [first.id]: 'unused' } }]);
  expect(errors).toEqual([]);
});
