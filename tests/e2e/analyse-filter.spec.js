// «Analyse: Filter-Karte nur wo sie wirkt» (Noah 07.11.2026 «3a»): the card «Data from / Period / Show» shows only the
// parts that change something on the tab you are on; «Eigenes Diagramm» and «Vergleiche» have their own periods and show
// a line instead; on a phone the card is one line («30 Tage · 5 Quellen») that opens the choices. No data needed:
// the card does not depend on it. German, phone + desktop.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { D0 } from './aktiv-fixture.js';
import { ready } from './settle.js';
import { SOURCES } from '../../src/lib/analyse.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');
const tab = (page, k) => page.locator(`[data-tab="${k}"]`).click();

test('the filter card shows only what a tab uses; on a phone it is one line', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/auswerten/analyse');
  await ready(page);
  const phone = page.viewportSize().width < 720;
  const toggle = page.locator('[data-filter-toggle]');
  const period = page.locator('#an-period');
  const sources = page.locator('[data-src]');
  const all = page.locator('[data-all]');

  // Überblick: sources and period, not «Also values without data»
  await tab(page, 'ueberblick');
  await expect(page.locator('.pick')).toBeVisible();
  await expect(sources).toHaveCount(SOURCES.length);
  await expect(period).toHaveCount(1);
  await expect(all).toHaveCount(0);
  if (phone) {
    // one line, the choices closed until a tap
    await expect(toggle).toBeVisible();
    await expect(toggle).toContainText(T('{n} sources|analyse').replace('{n}', String(SOURCES.length)));
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(period).toBeHidden();
    const h = (await page.locator('.pick').boundingBox()).height;
    expect(h, 'the closed card is one line').toBeLessThan(80);
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(period).toBeVisible();
    await expect(sources.first()).toBeVisible();
  } else {
    await expect(toggle).toBeHidden();
    await expect(period).toBeVisible();
    await expect(sources.first()).toBeVisible();
  }

  // Alle Werte: all three
  await tab(page, 'werte');
  await expect(sources).toHaveCount(SOURCES.length);
  await expect(all).toHaveCount(1);
  // Rekorde und Serien, Velos: only the period
  for (const k of ['rekorde', 'velos']) {
    await tab(page, k);
    await expect(page.locator('.pick')).toBeVisible();
    await expect(period, k).toHaveCount(1);
    await expect(sources, k).toHaveCount(0);
    await expect(all, k).toHaveCount(0);
    if (phone) await expect(toggle).not.toContainText(T('{n} sources|analyse').replace('{n}', String(SOURCES.length)));
  }
  // Eigenes Diagramm, Vergleiche: no card, one line that says where to choose
  for (const [k, note] of [['diagramm', 'Here you choose the values and the period in the diagram itself.|analyse'], ['vergleiche', 'Here you choose the periods in the cards below.|analyse']]) {
    await tab(page, k);
    await expect(page.locator('.pick'), k).toHaveCount(0);
    await expect(page.locator('[data-filter-note]'), k).toHaveText(T(note));
  }
  // back on Überblick the choice of the period is still the one from before (it lives on the page, not in the card)
  await tab(page, 'ueberblick');
  await expect(page.locator('.pick')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth), 'no sideways scroll').toBeLessThanOrEqual(page.viewportSize().width);
  expect(errors).toEqual([]);
});
