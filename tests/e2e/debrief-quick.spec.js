// v0.24.1 (Noah 3a and 4a): a finished day ride asks on Today "How was …?". "All good" saves the
// debrief at once (with Undo for a few seconds) and offers to keep the ride as a template, which then
// shows in New → Plan a trip. Fictional fixture plus one test_data_gtp_ trip; nothing leaves the preview.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';

const tr = (lang) => (en, vars) => {
  const text = (lang === 'de' ? DE[en] : null) ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const day = (n) => new Date(Date.now() + n * 864e5).toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const TRIP = 'test_data_gtp_quick';

/** One finished day ride (yesterday) on a hardtail, nothing else planned. */
function fixture(path, title) {
  const data = structuredClone(base);
  data.tables.bikes[0].type = 'Hardtail';
  const entries = data.tables.items.slice(3, 7).map((i) => ({ itemId: i.id, slot: 'seat', qty: 1, packed: true }));
  data.tables.trips = [{ id: TRIP, domain: 'bikepacking', title, startDate: day(-1), days: 1, bikeId: 'bike-test', bike: data.tables.bikes[0].name, setup: data.tables.bikes[0].setup, entries, ready: [], status: 'planned' }];
  writeFileSync(path, JSON.stringify(data));
}

/** The stored debrief of the trip (or null), read straight from IndexedDB. */
const storedDebrief = (page) =>
  page.evaluate((id) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction('debriefs').objectStore('debriefs').get(id);
      q.onsuccess = () => { r.result.close(); ok(q.result ?? null); };
    };
  }), TRIP);

for (const lang of ['en', 'de']) {
  test(`All good on Today, Undo and the template offer, ${lang}`, async ({ page, context }, info) => {
    const T = tr(lang);
    const title = `test_data_gtp_ Feierabend ${lang}`;
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const file = info.outputPath('debrief-quick-fixture.json');
    fixture(file, title);
    await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
    await context.addInitScript((l) => localStorage.setItem('lang', l), lang);
    page.on('dialog', (d) => d.accept());
    await page.goto('./');
    const data = page.locator('details.data');
    if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
    await data.getByLabel(T('Import backup')).setInputFiles(file);
    await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
    await expect(data.getByText(/importiert|Imported/)).toBeVisible();
    await page.goto('./#/');

    // 1. Today asks how the trip was: "All good" and "In detail" (the three steps of exactly this trip).
    const card = page.getByRole('region', { name: T('How was {trip}?', { trip: title }) });
    await expect(card).toBeVisible();
    await expect(card.getByRole('link', { name: T('In detail') })).toHaveAttribute('href', `#/debrief/${TRIP}`);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(sw, 'no sideways scroll').toBeLessThanOrEqual(page.viewportSize().width);

    // 2. "All good" saves at once; Undo takes it back and the card returns.
    await card.getByRole('button', { name: T('All good') }).click();
    const saved = page.getByRole('status').filter({ hasText: T('Saved: {trip}.', { trip: title }) });
    await expect(saved).toBeVisible();
    await expect(card).toBeHidden();
    expect(await storedDebrief(page)).toMatchObject({ status: 'done', weather: 'planned', amount: 'right', bags: 'fine', items: {}, missing: [], applied: [] });
    await saved.getByRole('button', { name: T('Undo') }).click();
    await expect(card).toBeVisible();
    expect(await storedDebrief(page)).toBe(null);

    // 3. "All good" again, then keep the ride as a template ("MTB day ride", a hardtail).
    await card.getByRole('button', { name: T('All good') }).click();
    await expect(saved).toBeVisible();
    const name = T('{kind} day ride', { kind: 'MTB' });
    const offer = page.getByRole('form', { name: T('Save as template "{name}"?', { name }) });
    await expect(offer).toBeVisible();
    await expect(offer.getByLabel(T('Name'))).toHaveValue(name);
    const sw2 = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(sw2, 'no sideways scroll with the offer').toBeLessThanOrEqual(page.viewportSize().width);
    await offer.getByRole('button', { name: T('Save template') }).click();
    const done = page.getByRole('status').filter({ hasText: T('Template "{name}" saved.', { name }) });
    await expect(done).toBeVisible();
    await expect(done.getByRole('link', { name: T('Show templates') })).toHaveAttribute('href', '#/pack/templates');

    // 4. Debrief lists the trip under "Done", no longer under "To debrief".
    await page.goto('./#/debrief');
    await expect(page.getByRole('region', { name: T('To debrief') }).getByText(title)).toHaveCount(0);
    await expect(page.getByRole('region', { name: T('Done') }).getByText(title)).toBeVisible();

    // 5. The next day ride: New → Plan a trip → From template → Create (4 clicks, plus the name).
    await page.goto('./#/');
    let clicks = 0;
    const click = async (loc) => {
      await loc.click();
      clicks++;
    };
    await click(page.getByRole('button', { name: T('New'), exact: true }).filter({ visible: true }));
    await click(page.getByRole('dialog', { name: T('New') }).getByRole('button', { name: T('Plan a trip') }));
    const from = page.getByRole('dialog', { name: T('Plan a new trip') }).getByRole('button', { name: new RegExp(`${T('From template')}.*${name}`) });
    await click(from);
    const dlg = page.getByRole('dialog', { name: T('New trip') });
    await dlg.getByLabel(T('Name')).fill(`test_data_gtp_ next ${lang}`);
    await click(dlg.getByRole('button', { name: T('Create trip') }));
    await expect(dlg).toBeHidden();
    await expect(page.locator('.tour-context h2')).toHaveText(`test_data_gtp_ next ${lang}`);
    expect(clicks).toBe(4);
    expect(errors).toEqual([]);
  });
}

test('No thanks is not asked again, and the three steps offer the template too', async ({ page, context }, info) => {
  const T = tr('en');
  const title = 'test_data_gtp_ Runde';
  const file = info.outputPath('debrief-quick-fixture.json');
  fixture(file, title);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'en'));
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const data = page.locator('details.data');
  if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
  await data.getByLabel(T('Import backup')).setInputFiles(file);
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await expect(data.getByText(/Imported/)).toBeVisible();

  // The three steps: "All as planned" → save → the Saved screen offers the template.
  await page.goto(`./#/debrief/${TRIP}`);
  await page.getByRole('button', { name: new RegExp(T('All as planned: weather, amount, bags')) }).click();
  await page.getByRole('button', { name: T('Save debrief') }).click();
  await expect(page.getByRole('heading', { name: T('Saved') })).toBeVisible();
  const name = T('{kind} day ride', { kind: 'MTB' });
  const offer = page.getByRole('form', { name: T('Save as template "{name}"?', { name }) });
  await expect(offer).toBeVisible();
  await offer.getByRole('button', { name: T('No thanks') }).click();
  await expect(offer).toBeHidden();
  // Saving again (after "Change answers") does not ask again for this trip.
  await page.getByRole('button', { name: T('Change answers') }).click();
  await page.getByRole('button', { name: T('Next: go through the items') }).click();
  await page.getByRole('button', { name: T('Next: summary') }).click();
  await page.getByRole('button', { name: T('Save debrief') }).click();
  await expect(page.getByRole('heading', { name: T('Saved') })).toBeVisible();
  await expect(page.getByRole('form', { name: /template/i })).toHaveCount(0);
});
