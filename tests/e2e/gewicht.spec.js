// TR6/TR6b «Gewicht» (Noah 14.10.2026 «TR5–TR7 freigegeben»): Ich › Meine Daten › Gewicht. Enter a
// weight, see the weight over time with a 7-day mean and watts per kg over the weeks, hide a chart and
// bring it back. Fictional activities and weights only; nothing leaves the device (all outside blocked).
import { test, expect } from '@playwright/test';
import { viaTab } from './placetab.js'; // UI-Ziele #6: the pages that were rows under Ich are tabs now
import { ready } from './settle.js';
import { day, seedActivities } from './leistung-data.js';

const shot = async (page, info, name) => {
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
};
// a weight every 4 days over 12 weeks, slowly from 73 to 71.4 kg (made up)
const WEIGHT = { entries: Array.from({ length: 21 }, (_, i) => ({ day: day(-84 + i * 4), kg: Math.round((73 - i * 0.08 + (i % 3 === 0 ? 0.3 : 0)) * 10) / 10 })) };

test('Gewicht: enter, the two charts, hide one and bring it back', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.goto('./');
  await ready(page);

  // UI-Ziele #6 (was Ich › Meine Daten): Auswerten › Gewicht
  await viaTab(page, 'active', '#/me/weight');
  await expect(page.getByRole('heading', { level: 1, name: 'Gewicht' })).toBeVisible();
  await expect(page.getByText('Ab dem zweiten Eintrag', { exact: false }).or(page.getByText('Trag dein Gewicht einmal ein'))).toBeVisible();

  // the first entry: a wrong number says so, a right one is kept (with «Rückgängig»)
  await page.locator('[data-weight-add]').click();
  const sheet = page.locator('[data-weight-sheet]');
  await expect(sheet).toBeVisible();
  await sheet.locator('[data-weight-kg]').fill('7');
  await sheet.getByRole('button', { name: 'Speichern' }).click();
  await expect(sheet.getByRole('alert')).toContainText('zwischen 30 und 250 kg');
  await sheet.locator('[data-weight-kg]').fill('71,6');
  await sheet.getByRole('button', { name: 'Speichern' }).click();
  await expect(sheet).toBeHidden();
  await expect(page.getByText('71.6 kg für den', { exact: false })).toBeVisible();
  await expect(page.locator('.pagehead')).toContainText('71.6 kg');

  // with the fictional rides and weights: both charts
  await seedActivities(page, { weight: { entries: [...WEIGHT.entries, { day: day(0), kg: 71.6 }] } });
  await page.reload();
  await ready(page);
  const wt = page.locator('[data-ana="wtime"]');
  const wk = page.locator('[data-ana="wkgtime"]');
  await expect(wt.getByRole('heading', { name: 'Gewicht über die Zeit' })).toBeVisible();
  await expect(wt).toContainText('Kein Ziel, keine Bewertung');
  await expect(wk.getByRole('heading', { name: 'Watt pro kg über die Zeit' })).toBeVisible();
  await expect(wk).toContainText(/Heute \d+ W ÷ 71.6 kg = \d\.\d\d W\/kg/);
  await expect(wk.locator('svg path')).toHaveCount(1);
  await shot(page, info, 'TR6b-gewicht');

  // «…» › Ausblenden, then «Rückgängig»; then off and on in «Analysen anpassen»
  await wt.getByRole('button', { name: /Mehr zu/ }).click();
  await page.getByRole('menuitem', { name: 'Ausblenden' }).click();
  await expect(wt).toHaveCount(0);
  await page.getByRole('button', { name: 'Rückgängig' }).click();
  await expect(wt).toBeVisible();
  await page.locator('[data-ana-adjust]').click();
  const ana = page.locator('[data-ana-sheet]');
  await expect(ana.getByText('Watt pro kg über die Zeit')).toBeVisible();
  await ana.locator('[data-ana-switch="wkgtime"]').click();
  await expect(wk).toHaveCount(0);
  await ana.locator('[data-ana-switch="wkgtime"]').click();
  await ana.getByRole('button', { name: 'Fertig' }).click();
  await expect(wk).toBeVisible();

  // change an entry and remove it again
  await page.locator(`[data-weight-day="${day(0)}"]`).click();
  await expect(sheet.locator('[data-weight-kg]')).toHaveValue('71.6');
  await sheet.getByRole('button', { name: 'Entfernen' }).click();
  await expect(page.locator(`[data-weight-day="${day(0)}"]`)).toHaveCount(0);

  // nothing about the weight went anywhere: no request left the device (all outside is blocked and the page has no errors)
  expect(errors).toEqual([]);
});
