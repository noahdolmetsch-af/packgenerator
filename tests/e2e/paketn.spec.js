// Paket N «Pläne und Träume» (19.10.2026): notes linked with each other (#10) and Ich › Was kommt (#68).
// In German, on a phone and a computer: two notes are written, one is linked from the other, the link
// shows on both, «Auf einen Blick» counts it, a #tag searches; Ich › Was kommt shows the packages.
// No sideways scroll, no page errors. Fictional data only.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { PACKAGES } from '../../src/lib/wascommt.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');

async function prep(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}
const noSideScroll = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);

test('notes: link one note with another, the link shows on both', async ({ page, context }) => {
  const errors = await prep(page, context);
  await page.goto('./#/notes');
  await ready(page);
  const cap = page.locator('form.cap textarea');
  for (const text of ['test_data_gtp_ Jura #herbst', 'test_data_gtp_ Packliste #herbst']) {
    await cap.fill(text);
    await page.locator('form.cap button[type="submit"]').click();
    await expect(page.locator('li.ncard', { hasText: text.split(' #')[0] })).toHaveCount(1);
  }
  const stats = page.locator('[data-note-stats]');
  await expect(stats).toContainText('#herbst');

  await page.locator('li.ncard', { hasText: 'Jura' }).locator('button').click();
  const sheet = page.locator('dialog.nsheet');
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('[data-note-links]')).toContainText(T('Maybe related'));
  await sheet.getByRole('button', { name: T('Link a note') }).click();
  await sheet.getByRole('searchbox', { name: T('Search a note to link') }).fill('Packliste');
  await sheet.locator('[data-note-links] button', { hasText: 'Packliste' }).click();
  await expect(sheet.locator('[data-note-links] .nl button', { hasText: 'Packliste' })).toHaveCount(1);
  await noSideScroll(page);

  // one tap opens the linked note; it shows the link back
  await sheet.locator('[data-note-links] .nl button', { hasText: 'Packliste' }).click();
  const other = page.locator('dialog.nsheet');
  await expect(other.locator('#note-h')).toContainText('Packliste');
  await expect(other.locator('[data-note-links]')).toContainText(T('links here'));
  await other.getByRole('button', { name: T('Done') }).click();
  await expect(stats).toContainText(T('{n} notes linked with others').replace('{n}', '2'));

  // a #tag searches
  await stats.getByRole('button', { name: /#herbst/ }).click();
  await expect(page.locator('.notes label.search input')).toHaveValue('#herbst');
  expect(errors).toEqual([]);
});

test('Ich › Was kommt shows the packages', async ({ page, context }) => {
  const errors = await prep(page, context);
  await page.goto('./#/me');
  await ready(page);
  await page.locator('a[data-row="next"]').click();
  await expect(page).toHaveURL(/#\/me\/next$/);
  const root = page.locator('[data-page="was-kommt"]');
  await expect(root.locator('h1, h2').first()).toBeVisible();
  await expect(root.locator('[data-package]')).toHaveCount(PACKAGES.length);
  await expect(root.locator('[data-package="N"]')).toContainText(T('Plans and dreams'));
  await noSideScroll(page);
  expect(errors).toEqual([]);
});

test('Touren › Träume: a dream with its season in the year band', async ({ page, context }) => {
  const errors = await prep(page, context);
  await page.goto('./#/trips/dreams');
  await ready(page);
  const root = page.locator('[data-page="dreams"]');
  await root.locator('form.cap input').fill('test_data_gtp_ Furka Pass');
  await root.locator('form.cap button[type="submit"]').click();
  await expect(root.locator('[data-dream]')).toHaveCount(1);
  await expect(root.locator('[data-dream]')).toContainText(T('Alpine passes'));
  // July fits, January does not
  await expect(root.locator('[data-month="7"] .num')).toHaveText('1');
  await expect(root.locator('[data-month="1"] .num')).toHaveText('0');
  await noSideScroll(page);

  await root.locator('[data-dream] button.open').click();
  const sheet = page.locator('dialog.dsheet');
  await sheet.locator('[data-months] button').nth(5).click(); // June on
  await expect(sheet).toContainText(T('chosen by you'));
  await sheet.getByRole('button', { name: T('Done') }).click();
  await expect(root.locator('[data-month="6"] .num')).toHaveText('1');
  await root.locator('[data-month="6"]').click();
  await expect(root.locator('#dr-list')).toContainText(T('Dreams in {month}').replace('{month}', T('Jun|month')));
  await expect(root.locator('[data-races]')).toBeVisible();
  await root.locator('[data-kinds] summary').click();
  await expect(root.locator('[data-kinds]')).toContainText(T('Jura and foothills'));
  expect(errors).toEqual([]);
});

test('Ich › Mein Kompass: a goal gets steps with dates, «Wie läuft\'s?», an idea becomes a goal', async ({ page, context }) => {
  const errors = await prep(page, context);
  await page.goto('./#/me');
  await ready(page);
  await page.locator('a[data-row="compass"]').click();
  await expect(page).toHaveURL(/#\/me\/compass$/);
  const root = page.locator('[data-page="compass"]');
  await root.locator('[data-goals] form.cap input[type="text"]').first().fill('test_data_gtp_ Alpenbrevet');
  await root.locator('[data-goals] form.cap button[type="submit"]').click();
  const goal = root.locator('article[data-goal]');
  await expect(goal).toHaveCount(1);
  await goal.locator('textarea').fill('Route zeichnen\nTraining planen');
  await goal.getByRole('button', { name: T('Add steps') }).click();
  await expect(goal.locator('.steps li')).toHaveCount(2);
  await expect(goal.locator('[data-ai-steps]')).toHaveCount(0); // AI helper not set up here
  await expect(root.locator('[data-goal-check]')).toBeVisible();
  await root.locator('[data-goal-check]').getByRole('button', { name: T('Going well') }).click();
  await expect(root.locator('[data-goal-check]')).toHaveCount(0);

  const ideas = root.locator('[data-box="ideas"]');
  await ideas.locator('form.addrow input').fill('test_data_gtp_ Ostsee umrunden');
  await ideas.locator('form.addrow button').click();
  await expect(ideas.locator('[data-entry]')).toHaveCount(1);
  await ideas.getByRole('button', { name: T('Make a goal') }).click();
  await expect(root.locator('article[data-goal]')).toHaveCount(2);
  await noSideScroll(page);
  expect(errors).toEqual([]);
});
