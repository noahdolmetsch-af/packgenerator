// Page «Challenges» and own daily goals with «Tick off» (Noah 21.11.2026 «4a», 22.11.2026 «a»). Fictional data only
// (home0460 fixture: the clock stands on Friday 9 October 2026, 17:00 Zürich). SHOTS=<folder> saves pictures.
import { test, expect } from './clock.js';
import { openHome, homeFixture, day } from './home0460-fixture.js';

const ziel = (hand = {}, extra = {}) => ({ id: 'tz-test-1', name: 'Test stretching', unit: 'min', word: '', goal: 10, from: day(-2), until: day(12), hand, stopped: false, closed: false, ...extra });
function fixture(list = []) {
  const data = homeFixture();
  data.tables.settings = [...data.tables.settings, ...(list.length ? [{ key: 'tagesziele', value: list }] : [])];
  return data;
}
const shot = async (page, info, name, el) => {
  if (!process.env.SHOTS) return;
  await el.evaluate((e) => (e.style.outline = '3px solid #f08a24')); // the new part, framed for the pictures
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png` });
};

test('a running own goal: Tick off counts the goal, a second tap takes it back, More adds amounts; Heute stays as it is', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info, { hour: 17, data: fixture([ziel({ [day(-1)]: [10] })]) });
  // Heute stays as it is: the own goal does not stand there, only on the page Challenges
  await expect(page.locator('[data-ziel-card]')).toHaveCount(0);
  await page.evaluate(() => (location.hash = '#/flow/challenges'));
  const card = page.locator('[data-ziel-card="tz-test-1"]');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Test stretching');
  await expect(card.locator('[data-ziel-now]')).toContainText(T('{have} of {goal} today', { have: T('{n} min', { n: 0 }), goal: T('{n} min', { n: 10 }) }));
  await shot(page, info, 'challenge-karte-offen', card);
  await card.locator('[data-ziel-tick]').click();
  await expect(card.locator('[data-ziel-now]')).toContainText(T('Done today: {have} of {goal}', { have: T('{n} min', { n: 10 }), goal: T('{n} min', { n: 10 }) }));
  await expect(card.locator('[data-ziel-tick]')).toHaveAttribute('aria-pressed', 'true');
  await shot(page, info, 'challenge-karte-geschafft', card);
  await card.locator('[data-ziel-tick]').click();
  await expect(card.locator('[data-ziel-now]')).toContainText(T('{n} min', { n: 0 }));
  await card.locator('[data-ziel-more]').click();
  await card.locator('[data-ziel-add="5"]').click();
  await expect(card.locator('[data-ziel-now]')).toContainText(T('{n} min', { n: 5 }));
  await card.locator('[data-ziel-own]').fill('7');
  await card.locator('[data-ziel-own]').press('Enter');
  await expect(card.locator('[data-ziel-now]')).toContainText(T('Done today: {have} of {goal}', { have: T('{n} min', { n: 12 }), goal: T('{n} min', { n: 10 }) }));
  expect(errors).toEqual([]);
});

test('the page Challenges: a new goal from the window, an idea to take over, change and end', async ({ page, context }, info) => {
  const T = await openHome(page, context, info, { hour: 17, data: fixture() });
  await page.evaluate(() => (location.hash = '#/flow/milestones'));
  await page.locator('[data-challenges-link]').click();
  await expect(page.locator('[data-challenges-page]')).toBeVisible();
  await expect(page.locator('[data-challenges-empty]')).toBeVisible();
  await shot(page, info, 'challenges-seite-leer', page.locator('[data-challenges-page]'));
  await page.locator('[data-ziel-new]').click();
  const sheet = page.locator('[data-ziel-sheet]');
  await sheet.locator('[data-ziel-name]').fill('Test steps');
  await sheet.locator('[data-ziel-unit="steps"]').click();
  await expect(sheet.locator('[data-ziel-goal]')).toHaveValue('8000');
  await shot(page, info, 'challenge-neu-fenster', sheet);
  await sheet.locator('[data-ziel-save]').click();
  const card = page.locator('[data-ziel-card]').first();
  await expect(card).toContainText('Test steps');
  await expect(card.locator('[data-ziel-now]')).toContainText('8000');
  await card.locator('[data-ziel-tick]').click();
  await expect(card.locator('[data-ziel-now]')).toContainText(T('Done today: {have} of {goal}', { have: T('{n} steps', { n: 8000 }), goal: T('{n} steps', { n: 8000 }) }));
  await shot(page, info, 'challenges-seite-mit-karte', page.locator('[data-challenges-page]'));
  // an idea opens the window first, nothing starts by itself
  await page.locator('[data-ziel-idea]').first().getByRole('button').click();
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('[data-ziel-name]')).not.toHaveValue('');
  await sheet.getByRole('button', { name: T('Cancel') }).click();
  await expect(page.locator('[data-ziel-card]')).toHaveCount(1);
  // end by hand: it moves to «Over» with its days
  await card.locator('[data-ziel-edit]').click();
  await sheet.getByRole('button', { name: T('End the challenge') }).click();
  await expect(page.locator('[data-ziel-over]')).toHaveCount(1);
  await expect(page.locator('[data-ziel-card]')).toHaveCount(0);
});

test('the question every 10 days: three buttons and Later, then it stays quiet', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info, { hour: 17, data: fixture() });
  // Heute stays as it is: the question is not there
  await expect(page.locator('[data-challenge-ask]')).toHaveCount(0);
  await page.evaluate(() => (location.hash = '#/flow/challenges'));
  const ask = page.locator('[data-challenge-ask]');
  await expect(ask).toBeVisible();
  await expect(ask).toContainText(T('Time for a look'));
  await shot(page, info, 'challenge-frage', ask);
  await ask.locator('[data-ask-later]').click();
  await expect(ask).toHaveCount(0);
  // «Later» asks again tomorrow: after a new look at the page it stays quiet today
  await page.evaluate(() => (location.hash = '#/flow/milestones'));
  await page.evaluate(() => (location.hash = '#/flow/challenges'));
  await expect(page.locator('[data-challenges-page]')).toBeVisible();
  await expect(page.locator('[data-challenge-ask]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('the question: Challenge opens the window for a new one and starts 10 quiet days', async ({ page, context }, info) => {
  const T = await openHome(page, context, info, { hour: 17, data: fixture() });
  await page.evaluate(() => (location.hash = '#/flow/challenges'));
  await page.locator('[data-ask-challenge]').click();
  await expect(page.locator('[data-ziel-sheet]')).toBeVisible();
  await expect(page.locator('[data-challenge-ask]')).toHaveCount(0);
  expect(T).toBeTruthy();
});

test('the question: Milestone goes to Milestones', async ({ page, context }, info) => {
  await openHome(page, context, info, { hour: 17, data: fixture() });
  await page.evaluate(() => (location.hash = '#/flow/challenges'));
  await page.locator('[data-ask-milestone]').click();
  await expect(page).toHaveURL(/#\/flow\/milestones/);
  await page.evaluate(() => (location.hash = '#/flow/challenges'));
  await expect(page.locator('[data-challenge-ask]')).toHaveCount(0);
});
