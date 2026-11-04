// «Freude als Auswertung» (Noah 04.11.2026 «3a», Persönliches Lernen Idee 6), German UI, phone 390 and desktop 1440,
// fictional data (sn4plus-fixture.js, clock Friday 9 October 2026):
// a) the open debrief of a ridden tour asks «Was hat es gut gemacht?»: a number stays marked, the same one again
//    takes it away;
// b) with answers on two other debriefs the third one brings the line «am höchsten»;
// c) the saved debrief shows the same card and keeps its answers.
import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { sn4plusData, P, D0 } from './sn4plus-fixture.js';
import { importAndSettle } from './settle.js';

const SHOTS = '/tmp/claude-0/sn-shots/freude';
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const shot = async (page, info, name, card) => {
  mkdirSync(SHOTS, { recursive: true });
  await card.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png` });
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
const OPEN = `${P}abend`; // ridden on 6 October, no debrief yet
const SAVED = `${P}herbst`;

function data(withHistory) {
  const d = sn4plusData();
  if (withHistory) {
    d.tables.debriefs = d.tables.debriefs.map((x) => {
      if (x.tripId === `${P}loop`) return { ...x, joy: { fun: 4, nature: 5, flow: 3 } };
      if (x.tripId === `${P}see`) return { ...x, joy: { fun: 3, nature: 5 } };
      if (x.tripId === `${P}pass`) return { ...x, joy: { fun: 5, nature: 4, company: 2 } };
      return x;
    });
  }
  return d;
}

async function start(page, context, info, withHistory = false) {
  mkdirSync(info.project.outputDir, { recursive: true });
  const file = `${info.project.outputDir}/freude-${info.testId}.json`;
  writeFileSync(file, JSON.stringify(data(withHistory)));
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

test('a) the open debrief asks «Was hat es gut gemacht?»; a number stays, the same one again takes it away', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/debrief/${OPEN}`);
  const card = page.locator('[data-debrief-joy]');
  await expect(card.getByRole('heading', { level: 2 })).toHaveText(T('What made it good?'));
  await expect(card.locator('[data-joy]')).toHaveCount(20);
  await expect(card.locator('[aria-pressed="true"]')).toHaveCount(0);
  await shot(page, info, 'F1-leer', card);
  await card.locator('[data-joy="fun"][data-joy-n="4"]').click();
  await expect(card.locator('[data-joy="fun"][data-joy-n="4"]')).toHaveAttribute('aria-pressed', 'true');
  await card.locator('[data-joy="nature"][data-joy-n="5"]').click();
  await expect(card.locator('[aria-pressed="true"]')).toHaveCount(2);
  await expect(card.locator('[data-joy-line]')).toHaveCount(0); // too few tours
  // the same number again: the answer is gone
  await card.locator('[data-joy="fun"][data-joy-n="4"]').click();
  await expect(card.locator('[data-joy="fun"][aria-pressed="true"]')).toHaveCount(0);
  await expect(card.locator('[aria-pressed="true"]')).toHaveCount(1);
  await noSideways(page);
  // the answer is kept when the page is opened again
  await page.reload();
  await expect(page.locator('[data-debrief-joy] [data-joy="nature"][data-joy-n="5"]')).toHaveAttribute('aria-pressed', 'true');
  expect(errors).toEqual([]);
});

test('b) three debriefs with answers bring the line «am höchsten»', async ({ page, context }, info) => {
  const errors = await start(page, context, info, true);
  await page.goto(`./#/debrief/${OPEN}`);
  const card = page.locator('[data-debrief-joy]');
  await expect(card.locator('[data-joy-line]')).toContainText(T('Nature|joy'));
  await expect(card.locator('[data-joy-line]')).toContainText('4.7');
  await card.locator('[data-joy="flow"][data-joy-n="2"]').click();
  await shot(page, info, 'F2-zeile', card);
  await noSideways(page);
  expect(errors).toEqual([]);
});

test('c) the saved debrief shows the same card', async ({ page, context }, info) => {
  const errors = await start(page, context, info, true);
  await page.goto(`./#/debrief/${SAVED}`);
  const card = page.locator('[data-debrief-joy]');
  const body = page.locator('[data-group="body"] .gb');
  if ((await body.getAttribute('aria-expanded')) !== 'true') await body.click();
  await expect(card.getByRole('heading', { level: 2 })).toHaveText(T('What made it good?'));
  await card.locator('[data-joy="company"][data-joy-n="3"]').click();
  await expect(card.locator('[data-joy="company"][data-joy-n="3"]')).toHaveAttribute('aria-pressed', 'true');
  await shot(page, info, 'F3-gespeichert', card);
  await page.reload();
  const body2 = page.locator('[data-group="body"] .gb');
  if ((await body2.getAttribute('aria-expanded')) !== 'true') await body2.click();
  await expect(page.locator('[data-debrief-joy] [data-joy="company"][data-joy-n="3"]')).toHaveAttribute('aria-pressed', 'true');
  expect(errors).toEqual([]);
});
