// «Höhenprofil wird abgefahren» (Paket E, Idee 13): opening a tour, a dot rides the elevation profile once;
// it is not there with «reduce motion». German UI, fictional data (the same as tourseite.spec.js).
import { test, expect } from './clock.js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { sn4plusData, D0, day } from './sn4plus-fixture.js';
import { at1Acts } from './at1-acts.js';
import { importAndSettle } from './settle.js';
import { encodePolyline } from '../../src/lib/spur/polyline.js';

const A = 'test_tour_';
const lineOf = (dir, n = 14) => encodePolyline(Array.from({ length: n }, (_, i) => [47.3 + Math.sin(dir) * 0.008 * i, 8.5 + Math.cos(dir) * 0.01 * i]));
const course = () => ({ pts: Array.from({ length: 30 }, (_, i) => [i * 6, 450 + Math.round(Math.sin(i / 4) * 180 + i * 6), 130, null]), breaks: [] });

async function open(page, context, info, fine = false) {
  const d = sn4plusData();
  const acts = at1Acts(day, A);
  acts[0] = { ...acts[0], line: lineOf(0.4), prof: course(), ...(fine ? { dprof: { step: 0.5, km: 30, d: [500, ...Array.from({ length: 60 }, (_, i) => Math.round(Math.sin(i / 6) * 14 + 3))] } } : {}) };
  d.tables.activities = acts;
  mkdirSync(info.project.outputDir, { recursive: true });
  const file = `${info.project.outputDir}/abfahren-${info.testId}.json`;
  writeFileSync(file, JSON.stringify(d));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    localStorage.setItem('lang', 'de');
    localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.clock.setFixedTime(new Date(`${D0}T10:00:00+02:00`));
  await page.goto('./');
  await importAndSettle(page, file);
  await page.goto(`./#/tour/${encodeURIComponent(`a:${A}1`)}`);
  await expect(page.locator('[data-tour-page]')).toBeVisible();
}

for (const [name, fine, box] of [
  ['the profile of the route', false, '[data-tour-profile] svg'],
  ['the fine profile of the ride', true, '[data-tour-course] [data-profile-box]'],
]) {
  test(`Idee 13: a dot rides ${name} once, then the whole profile stands`, async ({ page, context }, info) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await open(page, context, info, fine);
    const prof = page.locator(box).first();
    await prof.scrollIntoViewIfNeeded();
    const dot = page.locator(`${box.split(' ')[0]} [data-ride-dot]`);
    await expect(dot).toHaveCount(1, { timeout: 5000 });
    await expect(dot).toHaveCount(0, { timeout: 6000 });
    if (fine) await expect(prof.locator('svg')).not.toHaveAttribute('style', /clip-path/);
    else await expect(page.locator('[data-tour-profile] svg path.area')).not.toHaveAttribute('clip-path', /.+/);
    expect(errors).toEqual([]);
  });

  test(`Idee 13: with «reduce motion» no dot rides ${name}`, async ({ page, context }, info) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, context, info, fine);
    const prof = page.locator(box).first();
    await prof.scrollIntoViewIfNeeded();
    await expect(prof).toBeVisible();
    await expect(page.locator(`${box.split(' ')[0]} [data-ride-dot]`)).toHaveCount(0);
  });
}
