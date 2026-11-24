// «Fast geschafft» (Noah 01.11.2026 «4a»): after a tick a line says how close the next star is. Fictional data only; the clock
// stands on Friday 9 October 2026 (aktiv-fixture.js). SHOTS=<folder> saves pictures.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, TODAY, addDays, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
async function shot(page, info, name) {
  if (!process.env.SHOTS) return;
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png` });
}

test('after a tick a line says how close the next star is', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow');
  await ready(page);
  // three runs before: the next tick is the 4th, one before the 5th = star 1 of «Mal gemacht»
  await put(page, { flowLog: [1, 2, 3].map((i) => ({ id: `test_run_${i}`, actId: 'run', day: addDays(TODAY, -i), at: `${addDays(TODAY, -i)}T18:00:00+02:00`, n: 1 })) });
  await page.goto('./#/flow');
  await page.reload();
  await ready(page);
  await page.locator('section[aria-labelledby="tick-h"]').locator('[data-act="run"]').click();
  const hint = page.locator('[data-toast-hint]');
  await expect(hint).toBeVisible();
  await expect(hint).toContainText(T('Only {n}× to star {k} · {name}', { n: '1', k: '1', name: '' }).split('«')[0].trim());
  await expect(page.locator('dialog[data-star-window]')).toBeHidden();
  await shot(page, info, 'fast-geschafft');
  expect(errors).toEqual([]);
});

test('no line when no star is close', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await page.clock.install({ time: new Date(D0) });
  await page.goto('./#/flow');
  await ready(page);
  // the first tick of a week always brings «Weeks in a row» within reach (1 of 2): switch that one off, so no star is close
  await put(page, { settings: [{ key: 'flow.msTune', value: { 'run.weeks': { off: true } } }] });
  await page.reload();
  await ready(page);
  await page.locator('section[aria-labelledby="tick-h"]').locator('[data-act="run"]').click();
  // no star is close: the tick goes straight to the page «Geschafft» and the note with its line is gone (TickGrid)
  await expect(page).toHaveURL(/#\/flow\/geschafft/);
  await expect(page.locator('[data-toast-hint]')).toHaveCount(0);
  await expect(page.locator('.ftoast')).toHaveCount(0);
});
