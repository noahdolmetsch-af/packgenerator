// Klick-Rundgang H19 (Noah 22.10.2026 «1a»): the + menu also offers «Velo hinzufügen», «Aktivität abhaken»,
// «Tagebuch-Eintrag» and «Inspiration-Link»; each leads to its place. Fictional data only, no internet.
import { test, expect } from './clock.js';
import { ready } from './settle.js';
import { newButton } from './newbutton.js';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');

test('the + menu: bike, activity, diary and inspiration lead to their place', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./');
  await ready(page);
  const open = async () => {
    await (await newButton(page, T('New'))).click();
    return page.getByRole('dialog', { name: T('New') });
  };
  let dlg = await open();
  for (const name of ['Add bike', 'Tick an activity', 'Diary entry', 'Inspiration link']) await expect(dlg.getByText(T(name), { exact: true })).toBeVisible();
  await dlg.locator('[data-new-tick]').click();
  await expect(page).toHaveURL(/#\/flow$/);
  dlg = await open();
  await dlg.locator('[data-new-insp]').click();
  await expect(page).toHaveURL(/#\/me\/inspiration$/);
  dlg = await open();
  await dlg.locator('[data-new-bike]').click();
  await expect(page).toHaveURL(/#\/bikes/);
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  dlg = await open();
  await dlg.locator('[data-new-diary]').click();
  await expect(page).toHaveURL(/#\/tagebuch/);
  expect(errors).toEqual([]);
});
