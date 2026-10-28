// «Neuer Schwung» Packen 2 (block B6, Noah 27.10.2026 «1a 2a 3a» page by page with motion, «ok Packen»): on a phone
// a row swiped to the right is ticked like a tap; an up or down move scrolls and ticks nothing; the tap stays.
// Fictional fixture; nothing leaves the preview server.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';
import { STEP_BAR as BAR } from '../../src/lib/stepbar.js'; // the step bar's short names (Kurze Schritte)

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));

async function packDay(page, context, info) {
  const file = info.outputPath('wischen-fixture.json');
  writeFileSync(file, JSON.stringify(base));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  const panel = await openData(page);
  await panel.getByLabel(T('Import backup')).setInputFiles(file);
  await panel.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  await expect(panel.getByText(/importiert/)).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event('pg:dayride')));
  await expect(page.locator('.made-card')).toBeVisible();
  await page.locator('.trip-band nav a').filter({ hasText: T(BAR.pack) }).click();
  await expect(page.locator('.pd .pbag.cur')).toBeVisible();
}

// a finger on the row: down, a few moves, up (touch pointer events, as a phone sends them)
async function swipe(page, sel, dx, dy) {
  await page.evaluate(({ sel, dx, dy }) => {
    const el = document.querySelector(sel);
    const r = el.getBoundingClientRect();
    const x0 = r.left + 20;
    const y0 = r.top + r.height / 2;
    const ev = (type, x, y) => el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 7, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y }));
    ev('pointerdown', x0, y0);
    for (let i = 1; i <= 6; i++) ev('pointermove', x0 + (dx * i) / 6, y0 + (dy * i) / 6);
    ev('pointerup', x0 + dx, y0 + dy);
  }, { sel, dx, dy });
}

test('Packen: swipe a row to the right ticks it, up or down does not, the tap stays', async ({ page, context }, info) => {
  await packDay(page, context, info);
  const phone = info.project.name === 'phone';
  const hint = page.locator('.pd section.pbag.cur [data-swipe-hint]');
  await expect(hint).toHaveCount(phone ? 1 : 0);
  if (phone) await expect(hint).toHaveText(T('or swipe a row to the right'));
  // the ring of this bag, found by its name (a full bag moves on to the next one)
  const name = (await page.locator('.pd section.pbag.cur .bagh b').textContent()).trim();
  const ring = page.locator('.pd ul.blist > li.brow').filter({ hasText: name }).locator('[data-bag-ring] .rn');
  const [done, of] = (await ring.textContent()).trim().split('/').map(Number);
  const row = '.pd section.pbag.cur ul.items button.it[aria-pressed="false"]';
  // up or down: nothing is ticked
  await swipe(page, row, 4, 120);
  await expect(ring).toHaveText(`${done}/${of}`);
  // to the right, far enough: ticked like a tap
  await swipe(page, row, 160, 6);
  await expect(ring).toHaveText(`${done + 1}/${of}`);
  // a short swipe does not count
  await swipe(page, row, 30, 0);
  await expect(ring).toHaveText(`${done + 1}/${of}`);
  // the tap stays
  await page.locator(row).first().click();
  await expect(ring).toHaveText(done + 2 === of ? /.*/ : `${done + 2}/${of}`);
  if (done + 2 === of) await expect(ring.locator('svg')).toHaveCount(1); // full: the ring shows a tick
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});
