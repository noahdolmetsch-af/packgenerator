// «Ein Eingang» (Noah 24.11.2026 «1-3a», Stufe 2): the search is the one way in. No bubble in the bar; the empty window starts with
// «Help for this page» (the «?» stays); under a question «Open the assistant» leads on, «Ask further at …» is a closed line.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');

async function start(page, hash) {
  await page.addInitScript(() => {
    localStorage.setItem('lang', 'de');
    localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`./${hash}`);
  await ready(page);
  return errors;
}

async function openSearch(page, info) {
  if (info.project.name === 'phone') await page.getByRole('button', { name: T('Search everything') }).click();
  const field = page.getByRole('searchbox', { name: T('What do you want to do? Search or say an action') }).locator('visible=true').first();
  await field.focus();
  return field;
}

test('no assistant bubble in the bar; the help button stays', async ({ page }) => {
  const errors = await start(page, '#/');
  await expect(page.getByRole('link', { name: T('Assistant'), exact: true })).toHaveCount(0);
  await expect(page.locator('button[data-help-open]:visible').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('the empty window starts with the help row, a tap opens the help window', async ({ page }, info) => {
  const errors = await start(page, '#/gear');
  await openSearch(page, info);
  const row = page.locator('[data-search-help]:visible');
  await expect(row).toBeVisible();
  // it is the first thing in the empty window
  const first = page.locator('.try:visible').first().locator('> *').first();
  await expect(first).toHaveAttribute('data-search-help-row', '');
  await row.click();
  await expect(page.locator('dialog[data-help][open]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('a question leads on to the assistant, a simple word does not; ask further is closed', async ({ page }, info) => {
  const errors = await start(page, '#/');
  const field = await openSearch(page, info);
  await field.fill('regen');
  await expect(page.locator('[data-search-assistant]')).toHaveCount(0);
  await field.fill('Wann ist meine nächste Tour?');
  const fold = page.locator('[data-search-ask-fold]:visible');
  await expect(fold).toBeVisible();
  await expect(fold).not.toHaveAttribute('open', '');
  await page.locator('[data-search-assistant]:visible').click();
  await expect(page).toHaveURL(/#\/assistent\?q=/);
  await expect(page.getByRole('heading', { level: 1, name: T('Assistant') })).toBeVisible();
  expect(errors).toEqual([]);
});
