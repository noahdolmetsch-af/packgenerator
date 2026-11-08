// UX-Test 08.11.2026 (Noah «1–5 a», thread «Notfall-Seite und 320-px-Leiste reparieren»): three small repairs.
// 1. Notfall (#/mountain/sos) without a position is no dead end: «Nochmal versuchen» asks anew, «Karte öffnen» leads on.
// 2. An old address under #/flow (a bookmark such as #/flow/tennis) says the page is gone and offers the way on.
// 3. At 320 px the bottom bar writes «Velos und Material» in two whole lines, nothing cut off.
// Empty app, no data; the phone's position is played by a stand-in for navigator.geolocation.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');

/** A stand-in for the phone's GPS: `window.__geo` says what the next watch gets ('denied' or a position). */
async function fakeGeo(context, first) {
  await context.addInitScript((mode) => {
    localStorage.setItem('lang', 'de');
    window.__geo = mode;
    const geo = {
      watchPosition(ok, bad) {
        setTimeout(() => {
          if (window.__geo === 'ok') ok({ coords: { latitude: 46.95108, longitude: 7.43864, altitude: 540, accuracy: 8 }, timestamp: Date.now() });
          else bad({ code: window.__geo === 'timeout' ? 3 : 1 });
        }, 30);
        return 1;
      },
      clearWatch() {},
      getCurrentPosition() {},
    };
    Object.defineProperty(navigator, 'geolocation', { value: geo, configurable: true });
  }, first);
}

test('Notfall without a position: try again and open the map; a second try that works shows the position', async ({ page, context }) => {
  await fakeGeo(context, 'denied');
  await page.goto('./#/mountain/sos');
  const box = page.locator('[data-position]');
  await expect(box).toHaveAttribute('data-position', 'denied');
  // the calls stay on top, whatever the position does
  await expect(page.locator('a[data-call="1414"]').first()).toHaveAttribute('href', 'tel:1414');
  await expect(page.locator('a[data-call="112"]').first()).toHaveAttribute('href', 'tel:112');
  await expect(box).toContainText(T('The position is switched off for this app. Tell the rescue your place name, or look it up on the map.'));
  await expect(box).not.toContainText(T('Still switched off.'));
  await expect(page.locator('[data-sos-map]')).toHaveAttribute('href', '#/mountain/map');
  await expect(page.locator('[data-sos-map]')).toHaveText(T('Open the map'));
  // a try that ends the same way says so
  await page.locator('[data-sos-retry]').click();
  await expect(box).toContainText(T('Still switched off.'));
  await expect(page.locator('[data-sos-retry]')).toBeVisible();
  // the position is allowed now: the next try shows it and the buttons go
  await page.evaluate(() => (window.__geo = 'ok'));
  await page.locator('[data-sos-retry]').click();
  await expect(page.locator('[data-wgs]')).toContainText('46.95108');
  await expect(page.locator('[data-sos-retry]')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('Notfall: a position that did not come in time (no sky) offers the same two ways', async ({ page, context }) => {
  await fakeGeo(context, 'timeout');
  await page.goto('./#/mountain/sos');
  await expect(page.locator('[data-position]')).toHaveAttribute('data-position', 'none');
  await expect(page.locator('[data-sos-retry]')).toBeVisible();
  await expect(page.locator('[data-sos-map]')).toHaveAttribute('href', '#/mountain/map');
});

test('an old address under Aktiv says the page is gone and leads to the sport; Aktiv itself is untouched', async ({ page, context }) => {
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/flow/tennis');
  const gone = page.locator('[data-flow-gone]');
  await expect(gone).toBeVisible();
  await expect(gone.locator('h1')).toHaveText(T('This page is not there any more'));
  await expect(gone.getByRole('link', { name: T('To Tennis') })).toHaveAttribute('href', '#/flow/sport/act%3Atennis');
  await expect(gone.getByRole('link', { name: T('To Active') })).toHaveAttribute('href', '#/flow');
  // an unknown address has no sport to go to: one way, to Aktiv
  await page.goto('./#/flow/gibt-es-nicht');
  await expect(gone.getByRole('link')).toHaveCount(1);
  await expect(gone.getByRole('link', { name: T('To Active') })).toBeVisible();
  // the real pages are not called gone
  for (const h of ['#/flow', '#/flow/', '#/flow/sports', '#/flow/review', '#/flow/training']) {
    await page.goto(`./${h}`);
    await expect(page.locator('main h1').first()).toBeVisible();
    await expect(gone).toHaveCount(0);
  }
});

test('at 320 px the bottom bar shows «Velos und Material» in two whole lines', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'phone', 'the bar sits at the bottom of the phone');
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('./#/flow');
  await expect(page.locator('nav.bottom a')).not.toHaveCount(0);
  const names = await page.locator('nav.bottom .pn').evaluateAll((els) =>
    els.map((el) => ({ text: el.textContent, cut: el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 1, lines: Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight || '14')) })),
  );
  expect(names.map((n) => n.text)).toContain(T('Bikes and gear|place'));
  for (const n of names) {
    expect(n.cut, `«${n.text}» is cut off`).toBe(false);
    expect(n.lines, `«${n.text}» has more than two lines`).toBeLessThanOrEqual(2);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
