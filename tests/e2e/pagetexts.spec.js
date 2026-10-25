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
import { importAndSettle, openHelp } from './settle.js';

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

  // «Alles finden 2» (Noah 22.10.2026 «3a», changed on purpose): «Das kann die App hier» is behind «?»
  const help = await openHelp(page);
  await expect(help.locator('[data-section="can"] [data-can]')).toHaveCount(PAGES.pack.can.length);
  await page.keyboard.press('Escape');
  await expect(help).toBeHidden();

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
    // «Alles finden 2» (Noah 22.10.2026 «3a», changed on purpose): the card «Was hier steht» and «Das kann die App
    // hier» are behind «?» at the top; the page keeps the tip line and its examples
    await expect(main.locator(`[data-hint="${key}"], [data-hint-line], [data-section="can"]`), key).toHaveCount(0);
    await expect(line, key).toHaveCount(1);
    expect(ids, key).toContain(await line.getAttribute('data-tip'));
    const help = await openHelp(page);
    await expect(help.locator(`[data-hint="${key}"]`), key).toContainText(T(HINTS[key].lead[0]));
    if (PAGES[key].can.length) await expect(help.locator('[data-section="can"]'), key).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(help, key).toBeHidden();
    for (const ex of examplesOf(key)) await expect(main.locator(`[data-example="${ex.id}"]`), key).toContainText(T(ex.title));
    await fits(page, key);
    await page.screenshot({ path: `qa/pagetexts-${key}-${test.info().project.name}.png`, fullPage: true });
  }
  // HT 3a: the card alone on eight more places
  for (const [key, hash] of [['past', '#/pack/past'], ['notes', '#/notes'], ['inbox', '#/inbox'], ['templates', '#/pack/templates'], ['rides', '#/debrief/ride'], ['inspiration', '#/inspiration'], ['equipment', '#/bikes?tab=compare'], ['rig', '#/bikes?tab=rig']]) {
    await page.goto(`./${hash}`);
    const help = await openHelp(page);
    await expect(help.locator(`[data-hint="${key}"]`), key).toContainText(T(HINTS[key].lead[0]));
    await page.keyboard.press('Escape');
    await fits(page, key);
    await page.screenshot({ path: `qa/pagetexts-${key}-${test.info().project.name}.png`, fullPage: true });
  }
  expect(errors).toEqual([]);
});

test('HT1 Velopflege: the help with its situations, the jumps on the page', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/bikes?tab=care');
  const main = page.locator('main');
  // «Alles finden 2» (Noah 22.10.2026 «3a», changed on purpose): the card is behind «?»; on the page only the
  // line «Auf dieser Seite» with its jumps stays
  await expect(main.locator('[data-hint="care"]')).toHaveCount(0);
  // «Weiter unten»: a chip jumps to its part of the page
  const chip = main.locator('[data-onpage="care"] [data-jump="due-h"]');
  await expect(chip).toHaveText(T('Due now'));
  await chip.click();
  await expect(main.locator('#due-h')).toBeInViewport();
  await page.evaluate(() => window.scrollTo(0, 0));
  await fits(page, 'Velopflege');
  const help = await openHelp(page);
  const card = help.locator('[data-hint="care"]');
  await expect(card).toContainText(T(HINTS.care.lead[1]));
  // «Typisch hier» is open in the help window
  await expect(card.locator('[data-uses]').getByText(T(HINTS.care.uses[0][1]))).toBeVisible();
  await expect(help.locator('[data-section="can"]')).toBeVisible();
  await page.screenshot({ path: `qa/hinweis-care-${test.info().project.name}.png` });
  expect(errors).toEqual([]);
});
