// TR7d–TR7f «Analysen über die Wochen» (Noah 14.10.2026 «TR5–TR7 freigegeben»): under the look back of
// Aktiv › Training › Woche the six week cards (form, load per week, power curve, efficiency, month against
// month, year against year) in German, readable at 390 px; one hidden and back with «Rückgängig», one
// switched in «Analysen anpassen». Fictional activities only (leistung-data.js), nothing leaves the device.
import { test, expect } from '@playwright/test';
import { ready } from './settle.js';
import { seedActivities, zurichToday } from './leistung-data.js';
import DE from '../../src/lib/i18n/de/index.js';
import { ANALYSES } from '../../src/lib/training/analyses.js';

const T = (en) => DE[en] ?? en;
const shot = async (page, info, name) => {
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
};

test('Training › Woche: the analyses over the weeks, hide and undo, switch in «Analysen anpassen»', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.goto('./');
  await ready(page);
  await seedActivities(page);
  await page.goto('./#/flow/training');
  await page.reload();
  await ready(page);

  const sec = page.locator('[data-section="week-analyses"]');
  await expect(sec.getByRole('heading', { name: T('Analyses over the weeks') })).toBeVisible();
  const card = (k) => sec.locator(`[data-ana="${k}"]`);
  // every week card, in the order of «Analysen anpassen», with its German title
  const keys = ANALYSES.week.map((a) => a.key);
  for (const a of ANALYSES.week) await expect(card(a.key).getByRole('heading', { name: T(a.head ?? a.title) })).toBeVisible();
  await expect(sec.locator('[data-ana]')).toHaveCount(keys.length);
  expect(await sec.locator('[data-ana]').evaluateAll((els) => els.map((e) => e.dataset.ana))).toEqual(keys);

  // TR7d form: three lines, the legend with today's numbers, the calm caption
  await expect(card('form').getByRole('img')).toHaveAttribute('aria-label', /^Heute Fitness \d+, Ermüdung \d+, Form [+-]?\d+; 16 Wochen$/);
  await expect(card('form')).toContainText(/Fitness \d+ \(Mittel 42 Tage\)/);
  await expect(card('form')).toContainText(/Ermüdung \d+ \(Mittel 7 Tage\)/);
  await expect(card('form')).toContainText(/Form [+-]?\d+ \(Fitness – Ermüdung\)/);
  await expect(card('form')).toContainText('Form über null = eher ausgeruht');
  await expect(card('form').locator('svg text', { hasText: /^KW \d+$/ })).toHaveCount(4);
  // load per week: 16 weeks, this week lighter
  await expect(card('wload')).toContainText('Hell = diese Woche bis heute.');
  await expect(card('wload').locator('rect.now')).toHaveCount(1);
  // power curve: 90 days against the year
  await expect(card('pcurve')).toContainText('beste der letzten 90 Tage');
  await expect(card('pcurve')).toContainText(`beste ${zurichToday().slice(0, 4)}`);
  await expect(card('pcurve')).toContainText(/20 Min(: \d+ W in 90 Tagen, \d+ W im Jahr \(\w+\)| gleich: \d+ W| fast gleich: \d+ \/ \d+ W)\./);
  // efficiency: calm rides and a trend
  await expect(card('eff').locator('circle').first()).toBeVisible();
  expect(await card('eff').locator('circle').count()).toBeGreaterThanOrEqual(4);
  await expect(card('eff')).toContainText(/Heute \d+[.,]\d\d W pro Schlag|heute \d+[.,]\d\d, im/);
  await expect(card('eff')).toContainText('Nur Fahrten mit Leistungsmesser und Puls.');
  // month against month: last full month against the one before, then another one chosen
  const months = card('month').getByRole('combobox');
  await expect(months).toHaveCount(2);
  for (const r of ['km', 'Hm', 'Stunden', 'Belastung']) await expect(card('month').locator('.rn', { hasText: new RegExp(`^${r}$`) })).toBeVisible();
  const [first, second] = [await months.first().inputValue(), await months.nth(1).inputValue()];
  expect(first > second).toBe(true);
  const other = (await months.first().locator('option').evaluateAll((o) => o.map((x) => x.value))).find((v) => v !== first && v !== second);
  await months.first().selectOption(other);
  await expect(months.first()).toHaveValue(other);
  const short = new Date(`${other}-15T12:00:00Z`).toLocaleDateString('de-CH', { month: 'short', timeZone: 'UTC' });
  await expect(card('month').locator('.row[data-row="km"] small').first()).toHaveText(new RegExp(`^${short} \\d`));
  // year against year: up to the same day
  await expect(card('year')).toContainText('Gleicher Zeitraum: 1. Januar bis heute.');
  await expect(card('year')).toContainText(/\d{4} bis \d+\. \w+/);
  await expect(card('year').locator('.rn', { hasText: /^Aktivitäten$/ })).toBeVisible();
  // German only, no English left over
  expect(await sec.innerText()).not.toMatch(/\b(Wk|Fatigue|Load|Hours|best of|against|Trend from|Same period|days|year)\b/);
  // readable at 390: no page scroll sideways
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await card('form').scrollIntoViewIfNeeded();
  await shot(page, info, 'leistung-woche');

  // hide «Belastung pro Woche» and bring it back with «Rückgängig»
  await card('wload').getByRole('button', { name: `Mehr zu ${T('Load per week')}` }).click();
  await page.getByRole('menuitem', { name: T('Hide|ana') }).click();
  await expect(card('wload')).toHaveCount(0);
  await expect(page.getByText(`«${T('Load per week')}» ausgeblendet`)).toBeVisible();
  await page.getByRole('button', { name: T('Undo') }).click();
  await expect(card('wload')).toBeVisible();

  // «Analysen anpassen» from a card: switch «Effizienz» off and on again
  await card('year').getByRole('button', { name: `Mehr zu ${T('Year against year')}` }).click();
  await page.getByRole('menuitem', { name: T('Adjust analyses') }).click();
  const sheet = page.locator('[data-ana-sheet]');
  await expect(sheet.getByRole('heading', { name: T('Adjust analyses') })).toBeVisible();
  const sw = sheet.locator('[data-ana-switch="eff"]');
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  await expect(card('eff')).toHaveCount(0);
  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  await sheet.getByRole('button', { name: T('Done|ana') }).click();
  await expect(card('eff')).toBeVisible();
  await expect(sec.locator('[data-ana]')).toHaveCount(keys.length);

  expect(errors).toEqual([]);
});

