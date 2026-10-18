// Merken: Geburtstage und Pflanzen (Noah 15.10.2026 «plus geburtstag, pflanzen … ebenfalls reinnehmen»).
// A birthday is added in Kalender › Merken, shows in its own group with «in n Tagen» and the age, and as
// a reminder row on Ich › Erinnerungen; deleting has Undo. A plant shows when it is due, «Gegossen» moves
// the next day, Undo puts it back. Not on Heute. Phone and computer, German, no sideways scroll, no errors.
// Fictional names only. GP_SHOTS=<dir> also saves the pictures for the mockup page.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { addDays } from '../../src/lib/merken.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
const TODAY = '2026-10-15';
const D0 = `${TODAY}T09:00:00+02:00`; // the browser runs in Europe/Zurich
const SHOTS = process.env.GP_SHOTS;
const W = { phone: '390', desktop: '1440' };
const shot = async (page, info, name) => SHOTS && (await page.screenshot({ path: `${SHOTS}/${name}-${W[info.project.name]}.png` }));

async function open(page, context, hash) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`./${hash}`);
  return errors;
}
async function fits(page, where) {
  const w = page.viewportSize().width;
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(sw, `${where}: no sideways scroll`).toBeLessThanOrEqual(w);
}
async function addBirthday(page, name, day, { year = '' } = {}) {
  await page.locator('main').getByRole('button', { name: T('Birthday'), exact: true }).click();
  const dlg = page.locator('dialog.kind');
  await expect(dlg).toBeVisible();
  await dlg.getByLabel(T('Name')).fill(name);
  await dlg.getByLabel(T('Day'), { exact: true }).selectOption(String(+day.slice(8)));
  await dlg.getByLabel(T('Month'), { exact: true }).selectOption(String(+day.slice(5, 7)));
  if (year) await dlg.getByLabel(T('Year (optional)')).fill(year);
  return dlg;
}

test('Birthday: added in Merken, own group with in n days and the age, a reminder on Ich › Erinnerungen, delete with Undo', async ({ page, context }, info) => {
  const errors = await open(page, context, '#/calendar');
  const main = page.locator('main');
  await expect(main.getByRole('heading', { name: T('Remember'), level: 1 })).toBeVisible();

  const day = addDays(TODAY, 3);
  const dlg = await addBirthday(page, 'Mia', day, { year: String(+day.slice(0, 4) - 40) });
  await expect(dlg.getByRole('button', { name: T('The day before') })).toHaveAttribute('aria-pressed', 'true');
  await expect(dlg.getByRole('button', { name: T('On the day') })).toHaveAttribute('aria-pressed', 'true');
  await dlg.getByRole('button', { name: T('Save') }).click();
  await expect(dlg).toHaveCount(0);

  await expect(main.getByRole('heading', { name: T('Birthdays') })).toBeVisible();
  const row = main.locator('.bdays .td', { hasText: 'Mia' });
  await expect(row.locator('.due')).toHaveText(T('in {n} days', { n: 3 }));
  await expect(row).toContainText(T('turns {n}', { n: 40 }));

  // a second one without a year, later in the year: after Mia
  await addBirthday(page, 'Opa', addDays(TODAY, 40));
  await page.locator('dialog.kind').getByRole('button', { name: T('On the day') }).click(); // only the day before
  await page.locator('dialog.kind').getByRole('button', { name: T('Save') }).click();
  await expect(main.locator('.bdays .td b')).toHaveText(['Mia', 'Opa']);
  await fits(page, 'Merken with birthdays');

  // not on Heute (Noah's rule)
  await page.goto('./#/');
  await expect(page.locator('main')).not.toContainText('Mia');

  await page.goto('./#/me/reminders');
  const rem = main.locator('.row', { hasText: 'Mia' });
  await expect(rem).toBeVisible();
  await expect(rem).toContainText(T('Every year'));
  await expect(rem.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  await expect(main.getByRole('heading', { name: T('Birthdays') })).toBeVisible();
  await fits(page, 'Ich › Erinnerungen');

  // delete with Undo
  await page.goto('./#/calendar');
  await main.locator('.bdays .td', { hasText: 'Opa' }).locator('.tx').click();
  await page.locator('dialog.kind').getByRole('button', { name: T('Delete') }).click();
  await expect(main.locator('.bdays .td', { hasText: 'Opa' })).toHaveCount(0);
  await page.locator('.mk-toast').getByRole('button', { name: T('Undo') }).click();
  await expect(main.locator('.bdays .td', { hasText: 'Opa' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('Plant: due for 1 day, Watered moves the next day, Undo puts it back', async ({ page, context }) => {
  const errors = await open(page, context, '#/calendar');
  const main = page.locator('main');
  await main.getByRole('button', { name: T('Plant'), exact: true }).click();
  const dlg = page.locator('dialog.kind');
  await dlg.getByRole('button', { name: T('Save') }).click();
  await expect(dlg.getByRole('alert')).toHaveText(T('Write the name of the plant.'));
  await dlg.getByLabel(T('Name')).fill('Basilikum');
  await dlg.getByLabel(T('Water every … days')).fill('2');
  await dlg.getByLabel(T('Place (optional)')).fill('Balkon');
  await dlg.locator('input[type="date"]').fill(addDays(TODAY, -3));
  await expect(dlg.getByRole('button', { name: T('On the due day') })).toHaveAttribute('aria-pressed', 'true');
  await fits(page, 'plant window');
  await dlg.getByRole('button', { name: T('Save') }).click();

  await expect(main.getByRole('heading', { name: T('Plants') })).toBeVisible();
  const row = main.locator('.plants .td', { hasText: 'Basilikum' });
  await expect(row).toContainText('Balkon');
  await expect(row.locator('.due')).toHaveText(T('due for {n} day', { n: 1 }));
  await row.getByRole('button', { name: T('Watered: {name}', { name: 'Basilikum' }) }).click();
  await expect(row.locator('.due')).toHaveText(T('in {n} days', { n: 2 }));
  await expect(page.locator('.mk-toast')).toContainText(T('{name} · watered', { name: 'Basilikum' }));
  await page.locator('.mk-toast').getByRole('button', { name: T('Undo') }).click();
  await expect(row.locator('.due')).toHaveText(T('due for {n} day', { n: 1 }));
  await fits(page, 'Merken with plants');

  await page.goto('./#/me/reminders');
  await expect(main.locator('.row', { hasText: 'Basilikum' })).toContainText(T('Water every {n} days', { n: 2 }));
  expect(errors).toEqual([]);
});

test('Merken with both groups, next ones first, and the add window', async ({ page, context }, info) => {
  const errors = await open(page, context, '#/calendar');
  const main = page.locator('main');
  for (const [name, n, year] of [['Mia', 3, '1986'], ['Opa', 40, '']]) {
    await addBirthday(page, name, addDays(TODAY, n), { year });
    await page.locator('dialog.kind').getByRole('button', { name: T('Save') }).click();
  }
  for (const [name, every, place] of [['Basilikum', '2', 'Balkon'], ['Farn', '7', '']]) {
    await main.getByRole('button', { name: T('Plant'), exact: true }).click();
    const dlg = page.locator('dialog.kind');
    await dlg.getByLabel(T('Name')).fill(name);
    await dlg.getByLabel(T('Water every … days')).fill(every);
    if (place) await dlg.getByLabel(T('Place (optional)')).fill(place);
    await dlg.getByRole('button', { name: T('Save') }).click();
  }
  await expect(main.locator('.bdays .td b')).toHaveText(['Mia', 'Opa']);
  await expect(main.locator('.plants .td b')).toHaveText(['Basilikum', 'Farn']);
  await fits(page, 'Merken with both groups');
  await expect(page.locator('.mk-toast')).toHaveCount(0, { timeout: 12_000 }); // the «Saved» notice goes by itself
  await main.getByRole('heading', { name: T('Birthdays') }).scrollIntoViewIfNeeded();
  await shot(page, info, 'merken');
  const dlg = await addBirthday(page, 'Lena', addDays(TODAY, 12), { year: '2019' });
  await expect(dlg.getByRole('heading', { name: T('Birthday') })).toBeVisible();
  await fits(page, 'birthday window');
  await shot(page, info, 'neu');
  expect(errors).toEqual([]);
});
