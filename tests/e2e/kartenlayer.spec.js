// Kartenlayer (Noah 20.10.2026 «kartenlayer im front end wählbar sein»): the tour map has a «Kartengrund»
// button; the ground chosen there holds for all maps (here: the measuring map in the tools). Made-up tour
// data only; every request to outside is blocked, so the tiles are only checked by their address.
import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { sn4plusData, D0, day } from './sn4plus-fixture.js';
import { at1Acts } from './at1-acts.js';
import { importAndSettle } from './settle.js';
import { openShort } from './kurz-open.js';
import { encodePolyline } from '../../src/lib/spur/polyline.js';

const T = (en) => DE[en] ?? en;
const A = 'test_layer_';
const lineOf = (n = 14) => encodePolyline(Array.from({ length: n }, (_, i) => [47.3 + 0.003 * i, 8.5 + 0.009 * i]));

test('Map ground: chosen on the tour map, kept for the measuring map', async ({ page, context }, info) => {
  mkdirSync(info.project.outputDir, { recursive: true });
  const file = `${info.project.outputDir}/layer-${info.testId}.json`;
  const d = sn4plusData();
  const acts = at1Acts(day, A);
  acts[0] = { ...acts[0], line: lineOf() };
  d.tables.activities = acts;
  writeFileSync(file, JSON.stringify(d));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.clock.setFixedTime(new Date(`${D0}T10:00:00+02:00`));
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./');
  await importAndSettle(page, file);
  await page.goto(`./#/tour/${encodeURIComponent(`a:${A}1`)}`);
  await openShort(page);

  // the tour map starts on «Automatic»: swisstopo in Switzerland
  const map = page.locator('[data-tour-page] .tmap').first();
  await expect(map).toBeVisible();
  await expect(map.locator('.tiles img').first()).toHaveAttribute('src', /wmts\.geo\.admin\.ch/);
  // the layers button opens the list; the cycling map (CyclOSM) is there, the vector map is not
  await map.locator('[data-map-layers]').click();
  const list = map.locator('[data-map-grounds]');
  await expect(list).toBeVisible();
  await expect(list).toContainText(T('Applies to all maps in the app.'));
  await expect(list.locator('[data-map-ground-pick="vector"]')).toHaveCount(0);
  await expect(list.locator('[data-map-ground-pick="auto"]')).toHaveAttribute('aria-pressed', 'true');
  await list.locator('[data-map-ground-pick="cyclo"]').click();
  await expect(list).toHaveCount(0);
  await expect(map.locator('.tiles img').first()).toHaveAttribute('src', /tile-cyclosm\.openstreetmap\.fr/);
  await expect(map.locator('.attr')).toContainText('CyclOSM');

  // the measuring map in the tools shows the same choice
  await page.goto('./#/me/tools/map');
  const sel = page.locator('.mapm [data-map-ground]');
  await expect(sel).toHaveValue('cyclo');
  await sel.selectOption('osm');
  // and back on the tour map, the new choice holds
  await page.goto(`./#/tour/${encodeURIComponent(`a:${A}1`)}`);
  await expect(page.locator('[data-tour-page] .tmap .tiles img').first()).toHaveAttribute('src', /tile\.openstreetmap\.org/);
  expect(errors).toEqual([]);
});
