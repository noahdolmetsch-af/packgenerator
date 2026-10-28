// E8 «Schalter Bewegung» (Noah 27.10.2026 «1a 2a 3a 4a 5a»): Ich › Darstellung › Bedienung › Bewegung sets how much
// the app moves (Voll is the default and sets nothing); «Aus» stops the glide of the notes and stays after a reload.
import { test, expect } from './clock.js';
import NEWS from '../../src/lib/news/bewegung-schalter.js';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en) => DE[en] ?? NEWS.de[en] ?? en;

test('the motion switch: Voll, Ruhig, Aus', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/me/look');
  const row = page.locator('[data-motion-set]');
  await expect(row).toContainText(T('Motion'));
  // the three choices (MOTIONS in src/lib/theme.svelte.js, a runes file the test cannot import)
  for (const k of ['Full|motion', 'Calm|motion', 'Off|motion']) await expect(row.getByRole('button', { name: T(k), exact: true })).toBeVisible();
  await expect(row.getByRole('button', { name: T('Full|motion'), exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('html')).not.toHaveAttribute('data-motion', /.+/);

  await row.getByRole('button', { name: T('Off|motion'), exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
  const dur = await page.evaluate(() => {
    const el = document.createElement('div');
    el.style.transition = 'opacity 2s';
    document.body.append(el);
    const d = getComputedStyle(el).transitionDuration;
    el.remove();
    return d;
  });
  expect(parseFloat(dur)).toBeLessThan(0.01);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');

  await page.locator('[data-motion-set]').getByRole('button', { name: T('Calm|motion'), exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'calm');
  await page.locator('[data-motion-set]').getByRole('button', { name: T('Full|motion'), exact: true }).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-motion', /.+/);
});
