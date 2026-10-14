// Kamera-Knopf (Noah, 14.10.2026 «bei Belegen immer»): wherever a receipt is added, the phone gets
// «Beleg fotografieren» (opens the camera at once) next to «Galerie»; a computer keeps one
// «Foto wählen». Fictional fixture; the photo is a tiny generated PNG and never leaves the page.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { importAndSettle, closeDialog } from './settle.js';

const T = (en) => DE[en] ?? en;
const fixture = fileURLToPath(new URL('./fixture.json', import.meta.url));
const bike = JSON.parse(readFileSync(fixture, 'utf8')).tables.bikes[0];
// a small plain PNG, enough for createImageBitmap
const PNG = {
  name: 'beleg.png',
  mimeType: 'image/png',
  buffer: process.env.MOCK_IMG
    ? readFileSync(process.env.MOCK_IMG)
    : Buffer.from('iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAIAAAADnC86AAAAMElEQVR4nO3NMQ0AAAgDsPl3yc+BBEyQ8DTp30zXi4jFYrFYLBaLxWKxWCwWi8V3Fmz2HkDU8QY8AAAAAElFTkSuQmCC', 'base64'),
};
const shot = (page, name) => (process.env.MOCK_OUT ? page.screenshot({ path: `${process.env.MOCK_OUT}/${name}.png` }) : null);

async function load(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  await importAndSettle(page, fixture);
}

test('Bikes › Workshop: the visit dialog offers the camera for the receipt', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await load(page, context);
  await page.goto(`./#/bikes?tab=shop&bike=${bike.id}`);
  await page
    .getByRole('button', { name: T('Log a workshop visit') })
    .first()
    .click();
  const dlg = page.getByRole('dialog', { name: T('Log a workshop visit') });
  await expect(dlg).toBeVisible();
  const phone = info.project.name === 'phone';
  await shot(page, `K1-werkstattbesuch-${phone ? 390 : 1440}`);
  if (phone) {
    const cam = dlg.locator('label', { hasText: T('Photograph the receipt') });
    await expect(cam.locator('input')).toHaveAttribute('capture', 'environment');
    await expect(dlg.locator('label', { hasText: T('Gallery') }).locator('input')).not.toHaveAttribute('capture');
    await cam.locator('input').setInputFiles(PNG);
  } else {
    await expect(dlg.getByText(T('Photograph the receipt'))).toHaveCount(0);
    await dlg
      .locator('label', { hasText: T('Choose photo') })
      .locator('input')
      .setInputFiles(PNG);
  }
  await expect(dlg.getByRole('img', { name: T('Photo of the receipt') })).toBeVisible();
  await expect(dlg.getByText(T('Other photo'))).toBeVisible();
  await shot(page, `K2-mit-foto-${phone ? 390 : 1440}`);
  expect(errors).toEqual([]);
});

test('New › Workshop visit: the visit opens with the camera for the receipt; a receipt note and its filing too', async ({ page, context }, info) => {
  await load(page, context);
  await page.goto('./#/');
  const phone = info.project.name === 'phone';
  const pickNew = async (name) => {
    await page.keyboard.press('n');
    await page
      .getByRole('dialog', { name: T('New') })
      .getByRole('button', { name: T(name) })
      .click();
  };
  // since 0.125.0 A-J1 «Workshop visit» in New opens the real visit (not a note), with the camera
  await pickNew('Workshop visit');
  const visit = page.getByRole('dialog', { name: T('Log a workshop visit') });
  await expect(visit).toBeVisible();
  if (phone) {
    await expect(visit.locator('label', { hasText: T('Photograph the receipt') }).locator('input')).toHaveAttribute('capture', 'environment');
    await expect(visit.getByText(T('Gallery'))).toBeVisible();
  } else await expect(visit.getByText(T('Choose photo'))).toBeVisible();
  await shot(page, `K3-neu-werkstattbesuch-${phone ? 390 : 1440}`);
  await closeDialog(page);
  // a receipt note (New › Note + photo, «Werkstatt-Quittung: …»): the camera says «Beleg fotografieren»
  await pickNew('Note + photo');
  const dlg = page.getByRole('dialog', { name: T('Note + photo') });
  await expect(dlg).toBeVisible();
  await dlg.getByRole('textbox', { name: T('Note') }).fill(`${T('Workshop receipt: ')}test_data_gtp_ Service`);
  if (phone) {
    await expect(dlg.locator('label', { hasText: T('Photograph the receipt') }).locator('input')).toHaveAttribute('capture', 'environment');
    await expect(dlg.getByText(T('Gallery'))).toBeVisible();
  } else await expect(dlg.getByText(T('Choose photo'))).toBeVisible();
  // saved without a photo: filing it as a receipt in the Inbox offers the camera again
  await dlg.getByRole('button', { name: T('Save'), exact: true }).click();
  await expect(dlg).toBeHidden();
  await page.goto('./#/inbox');
  await page
    .locator('li[data-note-id]')
    .filter({ hasText: 'test_data_gtp_ Service' })
    .getByRole('button', { name: T('File'), exact: true })
    .click();
  const file = page.getByRole('dialog', { name: T('File as …') });
  await file.locator('button.tile[data-target="receipt"]').click();
  await file.getByRole('button', { name: bike.name }).click();
  const shop = file.getByPlaceholder(T('Name of the shop'));
  if (await shop.isVisible()) await shop.fill('test_data_gtp_ Velo');
  await file
    .locator('label', {
      hasText: T(phone ? 'Photograph the receipt' : 'Choose photo'),
    })
    .locator('input')
    .setInputFiles(PNG);
  await expect(file.getByRole('img', { name: T('Photo of the receipt') })).toBeVisible();
  await file.getByRole('img', { name: T('Photo of the receipt') }).scrollIntoViewIfNeeded();
  await shot(page, `K4-eingang-beleg-${phone ? 390 : 1440}`);
  await file.getByRole('button', { name: T('File as workshop visit') }).click();
  await expect(file).toBeHidden();
  await page.goto(`./#/bikes?tab=shop&bike=${bike.id}`);
  await expect(page.locator('img.rc').first()).toBeVisible();
});
