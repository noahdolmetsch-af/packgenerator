// «Verbesserungs-Logbuch» Schritt 2 (Noah 21.11.2026 «freigabe»): der Knopf «Verbessern», Block antippen, das Fenster.
// Fictional entries only; German UI, phone + desktop. SHOTS=<folder> saves pictures (Handy 390 / Computer 1440).
import { test, expect } from './clock.js';
import { ready } from './settle.js';

const SHOTS = process.env.SHOTS || '';

async function open(page, context, hash = './#/me') {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    localStorage.setItem('lang', 'de');
    localStorage.setItem('ops.improve', '1'); // browser tests start without the button, this one wants it
  });
  await page.goto(hash);
  await ready(page);
  return errors;
}
async function shot(page, info, name) {
  if (!SHOTS) return;
  const w = info.project.name === 'phone' ? 390 : 1440;
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${SHOTS}/${name}-${w}.png`, fullPage: false });
}
/** A tap at the middle of an element, as a finger or a mouse (the layer of the mode catches it). */
async function tapAt(page, info, loc) {
  const b = await loc.boundingBox();
  const x = b.x + Math.min(b.width / 2, 120);
  const y = b.y + b.height / 2;
  if (info.project.name === 'phone') await page.touchscreen.tap(x, y);
  else await page.mouse.click(x, y);
}
const press = (loc, info) => (info.project.name === 'phone' ? loc.tap() : loc.click());

test('Verbessern: button, tap a block, write, save, the entry is in the log with page, block and device', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const btn = page.locator('[data-improve]');
  await expect(btn).toBeVisible();
  await shot(page, info, 'verbessern-knopf');
  await press(btn, info);
  await expect(page.locator('[data-improve-bar]')).toBeVisible();
  await expect(btn).toBeHidden();
  await shot(page, info, 'verbessern-modus');

  // a tap on a block with a title
  const head = page.getByRole('heading', { name: 'Hilfe', exact: true }).first();
  const name = (await head.innerText()).trim();
  await head.evaluate((e) => e.scrollIntoView({ block: 'center' })); // not under the banner
  if (info.project.name !== 'phone') {
    const b = await head.boundingBox();
    await page.mouse.move(b.x + 20, b.y + b.height / 2);
    await expect(page.locator('[data-improve-frame]')).toBeVisible(); // the mouse shows the frame before the tap
    await shot(page, info, 'verbessern-block');
  }
  await tapAt(page, info, head);

  const sheet = page.locator('[data-logbuch-sheet]');
  await expect(sheet).toBeVisible();
  await expect(page.locator('[data-improve-frame]')).toBeVisible();
  await expect(sheet.locator('[data-lb-block-chip]')).toContainText(name);
  await expect(sheet.locator('[data-lb-context]')).toContainText('#/me');
  await expect(sheet.locator('[data-lb-page]')).toHaveCount(0);
  await shot(page, info, 'verbessern-fenster');

  await press(sheet.locator('[data-art="text"]'), info);
  await sheet.locator('[data-lb-text]').fill('Fiktiv: dieser Titel soll anders heissen.');
  await press(sheet.locator('[data-urgent="now"]'), info);
  await press(sheet.locator('[data-lb-save]'), info);
  await expect(sheet).toBeHidden();
  await expect(page.getByText('Im Logbuch festgehalten.')).toBeVisible(); // kept
  await expect(page.locator('[data-improve]')).toBeVisible(); // the mode is over

  await page.goto('./#/me/logbuch');
  await ready(page);
  const row = page.locator('[data-lb-entry]').first();
  await expect(row).toContainText('Fiktiv: dieser Titel soll anders heissen.');
  await expect(row).toContainText(name);
  await expect(row).toContainText('#/me');
  await expect(row.locator('[data-lb-now]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('Verbessern: whole page, take the block off, cancel keeps nothing', async ({ page, context }, info) => {
  await open(page, context);
  await press(page.locator('[data-improve]'), info);
  await press(page.locator('[data-improve-cancel]'), info);
  await expect(page.locator('[data-improve-bar]')).toBeHidden();
  await expect(page.locator('[data-improve]')).toBeVisible();

  await press(page.locator('[data-improve]'), info);
  await press(page.locator('[data-improve-whole]'), info);
  const sheet = page.locator('[data-logbuch-sheet]');
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('[data-lb-block-chip]')).toHaveCount(0);
  await press(sheet.locator('[data-art="gutso"]'), info);
  await sheet.locator('[data-lb-text]').fill('Fiktiv: die ganze Seite ist gut so.');
  await press(sheet.locator('[data-lb-save]'), info);
  await expect(sheet).toBeHidden();
  await expect(page.getByText('Im Logbuch festgehalten.')).toBeVisible(); // kept

  await page.goto('./#/me/logbuch');
  await ready(page);
  await expect(page.locator('[data-lb-entry]')).toHaveCount(1);
  await expect(page.locator('[data-lb-entry]').first()).toContainText('Fiktiv: die ganze Seite ist gut so.');
});

test('Verbessern: the switch in Ich › Darstellung takes the button away', async ({ page, context }, info) => {
  await context.addInitScript(() => localStorage.setItem('ops.improve', '0'));
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/me');
  await ready(page);
  await expect(page.locator('[data-improve]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
