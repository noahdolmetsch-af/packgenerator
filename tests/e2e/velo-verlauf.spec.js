// «Velopflege: Verlauf» (Noah 21.11.2026 «1a 2a 3a 4a 5a», Schritt D), German UI:
// - on a bike's care page: a card «Verlauf» with the newest three rows, then «Ganzer Verlauf» with filter, years and sum;
// - the sum of the year is the same number as «Kosten» in «Auf einen Blick»;
// - a bike without anything recorded says why and where to start.
// Fictional data (the ride-ledger set plus a history of «Demo Gravel»); nothing leaves the preview server.
import { writeFileSync } from 'node:fs';
import { test, expect } from './clock.js';
import { q1Data, RENN, GRAVEL, P, day } from './q1km-fixture.js';
import { openData, settle } from './settle.js';

function file(info) {
  const { fix } = q1Data();
  const T = fix.tables;
  const g = T.bikes.find((b) => b.id === GRAVEL);
  const e = (n, km, over) => ({ date: day(n), km, value: null, action: 'check', result: 'ok', by: 'self', model: null, note: '', ...over });
  g.parts = [
    { key: 'chain', model: 'Demo Kette', history: [e(-400, 3100, { action: 'replace', result: 'done', chf: 48 }), e(-60, 5700, { action: 'replace', result: 'done', chf: 54 }), e(-12, 6700, { value: 0.35 })] },
    { key: 'tyres', model: 'Demo Reifen', history: [e(-150, 5200, { action: 'replace', result: 'done', chf: 96 })] },
  ];
  T.visits = [{ id: `${P}vg1`, bikeId: GRAVEL, date: day(-30), km: 6000, shop: 'Demo Velo shop', totalChf: 189, parts: [{ part: 'padsF', action: 'replace', chf: 28, what: 'Bremsbeläge' }] }];
  T.inspections = [{ id: `${P}in1`, bikeId: GRAVEL, level: 'monthly', date: day(-12), km: 6700, done: true, doneAt: `${day(-12)}T10:00:00.000Z`, results: [{ id: 'pressure', state: 'ok' }, { id: 'brakefeel', state: 'watch' }] }];
  // «Demo Rennvelo» has nothing recorded at all
  T.bikes.find((b) => b.id === RENN).parts = [];
  T.visits = T.visits.filter((v) => v.bikeId !== RENN);
  T.inspections = T.inspections.filter((x) => x.bikeId !== RENN);
  const path = info.outputPath('verlauf-fixture.json');
  writeFileSync(path, JSON.stringify(fix));
  return path;
}

async function start(page, context, info) {
  const path = file(info);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel('Backup importieren').setInputFiles(path);
  await data.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await settle(page);
  await expect(data.getByText(/importiert.*alle Daten ersetzt/i)).toBeVisible();
}

test('the history shows the newest three rows, then the whole list with filter and sum', async ({ page, context }, info) => {
  await start(page, context, info);
  await page.goto(`./#/bikes?tab=care&bike=${GRAVEL}&open=1`);
  const card = page.locator('[data-verlauf]');
  await expect(card).toBeVisible();
  await expect(card.locator('[data-verlauf-row]')).toHaveCount(3);
  await expect(card.locator('[data-verlauf-row]').first()).toContainText('Monatlicher Check');
  await card.locator('[data-verlauf-open]').click();
  const all = card.locator('[data-verlauf-row]');
  expect(await all.count()).toBeGreaterThanOrEqual(5);
  // the filter: only the workshop
  await card.locator('[data-verlauf-kind]').getByRole('radio', { name: /^Service/ }).click();
  await expect(card.locator('[data-verlauf-row]:not([data-verlauf-row="service"])')).toHaveCount(0);
  await expect(card.locator('[data-verlauf-row="service"]').first()).toContainText('CHF 189');
  await expect(card.locator('[data-verlauf-sum]')).toContainText('CHF');
  // the sum of the year (all kinds) is the number of «Kosten» in «Auf einen Blick»
  await card.locator('[data-verlauf-kind]').getByRole('radio', { name: /^Alle/ }).click();
  const year = String(new Date().getFullYear());
  await card.locator('[data-verlauf-year]').getByRole('radio', { name: year }).click();
  const sum = (await card.locator('[data-verlauf-sum]').innerText()).match(/CHF\s*([\d’'.,]+)/)[1].replace(/[’',]/g, '');
  const glance = (await page.locator('[data-glance-cost] .v').innerText()).match(/CHF\s*([\d’'.,]+)/)[1].replace(/[’',]/g, '');
  expect(Number(sum)).toBe(Number(glance));
  const wide = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(wide).toBeLessThanOrEqual(0);
  await card.getByRole('button', { name: 'Weniger zeigen' }).click();
  await expect(card.locator('[data-verlauf-row]')).toHaveCount(3);
});

test('the costs tile of the glance card opens the history', async ({ page, context }, info) => {
  await start(page, context, info);
  await page.goto(`./#/bikes?tab=care&bike=${GRAVEL}&open=1`);
  await page.locator('[data-glance-verlauf]').click();
  await expect(page.locator('[data-verlauf] [data-verlauf-kind]')).toBeVisible();
});

test('a bike with nothing recorded says why the history is empty', async ({ page, context }, info) => {
  await start(page, context, info);
  await page.goto(`./#/bikes?tab=care&bike=${RENN}&open=1`);
  const card = page.locator('[data-verlauf]');
  await expect(card).toBeVisible();
  await expect(card.locator('[data-verlauf-row]')).toHaveCount(0);
  await expect(card).toContainText('Noch nichts erfasst');
  await expect(card.getByRole('link', { name: 'Inspektionen öffnen' })).toBeVisible();
});
