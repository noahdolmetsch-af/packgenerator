// «Mehr Inhalt in der App» (Noah 15.10.2026, answers 1a 2a 3a 4a 5a): the tip line and the fold
// «Das kann die App hier» on ten more places, «Passt zu heute» for rain on Packen (4a) with a link to
// MeteoSchweiz (5a), and an example that becomes an own note (3a). German, on a phone and a computer, no
// sideways scroll, no page errors. Fictional fixture and test_data_gtp_ trips only.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { PAGES, examplesOf } from '../../src/lib/pageinfo.js';
import { HINTS } from '../../src/lib/hints.js';
import { importAndSettle } from './settle.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const day = (n) => {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Zurich' }));
  d.setDate(d.getDate() + n);
  return iso(d);
};
const TRIP = { id: 'gtp-ct', domain: 'bikepacking', title: 'test_data_gtp_ Seerunde', days: 1, bikeId: 'bike-test', bike: 'Test gravel bike', setup: {}, entries: [{ itemId: 'TO01', slot: 'frame', qty: 1, packed: false }], ready: [], status: 'planned', hours: 3, overnight: 'none', startDate: day(1) };

async function start(page, context, info) {
  const file = info.outputPath('pagetexts.json');
  const data = structuredClone(base);
  data.tables.trips.push(TRIP);
  writeFileSync(file, JSON.stringify(data));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  await importAndSettle(page, file);
  return errors;
}
/** Write rows straight into the app's IndexedDB (then reload, so the app reads them). */
const put = (page, rows) =>
  page.evaluate(async (rows) => {
    const db = await new Promise((res, rej) => {
      const r = indexedDB.open('pack-generator');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    await new Promise((res, rej) => {
      const tx = db.transaction(Object.keys(rows), 'readwrite');
      for (const [t, list] of Object.entries(rows)) for (const x of list) tx.objectStore(t).put(x);
      tx.oncomplete = res;
      tx.onerror = () => rej(tx.error);
    });
    db.close();
  }, rows);
const table = (page, name) =>
  page.evaluate((s) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(s).objectStore(s).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), name);
async function fits(page, where) {
  const w = page.viewportSize().width;
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(sw, `${where}: no sideways scroll`).toBeLessThanOrEqual(w);
}

test('Packen on a rainy day: «Passt zu heute» first with MeteoSchweiz, the fold, the example as a note', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  // a rainy day at a fictional home place
  const place = { name: 'Testdorf', lat: 47.1, lon: 7.1 };
  await put(page, {
    settings: [{ key: 'homePlace', value: place }],
    meta: [{ key: 'homeForecast', fetchedAt: new Date().toISOString(), place, days: [{ date: day(0), min: 8, max: 14, rainMm: 6, rainPct: 90 }] }],
  });
  await page.evaluate((id) => localStorage.setItem('pack.currentTrip', id), TRIP.id);
  await page.goto('./#/pack');
  await page.reload();
  const main = page.locator('main');

  const line = main.locator('[data-tip]');
  await expect(line).toHaveAttribute('data-tip', 'pack-rain');
  await expect(line.locator('[data-kind="today"]')).toHaveText(T('Fits today|tag'));
  await expect(line).toContainText(T('only when rain is forecast'));
  await expect(line.locator('[data-tip-link]')).toHaveAttribute('href', 'https://www.meteoschweiz.admin.ch/');

  const can = main.locator('[data-section="can"]');
  await can.locator('summary').click();
  await expect(can.locator('[data-can]')).toHaveCount(PAGES.pack.can.length);

  // 3a: the example is a closed fold; «Als Notiz speichern» keeps it as an own note with a checklist
  const ex = examplesOf('pack')[0];
  const fold = main.locator(`[data-example="${ex.id}"]`);
  await expect(fold).toContainText(T(ex.title));
  await fold.locator('summary').click();
  await fits(page, 'Packen mit Beispiel');
  await page.screenshot({ path: `qa/pagetexts-pack-${test.info().project.name}.png`, fullPage: true });
  await fold.getByRole('button', { name: T('Save as note') }).click();
  await expect(fold.getByRole('status')).toContainText(T('Saved as a note.'));
  await expect.poll(async () => (await table(page, 'notes')).length).toBe(1);
  const [note] = await table(page, 'notes');
  expect(note.title).toBe(T(ex.title));
  expect(note.checklist.map((c) => c.text)).toEqual(ex.lines.map((x) => T(x)));
  expect(errors).toEqual([]);
});

test('the tip line and the fold on the other places', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.evaluate((id) => localStorage.setItem('pack.currentTrip', id), TRIP.id);
  const places = [
    ['trips', '#/trips'],
    ['ride', '#/ride'],
    ['debrief', '#/debrief'],
    ['gear', '#/gear'],
    ['wardrobe', '#/wardrobe'],
    ['care', '#/bikes?tab=care'],
    ['workshop', '#/bikes?tab=shop'],
    ['me', '#/me'],
  ];
  for (const [key, hash] of places) {
    await page.goto(`./${hash}`);
    const main = page.locator('main');
    const ids = PAGES[key].tips.map((x) => x.id);
    const line = main.locator('[data-tip]');
    if (key === 'trips' && test.info().project.name === 'phone') {
      // Paket D (Noah 19.10.2026 «1a»): on the phone the card starts folded as the quiet line «Was hier steht ›»
      // in the head; a tap opens it, then the same checks. (This fixture has no «In Zahlen · Weiter» line, so
      // the tip stands at the page end; handy-kurz.spec checks it behind that line.)
      await expect(main.locator('[data-hint-line="trips"]'), key).toHaveText(T('What is here'));
      await expect(main.locator('[data-hint="trips"]'), key).toHaveCount(0);
      await expect(main.locator('[data-trips-extras]'), key).toHaveCount(0);
      await main.locator('[data-hint-line="trips"]').click();
      await expect(main.locator('[data-hint-line="trips"]'), key).toHaveCount(0);
    }
    await expect(line, key).toHaveCount(1);
    // HT 3a: the card «Was hier steht» on top, before the tip line
    const card = main.locator(`[data-hint="${key}"]`);
    await expect(card, key).toContainText(T(HINTS[key].lead[0]));
    expect(await card.evaluate((c, l) => !!(c.compareDocumentPosition(l) & Node.DOCUMENT_POSITION_FOLLOWING), await line.elementHandle()), `${key}: the card comes before the tip`).toBe(true);
    expect(ids, key).toContain(await line.getAttribute('data-tip'));
    if (PAGES[key].can.length) await expect(main.locator('[data-section="can"]'), key).toHaveCount(1);
    for (const ex of examplesOf(key)) await expect(main.locator(`[data-example="${ex.id}"]`), key).toContainText(T(ex.title));
    await fits(page, key);
    await page.screenshot({ path: `qa/pagetexts-${key}-${test.info().project.name}.png`, fullPage: true });
  }
  // HT 3a: the card alone on three more places
  for (const [key, hash] of [['past', '#/pack/past'], ['notes', '#/notes'], ['inbox', '#/inbox']]) {
    await page.goto(`./${hash}`);
    await expect(page.locator(`main [data-hint="${key}"]`), key).toContainText(T(HINTS[key].lead[0]));
    await fits(page, key);
    await page.screenshot({ path: `qa/pagetexts-${key}-${test.info().project.name}.png`, fullPage: true });
  }
  expect(errors).toEqual([]);
});

test('HT1 Velopflege: the card with its situations, jumps, the fold at the end, fold and back', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/bikes?tab=care');
  const main = page.locator('main');
  const card = main.locator('[data-hint="care"]');
  await expect(card).toContainText(T(HINTS.care.lead[1]));
  // 2b: on a phone «Typisch hier» starts folded, on a computer it is open
  const uses = card.getByText(T(HINTS.care.uses[0][1]));
  if (test.info().project.name === 'phone') {
    await expect(uses).toBeHidden();
    await card.locator('[data-uses] summary').click();
  }
  await expect(uses).toBeVisible();
  // «Weiter unten»: a chip jumps to its part of the page
  const chip = card.locator('[data-jump="due-h"]');
  await expect(chip).toHaveText(T('Due now'));
  await chip.click();
  await expect(main.locator('#due-h')).toBeInViewport();
  // «Das kann die App hier» opens the fold at the end
  await card.locator('[data-hint-can]').click();
  await expect(main.locator('[data-section="can"]')).toHaveAttribute('open', '');
  await page.evaluate(() => window.scrollTo(0, 0));
  await fits(page, 'Velopflege mit Hinweis');
  await page.screenshot({ path: `qa/hinweis-care-${test.info().project.name}.png`, fullPage: true });
  // 1a: × leaves the quiet line «Was hier steht», which opens the card again
  await card.getByRole('button', { name: T('Fold the explanation') }).click();
  const back = main.locator('[data-hint-line="care"]');
  await expect(back).toContainText(T('What is here'));
  await expect(card).toHaveCount(0);
  await back.click();
  await expect(main.locator('[data-hint="care"]')).toBeVisible();
  expect(errors).toEqual([]);
});
