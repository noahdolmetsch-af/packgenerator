// Gesamttest Runde 2, C3 und C6 (Noah 25.11.2026 «Alle B und C weitergeben»): at 320 px «Vergleiche» in Auswerten › Analyse broke in the
// middle of the word («Vergleich / e»), the label «Auswerten» of the bottom bar ended in «Auswert…», and long names in the lists of Analyse
// were cut without «…». German UI, fictional days, the clock on Friday 9 October 2026.
import { test, expect } from '@playwright/test';
import { D0, TODAY, addDays, put } from './aktiv-fixture.js';
import { cutOff, brokenWords } from './gesamttest/lib.js';
import { ready } from './settle.js';

function rows() {
  const healthDays = [];
  for (let i = 0; i < 40; i++) {
    const date = addDays(TODAY, -i);
    healthDays.push({ date, azm: 20 + (i % 5) * 5, restingHr: 50 + (i % 3), hrvMs: 45 + (i % 4), steps: 9000, sleep: { asleepMin: 430, deepMin: 70, remMin: 90, lightMin: 230, awakeMin: 25, start: '23:05', end: '06:55', efficiency: 90 }, spo2: 96, breath: 14, kcal: 2300, kcalActive: 600, hrMax: 150, src: 'google', at: `${date}T08:00:00Z` });
  }
  const act = (id, day, name) => ({
    id: `test_data_${id}`, day, time: '07:10', start: `${day}T05:10:00Z`, name, type: 'Ride', kind: 'bike', km: 42, hm: 400, movingS: 5400, elapsedS: 5700, gearId: null,
    hrAvg: 135, hrMax: 160, commute: false, trainer: false, wAvg: null, wMax: null, wDevice: false, spdAvg: null, spdMax: null, cad: 84, hist: { 120: 2700, 150: 2700 },
    tempAvg: 8, wNorm: null, kj: null, effort: 80, line: null, workout: null, prs: 0, achv: 0, elevHigh: null, elevLow: null, kcal: 900,
  });
  const activities = [act('lang1', TODAY, 'Morgenrunde um den See mit sehr langem Namen für die Prüfung'), act('lang2', addDays(TODAY, -3), 'Gravel über den Pass und zurück mit Pause am Gipfelkreuz')];
  return { healthDays, activities, trips: [], flowChecks: [{ day: TODAY, sleep: 8, energy: 9, mood: 7 }], flowLog: [] };
}

test('at 320 and 390 px: chips, tabs and long names keep every word whole, the bottom bar names every place', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'phone', 'a phone width');
  test.setTimeout(120_000);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('./#/flow');
  await ready(page);
  await put(page, rows());
  for (const w of [320, 390]) for (const [hash, what0] of [['#/auswerten/analyse', 'Analyse'], ['#/auswerten/analyse/km%3Abike', 'Analyse, Wert'], ['#/auswerten', 'Auswerten'], ['#/flow/stats/hr', 'Koerperwerte Herz'], ['#/flow/stats/sleep', 'Koerperwerte Schlaf'], ['#/flow/stats/body', 'Koerperwerte Koerper'], ['#/trips/rides', 'Fahrten'], ['#/flow/training', 'Training']]) {
    const what = `${what0} ${w}`;
    await page.setViewportSize({ width: w, height: 568 });
    await page.goto(`./${hash}`);
    await page.reload();
    await ready(page);
    await expect(page.locator('main h1').first()).toBeVisible();
    // the width of the text itself against its box (scrollWidth is rounded and let «Auswert…» pass by a hair)
    const bar = await page.evaluate(() => [...document.querySelectorAll('nav.bottom .pn')].filter((e) => {
      const r = document.createRange();
      r.selectNodeContents(e);
      return r.getBoundingClientRect().width > e.getBoundingClientRect().width + 0.1 || e.scrollHeight > e.clientHeight + 1;
    }).map((e) => e.textContent.trim()));
    expect.soft(await brokenWords(page), `${what}: no word broken inside`).toEqual([]);
    expect.soft(await cutOff(page), `${what}: nothing cut off without «…» or a full text`).toEqual([]);
    expect.soft(bar, `${what}: the bottom bar labels are whole`).toEqual([]);
  }
});
