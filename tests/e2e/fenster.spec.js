// Windows on Heute (Noah 19.10.2026 «1a 3a»): the evening before a trip comes as its own window («Packen»),
// Sunday from 18:00 the Wochenrückblick. Each with «Später» (back in one hour), «Heute nicht» (until tomorrow)
// and its main button. The trip card stays on Heute. Phone 390 and desktop 1440, German, fictional data
// (home0460-fixture.js: Friday 9 October 2026, the trip «Herbstrunde» starts on Saturday).
// SHOTS=<folder> saves screenshots (light).
import { test, expect } from '@playwright/test';
import { openHome, D0 } from './home0460-fixture.js';

async function shot(page, info, name) {
  if (!process.env.SHOTS) return;
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png` });
}
const at = async (page, stamp) => {
  await page.clock.setFixedTime(new Date(`${stamp}:00+02:00`));
  await page.reload();
};

test('the evening before a trip: a window with Pack now, Later for one hour, Not today until tomorrow', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info, { hour: 16 });
  const win = page.locator('dialog[data-window]');
  // before 17:00 nothing
  await expect(page.locator('[data-section="greeting"]')).toBeVisible();
  await expect(win).toHaveCount(0);

  await at(page, `${D0}T18:00`);
  await expect(win).toHaveJSProperty('open', true);
  await expect(win).toHaveAttribute('data-window', 'eve');
  // UI-Ziele I1 / #16 (changed on purpose): the heading asks «Bereit für morgen?», the trip stands right under it
  await expect(win.getByRole('heading', { name: T('Ready for tomorrow?') })).toBeVisible();
  await expect(win.locator('.vd-sub')).toContainText('Herbstrunde');
  await expect(win.locator('[data-window-packed]')).toBeVisible();
  await shot(page, info, 'fenster-vorabend');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);

  // «Später»: away, the trip card stays on Heute; back after one hour
  await win.locator('[data-window-later]').click();
  await expect(win).toBeHidden();
  await expect(page.locator('[data-tile="trip"]').first()).toBeVisible();
  await at(page, `${D0}T18:30`);
  await expect(page.locator('[data-section="greeting"]')).toBeVisible();
  await expect(win).toBeHidden();
  await at(page, `${D0}T19:01`);
  await expect(win).toHaveJSProperty('open', true);

  // «Heute nicht»: away until tomorrow, also after a reload
  await win.locator('[data-window-today]').click();
  await expect(win).toHaveCount(0);
  await at(page, `${D0}T21:00`);
  await expect(page.locator('[data-section="greeting"]')).toBeVisible();
  await expect(win).toHaveCount(0);
  expect(T('Pack now')).toBe('Jetzt packen');
  expect(errors).toEqual([]);
});

test('the evening before a trip: Ready for tomorrow, Pack now opens the packing of that trip', async ({ page, context }, info) => {
  const T = await openHome(page, context, info, { hour: 18 });
  const win = page.locator('dialog[data-window="eve"]');
  await expect(win).toHaveJSProperty('open', true);
  // UI-Ziele I1 / #16 (Noah 20.10.2026 «freigabe»): «Bereit für morgen?» gathers the steps of tomorrow, each with its way
  await expect(win.getByRole('heading', { name: T('Ready for tomorrow?') })).toBeVisible();
  await expect(win.locator('[data-hint="charge"] a')).toHaveAttribute('href', '#/pack?charge');
  expect(await win.locator('[data-hint]').count()).toBeLessThanOrEqual(3);
  await win.locator('[data-window-go]').click();
  await expect(page).toHaveURL(/#\/pack$/);
  await expect(page.getByText(/Herbstrunde/).first()).toBeVisible();
});

test('Sunday from 18:00: the Wochenrueckblick as a window, its button opens the review', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { hour: 9 });
  await at(page, '2026-10-11T17:30'); // a Sunday, before 18:00
  await expect(page.locator('[data-section="greeting"]')).toBeVisible();
  await expect(page.locator('dialog[data-window]')).toHaveCount(0);
  await at(page, '2026-10-11T18:10');
  const win = page.locator('dialog[data-window="week"]');
  // Paket C: never two windows at once. When the Tages-Check window is open (questions due), it comes first and the
  // Wochenrückblick waits until it is closed.
  const check = page.locator('dialog[data-section="abfragen"][open]');
  await expect(check.or(win)).toBeVisible();
  if (await check.count()) {
    await expect(page.locator('dialog[data-window]')).toHaveCount(0);
    await check.locator('[data-ab-today]').click();
    await expect(check).toHaveCount(0);
  }
  await expect(win).toHaveJSProperty('open', true);
  await shot(page, info, 'fenster-wochenrueckblick');
  await win.locator('[data-window-go]').click();
  await expect(page).toHaveURL(/#\/flow\/review$/);
  // opened once: not again today
  await page.goto('./#/');
  await expect(page.locator('[data-section="greeting"]')).toBeVisible();
  await expect(page.locator('dialog[data-window]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
