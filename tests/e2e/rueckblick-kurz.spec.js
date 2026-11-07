// «Rückblick in 30 Sekunden» (Noah 05.11.2026, Touren 3b), German UI, phone 390 and desktop 1440, fictional data
// (sn4plus-fixture.js, clock Friday 9 October 2026): the open debrief of a ridden tour starts with three
// questions with faces; the answers show in the long form below; «Fertig» saves like the long «Done».
import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { sn4plusData, P, D0 } from './sn4plus-fixture.js';
import { importAndSettle } from './settle.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
const OPEN = `${P}abend`; // ridden on 6 October, no debrief yet

const debriefOf = (page, tripId) =>
  page.evaluate((id) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction('debriefs').objectStore('debriefs').get(id);
      q.onsuccess = () => { r.result.close(); ok(q.result ?? null); };
    };
  }), tripId);

async function start(page, context, info) {
  mkdirSync(info.project.outputDir, { recursive: true });
  const file = `${info.project.outputDir}/kurz-${info.testId}.json`;
  writeFileSync(file, JSON.stringify(sn4plusData()));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.clock.setFixedTime(new Date(`${D0}T10:00:00+02:00`));
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./');
  await importAndSettle(page, file);
  return errors;
}

test('Rückblick in 30 Sekunden: three questions, the answers show below, the short version saves the debrief', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/debrief/${OPEN}`);
  const card = page.locator('[data-debrief-kurz]');
  await expect(card.getByRole('heading', { level: 2 })).toHaveText(T('Debrief in 30 seconds'));
  // nothing is answered for the ride; the luggage starts as «Genau richtig» (the long form is filled in as planned)
  await expect(card.locator('[aria-pressed="true"]')).toHaveCount(1);
  await expect(card.locator('[data-kurz-amount="right"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(card.locator('[data-kurz-name]')).toHaveCount(0);
  // 1: a face; the same answer shows on «What made it good?» below
  await card.locator('[data-kurz-fun="4"]').click();
  await expect(card.locator('[data-kurz-fun="4"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-debrief-joy] [data-joy="fun"][data-joy-n="4"]')).toHaveAttribute('aria-pressed', 'true');
  // 2: the luggage
  await card.locator('[data-kurz-amount="much"]').click();
  await expect(card.locator('[data-kurz-amount="much"]')).toHaveAttribute('aria-pressed', 'true');
  // 3: something was missing; it is on the list of the long form
  await card.locator('[data-kurz-miss="yes"]').click();
  await card.locator('[data-kurz-name]').fill('test_data_gtp_ Schloss');
  await card.locator('[data-kurz-name]').press('Enter');
  await expect(card).toContainText('test_data_gtp_ Schloss');
  await expect(page.locator('.miss-fold')).toContainText('test_data_gtp_ Schloss');
  await noSideways(page);
  // Done: the debrief is saved with the three answers
  await card.locator('[data-kurz-done]').click();
  await expect(page.locator('[data-debrief-kurz]')).toHaveCount(0);
  const d = await debriefOf(page, OPEN);
  expect(d.status).toBe('done');
  expect(d.joy).toEqual({ fun: 4 });
  expect(d.amount).toBe('much');
  expect(d.missing.map((m) => m.name)).toEqual(['test_data_gtp_ Schloss']);
  expect(errors).toEqual([]);
});

test('Rückblick in 30 Sekunden: «Nein, nichts» and a second tap on a face take nothing along', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/debrief/${OPEN}`);
  const card = page.locator('[data-debrief-kurz]');
  await card.locator('[data-kurz-fun="2"]').click();
  await card.locator('[data-kurz-fun="2"]').click();
  await expect(card.locator('[data-kurz-fun="2"]')).toHaveAttribute('aria-pressed', 'false');
  await card.locator('[data-kurz-miss="no"]').click();
  await expect(card.locator('[data-kurz-name]')).toHaveCount(0);
  await card.locator('[data-kurz-done]').click();
  await expect(page.locator('[data-debrief-kurz]')).toHaveCount(0);
  const d = await debriefOf(page, OPEN);
  expect(d.status).toBe('done');
  expect(d.joy ?? null).toBe(null);
  expect(d.missing).toEqual([]);
  expect(errors).toEqual([]);
});
