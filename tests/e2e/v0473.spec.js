// v0.47.3 (two bugs from clicking through the app); fictional data only (test_data_gtp_).
// 1. «Kühl + Regen» in the New trip window showed «Fürs Wetter: nichts zusätzlich»: with the forecast
//    already on «Kühl» and rain, the taps on «Kühl» and «+ Regen» took both off again (the chips toggled).
//    Now a chip only sets, and dry / rain are two chips as on the trip page.
// 2. The phone ••• menu of the packing list was cut off at the left edge at 390 px (with «Rückgängig»
//    in the toolbar the ••• moved left and the right-aligned menu ran off the screen). Every ••• menu now
//    stays inside the screen (ui/inview.js): checked here at 320 and 390 px.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const RAW = readFileSync(fileURLToPath(new URL('./pf-fixture.json', import.meta.url)), 'utf8');
const day = (n = 0) => new Date(Date.now() + n * 864e5).toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const tap = (loc, info) => (info.project.name === 'phone' ? loc.tap() : loc.click());

function fixtureFile(info) {
  mkdirSync(info.project.outputDir, { recursive: true });
  const path = `${info.project.outputDir}/v0473-fixture-${info.testId}.json`;
  writeFileSync(path, RAW.replace(/"@([+-]\d+)"/g, (m, n) => `"${day(Number(n))}"`));
  return path;
}

/** Open-Meteo answer: 16 days from today, 6–12 °C and 8 mm (→ «Kühl» and rain). */
function meteo() {
  const day0 = new Date(`${day(0)}T00:00:00Z`);
  const time = Array.from({ length: 16 }, (_, n) => new Date(day0.getTime() + n * 864e5).toISOString().slice(0, 10));
  return { daily: { time, temperature_2m_min: time.map(() => 6.4), temperature_2m_max: time.map(() => 11.5), precipitation_sum: time.map(() => 8), precipitation_probability_max: time.map(() => 90) } };
}

async function start(page, context, info, { forecast = false } = {}) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  if (forecast) await page.route(/api\.open-meteo\.com\/v1\/forecast/, (route) => route.fulfill({ json: meteo() }));
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  const data = page.locator('details.data');
  await expect(async () => {
    if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
    expect(await data.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  await data.getByLabel('Backup importieren').setInputFiles(fixtureFile(info));
  await data.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await expect(data.getByText(/importiert.*alle Daten ersetzt/i)).toBeVisible();
  return errors;
}

const allTrips = (page) =>
  page.evaluate(() => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction('trips').objectStore('trips').getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }));

async function openNew(page, info) {
  await tap(page.getByRole('button', { name: 'Neu', exact: true }).filter({ visible: true }), info);
  await tap(page.getByRole('dialog', { name: 'Neu' }).getByRole('button', { name: 'Tour planen' }), info);
  const dlg = page.getByRole('dialog', { name: 'Neue Tour' });
  await expect(dlg).toBeVisible();
  return dlg;
}

for (const forecast of [true, false]) {
  test(`«Kühl + Regen» in a new trip brings the cold and the rain items (${forecast ? 'forecast already on Kühl and rain' : 'no forecast'})`, async ({ page, context }, info) => {
    const errors = await start(page, context, info, { forecast });
    const dlg = await openNew(page, info);
    const wx = dlg.locator('fieldset.ctx').filter({ hasText: 'Wetter' });
    const chilly = wx.getByRole('button', { name: /^Kühl/ });
    const rain = wx.getByRole('group', { name: 'Regen', exact: true }).getByRole('button', { name: 'Regen', exact: true });
    if (forecast) {
      // The forecast chose «Kühl» and rain already (the case that took both off again).
      await expect(chilly).toHaveAttribute('aria-pressed', 'true');
      await expect(rain).toHaveAttribute('aria-pressed', 'true');
    }
    await tap(chilly, info);
    await tap(rain, info);
    await expect(chilly).toHaveAttribute('aria-pressed', 'true');
    await expect(rain).toHaveAttribute('aria-pressed', 'true');
    await expect(wx.getByRole('button', { name: 'Trocken', exact: true })).toHaveAttribute('aria-pressed', 'false');
    const box = dlg.getByRole('region', { name: 'So wird deine Packliste' });
    await expect(box).not.toContainText('Fürs Wetter: nichts zusätzlich');
    for (const name of ['Langarmtrikot', 'Armlinge', 'Windweste', 'Buff', 'Regenjacke', 'Regenhandschuhe']) await expect(box).toContainText(`test_data_gtp_ ${name}`);
    await expect(box).not.toContainText('test_data_gtp_ Winterhandschuhe'); // below 6 °C: only with «Kalt»
    // «Trocken» takes the rain items off again, the cold ones stay.
    await tap(wx.getByRole('button', { name: 'Trocken', exact: true }), info);
    await expect(box).not.toContainText('test_data_gtp_ Regenjacke');
    await expect(box).toContainText('test_data_gtp_ Langarmtrikot');
    // «Ohne Wetter» takes the whole weather off (also the forecast's); a chip sets it again.
    const none = wx.getByRole('button', { name: 'Ohne Wetter', exact: true });
    await tap(none, info);
    await expect(none).toHaveAttribute('aria-pressed', 'true');
    await expect(chilly).toHaveAttribute('aria-pressed', 'false');
    await expect(box).toContainText('Fürs Wetter: nichts zusätzlich');
    await tap(chilly, info);
    await tap(rain, info);
    await expect(none).toHaveAttribute('aria-pressed', 'false');
    await tap(dlg.getByRole('button', { name: /^Tour erstellen/ }), info);
    await expect(dlg).toBeHidden();
    await expect.poll(async () => (await allTrips(page)).length).toBe(3);
    const made = (await allTrips(page)).find((x) => x.id !== 'test_data_gtp_event' && x.id !== 'test_data_gtp_past');
    expect(made.wx).toEqual({ min: 6, max: 12, rain: 'rain' });
    const ids = made.entries.map((e) => e.itemId);
    for (const id of ['KL03', 'KL04', 'KL07', 'KL10', 'KL05', 'KL12']) expect(ids).toContain(`test_data_gtp_${id}`);
    // The trip page: «Ohne Wetter» in «Ans Wetter angepasst» takes the weather off, Undo brings it back.
    await page.goto('./#/pack');
    const quick = page.locator('.wxq');
    await tap(quick.getByRole('button', { name: 'Ohne Wetter', exact: true }), info);
    await expect(quick.getByRole('button', { name: 'Ohne Wetter', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(async () => (await allTrips(page)).find((x) => x.id === made.id).wx).toEqual({ min: null, max: null, rain: 'none' });
    await expect.poll(async () => (await allTrips(page)).find((x) => x.id === made.id).entries.map((e) => e.itemId)).not.toContain('test_data_gtp_KL05');
    expect(errors).toEqual([]);
  });
}

/** The open menu's box is inside the viewport (8 px edge allowed to be 0). */
async function inside(page, menu) {
  const box = await menu.boundingBox();
  const vw = page.viewportSize();
  expect(box, 'the menu is shown').not.toBeNull();
  expect(box.x, 'not cut off on the left').toBeGreaterThanOrEqual(0);
  expect(box.x + box.width, 'not cut off on the right').toBeLessThanOrEqual(vw.width);
  return box;
}

for (const width of [320, 390]) {
  test(`every ••• menu stays inside the screen at ${width} px`, async ({ page, context }, info) => {
    test.skip(info.project.name !== 'phone', 'phone widths');
    await page.setViewportSize({ width, height: 844 });
    const errors = await start(page, context, info);
    await page.goto('./#/pack');
    await expect(page.locator('.trip-band')).toBeVisible();
    const noSideScroll = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

    // 1. The packing list's •••, also with «Rückgängig» in the toolbar (the case that was cut off).
    const more = page.locator('.list-menu > summary');
    for (const step of ['plain', 'undo']) {
      if (step === 'undo') {
        await tap(page.locator('.wxq').getByRole('button', { name: /^Kühl/ }), info);
        await expect(page.locator('.list-toolbar').getByRole('button', { name: 'Rückgängig' })).toBeVisible();
      }
      await more.scrollIntoViewIfNeeded();
      await tap(more, info);
      const menu = page.locator('.list-menu-content');
      await expect(menu).toBeVisible();
      await inside(page, menu);
      // the ••• sits at the right end of its row (it moved left when «Rückgängig» came)
      const b = await more.boundingBox();
      expect(b.x + b.width).toBeGreaterThan(width - 30);
      expect(await noSideScroll()).toBe(true);
      await tap(more, info);
      await expect(menu).toBeHidden();
    }

    // 2. «In Bearbeitung»: the ••• of the last row near the bottom flips up, inside the screen.
    await tap(page.locator('.trip-band').getByRole('button', { name: /weitere/ }), info);
    const rows = page.getByRole('button', { name: /^Mehr zu / });
    await expect(rows.first()).toBeVisible();
    for (const n of [0, (await rows.count()) - 1]) {
      await tap(rows.nth(n), info);
      const menu = page.getByRole('menu').filter({ visible: true });
      const box = await inside(page, menu);
      expect(box.y + box.height, 'not under the bottom of the screen').toBeLessThanOrEqual(844);
      await page.keyboard.press('Escape');
      await expect(menu).toHaveCount(0);
    }

    // 3. Templates: the ••• of a template row.
    await page.goto('./#/pack/templates');
    const tpl = page.getByRole('button', { name: /^Mehr zu test_data_gtp_/ }).first();
    await tap(tpl, info);
    await inside(page, page.getByRole('menu').filter({ visible: true }));
    expect(await noSideScroll()).toBe(true);
    expect(errors).toEqual([]);
  });
}
