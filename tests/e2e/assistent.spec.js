// «Assistent» (Noah 15.10.2026 «1 beides 2a und b 3 a und b»): own button (sidebar / phone top bar) and
// in the search; «Frag die App» answers free from own data; «Hilf mir planen» opens New trip filled in.
// Fictional v0.77.0 data; nothing goes out (the AI helper is off).
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { v0770File } from './v0770-fixture.js';
import { openData, settle } from './settle.js';
import { sentOut } from './public-data.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

async function start(page, context, info) {
  const file = v0770File(info);
  const out = [];
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => (out.push(route.request().url()), route.abort()));
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel('Backup importieren').setInputFiles(file);
  await data.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await settle(page);
  return { errors, out };
}
const external = sentOut; // weather and lake values carry nothing of yours

test('the button opens the page; an example asks, the app answers; the three ways with examples', async ({ page, context }, info) => {
  const { errors, out } = await start(page, context, info);
  await page.goto('./#/');
  await page.getByRole('link', { name: T('Assistant'), exact: true }).first().click();
  await expect(page).toHaveURL(/#\/assistent$/);
  await expect(page.getByRole('heading', { level: 1, name: T('Assistant') })).toBeVisible();
  await page.getByRole('button', { name: T('What is due on my bikes?') }).first().click();
  const card = page.locator('.aa[data-aa="care"]');
  await expect(card).toBeVisible();
  await expect(card.getByText(T('The app answers, from your data'))).toBeVisible();
  const how = page.locator('[data-as="how"]');
  await how.locator('summary').click();
  await expect(how.getByText(T('2 · Chrome AI'))).toBeVisible();
  await expect(how.getByText(T('Bike care: what is due next on chain, cassette, brake pads and tyres, with a concrete check'))).toBeVisible();
  await noSideways(page);
  await page.screenshot({ path: info.outputPath('as-ask.png'), fullPage: true });
  await how.getByRole('button', { name: `«${T('When is my next trip?')}»` }).click();
  await expect(page.locator('.aa[data-aa="trip"], .aa[data-aa="pack"]').first()).toBeVisible();
  expect(external(out)).toEqual([]);
  expect(errors).toEqual([]);
});

test('the search answers a question from own data, with a link', async ({ page, context }, info) => {
  const { errors, out } = await start(page, context, info);
  await page.goto('./#/');
  const phone = (page.viewportSize()?.width ?? 1440) < 720;
  if (phone) await page.getByRole('button', { name: T('Search everything') }).click();
  await page.getByRole('searchbox').first().fill('Was ist an meinen Velos fällig?');
  const card = page.locator('.aa[data-aa="care"]');
  await expect(card).toBeVisible();
  await card.locator('.aa-go').click();
  await expect(page).toHaveURL(/#\/bikes\?tab=care/);
  expect(external(out)).toEqual([]);
  expect(errors).toEqual([]);
});

test('«Hilf mir planen»: four questions, the plan, «Tour anlegen» opens New trip filled in', async ({ page, context }, info) => {
  const { errors } = await start(page, context, info);
  await page.goto('./#/assistent/plan');
  await expect(page.getByRole('heading', { name: T('Help me plan'), level: 2 })).toBeVisible();
  await page.getByLabel(T('Days')).fill('2');
  await page.getByRole('radio', { name: T('Hotel/hut') }).click();
  await page.getByRole('button', { name: T('Show my plan') }).click();
  const plan = page.locator('[data-ph="plan"]');
  await expect(plan.locator('[data-ph-row="when"]')).toContainText(T('Hotel/hut'));
  await expect(plan.locator('[data-ph-row="list"]')).toBeVisible();
  await noSideways(page);
  await page.screenshot({ path: info.outputPath('as-plan.png'), fullPage: true });
  await plan.getByRole('button', { name: T('Create the trip') }).click();
  const dlg = page.getByRole('dialog', { name: T('Conditions|newtrip') });
  await expect(dlg).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('pack.planPrefill'))).toBeNull();
  // the plan's answers are in New trip: two days, the night «Hotel/hut»
  await expect(dlg.getByRole('button', { name: T('Hotel/hut'), exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(errors).toEqual([]);
});
