// Gesamttest 21.10.2026 C7 and C8 (Noah «c1-c9 umsetzen»), fictional data (test_data_gtp_ names, pf-fixture.json):
// C7: on a phone the care page of one bike and its inspections show the first rows of each long list, then
// «{n} weitere zeigen»; the page is shorter until you tap it. The computer keeps every row.
// C8: a part row reads «name model» with a space between them (screen readers read the text as one).
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { openData, settle } from './settle.js';
import DE from '../../src/lib/i18n/de/index.js';
import { PHONE_ROWS } from '../../src/lib/touren/kurz.js';

const P = 'test_data_gtp_';
const SPARK = `${P}spark`;
const RAW = readFileSync(fileURLToPath(new URL('./pf-fixture.json', import.meta.url)), 'utf8');
const CARE_SRC = readFileSync(fileURLToPath(new URL('../../src/lib/care.js', import.meta.url)), 'utf8');
// the parts the app knows, read from its source
const KEYS = [...CARE_SRC.slice(0, CARE_SRC.indexOf('export const PART =')).matchAll(/key: '(\w+)'/g)].map((m) => m[1]);
const day = (n = 0) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })}T12:00:00Z`));
const MORE = new RegExp(DE['Show {n} more'].replace('{n}', '\\d+'));

/** The PF fixture with a Spark that has every part, each with three works and a model. */
function fixtureFile(info) {
  const fix = JSON.parse(RAW.replace(/"@([+-]\d+)"/g, (m, n) => `"${day(Number(n))}"`));
  const spark = fix.tables.bikes.find((b) => b.id === SPARK);
  const e = (n, km) => ({ date: day(n), km, value: null, action: 'service', result: 'done', by: 'self', model: null, note: '' });
  spark.parts = KEYS.map((key, i) => ({ key, model: `${P} Modell ${i}`, history: [e(-400 + i, 1000 + i * 10), e(-200 + i, 3000 + i * 10), e(-20 - i, 4800 - i)] }));
  const path = info.outputPath('velopflege-kurz.json');
  writeFileSync(path, JSON.stringify(fix));
  return path;
}

async function start(page, context, info) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel('Backup importieren').setInputFiles(fixtureFile(info));
  await data.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await settle(page);
  return errors;
}
const open = async (page, hash) => {
  await page.goto(`./${hash}`);
  await page.locator('main h1').first().waitFor();
  await page.waitForTimeout(800);
};
const height = (page) => page.evaluate(() => document.documentElement.scrollHeight);

test('Velopflege kurz: phone shows five rows per list, then more', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'phone', 'the phone view');
  const errors = await start(page, context, info);

  // the care page of one bike: «Pflege für …» shows five cares, then «n weitere zeigen»
  await open(page, `#/bikes?tab=care&bike=${SPARK}&open=1`);
  const plan = page.locator('[data-care-plan]');
  await expect(plan.locator('li[data-care]')).toHaveCount(PHONE_ROWS);
  const more = plan.locator('[data-care-plan-more]');
  await expect(more).toHaveText(MORE);
  expect((await more.boundingBox()).height).toBeGreaterThanOrEqual(44);
  const short = await height(page);
  await more.click();
  expect(await plan.locator('li[data-care]').count()).toBeGreaterThan(PHONE_ROWS);
  await expect(more).toHaveCount(0);
  expect(short).toBeLessThan(await height(page));

  // C8: name and model with a space between them
  const pn = page.locator('.ptable .prow .pn').first();
  const [nm, model] = await Promise.all([pn.locator('.nm').innerText(), pn.locator('small').innerText()]);
  expect(await pn.textContent()).toBe(`${nm} ${model}`);

  // the inspections: the checklist points show five rows over all areas, then «n weitere zeigen»
  await open(page, `#/bikes?tab=care&view=inspect&bike=${SPARK}`);
  const edit = page.locator('[data-inspect-edit]');
  await expect(edit.locator('[data-point-row]')).toHaveCount(PHONE_ROWS);
  const pmore = edit.locator('[data-points-more]');
  await expect(pmore).toHaveText(MORE);
  const shortI = await height(page);
  await pmore.click();
  expect(await edit.locator('[data-point-row]').count()).toBeGreaterThan(PHONE_ROWS);
  expect(shortI).toBeLessThan(await height(page));
  expect(errors).toEqual([]);
});

test('Velopflege kurz: computer keeps every row', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'desktop', 'the computer view');
  const errors = await start(page, context, info);
  await open(page, `#/bikes?tab=care&bike=${SPARK}&open=1`);
  expect(await page.locator('[data-care-plan] li[data-care]').count()).toBeGreaterThan(PHONE_ROWS);
  await expect(page.locator('[data-care-plan-more]')).toHaveCount(0);
  await open(page, `#/bikes?tab=care&view=inspect&bike=${SPARK}`);
  expect(await page.locator('[data-inspect-edit] [data-point-row]').count()).toBeGreaterThan(PHONE_ROWS);
  await expect(page.locator('[data-points-more], [data-areas-more]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
