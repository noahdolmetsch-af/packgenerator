// «Diagramme zum Antippen» + «Genaue Werte» (Noah 27.10.2026 «1-5 a»): the charts of «Haken ausgewertet»
// have a labelled axis, show the exact numbers of the week or day you point at, open a window with what is
// behind a bar (prev/next inside it), and show the same numbers «Als Tabelle». German, 390 px and computer.
// Fixed clock, fictional ticks only (aktiv-fixture.js).
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, aktivRows, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};

/** Click column i of n of a chart's plot, in its middle. */
async function tapColumn(page, plot, i, n) {
  await plot.scrollIntoViewIfNeeded();
  const b = await plot.boundingBox();
  await page.mouse.click(b.x + ((i + 0.5) / n) * b.width, b.y + b.height * 0.8);
}

test('Haken ausgewertet: axis, exact numbers, a window behind every bar, as a table', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow');
  await ready(page);
  await put(page, aktivRows());
  await page.goto('./#/flow/auswertung');
  await page.reload();
  await ready(page);

  const weeks = page.locator('[data-chart="tkweeks"]');
  await expect(weeks).toBeVisible();

  // a value axis with at least three round, labelled steps; the newest week in the line above the chart
  const ticks = weeks.locator('[data-yticks] span');
  expect(await ticks.count()).toBeGreaterThanOrEqual(3);
  await expect(ticks.first()).toHaveText('0');
  await expect(weeks.locator('[data-readout]')).toContainText(T('Week from {d}', { d: '' }).trim());

  // a tap on the second-last week opens its window with its seven days
  const plot = weeks.locator('[data-plot]');
  const n = Number(await plot.getAttribute('data-n'));
  await tapColumn(page, plot, n - 2, n);
  const sheet = page.locator('[data-chart-sheet]');
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('[data-sheet-day]')).toHaveCount(7);
  const first = await sheet.locator('h2').textContent();
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/diagramme-woche-${info.project.name === 'phone' ? 390 : 1440}.png` });

  // «Nächste Woche» walks on inside the window, ✕ closes it
  await sheet.getByRole('button', { name: T('Next week') }).click();
  await expect(sheet.locator('h2')).not.toHaveText(first);
  await expect(sheet.getByRole('button', { name: T('Next week') })).toBeDisabled();
  await sheet.getByRole('button', { name: T('Close') }).click();
  await expect(sheet).toHaveCount(0);

  // «Als Tabelle»: the same weeks as rows, newest first
  await weeks.getByRole('button', { name: T('As table') }).click();
  const table = weeks.locator('[data-chart-table]');
  await expect(table).toBeVisible();
  expect(await table.locator('tbody tr').count()).toBeGreaterThan(5);
  await weeks.getByRole('button', { name: T('Chart|table') }).click();
  await expect(weeks.locator('[data-plot]')).toBeVisible();

  // weekdays: a tap on Monday names the activities behind the bar
  const days = page.locator('[data-chart="tkdays"]');
  await expect(days.locator('[data-yticks] span').last()).toContainText('%');
  await tapColumn(page, days.locator('[data-plot]'), 0, 7);
  await expect(sheet.locator('h2')).toHaveText(new Date(Date.UTC(2026, 9, 5, 12)).toLocaleDateString('de-CH', { weekday: 'long', timeZone: 'UTC' }));
  expect(await sheet.locator('[data-sheet-acts] li').count()).toBeGreaterThan(0);
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);

  // the course by keyboard: ← chooses the day before today, Enter opens it
  const line = page.locator('[data-chart="tkline"] [data-plot]');
  await line.focus();
  await page.keyboard.press('End');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Enter');
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('[data-sheet-n]')).toBeVisible();
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/diagramme-tag-${info.project.name === 'phone' ? 390 : 1440}.png` });
  await sheet.getByRole('button', { name: T('Close') }).click();

  if (process.env.SHOTS) await page.locator('[data-section="analyses"]').screenshot({ path: `${process.env.SHOTS}/diagramme-karten-${info.project.name === 'phone' ? 390 : 1440}.png` });

  // the page never scrolls sideways
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});
