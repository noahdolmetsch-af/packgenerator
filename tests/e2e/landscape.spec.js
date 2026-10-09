// v0.30.1 (Noah's phone test of 0.29.2, D6): a phone turned sideways (844×390, 915×412).
// On the four trip steps (Plan, Pack, On the way, Debrief) the top bar and the dark trip band took
// most of the 390 px, and the steps were hard to reach. Now: a low top bar, a compact band, a small
// bottom bar, nothing cut off, no sideways scroll, and room left for the content.
// LANDSCAPE_SHOTS=<folder> saves a screenshot per page and size there (never into the repo).
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const P = 'test_data_gtp_';
const RAW = readFileSync(fileURLToPath(new URL('./pf-fixture.json', import.meta.url)), 'utf8');
const day = (n = 0) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })}T12:00:00Z`));
const EVENT = `${P}event`;

async function start(page, context, info) {
  const file = info.outputPath('landscape-fixture.json');
  writeFileSync(file, RAW.replace(/"@([+-]\d+)"/g, (m, n) => `"${day(Number(n))}"`));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
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
  await data.getByLabel('Backup importieren').setInputFiles(file);
  await data.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await expect(data.getByText(/importiert.*alle Daten ersetzt/i)).toBeVisible();
  return errors;
}

/** Heights of the bars and the band, and what is left for the page. */
const measure = (page) =>
  page.evaluate(() => {
    const h = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return 0;
      const r = el.getBoundingClientRect();
      return r.height;
    };
    const steps = [...document.querySelectorAll('.trip-band .steps a')].map((a) => {
      const r = a.getBoundingClientRect();
      return { h: r.height, right: r.right, bottom: r.bottom };
    });
    const act = document.querySelector('.trip-band .act');
    const actR = act?.getBoundingClientRect();
    return {
      vw: innerWidth,
      vh: innerHeight,
      wide: document.documentElement.scrollWidth - innerWidth,
      top: h('header.top'),
      bottom: h('nav.bottom'),
      band: h('.trip-band'),
      act: actR && getComputedStyle(act).position === 'fixed' ? actR.height : 0,
      steps,
      bandTop: document.querySelector('.trip-band')?.getBoundingClientRect().top ?? 0,
    };
  });

for (const [w, hgt] of [
  [844, 390],
  [915, 412],
  [667, 375], // a small phone sideways keeps the phone layout (bottom bar)
]) {
  test(`D6: trip steps in landscape ${w}×${hgt}: low bars, compact band, nothing cut off`, async ({ page, context }, info) => {
    test.skip(info.project.name !== 'phone', 'phone only');
    await page.setViewportSize({ width: w, height: hgt });
    const errors = await start(page, context, info);
    // Open the event trip (Plan), then walk the four steps through the band's tabs.
    await page.goto('./#/pack');
    await page.getByLabel('Mehr: andere Tour, Tour bearbeiten, Vorlagen, drucken').click();
    await page.locator('.list-menu-content select').selectOption(EVENT);
    await expect(page.locator('.trip-band h1')).toBeVisible();
    for (const step of ['Plan', 'Packen', 'Unterwegs', 'Rückblick']) {
      await page.locator('.trip-band .steps a').filter({ hasText: step }).first().click();
      await expect(page.locator('.trip-band .steps a[aria-current="page"]')).toContainText(step);
      await expect(page.locator('.trip-band h1')).toBeVisible();
      await page.evaluate(() => window.scrollTo(0, 0));
      const m = await measure(page);
      if (process.env.LANDSCAPE_SHOTS) await page.screenshot({ path: join(process.env.LANDSCAPE_SHOTS, `landscape-${w}x${hgt}-${step}.png`) });
      const where = `${step} ${w}×${hgt}: ${JSON.stringify({ ...m, steps: m.steps.length })}`;
      expect(m.wide, `${where}: no sideways scroll`).toBeLessThanOrEqual(0);
      expect(m.top, `${where}: low top bar`).toBeLessThanOrEqual(52);
      expect(m.bottom, `${where}: small bottom bar`).toBeLessThanOrEqual(52);
      // The band: name, one line of facts and the steps, not half the screen.
      // v0.47.1: on Plan the facts (date, duration, bike, weather) are tappable and may take two short lines.
      expect(m.band, `${where}: compact band`).toBeLessThanOrEqual(step === 'Plan' ? 165 : 150);
      expect(m.bandTop - m.top, `${where}: the band right under the top bar`).toBeLessThanOrEqual(16);
      // Every step tab is whole on screen and big enough for a thumb.
      for (const s of m.steps) {
        expect(s.h, `${where}: step tab 44 px`).toBeGreaterThanOrEqual(44);
        expect(s.right, `${where}: step tab not cut off`).toBeLessThanOrEqual(m.vw);
      }
      // What the fixed bars cover at the top and bottom leaves at least half the screen for the page.
      const covered = m.top + Math.max(m.bottom, 0) + m.act;
      expect(m.vh - covered, `${where}: room for the content`).toBeGreaterThanOrEqual(m.vh * 0.5);
    }
    expect(errors).toEqual([]);
  });
}
