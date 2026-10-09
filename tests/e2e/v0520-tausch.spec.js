// v0.52.0 «Tauschen» (OP2a, Noah a): fictional day ride (test_data_gtp_, v0520-fixture.js), 10–16 °C, dry.
// - The worn clothing is the first card «Am Körper»; a tap on a piece opens «Tauschen», a tap on an
//   alternative swaps it: two taps. The message has «Rückgängig», which also forgets the pick.
// - The alternatives are ordered by the trip's weather, then by the last picks (swap.memory).
// - «Im Kleiderschrank öffnen» shows the wardrobe with the trip band; unsuitable duplicates are hidden with a hint.
// - Phone 390: no sideways scroll on the packing list, in the sheet and in the wardrobe.
import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { tauschData, P, TRIP } from './v0520-fixture.js';

const id = (n) => `${P}${n}`;
const name = (n) => `${P}${n}`;

async function start(page, context, info, opts = {}) {
  mkdirSync(info.project.outputDir, { recursive: true });
  const file = `${info.project.outputDir}/v0520-fixture-${info.testId}.json`;
  writeFileSync(file, JSON.stringify(tauschData(opts)));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  const data = page.locator('details.data');
  await expect(async () => {
    if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
    expect(await data.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  await data.getByLabel('Backup importieren').setInputFiles(file);
  await data.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await expect(data.getByText(/importiert.*alle Daten ersetzt/i)).toBeVisible();
  await page.goto('./#/pack');
  await expect(page.locator('.worn-card')).toBeVisible();
  return errors;
}

const read = (page, store, key) =>
  page.evaluate(([s, k]) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(s).objectStore(s).get(k);
      q.onsuccess = () => { r.result.close(); ok(q.result ?? null); };
    };
  }), [store, key]);
const onTrip = async (page) => (await read(page, 'trips', TRIP)).entries.map((e) => e.itemId);
const tap = (loc, info) => (info.project.name === 'phone' ? loc.tap() : loc.click());
const noSideScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
const sheet = (page) => page.locator('dialog.swap-sheet');
const alts = (page, which = 0) => sheet(page).locator('ul.alts').nth(which).locator('.alt .nm');

test('swap a worn piece in two taps, with Undo', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const card = page.locator('.worn-card');
  // head to feet: Kopf before Oberkörper before Beine
  await expect(card.locator('h4')).toHaveText(['Kopf', 'Oberkörper', 'Beine', 'Hände', 'Füsse']);
  // tap 1: the piece opens «Tauschen»
  await tap(card.getByRole('button', { name: `${name('Trikot kurzarm grau')} tauschen` }), info);
  await expect(sheet(page).getByRole('heading', { name: 'Tauschen' })).toBeVisible();
  await expect(sheet(page).getByText('Oberkörper · Basis')).toBeVisible();
  // tap 2: the alternative swaps and closes
  await tap(sheet(page).getByRole('button', { name: `Tauschen gegen ${name('Trikot langarm orange')}` }), info);
  await expect(sheet(page)).toHaveCount(0);
  await expect.poll(() => onTrip(page)).toContain(id('T11'));
  expect(await onTrip(page)).not.toContain(id('T03'));
  const entry = (await read(page, 'trips', TRIP)).entries.find((e) => e.itemId === id('T11'));
  expect(entry).toMatchObject({ slot: 'body', swappedFrom: id('T03'), packed: false });
  await expect(card.getByText(`statt ${name('Trikot kurzarm grau')}`)).toBeVisible();
  const mem = await read(page, 'settings', 'swap.memory');
  expect(mem.value[id('T11')]).toMatchObject({ n: 1, c: 10 });
  // Undo: the old piece is back, the pick is forgotten
  const toast = page.locator('.onion-toast');
  await expect(toast).toContainText(`${name('Trikot langarm orange')} statt ${name('Trikot kurzarm grau')}`);
  await tap(toast.getByRole('button', { name: 'Rückgängig' }), info);
  await expect.poll(() => onTrip(page)).toContain(id('T03'));
  expect(await onTrip(page)).not.toContain(id('T11'));
  await expect.poll(() => read(page, 'settings', 'swap.memory')).toBeNull();
  expect(errors).toEqual([]);
});

test('alternatives by the weather first, then by the last picks', async ({ page, context }, info) => {
  await start(page, context, info);
  const open = async () => {
    await tap(page.locator('.worn-card').getByRole('button', { name: `${name('Trikot kurzarm grau')} tauschen` }), info);
    await expect(sheet(page)).toBeVisible();
  };
  await open();
  // 10–16 °C: the long jersey (8–18) fits best; the summer pieces fit less, with the reason
  await expect(alts(page, 0).first()).toContainText(name('Trikot langarm orange'));
  await expect(alts(page, 0).first()).toContainText('passt am besten');
  await expect(sheet(page).getByText('Passt weniger · 2')).toBeVisible();
  await expect(alts(page, 1)).toContainText([name('Merino-Shirt kurzarm weiss'), name('Trikot kurzarm schwarz')]);
  await expect(sheet(page).getByText('erst ab 18°')).toBeVisible();
  // other pieces of the zone or layer are not offered
  await expect(sheet(page).getByText(name('Windjacke grau'))).toHaveCount(0);
  await tap(sheet(page).getByRole('button', { name: 'Schliessen' }), info);
  // a warm day (Warm 16–24 °C): the long jersey now fits less
  await tap(page.getByRole('button', { name: /^Warm/ }), info);
  await expect.poll(async () => (await read(page, 'trips', TRIP)).wx.min).toBe(16);
  await open();
  await expect(alts(page, 1)).toContainText([name('Trikot langarm orange')]);
  await expect(alts(page, 0).first()).toContainText(name('Merino-Shirt kurzarm grau'));
});

test('a piece picked before ranks first among the fitting ones', async ({ page, context }, info) => {
  await start(page, context, info, { memory: { [id('T12')]: { n: 2, at: '2026-10-01T08:00:00.000Z', c: 9 } } });
  await tap(page.locator('.worn-card').getByRole('button', { name: `${name('Trikot kurzarm grau')} tauschen` }), info);
  await expect(alts(page, 0).first()).toContainText(name('Unterhemd langarm schwarz'));
  await expect(sheet(page).getByText('zuletzt bei 9° · 2×')).toBeVisible();
  await expect(alts(page, 0).nth(1)).toContainText(name('Trikot langarm orange'));
});

test('the wardrobe for the trip: band, unsuitable duplicates hidden with a hint', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await tap(page.locator('.worn-card').getByRole('link', { name: 'Im Kleiderschrank öffnen' }), info);
  await expect(page).toHaveURL(/#\/wardrobe\/trip\//);
  const band = page.locator('.tband');
  await expect(band).toContainText('Für deine Tour');
  await expect(band).toContainText('10–16 °C');
  await expect(band.getByRole('button', { name: 'Trocken' })).toHaveAttribute('aria-pressed', 'true');
  // dry 10–16: the summer jerseys and the rain jacket are hidden, each place keeps a fitting piece
  await expect(page.getByText(/Teile ausgeblendet/)).toBeVisible();
  await expect(page.locator('.cols').getByText(name('Trikot kurzarm schwarz'))).toHaveCount(0);
  await expect(page.locator('.cols').getByText(name('Regenjacke schwarz'))).toHaveCount(0);
  await expect(page.locator('.cols').getByText(name('Trikot langarm orange'))).toBeVisible();
  // rain: the rain jacket fits, the windvest keeps no rain out
  await tap(band.getByRole('button', { name: 'Regen' }), info);
  await expect(page.locator('.cols').getByText(name('Regenjacke schwarz'))).toBeVisible();
  // «Alle zeigen» shows everything again
  await tap(page.getByRole('button', { name: 'Alle zeigen' }), info);
  await expect(page.locator('.cols').getByText(name('Trikot kurzarm schwarz'))).toBeVisible();
  await tap(band.getByRole('link', { name: 'Zurück zur Packliste' }), info);
  await expect(page.locator('.worn-card')).toBeVisible();
  expect(errors).toEqual([]);
});

test('phone 390: no sideways scroll on the list, in the sheet and in the wardrobe', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'phone', 'phone only');
  await start(page, context, info);
  expect(await noSideScroll(page)).toBe(true);
  await page.locator('.worn-card').getByRole('button', { name: `${name('Trikot kurzarm grau')} tauschen` }).tap();
  await expect(sheet(page)).toBeVisible();
  expect(await noSideScroll(page)).toBe(true);
  expect(await sheet(page).evaluate((d) => d.scrollWidth <= d.clientWidth)).toBe(true);
  // every button in the sheet is a full 44 px target
  const small = await sheet(page).locator('button, a').evaluateAll((els) => els.filter((e) => e.getBoundingClientRect().height < 44).map((e) => e.textContent));
  expect(small).toEqual([]);
  await page.goto(`./#/wardrobe/trip/${encodeURIComponent(TRIP)}`);
  await expect(page.locator('.tband')).toBeVisible();
  expect(await noSideScroll(page)).toBe(true);
});
