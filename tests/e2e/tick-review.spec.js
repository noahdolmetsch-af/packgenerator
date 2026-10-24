// «Auswertung wie Training» (Noah 20.10.2026 «das ist ab jetzt unser standard», «zum auswerten von meinen
// täglich abgehakten aktivitäten»): Aktiv › Ziele › Auswerten (#/flow/auswertung) with the key tiles and the
// «Analysen» cards of the ride page, in German, at 390 px and on a computer. One card hidden and back with
// «Rückgängig», the period and the activity changed. Fixed clock, fictional ticks only (aktiv-fixture.js).
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { ANALYSES } from '../../src/lib/training/analyses.js';
import { D0, TODAY, addDays, aktivRows, put } from './aktiv-fixture.js';
import { ready } from './settle.js';
import { tapTab } from './placetab.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};

test('Auswerten › Haken ausgewertet: tiles, the tick analyses, hide and undo, period and activity', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow');
  await ready(page);
  await put(page, aktivRows());

  // the way in («Aktiv neu», Noah 22.10.2026): Auswerten › «Haken ausgewertet»
  await page.goto('./#/auswerten');
  await page.reload();
  await ready(page);
  await tapTab(page, T('Ticks evaluated|tab'));
  await expect(page).toHaveURL(/#\/flow\/auswertung$/);
  await expect(page.getByRole('heading', { level: 1, name: T('Your ticks evaluated') })).toBeVisible();

  // the key tiles like on the ride page
  const vals = page.locator('[data-section="values"]');
  for (const k of ['days', 'ticks', 'week', 'min', 'longest', 'current', 'acts']) await expect(vals.locator(`[data-val="${k}"]`)).toBeVisible();
  await expect(vals.locator('[data-val="days"] small')).toHaveText(T('Days with a tick'));

  // every tick card, in the order of «Analysen anpassen», with its German title
  const sec = page.locator('[data-section="analyses"]');
  const card = (k) => sec.locator(`[data-ana="${k}"]`);
  const keys = ANALYSES.ticks.map((a) => a.key);
  await expect(sec.locator('.anh .num')).toContainText(`${keys.length} von ${keys.length} ·`);
  for (const a of ANALYSES.ticks) await expect(card(a.key).getByRole('heading', { name: T(a.head ?? a.title) })).toBeVisible();
  expect(await sec.locator('[data-ana]').evaluateAll((els) => els.map((e) => e.dataset.ana))).toEqual(keys);
  await expect(card('tkgrid').locator('[data-grid-act="meditation"]')).toBeVisible();
  await expect(card('tkhalves').locator('[data-halves-sentence]')).toContainText(T('In the second half you ticked'));
  await expect(card('tkbest').locator('[data-best="run"]')).toBeVisible();

  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/tick-review-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });

  // the page never scrolls sideways
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);

  // «…» › Ausblenden, then «Rückgängig»
  await card('tkhours').getByRole('button', { name: new RegExp(T('More for {title}', { title: T('Time of day spread') })) }).click();
  await page.getByRole('menuitem', { name: T('Hide|ana') }).click();
  await expect(card('tkhours')).toHaveCount(0);
  await expect(sec.locator('.anh .num')).toContainText(`${keys.length - 1} von ${keys.length} ·`);
  await page.getByRole('button', { name: 'Rückgängig' }).click();
  await expect(card('tkhours')).toBeVisible();

  // one activity and 30 days: the address keeps the choice
  await page.locator('[data-tk-act]').selectOption('meditation');
  await page.getByRole('group', { name: T('Period|tk') }).getByRole('button', { name: T('30 days|tk') }).click();
  await expect(page).toHaveURL(/#\/flow\/auswertung\?act=meditation&p=30$/);
  await expect(vals.locator('[data-val="acts"]')).toHaveCount(0);
  await expect(card('tkgrid')).toHaveCount(0); // one activity: no grid
  await expect(card('tkweeks')).toBeVisible();

  expect(errors).toEqual([]);
});

test('Auswerten › Deine Antworten: the same cards for a check question with a number', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow');
  await ready(page);
  // fictional answers: the battery 1–10 on 60 days
  const abAnswers = [];
  for (let i = 60; i >= 0; i--) {
    if (i % 7 === 3) continue;
    const day = addDays(TODAY, -i);
    abAnswers.push({ id: `test_ak_${day}`, qid: 'erholung.akku', area: 'erholung', day, at: `${day}T08:10`, slot: `${day}T08:00`, kind: 'scale', value: 4 + (i % 5), note: null, src: 'hand' });
  }
  await put(page, { ...aktivRows(), abAnswers });
  await page.goto('./#/flow/auswertung');
  await page.reload();
  await ready(page);

  await page.getByRole('group', { name: T('What|tk') }).getByRole('button', { name: T('Your answers') }).click();
  await expect(page).toHaveURL(/#\/flow\/auswertung\?q=erholung\.akku$/);
  await expect(page.getByRole('heading', { level: 1, name: T('Your answers evaluated') })).toBeVisible();
  const vals = page.locator('[data-section="values"]');
  for (const k of ['n', 'days', 'mean', 'min', 'max', 'last']) await expect(vals.locator(`[data-val="${k}"]`)).toBeVisible();
  const sec = page.locator('[data-section="analyses"]');
  const keys = ANALYSES.answers.map((a) => a.key);
  for (const a of ANALYSES.answers) await expect(sec.locator(`[data-ana="${a.key}"]`).getByRole('heading', { name: T(a.head ?? a.title) })).toBeVisible();
  expect(await sec.locator('[data-ana]').evaluateAll((els) => els.map((e) => e.dataset.ana))).toEqual(keys);
  await expect(sec.locator('[data-ana="anhalves"] [data-halves-sentence]')).toContainText(T('In the second half your answer was'));
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/answer-review-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
  expect(errors).toEqual([]);
});
