// Nachtträume (Noah 04./05.11.2026): the morning question about the night; its sentence is also an entry of the Tagebuch with the tag «Traum».
// On a phone and a computer, in German, with a fixed clock in Europe/Zurich. Fictional data only. SHOTS=<folder> saves full-page screenshots.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';
import { flowSeeded, putWall } from './wall-fixture.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const DAY = '2026-10-15';

async function shot(page, name) {
  if (!process.env.SHOTS) return;
  const w = page.viewportSize().width;
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${w <= 500 ? 390 : 1440}.png`, fullPage: true });
}

test('Nachtraeume: the morning question, its sentence lands in the Tagebuch with the tag Traum', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(`${DAY}T07:52:00+02:00`) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/');
  await ready(page);
  await flowSeeded(page);
  await putWall(page);
  await ready(page);

  await page.goto('./#/check/morning');
  await ready(page);
  const rq = page.locator('[data-round-questions="morning"]');
  const q = rq.locator('[data-q="erholung.traum"]');
  await expect(q).toContainText(T('What did you dream last night?'));
  await q.getByRole('button', { name: T('nice|dream') }).click();
  await q.getByRole('button', { name: T('exciting|dream') }).click();
  await q.getByRole('textbox').fill('Ich bin mit dem Velo über einen Pass geflogen.');
  await expect(q.getByRole('button', { name: T('nice|dream') })).toHaveAttribute('aria-pressed', 'true');
  await shot(page, 'nachtraeume-frage');
  // saved at once (a moment after the last tap), kept after a reload
  await page.waitForTimeout(900);
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-q="erholung.traum"]').getByRole('textbox')).toHaveValue('Ich bin mit dem Velo über einen Pass geflogen.');
  await expect(page.locator('[data-q="erholung.traum"]').getByRole('button', { name: T('exciting|dream') })).toHaveAttribute('aria-pressed', 'true');

  // the Tagebuch holds the sentence with the tag «Traum»
  await page.goto('./#/tagebuch');
  await ready(page);
  await expect(page.getByText('Ich bin mit dem Velo über einen Pass geflogen.').first()).toBeVisible();
  await expect(page.getByRole('button', { name: '#Traum' }).first()).toBeVisible();
  await shot(page, 'nachtraeume-tagebuch');
  expect(errors).toEqual([]);
});
