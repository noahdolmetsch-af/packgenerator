// «Bewegung» (Noah 19.10.2026 «alle 1-3», notes/bewegung-2026-10-19): three moves that explain what happened.
// Stelle 1: a full bag moves on, its row lights up green, the next bag comes up softly; a tick fills the box.
// Stelle 2: a window slides up from below on a phone and grows in on a computer.
// Stelle 3: what a fold reveals fades in under its row.
// Reduced motion: no sliding or growing, only fades and colours. Fictional fixture; nothing leaves the preview server.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';
import { STEP_BAR as BAR } from '../../src/lib/stepbar.js'; // Schrittleiste (Noah 26.10.2026 «1b», changed on purpose): the bar's short names

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));

async function packDay(page, context, info) {
  const file = info.outputPath('bewegung-fixture.json');
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

const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop);

test('Stelle 1: a full bag moves on, its row lights up, the next bag comes up, a tick still counts at once', async ({ page, context }, info) => {
  await packDay(page, context, info);
  const open = page.locator('.pd section.pbag.cur');
  expect(await css(open, 'transitionProperty')).toContain('opacity');
  expect(await css(open, 'transitionDuration')).toContain('0.26s');
  const box = open.locator('button.it .box').first();
  expect(await css(box, 'transitionProperty')).toContain('background-color');
  const first = await open.locator('.bagh b').textContent();
  await open.getByRole('button', { name: T('Whole bag packed') }).click();
  // the finished bag's row in «Taschen» lights up green for a moment
  await expect(page.locator('.pd li.brow.pbag.flash')).toHaveCount(1);
  await expect(page.locator('.pd li.brow.pbag.flash .bt b')).toHaveText(first);
  await expect(page.locator('.pd li.brow.pbag.flash')).toHaveCount(0, { timeout: 3000 });
  // nothing waits for the move: a tick right after the change counts
  await expect(open.locator('.bagh b')).not.toHaveText(first);
  const it = open.locator('button.it').first();
  await it.click();
  await expect(it).toHaveAttribute('aria-pressed', 'true');
});

test('Stelle 2: a window slides up on a phone and grows in on a computer', async ({ page, context }, info) => {
  await packDay(page, context, info);
  // Impeccable round 2 «Packen 2»: while little is packed the main button packs the next bag; «Packen abschliessen»
  // sits quietly at the end of the bags and asks in its window
  const quiet = page.locator('[data-finish-quiet]');
  await ((await quiet.count()) ? quiet : page.locator('.trip-band .mainbar .go')).click();
  const ask = page.locator('dialog.ask');
  await expect(ask).toBeVisible();
  expect(await css(ask, 'animationName')).toBe(info.project.use.isMobile ? 'mv-up' : 'mv-pop');
  // closing is instant: nothing stays over the page
  await ask.getByRole('button', { name: T('Keep packing') }).click();
  await expect(ask).toBeHidden();
});

test('Stelle 3 and reduced motion: a fold fades in; with reduced motion only fades remain', async ({ page }) => {
  await page.goto('./');
  const probe = (sel) =>
    page.evaluate((s) => {
      const d = document.createElement('details');
      d.innerHTML = '<summary>Mehr</summary><p>Inhalt</p>';
      document.body.append(d);
      d.open = true;
      const dlg = document.createElement('dialog');
      dlg.className = 'sheet';
      document.body.append(dlg);
      dlg.showModal();
      const out = { fold: getComputedStyle(d.querySelector('p')).animationName, win: getComputedStyle(dlg).animationName };
      dlg.close();
      d.remove();
      dlg.remove();
      return out[s];
    }, sel);
  expect(await probe('fold')).toBe('mv-reveal');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await probe('fold')).toBe('mv-fade');
  expect(await probe('win')).toBe('mv-fade');
});

test('Reduced motion on Pack: the bag does not move, the green row still shows', async ({ page, context }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await packDay(page, context, info);
  const open = page.locator('.pd section.pbag.cur');
  expect(await css(open, 'transitionDuration')).toBe('0s');
  await open.getByRole('button', { name: T('Whole bag packed') }).click();
  await expect(page.locator('.pd li.brow.pbag.flash')).toHaveCount(1);
});

test('4b: a ticked item slides down to the packed ones, but only a moment after the last tap', async ({ page, context }, info) => {
  await packDay(page, context, info);
  const items = page.locator('.pd section.pbag.cur button.it');
  const name = (await items.first().locator('.nm').textContent()).trim();
  await items.first().click();
  // right after the tap the row stays under the finger
  await expect(items.first()).toHaveAttribute('aria-pressed', 'true');
  // UI-Grundlagen (Noah 20.10.2026, changed on purpose): a packed row adds the word «drin» after its name
  await expect(items.first().locator('.nm')).toContainText(name);
  // a moment later it has moved down below the open items
  await expect(items.last()).toHaveAttribute('aria-pressed', 'true', { timeout: 4000 });
  await expect(items.last().locator('.nm')).toContainText(name);
  await expect(items.first()).toHaveAttribute('aria-pressed', 'false');
});
