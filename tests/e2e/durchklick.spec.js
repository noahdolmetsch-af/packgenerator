// v0.137.0 Durchklick (Noah 14.10.2026 «1-5 freigeben», mockups DK6/DK7): plain words, long names
// without spaces wrap, a 0 line in the km chart, and no «older» warning when importing on an empty
// device. Fictional data (tests/fixtures/gesamttest), German.
import { test, expect } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { start, prepare, fixture, sideways, openData, tr } from './gesamttest/lib.js';
import { settle } from './settle.js';

const T = tr('de');
const LONG = 'Probetour_ohne_Leerzeichen_2610132015_v124_nichts_selektiert_abcdefghij';

test('DK7a: a long name without spaces wraps on Touren and Vorlagen, no sideways scroll', async ({ page, context }, info) => {
  const data = structuredClone(fixture().data);
  for (const trip of data.tables.trips) trip.title = `${LONG}_${trip.id}`;
  for (const tpl of data.tables.templates ?? []) tpl.name = `${LONG}_${tpl.id}`;
  await start(page, context, info, { data });
  for (const hash of ['#/trips', '#/pack/templates']) {
    await page.goto(`./${hash}`);
    await page.locator('main').waitFor();
    await expect(page.locator('main').getByText(new RegExp(LONG)).first()).toBeVisible();
    const s = await sideways(page);
    expect(s.sw, `${hash}: ${s.wide.join(', ')}`).toBeLessThanOrEqual(s.w);
  }
});

test('DK6, DK7b: the look back page says Erkenntnisse, no internal code, the km chart has a 0', async ({ page, context }, info) => {
  await start(page, context, info);
  await page.goto('./#/debrief');
  const main = page.locator('main');
  await main.waitFor();
  // UI-Regeln Teil 2 (Noah «a»): on a phone the Rückblick lines start closed, so the word is read where it shows
  // (the line «Gelernt · 60 Erkenntnisse» and the link «Erkenntnisse» under «Mehr»)
  await expect(main.getByText(T('Learnings'), { exact: true }).filter({ visible: true }).first()).toBeVisible();
  await expect(main).not.toContainText('Learnings');
  await expect(main).not.toContainText('S1');
  const ax = main.locator('.bars .ax').first();
  if (await ax.count()) await expect(ax.locator('span').last()).toHaveText('0');
});

test('DK7c: importing on an empty device says Neu hier, no older warning; the lights count every row', async ({ page, context }, info) => {
  await prepare(page, context, 'de');
  await page.goto('./');
  await settle(page);
  const file = info.outputPath('leer.json');
  writeFileSync(file, JSON.stringify(fixture().data));
  const data = await openData(page);
  await data.getByLabel(T('Import backup')).setInputFiles(file);
  await expect(page.getByText(T('New here'), { exact: true })).toBeVisible();
  await expect(page.getByText(T('Older'), { exact: true })).toHaveCount(0);
  await page.goto('./#/me/data');
  // Impeccable «Daten und Backup» (18.10.2026): the head says in words what is not in order instead of
  // «n von 3 grün»; every row still has its light, and a yellow row makes the head name it.
  const line = page.locator('[data-head-line]');
  const list = page.locator('#lights-h').locator('xpath=ancestor::section[1]').locator('.ich-list > li');
  const rows = await list.count();
  expect(rows).toBeGreaterThanOrEqual(3);
  await expect(list.locator('.dot')).toHaveCount(rows);
  const warns = await list.locator('.dot.warn').count();
  if (warns) await expect(line).not.toHaveText(T('Everything is in order.'));
  else await expect(line).toHaveText(T('Everything is in order.'));
});
