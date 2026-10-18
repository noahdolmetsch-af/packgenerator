// WS6 «Wieder sichtbar» (Noah 14.10.2026 «1a 2b 3a ws1-ws7 freigeben», 3a): under the rings on Aktiv a
// fold «Was zur Erholung zählt» opens the activities of the ring Erholung with «zuletzt am» and the
// minutes; a link leads to Ziele. Closed at first. Fictional data only, the clock on Friday 9 October 2026.
// SHOTS=<folder> saves the screenshots (1440 and 390, light).
import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, TODAY, addDays, aktivRows, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};

test('WS6: under the rings, what counts for recovery opens with the last time', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow');
  await ready(page);
  const rows = aktivRows();
  // Sauna (the seed's activity of the ring Erholung): last on Tuesday 6 October, 30 min
  rows.flowLog.push({ id: 'test_sauna_1', actId: 'sauna', day: addDays(TODAY, -3), at: `${addDays(TODAY, -3)}T19:00:00+02:00`, min: 30 });
  await put(page, rows);
  await page.reload();
  await ready(page);

  const fold = page.locator('.ringc details[data-rest]');
  await expect(fold).toBeVisible();
  await expect(fold).not.toHaveAttribute('open', '');
  await expect(fold.locator('summary')).toContainText('Was zur Erholung zählt');
  await fold.locator('summary').click();
  await expect(fold).toHaveAttribute('open', '');
  const sauna = fold.locator('li').filter({ hasText: 'Sauna' });
  await expect(sauna).toContainText(T('last {date}', { date: 'Di., 6. Okt.' }));
  await expect(sauna).toContainText(T('{n} min', { n: 30 }));
  await fold.scrollIntoViewIfNeeded();
  if (process.env.SHOTS) {
    mkdirSync(process.env.SHOTS, { recursive: true });
    await page.screenshot({ path: `${process.env.SHOTS}/WS6-erholung-${info.project.name === 'phone' ? 390 : 1440}.png` });
  }
  await fold.getByRole('link', { name: T('Change in Goals') }).click();
  await expect(page).toHaveURL(/#\/flow\/goals/);
  expect(errors).toEqual([]);
});
