// «Fahrtechnik-Tagebuch» (Noah 04.11.2026 «4a», Persönliches Lernen Idee 3), German UI, phone 390 and desktop 1440,
// fictional data (sn4plus-fixture.js, clock Friday 9 October 2026):
// a) the open debrief asks «Was hast du geübt?»: a technique is ticked, «Noch unsicher» says how it went, a second
//    tap takes it away;
// b) the diary page counts the technique, offers «Das will ich üben» with a place that stays;
// c) an empty diary says why and offers the debriefs.
import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { sn4plusData, P, D0 } from './sn4plus-fixture.js';
import { importAndSettle } from './settle.js';

const SHOTS = '/tmp/claude-0/sn-shots/fahrtechnik';
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const shot = async (page, info, name, card = null) => {
  mkdirSync(SHOTS, { recursive: true });
  if (card) await card.evaluate((el) => { el.scrollIntoView({ block: 'center' }); el.style.outline = '3px solid #d9822b'; el.style.outlineOffset = '2px'; });
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png` });
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
const OPEN = `${P}abend`; // ridden on 6 October, no debrief yet

function data(withHistory) {
  const d = sn4plusData();
  if (withHistory) {
    d.tables.debriefs = d.tables.debriefs.map((x) => {
      if (x.tripId === `${P}loop`) return { ...x, skills: { hairpins: 'unsure', wet: 'tried' } };
      if (x.tripId === `${P}see`) return { ...x, skills: { hairpins: 'good' } };
      return x;
    });
  }
  return d;
}

async function start(page, context, info, withHistory = false) {
  mkdirSync(info.project.outputDir, { recursive: true });
  const file = `${info.project.outputDir}/fahrtechnik-${info.testId}.json`;
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

test('a) the debrief asks «Was hast du geübt?»; tick, say how it went, a second tap takes it away', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/debrief/${OPEN}`);
  const card = page.locator('[data-debrief-skills]');
  await expect(card.getByRole('heading', { level: 2 })).toHaveText(T('What did you practise?'));
  await expect(card.locator('[data-skill]')).toHaveCount(8);
  await expect(card.locator('[data-skill-say]')).toHaveCount(0);
  await shot(page, info, 'T1-leer', card);
  await card.locator('[data-skill="hairpins"]').click();
  await expect(card.locator('[data-skill="hairpins"]')).toHaveAttribute('aria-pressed', 'true');
  await card.locator('[data-skill-say="hairpins"] [data-skill-kind="unsure"]').click();
  await expect(card.locator('[data-skill-say="hairpins"] [data-skill-kind="unsure"]')).toHaveAttribute('aria-pressed', 'true');
  await card.locator('[data-skill="braking"]').click();
  await expect(card.locator('[data-skill-say]')).toHaveCount(2);
  await shot(page, info, 'T2-abgehakt', card);
  await card.locator('[data-skill="braking"]').click();
  await expect(card.locator('[data-skill-say]')).toHaveCount(1);
  await noSideways(page);
  await page.reload();
  await expect(page.locator('[data-debrief-skills] [data-skill-say="hairpins"] [data-skill-kind="unsure"]')).toHaveAttribute('aria-pressed', 'true');
  expect(errors).toEqual([]);
});

test('b) the diary counts a technique and keeps the wish with its place', async ({ page, context }, info) => {
  const errors = await start(page, context, info, true);
  await page.goto('./#/debrief/technik');
  const page1 = page.locator('[data-technik]');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(T('Riding technique diary'));
  const row = page1.locator('[data-tech="hairpins"]');
  await expect(row).toContainText(T('Worked on {n} times', { n: 2 }));
  await expect(page1.locator('[data-tech="wet"]')).toContainText(T('Worked on {n} time', { n: 1 }));
  await expect(page1.locator('[data-tech="gravel"]')).toContainText(T('Not worked on yet'));
  await row.locator('[data-tech-want]').click();
  await expect(row.locator('[data-tech-want]')).toHaveAttribute('aria-pressed', 'true');
  await row.locator('[data-tech-place]').fill('Parkplatz hinter dem Bahnhof');
  await row.locator('[data-tech-place]').blur();
  await shot(page, info, 'T3-tagebuch', row);
  await noSideways(page);
  await page.reload();
  const row2 = page.locator('[data-technik] [data-tech="hairpins"]');
  await expect(row2.locator('[data-tech-want]')).toHaveAttribute('aria-pressed', 'true');
  await expect(row2.locator('[data-tech-place]')).toHaveValue('Parkplatz hinter dem Bahnhof');
  // the wish also shows in the debrief, and the technique stands first there
  await page.goto(`./#/debrief/${OPEN}`);
  await expect(page.locator('[data-debrief-skills] [data-skill]').first()).toHaveAttribute('data-skill', 'hairpins');
  expect(errors).toEqual([]);
});

test('c) an empty diary says why and offers the debriefs', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/debrief/technik');
  const empty = page.locator('[data-technik] [data-empty]');
  await expect(empty).toContainText(T('Nothing noted yet. Tick the techniques you worked on in a debrief, and they show up here.'));
  await expect(empty.getByRole('link', { name: T('To the debriefs') })).toHaveAttribute('href', '#/debrief');
  await shot(page, info, 'T4-leer', empty);
  await noSideways(page);
  expect(errors).toEqual([]);
});
