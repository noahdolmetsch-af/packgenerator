// TR7a/TR7b/TR7f «Analysen auf der Aktivität» (Noah 14.10.2026 «TR5–TR7 freigegeben»): Anstiege,
// Abschnitte (tap shows the section in Verlauf), Verlauf with its tooltip, Puls mal Leistung, the two
// halves, similar rides (a dot opens that ride) and best values, in German, on the fictional ride 3001;
// «Mehr Inhalt» T2 hard pieces (a tap shades the piece in Verlauf) and T5 the home loop over time.
// Hiding via «…» › Ausblenden with Rückgängig, and a switch in «Analysen anpassen». Fictional data only;
// everything outside the preview server is blocked.
import { test, expect } from '@playwright/test';
import { ready } from './settle.js';
import { P, GEAR, ZONES, day, routeStrava, seedActivities, activities, detail } from './leistung-data.js';
import { ftpEstimate } from '../../src/lib/training.js';
import { ANALYSES } from '../../src/lib/training/analyses.js';
import { hardPieces, piecesSummary } from '../../src/lib/training/inhalt/inhalt-fahrt.js';

// «Mehr Inhalt» T2: what the app should find on the main ride, from the same fictional data and the app's own rules
const FTP = ftpEstimate(activities().map((a) => ({ day: a.startLocal.slice(0, 10), w20: a.wDevice ? detail(a.id).w20 : null })), day(0));
const PIECES = hardPieces(detail('3001').prof, FTP);
const SUM = piecesSummary(PIECES, FTP, detail('3001').prof.breaks);

const shot = async (page, info, name) => {
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
};

async function open(page, context, baseURL) {
  await routeStrava(context, { log: [], app: baseURL });
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.goto('./');
  await ready(page);
  await seedActivities(page, { weight: { entries: [{ day: day(-30), kg: 72 }] } });
  // the bike's name and the heart rate zones as a fetch would have stored them
  await page.evaluate(
    ({ gear, zones }) =>
      new Promise((ok, bad) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const tx = r.result.transaction('settings', 'readwrite');
          tx.objectStore('settings').put({ key: 'strava', value: { gear, lastSync: new Date().toISOString() } });
          tx.objectStore('settings').put({ key: 'strava.zones', value: { hr: zones, at: new Date().toISOString() } });
          tx.oncomplete = () => (r.result.close(), ok());
          tx.onerror = () => bad(tx.error);
        };
      }),
    { gear: GEAR, zones: ZONES },
  );
  await page.goto('./#/flow/training/a/3001');
  await page.reload();
  await ready(page);
  await expect(page.getByRole('heading', { level: 1, name: `${P}Abendrunde Hügel` })).toBeVisible();
}

test('Analysen auf der Aktivität: Anstiege, Abschnitte, Verlauf, Puls mal Leistung, Hälften, ähnliche Fahrten, Bestwerte', async ({ page, context, baseURL }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, context, baseURL);
  const card = (k) => page.locator(`[data-ana="${k}"]`);
  // every analysis of the activity is on, counted from the app's own list
  await expect(page.locator('[data-section="analyses"] .anh .num')).toContainText(`${ANALYSES.act.length} von ${ANALYSES.act.length} ·`);

  // TR7f: the climbs of this ride with VAM
  const climbs = card('climbs');
  await expect(climbs.getByRole('heading', { name: 'Anstiege' })).toBeVisible();
  await expect(climbs).toContainText('VAM pro Anstieg');
  await expect(climbs.getByRole('row')).toHaveCount(4);
  await expect(climbs.getByRole('rowheader', { name: `${P}Pass von Unterdorf` })).toBeVisible();
  await expect(climbs.getByRole('row').nth(1)).toContainText('18:42');
  await expect(climbs.getByRole('row').nth(1)).toContainText('1’046');
  await expect(climbs).toContainText('VAM = Höhenmeter pro Stunde im Anstieg. Aus den Strava-Segmenten dieser Fahrt mit Steigung über 3 %.');

  // TR7a: sections per 5 km, the two climbs tinted with «Anstieg»
  const sec = card('sections');
  await expect(sec.getByRole('heading', { name: 'Abschnitte' })).toBeVisible();
  await expect(sec).toContainText('je 5 km');
  await expect(sec.getByRole('columnheader')).toHaveText(['km', 'Zeit', 'km/h', 'Hm', 'Ø Puls', 'Ø W']);
  await expect(sec.locator('tbody tr')).toHaveCount(9);
  await expect(sec.locator('.cpill')).toHaveCount(2); // 10–15 and 15–20 have more than 3 %
  await expect(sec.locator('tbody tr').nth(2)).toContainText('Anstieg');
  await expect(sec.locator('tbody tr').nth(0)).toContainText('11:01');

  // TR7a: the course with elevation, heart rate, power and the break; tapping shows the nearest minute
  const tl = card('timeline');
  await expect(tl.getByRole('heading', { name: 'Verlauf' })).toBeVisible();
  await expect(tl).toContainText('Höhe, Puls und Leistung über die Zeit');
  await expect(tl.getByRole('img')).toHaveAttribute('aria-label', /^Verlauf über 96 Minuten, Höhe .* m, Puls .*, Leistung .* W, 1 Pause$/);
  for (const w of ['Höhenprofil', 'Puls', 'Leistung', 'Pause']) await expect(tl.locator('.lg')).toContainText(w);
  const svg = tl.locator('.tl svg');
  const box = await svg.boundingBox();
  await svg.click({ position: { x: box.width / 3, y: box.height / 2 } });
  await expect(tl.locator('[data-tip]')).toContainText(/^\d+ Min · Höhe \d+ m\s*Puls \d+ · Watt \d+$/);

  // a tapped section is shaded in the course; tapping it again clears it
  await sec.getByRole('button', { name: 'km 10–15 im Verlauf zeigen' }).click();
  await expect(sec.getByRole('button', { name: 'km 10–15 im Verlauf zeigen' })).toHaveAttribute('aria-pressed', 'true');
  await expect(tl.locator('[data-focus]')).toHaveCount(1);
  await expect(tl).toContainText('Markiert: km 10–15.');
  await shot(page, info, 'leistung-analysen-1');
  await sec.getByRole('button', { name: 'km 10–15 im Verlauf zeigen' }).click();
  await expect(tl.locator('[data-focus]')).toHaveCount(0);

  // «Mehr Inhalt» T2: the hard pieces of this ride, one summary line and a table; a tapped piece is shaded in the course
  const iv = card('intervals');
  await expect(iv.getByRole('heading', { name: 'Harte Stücke dieser Fahrt' })).toBeVisible();
  await expect(iv).toContainText('ab 90 % deiner FTP, mindestens 3 Minuten');
  expect(SUM).toMatchObject({ same: true, n: 4, mins: 5, zone: 4, pause: 3 });
  await expect(iv.locator('[data-pieces-summary]')).toHaveText(`4 × 5 Min in Z4, Ø ${SUM.w} W, Pause Ø 3 Min`);
  await expect(iv.getByRole('columnheader')).toHaveText(['Start', 'Dauer', 'Ø W', 'Ø Puls', 'Zone']);
  await expect(iv.locator('tbody tr')).toHaveCount(PIECES.length);
  await expect(iv.locator('tbody tr').first()).toContainText('Min 66');
  await expect(iv.locator('tbody tr').first()).toContainText('5:00');
  await expect(iv.locator('tbody tr').first()).toContainText(`${PIECES[0].w}`);
  await expect(iv.locator('tbody tr').first()).toContainText('Z4');
  await expect(iv).toContainText(`Hart = ab 90 % deiner geschätzten FTP (${FTP} W), mindestens 3 Minuten am Stück.`);
  const pieceBtn = iv.getByRole('button', { name: 'Hartes Stück ab Minute 74 im Verlauf zeigen' });
  await pieceBtn.click();
  await expect(pieceBtn).toHaveAttribute('aria-pressed', 'true');
  await expect(tl.locator('[data-focus]')).toHaveCount(1);
  await expect(tl).toContainText('Markiert: das harte Stück ab Minute 74. Nochmals antippen hebt es auf.');
  await expect(sec.getByRole('button', { pressed: true })).toHaveCount(0);
  await shot(page, info, 'inhalt-harte-stuecke');
  await pieceBtn.click();
  await expect(pieceBtn).toHaveAttribute('aria-pressed', 'false');
  await expect(tl.locator('[data-focus]')).toHaveCount(0);

  // «Mehr Inhalt» T5: the same route over time, this ride marked, one calm sentence
  const hl = card('homeloop');
  await expect(hl.getByRole('heading', { name: 'Deine Hausrunde über die Zeit' })).toBeVisible();
  await expect(hl).toContainText('4 Fahrten auf dieser Strecke');
  await expect(hl.locator('[data-homeloop-sentence]')).toHaveText('Auf dieser Strecke warst du diesmal 1:20 schneller als im Schnitt, bei 4 Schlägen weniger Puls.');
  await expect(hl.getByRole('columnheader')).toHaveText(['Datum', 'Zeit', 'km/h', 'Ø W', 'Ø Puls', 'W/Schlag']);
  await expect(hl.locator('tbody tr')).toHaveCount(4);
  const meRow = hl.locator('[data-loop-row="3001"]');
  await expect(meRow).toHaveAttribute('aria-current', 'true');
  await expect(hl.locator('tbody tr').last()).toHaveAttribute('data-loop-row', '3001'); // oldest first, this ride is the newest
  await expect(meRow).toContainText('diese Fahrt');
  await expect(meRow).toContainText('1:36:00');
  await expect(meRow).toContainText('188');
  await expect(meRow).toContainText('1.36'); // 188 W ÷ 138 beats
  await expect(hl.getByRole('img')).toHaveAttribute('aria-label', 'Ø Tempo auf 4 Fahrten dieser Strecke; diese Fahrt ist der grössere Punkt.');
  await expect(hl).toContainText('Gleicher Name und km ±10 %.');
  expect(await hl.locator('table').evaluate((el) => el.scrollWidth <= el.parentElement.clientWidth + 1)).toBe(true); // every column fits, also on the phone
  await expect(hl.locator('a[href="#/flow/training/a/3801"]')).toHaveCount(1);
  await shot(page, info, 'inhalt-hausrunde');

  // TR7a: heart rate by power, a real table, Z1 Erholung … Z5 Maximal by Z1 … Z7
  const grid = card('grid');
  await expect(grid.getByRole('heading', { name: 'Puls mal Leistung' })).toBeVisible();
  await expect(grid.getByRole('rowheader')).toHaveText(['Z1 Erholung', 'Z2 Grundlage', 'Z3 Tempo', 'Z4 Schwelle', 'Z5 Maximal']);
  await expect(grid.getByRole('columnheader')).toHaveText(['Puls ↓ · Leistung →', 'Z1', 'Z2', 'Z3', 'Z4', 'Z5', 'Z6', 'Z7']);
  await expect(grid.locator('td')).toHaveCount(35);
  const minutes = (await grid.locator('td').allTextContents()).map((s) => (s === '·' ? 0 : Number(s)));
  expect(minutes.reduce((a, b) => a + b, 0)).toBeGreaterThanOrEqual(94); // 96 min in the grid, each cell rounded
  await expect(grid).toContainText('Ecke unten links = hoher Puls bei wenig Leistung.');

  // TR7b: the two halves and one calm sentence
  const hv = card('halves');
  await expect(hv.getByRole('heading', { name: 'Erste gegen zweite Hälfte' })).toBeVisible();
  await expect(hv.getByRole('columnheader')).toHaveText(['1. Hälfte · 0:48', '2. Hälfte · 0:48']);
  await expect(hv.getByRole('rowheader')).toHaveText(['Ø Leistung', 'Ø Puls', 'Watt pro Schlag']);
  await expect(hv.locator('[data-halves-sentence]')).toHaveText('In der zweiten Hälfte 4 % mehr Puls bei fast gleicher Leistung.');
  await expect(hv).toContainText('Nur Beobachtung. Gerechnet ohne Pausen.');

  // TR7b: best values with stars and W/kg
  const best = card('best');
  await expect(best.getByRole('heading', { name: 'Bestwerte' })).toBeVisible();
  await expect(best.getByRole('rowheader')).toHaveText(['5 s', '1 Min', '5 Min', '20 Min', '60 Min']);
  await expect(best.getByRole('columnheader')).toHaveText(['Dauer', 'Diese Fahrt', 'Beste 90 Tage', `Beste ${day(-1).slice(0, 4)}`]);
  await expect(best.locator('[data-best="5"] td').first()).toContainText('584 W');
  await expect(best.locator('[data-best="5"] td').first()).toContainText('8.1 W/kg');
  await expect(best).toContainText('Stern = neue Bestleistung der letzten 90 Tage oder gleich gut. Mit Gewicht auch in W/kg.');

  // TR7b: similar rides on the same bike
  const sim = card('similar');
  await expect(sim.getByRole('heading', { name: 'Ähnliche Fahrten' })).toBeVisible();
  await expect(sim).toContainText('gleiche Gruppe, km und Hm je ±20 %');
  await expect(sim.locator('.cap')).toContainText(new RegExp(`^\\d+ ähnliche Fahrten: ${P}Gravel Blau, 34–51 km, 544–816 Hm\\. Rechts unten = mehr Leistung bei weniger Puls\\. Punkt antippen öffnet die Fahrt\\.$`));
  expect(await sim.locator('[data-similar]').count()).toBeGreaterThanOrEqual(3);

  // no page wider than the screen
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await shot(page, info, 'leistung-analysen-2');
  if (process.env.SHOTS) for (const k of ['climbs', 'sections', 'timeline', 'grid', 'halves', 'similar', 'best', 'intervals', 'homeloop']) await card(k).screenshot({ path: `${process.env.SHOTS}/ana-${k}-${info.project.name === 'phone' ? 390 : 1440}.png` });

  // TR7c: «…» › Ausblenden, then Rückgängig
  await grid.getByRole('button', { name: 'Mehr zu Puls mal Leistung' }).click();
  await page.getByRole('menuitem', { name: 'Ausblenden' }).click();
  await expect(card('grid')).toHaveCount(0);
  await expect(page.getByText('«Puls mal Leistung» ausgeblendet')).toBeVisible();
  await page.getByRole('button', { name: 'Rückgängig' }).click();
  await expect(card('grid')).toBeVisible();

  // TR7c: off and on again in «Analysen anpassen»
  await best.getByRole('button', { name: 'Mehr zu Bestwerte' }).click();
  await page.getByRole('menuitem', { name: 'Analysen anpassen' }).click();
  const sheet = page.locator('[data-ana-sheet]');
  await expect(sheet).toBeVisible();
  await sheet.locator('[data-ana-switch="best"]').click();
  await expect(sheet.locator('[data-ana-switch="best"]')).toHaveAttribute('aria-checked', 'false');
  await expect(card('best')).toHaveCount(0);
  await sheet.locator('[data-ana-switch="best"]').click();
  await expect(sheet.locator('[data-ana-switch="best"]')).toHaveAttribute('aria-checked', 'true');
  await sheet.getByRole('button', { name: 'Fertig' }).click();
  await expect(sheet).toBeHidden();
  await expect(card('best')).toBeVisible();

  // a dot opens that ride
  const dot = sim.locator('[data-similar]').first();
  const id = await dot.getAttribute('data-similar');
  await dot.click();
  await expect(page).toHaveURL(new RegExp(`#/flow/training/a/${id}$`));
  await expect(page.getByRole('heading', { level: 1 })).toContainText(P);

  expect(errors).toEqual([]);
});

test('Analysen auf der Aktivität: a ride without a power meter shows heart rate only, no grid, no best values', async ({ page, context, baseURL }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, context, baseURL);
  // find a ride without a power meter among the fictional ones
  const id = await page.evaluate(
    () =>
      new Promise((ok) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const q = r.result.transaction('activities').objectStore('activities').getAll();
          q.onsuccess = () => (r.result.close(), ok(q.result.find((a) => a.kind === 'bike' && !a.wDevice)?.id));
        };
      }),
  );
  expect(id).toBeTruthy();
  await page.goto(`./#/flow/training/a/${id}`);
  await expect(page.locator('[data-ana="sections"]')).toBeVisible();
  await expect(page.locator('[data-ana="grid"]')).toHaveCount(0);
  await expect(page.locator('[data-ana="best"]')).toHaveCount(0);
  await expect(page.locator('[data-ana="climbs"]')).toHaveCount(0); // only the main ride has climbs
  await expect(page.locator('[data-ana="intervals"]')).toHaveCount(0); // no power meter, no hard pieces
  const hv = page.locator('[data-ana="halves"]');
  await expect(hv.getByRole('rowheader')).toHaveText(['Ø Puls']);
  await expect(hv.locator('[data-halves-sentence]')).toHaveText('In der zweiten Hälfte 4 % mehr Puls.');
  expect(errors).toEqual([]);
});
