// «Träume an einem Ort» (Träume und Neuland, Frage 3a): a dream in the Kompass box shows on Träume and
// becomes a dream tour in one tap (Undo brings it back); the Kompass and the travel wishes link to Träume.
// Fictional data only.
import { test, expect } from './clock.js';
import { mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const P = 'test_data_gtp_';
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const SHOTS = process.env.SHOTS_DIR ?? null;
const shot = async (page, info, name) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? '390' : '1440'}.png`, fullPage: true });
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

test('Träume an einem Ort: a compass dream becomes a dream tour, links both ways', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));

  // 1. the compass: a dream in the box «Träume», and the link to Träume
  await page.goto('./#/me/compass');
  await ready(page);
  const box = page.locator('[data-box="dreams"]');
  await box.getByRole('textbox').fill(`${P}Einmal um den Bodensee`);
  await box.getByRole('button', { name: T('Add') }).click();
  await expect(box).toContainText(`${P}Einmal um den Bodensee`);
  await expect(box.locator('[data-compass-dreams-link] a')).toHaveAttribute('href', '#/trips/dreams');

  // 2. Träume › Weitere Träume: the compass dream, one tap makes it a dream tour
  await page.goto('./#/trips/dreams');
  await ready(page);
  const more = page.locator('[data-more-dreams]');
  const row = more.locator('[data-compass-dream]', { hasText: `${P}Einmal um den Bodensee` });
  await expect(row).toBeVisible();
  await expect(more.locator('[data-md-wishes]')).toHaveAttribute('href', '#/me/frei/reise');
  await more.scrollIntoViewIfNeeded();
  await noSideways(page);
  await shot(page, info, 'TO1-weitere-traeume');
  await row.locator('[data-md-move]').click();
  await expect(page.locator('[data-dream]', { hasText: `${P}Einmal um den Bodensee` })).toHaveCount(1);
  await expect(more.locator('[data-compass-dream]')).toHaveCount(0);

  // 3. Undo: back in the compass, gone from the dreams
  await page.getByRole('button', { name: T('Undo') }).click();
  await expect(more.locator('[data-compass-dream]', { hasText: `${P}Einmal um den Bodensee` })).toBeVisible();
  await expect(page.locator('[data-dream]', { hasText: `${P}Einmal um den Bodensee` })).toHaveCount(0);

  // 4. the travel wishes link back
  await more.locator('[data-md-wishes]').click();
  await expect(page.locator('[data-reise-dreams-link] a')).toHaveAttribute('href', '#/trips/dreams');
  expect(errors).toEqual([]);
});
