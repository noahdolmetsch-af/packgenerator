// Noah 27.10.2026 «1a 2a»: the voice notes of a trip in the Rückblick timeline, played where they were spoken.
// A note with its voice note and a «Hier bin ich» place with one. German UI, phone 390 and desktop 1440,
// fictional data (sn2x-fixture.js plus test_data_ voice notes).
import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { sn2xData, P, D0, SEE } from './sn2x-fixture.js';
import { openData, settle } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const VOICE = 'data:audio/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwEAAAAAAAAA';

function data() {
  const d = sn2xData();
  const n1 = d.tables.notes.find((n) => n.id === `${P}n1`);
  n1.inputs = { voices: [{ id: 'test_data_v1', src: VOICE, s: 14, at: n1.at, text: 'test_data_ Nebel liegt tief' }] };
  const see = d.tables.trips.find((x) => x.id === SEE);
  d.tables.tracks = [...(d.tables.tracks ?? []), { id: 'test_data_place1', kind: 'place', tripId: SEE, day: see.startDate, at: `${see.startDate}T09:30:00.000Z`, lat: 47.28, lon: 8.3, text: 'test_data_ Aussicht', inputs: { voices: [{ id: 'test_data_v2', src: VOICE, s: 41, at: `${see.startDate}T09:30:00.000Z` }] } }];
  return d;
}

test('voice notes in the Rückblick timeline: play where spoken', async ({ page, context }, info) => {
  mkdirSync(info.project.outputDir, { recursive: true });
  const file = `${info.project.outputDir}/zlsn-${info.testId}.json`;
  writeFileSync(file, JSON.stringify(data()));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.clock.setFixedTime(new Date(`${D0}T10:00:00+02:00`));
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const panel = await openData(page);
  await panel.getByLabel('Backup importieren').setInputFiles(file);
  await panel.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await settle(page);
  // a fake player: the test browser has no sound
  await page.evaluate(() => {
    HTMLMediaElement.prototype.play = function () { this.dataset.played = this.src.slice(0, 20); return Promise.resolve(); };
    HTMLMediaElement.prototype.pause = function () {};
  });

  await page.goto(`./#/debrief/${encodeURIComponent(SEE)}`);
  const tl = page.locator('section[data-group="tour"] [data-timeline]');
  await expect(tl.locator('li.tle.note')).toHaveCount(2);
  const note = tl.locator('li.tle.note').filter({ hasText: 'Nebel am See' });
  await expect(note.locator('[data-tl-voice]')).toHaveCount(1);
  await expect(note).toContainText('0:14');
  await expect(note).toContainText('test_data_ Nebel liegt tief');
  const place = tl.locator('li.tle.voice');
  await expect(place).toHaveCount(1);
  await expect(place).toContainText(T('Voice note'));
  await expect(place).toContainText('test_data_ Aussicht');
  await expect(place).toContainText('0:41');
  // in time order: the note at 08:40, then the place at 09:30
  const kinds = await tl.locator('li.tle').evaluateAll((els) => els.map((e) => [...e.classList].find((c) => c !== 'tle')));
  expect(kinds.indexOf('note')).toBeLessThan(kinds.indexOf('voice'));

  // play, then stop; playing one stops the other
  const b1 = note.locator('[data-tl-voice]');
  const b2 = place.locator('[data-tl-voice]');
  await b1.click();
  await expect(b1).toHaveAttribute('aria-pressed', 'true');
  await expect(b1).toContainText(T('Stop'));
  await b2.click();
  await expect(b2).toHaveAttribute('aria-pressed', 'true');
  await expect(b1).toHaveAttribute('aria-pressed', 'false');
  await b2.click();
  await expect(b2).toHaveAttribute('aria-pressed', 'false');
  await expect(b2).toContainText(T('Play'));
  // phone: the buttons are big enough to tap, and nothing scrolls sideways
  const box = await b1.boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  if (process.env.ZLSN_SHOTS) {
    await place.scrollIntoViewIfNeeded();
    await tl.screenshot({ path: `${process.env.ZLSN_SHOTS}/nachher-${info.project.name === 'phone' ? 390 : 1440}.png` });
  }
  expect(errors).toEqual([]);
});
