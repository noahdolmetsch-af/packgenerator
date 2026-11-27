// «Position merken» and «Link auf den Abschnitt» (thread «Navigation ohne Sackgassen», Noah 23.11.2026 «ja»):
// 1. after «Zurück» a long page is at the same place again; a step forward (a link) opens at the top.
// 2. an address with ?at=<section> opens with that section in view.
// German UI, no network, an empty app (fictional data only).
import { test, expect } from './clock.js';
import { ready } from './settle.js';

async function open(page, context, hash) {
  await context.route(/^https?:\/\/(?!localhost[:/]|127\.0\.0\.1)/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto(`./${hash}`);
  await ready(page);
}

test('Zurück bringt eine lange Seite an dieselbe Stelle', async ({ page, context }) => {
  await open(page, context, '#/me/look'); // a long page (Darstellung)
  await expect(page.locator('#look-ops')).toBeAttached();
  await page.evaluate(() => window.scrollTo(0, 1400));
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBeGreaterThan(1000);
  const before = await page.evaluate(() => Math.round(window.scrollY));
  await page.waitForTimeout(250);
  // a step forward: a new page opens at the top
  await page.evaluate(() => { location.hash = '#/week'; });
  await expect(page.locator('main')).toContainText(/\S/);
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(0);
  // a step back: the long page is where it was (a phone may differ by a toolbar's height)
  await page.goBack();
  await expect(page).toHaveURL(/#\/me\/look$/);
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY)), { timeout: 6000 }).toBeGreaterThan(before - 120);
  expect(await page.evaluate(() => Math.round(window.scrollY))).toBeLessThan(before + 120);
});

test('ein Link mit ?at= öffnet den Abschnitt und lässt ihn kurz leuchten', async ({ page, context }) => {
  await open(page, context, '#/me/look?at=look-ops');
  const h = page.locator('#look-ops');
  await expect(h).toBeVisible();
  await expect(h).toHaveAttribute('data-spot-on', /at:look-ops/, { timeout: 6000 });
  const box = await h.boundingBox();
  const vh = page.viewportSize().height;
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(vh);
});

test('ohne ?at= bleibt eine Seite am Anfang', async ({ page, context }) => {
  await open(page, context, '#/me/look');
  expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(0);
});

// 27.11.2026 (Noah: «die App lädt von alleine immer wieder neu, mitten in der Arbeit»): after a reload (a new version, or a phone that
// took the app out of memory) the page is at the place where it was; a fresh start from the icon still opens at the top.
test('nach einem Neuladen ist die lange Seite wieder an derselben Stelle', async ({ page, context }) => {
  await open(page, context, '#/me/look');
  await expect(page.locator('#look-ops')).toBeAttached();
  await page.evaluate(() => window.scrollTo(0, 1400));
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBeGreaterThan(1000);
  const before = await page.evaluate(() => Math.round(window.scrollY));
  await page.waitForTimeout(250);
  // the app goes out of sight (the phone may now throw it away): the position is written
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { get: () => 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.reload();
  await ready(page);
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY)), { timeout: 6000 }).toBeGreaterThan(before - 120);
  expect(await page.evaluate(() => Math.round(window.scrollY))).toBeLessThan(before + 120);
});

// Nothing the app does by itself in the background may load the page anew (the page and its place stay): back to the screen,
// network back, a new check for a version.
test('Zurück in die App und Netz zurück laden die sichtbare Seite nicht neu', async ({ page, context }) => {
  await open(page, context, '#/me/look');
  await expect(page.locator('#look-ops')).toBeAttached();
  await page.evaluate(() => {
    window.__stays = 'same page';
    window.scrollTo(0, 900);
  });
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBeGreaterThan(700);
  const before = await page.evaluate(() => Math.round(window.scrollY));
  await page.evaluate(() => {
    for (const hidden of [true, false]) {
      Object.defineProperty(document, 'visibilityState', { get: () => (hidden ? 'hidden' : 'visible'), configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    }
    window.dispatchEvent(new Event('offline'));
    window.dispatchEvent(new Event('online'));
    window.dispatchEvent(new Event('focus'));
  });
  await page.waitForTimeout(4000);
  expect(await page.evaluate(() => window.__stays), 'die Seite wurde nicht neu geladen').toBe('same page');
  expect(Math.abs((await page.evaluate(() => Math.round(window.scrollY))) - before)).toBeLessThan(40);
});
