// TR5/TR5b «Leistung» on one activity (Noah 14.10.2026 «TR5–TR7 freigegeben»): all values from Strava,
// «Leistung», «Zeit in Leistungsbereichen», «Belastung», «Leistungskurve» and the analyses «Mehr aus der
// Leistung», «Leistungsbereiche als Balken», «Trittfrequenz verteilt»; a card hidden and brought back.
// Fictional activities only (leistung-data.js); nothing leaves the preview server.
import { test, expect } from '@playwright/test';
import { ready } from './settle.js';
import { activities, detail, seedActivities, day, P } from './leistung-data.js';
import { ftpEstimate, powerLoad, wkg } from '../../src/lib/training.js';
import { POWER_ZONE_NAMES } from '../../src/lib/training/act/power.js';
import DE from '../../src/lib/i18n/de/index.js';

const shot = async (page, info, name) => {
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
};
const KG = 72;

// what the app should compute from the same fictional data: every power ride's best 20 minutes of the last 90 days
const ACTS = activities();
const recs = ACTS.map((a) => ({ day: a.startLocal.slice(0, 10), w20: a.wDevice ? detail(a.id).w20 : null }));
const FTP = ftpEstimate(recs, day(0));
const MAIN = ACTS[0];
const NO_METER = ACTS.find((a) => !a.wDevice && a.type !== 'Run');

async function start(page, context, { weight = true } = {}) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.goto('./');
  await ready(page);
  await seedActivities(page, { weight: weight ? { entries: [{ day: day(-30), kg: KG }] } : null });
  await page.reload(); // the weight is read once at start (written straight into IndexedDB, Dexie does not see it)
  await ready(page);
}

test('TR5/TR5b: power, load, power curve and the analyses on one activity', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context);
  await page.goto(`./#/flow/training/a/${MAIN.id}`);
  await expect(page.getByRole('heading', { level: 1, name: MAIN.name })).toBeVisible();

  // TR5: every value from Strava; the power values are no longer here with a power meter
  const values = page.locator('[data-section="values"]');
  await expect(values.locator('[data-val="moving"]')).toContainText('1:36');
  await expect(values.locator('[data-val="moving"]')).toContainText('Dauer in Bewegung');
  await expect(values.locator('[data-val="elapsed"]')).toContainText('1:42');
  await expect(values.locator('[data-val="elapsed"]')).toContainText('Zeit verstrichen');
  await expect(values.locator('[data-val="speed"]')).toContainText('26.4 / 58.1');
  await expect(values.locator('[data-val="hr"]')).toContainText('138 / 171');
  await expect(values.locator('[data-val="cad"]')).toContainText('84');
  await expect(values.locator('[data-val="kcal"]')).toContainText('890');
  await expect(values.locator('[data-val="temp"]')).toContainText('14 °C');
  await expect(values.locator('[data-val="pauses"]')).toContainText('2 · 00:00:06:00'); // pauses as dd:hh:mm:ss (Noah 21.10.2026)
  await expect(values.locator('[data-power]')).toHaveCount(0);

  // «Leistung» from the power meter, with W/kg from the weight on this device
  const power = page.locator('[data-section="power"]');
  await expect(page.getByRole('heading', { name: 'Leistung', exact: true })).toBeVisible();
  await expect(power.locator('[data-power="avg"]')).toContainText('188 W');
  await expect(power.locator('[data-power="np"]')).toContainText('211 W');
  await expect(power.locator('[data-power="max"]')).toContainText('612 W');
  await expect(power.locator('[data-power="w20"]')).toContainText('248 W');
  await expect(power.locator('[data-power="wkg"]')).toContainText(wkg(188, KG).toFixed(1));
  await expect(power.locator('[data-power="wkg20"]')).toContainText(wkg(248, KG).toFixed(1));
  await expect(power.locator('[data-power="kj"]')).toContainText(/1.084 kJ/);
  await expect(power.locator('[data-power="ftp"]')).toContainText(`${FTP} W`);
  await expect(power).toContainText('FTP geschätzt = 95 % deiner besten 20 Minuten der letzten 90 Tage. W/kg mit deinem Gewicht aus Ich (bleibt auf diesem Gerät).');

  // the 7 power zones from the FTP
  const pz = page.locator('[data-section="power-zones"]');
  await expect(page.getByText(`aus FTP ${FTP} W`, { exact: true })).toBeVisible();
  await expect(pz.locator('li[data-pzone]')).toHaveCount(7);
  for (const [i, n] of POWER_ZONE_NAMES.entries()) await expect(pz.locator(`li[data-pzone="${i + 1}"]`)).toContainText(`Z${i + 1} ${DE[n]}`);
  await expect(pz.locator('li[data-pzone="1"]')).toContainText(`bis ${Math.round(FTP * 0.55)} W`);

  // «Belastung» two ways and the power curve with the grey best of 90 days
  const load = page.locator('[data-section="load"]');
  await expect(load.locator('[data-load="effort"]')).toContainText('87');
  await expect(load.locator('[data-load="effort"]')).toContainText('Relative Effort (Strava, aus dem Puls)');
  const pl = powerLoad({ wNorm: 211, movingS: 5760 }, FTP);
  await expect(load.locator('[data-load="power"]')).toContainText(String(pl.load));
  await expect(load.locator('[data-load="power"]')).toContainText(`Belastung aus Leistung (NP ÷ FTP ${pl.intensity.toFixed(2)} · 1:36 h)`);
  const curve = page.locator('[data-section="power-curve"] svg');
  await expect(curve).toHaveAttribute('aria-label', 'Leistungskurve: 5 s 584 W, 1 Min 402 W, 5 Min 296 W, 20 Min 248 W, 60 Min 214 W');
  await expect(curve.locator('[data-best]')).toHaveCount(1);
  await expect(curve.locator('circle')).toHaveCount(5);

  // TR5b: the three analyses
  const more = page.locator('[data-ana="more"]');
  await expect(more).toContainText('Mehr aus der Leistung');
  await expect(more.locator('[data-more="wkg"]')).toContainText(`${wkg(188, KG).toFixed(1)} / ${wkg(211, KG).toFixed(1)}`);
  await expect(more.locator('[data-more="kcal"]')).toContainText(/≈ 1.084 kcal/);
  await expect(more.locator('[data-more="if"]')).toContainText(pl.intensity.toFixed(2));
  await expect(more.locator('[data-more="vi"]')).toContainText('1.12');
  await expect(more.locator('[data-more-sentence]')).toContainText('VI 1.12: wechselndes Tempo (1.00 = ganz gleichmässig). Nur zum Anschauen, ohne Wertung.');
  const bars = page.locator('[data-ana="pzbars"]');
  await expect(bars).toContainText('Leistungsbereiche als Balken');
  await expect(bars.locator('[data-pz]')).toHaveCount(7);
  await expect(bars).toContainText(`Minuten pro Leistungsbereich aus FTP ${FTP} W.`);
  const cad = page.locator('[data-ana="cadence"]');
  await expect(cad).toContainText('Trittfrequenz verteilt');
  await expect(cad.locator('[data-cad]')).toHaveCount(9);
  await expect(cad.locator('[data-cad="90"]')).toContainText('30 %');
  await expect(cad).toContainText('Ø 84, meist 80–90.');
  await shot(page, info, 'TR5');

  // hide «Mehr aus der Leistung» and bring it back with «Rückgängig»
  await more.getByRole('button', { name: /Mehr aus der Leistung/ }).click();
  await page.getByRole('menuitem', { name: 'Ausblenden' }).click();
  await expect(more).toHaveCount(0);
  await page.getByRole('button', { name: 'Rückgängig' }).click();
  await expect(more).toBeVisible();

  // hide the cadence and switch it back on in «Analysen anpassen»
  await cad.getByRole('button', { name: /Trittfrequenz verteilt/ }).click();
  await page.getByRole('menuitem', { name: 'Ausblenden' }).click();
  await expect(cad).toHaveCount(0);
  await bars.getByRole('button', { name: /Leistungsbereiche als Balken/ }).click();
  await page.getByRole('menuitem', { name: 'Analysen anpassen' }).click();
  const sheet = page.locator('[data-ana-sheet]');
  await expect(sheet.locator('[data-ana-switch="cadence"]')).toHaveAttribute('aria-checked', 'false');
  await sheet.locator('[data-ana-switch="cadence"]').click();
  await expect(sheet.locator('[data-ana-switch="cadence"]')).toHaveAttribute('aria-checked', 'true');
  await sheet.getByRole('button', { name: 'Fertig' }).click();
  await expect(cad).toBeVisible();

  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  expect(errors).toEqual([]);
});

test('TR5: without weight no W/kg (a link to the weight); without a power meter no power cards', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context, { weight: false });
  await page.goto(`./#/flow/training/a/${MAIN.id}`);
  const power = page.locator('[data-section="power"]');
  await expect(power.locator('[data-power="avg"]')).toContainText('188 W');
  await expect(power.locator('[data-power="wkg"]')).toHaveCount(0);
  await expect(power.locator('[data-power="wkg20"]')).toHaveCount(0);
  // N1 (Noah 20.10.2026, changed on purpose): the weight now lives under «Auswerten › Gewicht»; the label comes from the app
  await expect(power.getByRole('link', { name: DE['Me › My data › Weight'] })).toHaveAttribute('href', '#/me/weight');
  await expect(page.locator('[data-ana="more"] [data-more="wkg"]')).toHaveCount(0);
  await expect(page.locator('[data-ana="more"] [data-more="if"]')).toBeVisible();

  // a ride without a power meter: Strava's values, Relative Effort, the cadence; no power cards
  await page.goto(`./#/flow/training/a/${NO_METER.id}`);
  await expect(page.getByRole('heading', { level: 1, name: NO_METER.name })).toBeVisible();
  await expect(page.locator('[data-section="values"] [data-val="moving"]')).toBeVisible();
  await expect(page.locator('[data-section="power"]')).toHaveCount(0);
  await expect(page.locator('[data-section="power-zones"]')).toHaveCount(0);
  await expect(page.locator('[data-section="power-curve"]')).toHaveCount(0);
  await expect(page.locator('[data-load="effort"]')).toContainText(String(NO_METER.effort));
  await expect(page.locator('[data-load="power"]')).toHaveCount(0);
  await expect(page.locator('[data-ana="more"]')).toHaveCount(0);
  await expect(page.locator('[data-ana="pzbars"]')).toHaveCount(0);
  await expect(page.locator('[data-ana="cadence"]')).toBeVisible();
  expect(NO_METER.name.startsWith(P)).toBe(true);
  expect(errors).toEqual([]);
});
