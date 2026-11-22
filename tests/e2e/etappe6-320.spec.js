// Etappe 6 (Querschnitt, E6-002 bis E6-004): at 320 px four pages pushed the page wider or cut a button text:
// the main button «Fertig gepackt» of the packing day ended in «Fertig ge…», the «+ Wert» list of Analyse was as wide
// as its longest value, and the rows of Zeitzonen and of the race paperwork had more buttons than fit in a line
// (the race rows even broke words letter by letter at 390 px).
import { test, expect } from './clock.js';
import { start, sideways, cutOff, brokenWords } from './gesamttest/lib.js';
import { ready } from './settle.js';

test('at 320 px: Fertig gepackt, +Wert, Zeitzonen and Papierkram fit the screen', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'phone', 'a phone width');
  test.setTimeout(150_000);
  await start(page, context, info);
  await page.setViewportSize({ width: 320, height: 844 });
  const fits = async (hash, what) => {
    await page.goto(`./${hash}`);
    await page.reload();
    await ready(page);
    await page.waitForTimeout(700);
    const sw = await sideways(page);
    expect.soft(sw.sw, `${what}: the page is wider than the screen (${sw.wide.join(', ')})`).toBeLessThanOrEqual(sw.w + 1);
  };
  await fits('#/auswerten/analyse/late', 'Analyse, «+ Wert»');
  await fits('#/auswerten/analyse/km%3Abike', 'Analyse, Namen über dem Diagramm');
  await fits('#/me/tools/zones', 'Zeitzonen');
  await fits('#/race/test_data_gtp_trip26/prepare', 'Rennen, Papierkram');
  expect.soft(await brokenWords(page), 'Papierkram at 320 px: no word broken letter by letter').toEqual([]);
  // the same rows at 390 px: before, «Anmeldung» stood letter by letter in a narrow column
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await ready(page);
  await page.waitForTimeout(700);
  expect.soft(await brokenWords(page), 'Papierkram at 390 px: no word broken letter by letter').toEqual([]);
  await page.setViewportSize({ width: 320, height: 844 });
  // Rennen-Check shows the same editable rows: «Ersatzschläuche» must stay one word at 390 px
  await page.goto('./#/racecheck/test_data_gtp_trip26');
  await ready(page);
  await page.waitForTimeout(700);
  expect.soft(await brokenWords(page), 'Rennen-Check at 390 px: no word broken letter by letter').toEqual([]);
  await page.setViewportSize({ width: 320, height: 844 });
  await fits('#/pack?day', 'Packtag');
  expect.soft(await cutOff(page), 'the main button says «Fertig gepackt» in full').toEqual([]);
});
