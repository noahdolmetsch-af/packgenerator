// v0.72.0 «Feinschliff» (Noah 10.10.2026, Umbenennen 1a–5a): one rename sheet everywhere, the name
// field has the cursor and the keyboard's key saves, Android back and Escape keep the typed name
// (Escape is what Chrome's CloseWatcher sends on a real Android back, history.back() the other way),
// ✕ leaves it, «Renamed to … · Undo» afterwards, and Setup stays on the renamed bike.
// Fictional data only (home0460-fixture.js, test_data_gtp_ records).
import { test, expect } from '@playwright/test';
import { openHome } from './home0460-fixture.js';

const P = 'test_data_gtp_';
const FACTOR = 'test_data_gtp_factor';

async function setup(page, context, info) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('dialog', (d) => d.dismiss());
  const T = await openHome(page, context, info);
  return { T, errors };
}
const bikesTable = (page) =>
  page.evaluate(
    () =>
      new Promise((res) => {
        const q = indexedDB.open('pack-generator');
        q.onsuccess = () => {
          const r = q.result.transaction('bikes').objectStore('bikes').getAll();
          r.onsuccess = () => res(r.result.map((b) => [b.id, b.name]));
        };
      }),
  );

test('rename a bike: one sheet, the keyboard key saves, the same bike stays chosen, Undo', async ({ page, context }, info) => {
  const { T, errors } = await setup(page, context, info);
  await page.goto('./#/bikes');
  const band = page.locator('section.setup-band');
  // without ?bike= Setup shows the first bike by name: Factor
  await expect(band.getByRole('heading', { name: `${P} Factor` })).toBeVisible();
  await band.getByRole('button', { name: T('Rename {name}', { name: `${P} Factor` }) }).click();
  const rn = page.locator('dialog.rename[open]');
  const field = rn.getByRole('textbox', { name: T('Name'), exact: true });
  await expect(rn.getByRole('heading', { name: T('Rename bike') })).toBeVisible();
  await expect(field).toBeFocused();
  await expect(field).toHaveAttribute('enterkeyhint', 'done');
  await expect(field).toHaveValue(`${P} Factor`);
  // a name that sorts last: the page must not jump to another bike
  await field.fill(`${P} Zeta`);
  await field.press('Enter');
  await expect(rn).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp(`bike=${FACTOR}`));
  await expect(band.getByRole('heading', { name: `${P} Zeta` })).toBeVisible();
  expect((await bikesTable(page)).find((b) => b[0] === FACTOR)[1]).toBe(`${P} Zeta`);
  const toast = page.locator('.rtoast');
  await expect(toast).toContainText(T('Renamed to "{name}".', { name: `${P} Zeta` }));
  await toast.getByRole('button', { name: T('Undo') }).click();
  await expect(band.getByRole('heading', { name: `${P} Factor` })).toBeVisible();
  await expect(toast).toHaveCount(0);
  // the ✕ empties the field; an empty name is not saved
  await band.getByRole('button', { name: T('Rename {name}', { name: `${P} Factor` }) }).click();
  await rn.getByRole('button', { name: T('Clear the name') }).click();
  await expect(field).toHaveValue('');
  await expect(field).toBeFocused();
  await rn.getByRole('button', { name: T('Save') }).click();
  await expect(rn.getByRole('alert')).toHaveText(T('Give it a name.'));
  await rn.getByRole('button', { name: T('Cancel') }).click();
  await expect(rn).toHaveCount(0);
  expect((await bikesTable(page)).find((b) => b[0] === FACTOR)[1]).toBe(`${P} Factor`);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('back keeps the typed name: Escape (Android back) and history back save, Close and Cancel leave it', async ({ page, context }, info) => {
  const { T, errors } = await setup(page, context, info);
  await page.goto(`./#/bikes?bike=${FACTOR}`);
  const band = page.locator('section.setup-band');
  const rn = page.locator('dialog.rename[open]');
  const field = rn.getByRole('textbox', { name: T('Name'), exact: true });
  // Escape: what Chrome on Android sends for its own back (CloseWatcher → cancel)
  await band.getByRole('button', { name: T('Rename {name}', { name: `${P} Factor` }) }).click();
  await field.fill(`${P} Factor Esc`);
  await page.keyboard.press('Escape');
  await expect(rn).toHaveCount(0);
  await expect(band.getByRole('heading', { name: `${P} Factor Esc` })).toBeVisible();
  // the browser's back button (popstate): saved too, the page stays
  await band.getByRole('button', { name: T('Rename {name}', { name: `${P} Factor Esc` }) }).click();
  await field.fill(`${P} Factor Back`);
  await page.goBack();
  await expect(rn).toHaveCount(0);
  await expect(page).toHaveURL(/#\/bikes/);
  await expect(band.getByRole('heading', { name: `${P} Factor Back` })).toBeVisible();
  // ✕ and «Cancel» leave the name as it was
  await band.getByRole('button', { name: T('Rename {name}', { name: `${P} Factor Back` }) }).click();
  await field.fill(`${P} nie gespeichert`);
  await rn.getByRole('button', { name: T('Close') }).click();
  await expect(rn).toHaveCount(0);
  await expect(band.getByRole('heading', { name: `${P} Factor Back` })).toBeVisible();
  // the other details are one link further; there too Escape keeps what was typed
  await band.getByRole('button', { name: T('Rename {name}', { name: `${P} Factor Back` }) }).click();
  await rn.getByRole('button', { name: new RegExp(T('Type, use and photo: Bike details')) }).click();
  const det = page.locator('dialog[aria-labelledby="bike-dlg-h"]');
  await expect(det).toBeVisible();
  await det.getByLabel(T('What you use it for')).fill(`${P} Alpencross`);
  await page.keyboard.press('Escape');
  await expect(det).toBeHidden();
  await expect(band).toContainText(`${P} Alpencross`);
  expect(errors).toEqual([]);
});

test('a bag: the pencil in its window opens the same sheet; the window keeps changes on Escape', async ({ page, context }, info) => {
  const { T, errors } = await setup(page, context, info);
  await page.goto(`./#/bikes?bike=${FACTOR}`);
  const fold = page.locator('details', { hasText: T('Your bags') }).last();
  await fold.locator('summary').first().click();
  await fold.getByRole('button', { name: /Test seat pack/ }).first().click();
  const bag = page.locator('dialog[aria-labelledby="bag-h"]');
  await expect(bag).toBeVisible();
  await bag.getByRole('button', { name: T('Rename {name}', { name: 'Test seat pack' }) }).click();
  const rn = page.locator('dialog.rename[open]');
  await expect(rn.getByRole('heading', { name: T('Rename bag') })).toBeVisible();
  await rn.getByRole('textbox', { name: T('Name'), exact: true }).fill(`${P} Satteltasche neu`);
  await rn.getByRole('button', { name: T('Save') }).click();
  await expect(rn).toHaveCount(0);
  await expect(bag.getByRole('heading')).toContainText(`${P} Satteltasche neu`);
  // the bag window itself: a changed note is kept on Escape (Android back), like «Save»
  await bag.getByLabel(T('Note')).fill(`${P} wasserdicht`);
  await page.keyboard.press('Escape');
  await expect(bag).toBeHidden();
  const rec = await page.evaluate(
    () =>
      new Promise((res) => {
        const q = indexedDB.open('pack-generator');
        q.onsuccess = () => {
          const r = q.result.transaction('containers').objectStore('containers').get('bag-TA01');
          r.onsuccess = () => res(r.result);
        };
      }),
  );
  expect([rec.name, rec.note]).toEqual([`${P} Satteltasche neu`, `${P} wasserdicht`]);
  expect(errors).toEqual([]);
});
