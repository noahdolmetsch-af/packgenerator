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
  // step 3: the photo of the page is made with the tap and shown in the window
  const small = sheet.locator('[data-lb-photo]');
  await expect(small).toBeVisible();
  expect(await small.getAttribute('src')).toMatch(/^data:image\/jpeg;base64,/);
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
  // the photo is kept on the entry: a small JPEG, shown as a thumbnail
  const thumb = row.locator('[data-lb-photo] img');
  await expect(thumb).toBeVisible();
  const bytes = await thumb.evaluate((img) => Math.round(((img.src.length - img.src.indexOf(',') - 1) * 3) / 4));
  expect(bytes).toBeGreaterThan(3000); // not a blank pixel
  expect(bytes).toBeLessThan(700 * 1024);
  // the whole page, also the part below the fold: the picture is taller than the screen (the page «Ich» is long)
  const dims = await thumb.evaluate((img) => ({ h: img.naturalHeight, w: img.naturalWidth, screen: innerHeight }));
  expect(dims.h).toBeGreaterThan(dims.screen);
  expect(dims.h).toBeLessThanOrEqual(6000);
  await shot(page, info, 'verbessern-liste');
  // a tap shows the long picture as wide as the window, and it scrolls
  await press(row.locator('[data-lb-photo]'), info);
  const scr = page.locator('[data-lightbox-scroll]');
  await expect(scr).toBeVisible();
  expect(await scr.evaluate((d) => d.scrollHeight > d.clientHeight)).toBe(true);
  await shot(page, info, 'verbessern-foto-gross');
  await page.keyboard.press('Escape');
  await expect(scr).toBeHidden();
  if (SHOTS) {
    const b64 = await thumb.evaluate((img) => img.src.split(',')[1]);
    (await import('node:fs')).writeFileSync(`${SHOTS}/verbessern-foto-${info.project.name === 'phone' ? 390 : 1440}.jpg`, Buffer.from(b64, 'base64'));
  }
  // «Bilder speichern»: one file per photo, named with its number
  const download = page.waitForEvent('download');
  await press(page.locator('[data-lb-images]'), info);
  expect((await download).suggestedFilename()).toMatch(/^logbuch-01-me\.jpg$/);
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
