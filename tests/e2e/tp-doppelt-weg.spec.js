// TrainingPeaks, every workout three times (Noah 27.11.2026): copies of one workout from before the stable id are folded into one on the
// next fetch; a tick stays. Made-up link and workouts, German, phone + desktop, clock fixed (Friday 27 Nov 2026).
// TP_SHOTS=<dir> saves screenshots (before: fetching off, after: fetching on).
import { test, expect } from '@playwright/test';
import { ready } from './settle.js';

const SHOTS = process.env.TP_SHOTS || '';
const LINK = 'https://www.trainingpeaks.com/ical/TESTaaaa11bbbb.ics';
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
const BASE = { kind: 'bike', zone: null, src: 'tp' };
const old = (id, day, name, mins, extra = {}) => ({ id, day, name, mins, ...BASE, ...extra });

const ics = (tag) =>
  ['BEGIN:VCALENDAR', 'VERSION:2.0',
    `BEGIN:VEVENT`, `UID:${tag}-1`, 'SUMMARY:Bike: Beispiel Grundlage', 'DTSTART;VALUE=DATE:20261123', 'DESCRIPTION:Planned duration: 1:04:00', 'END:VEVENT',
    `BEGIN:VEVENT`, `UID:${tag}-2`, 'SUMMARY:Bike: Beispiel Intervalle', 'DTSTART;VALUE=DATE:20261124', 'DESCRIPTION:Planned duration: 1:05:30', 'END:VEVENT',
    `BEGIN:VEVENT`, `UID:${tag}-3`, 'SUMMARY:Bike: Beispiel Locker', 'DTSTART;VALUE=DATE:20261128', 'DESCRIPTION:Planned duration: 1:04:00', 'END:VEVENT',
    'END:VCALENDAR'].join('\r\n');

async function seed(page, rows) {
  await page.evaluate(
    (list) =>
      new Promise((ok) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const tx = r.result.transaction([...new Set(list.map((x) => x[0]))], 'readwrite');
          for (const [store, rec] of list) tx.objectStore(store).put(rec);
          tx.oncomplete = () => (r.result.close(), ok());
        };
      }),
    rows,
  );
}

test('TrainingPeaks: three copies of a workout become one on the next fetch, the tick stays', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  let n = 0;
  await context.route(/packgen-three\.vercel\.app\/api\/linkcheck\?a=trainingpeaks/, (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    return route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify({ ics: ics(`fresh${n++}`) }) });
  });
  await context.addInitScript(() => {
    localStorage.setItem('lang', 'de');
    localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.clock.setFixedTime(new Date('2026-11-27T12:00:00+01:00'));
  const shot = async (name) => {
    if (!SHOTS) return;
    const vp = page.viewportSize();
    for (const h of info.project.name === 'desktop' ? [900, 800] : [vp.height]) {
      await page.setViewportSize({ width: vp.width, height: h });
      await page.locator('[data-week-range]').scrollIntoViewIfNeeded();
      await page.evaluate(() => document.querySelector('[data-week-range]').scrollIntoView({ block: 'start' }));
      await page.waitForTimeout(700);
      await page.screenshot({ path: `${SHOTS}/${name}-${vp.width}x${h}.png` });
    }
    await page.setViewportSize(vp);
  };
  await page.goto('./#/flow/training');
  await ready(page);

  const copies = [
    old('tp-aa1', '2026-11-23', 'Bike: Beispiel Grundlage', 64),
    old('tp-aa2', '2026-11-23', 'Bike: Beispiel Grundlage', 64),
    old('tp-aa3', '2026-11-23', 'Bike: Beispiel Grundlage', 64, { done: true }),
    old('tp-bb1', '2026-11-24', 'Bike: Beispiel Intervalle', 65),
    old('tp-bb2', '2026-11-24', 'Bike: Beispiel Intervalle', 65),
    old('tp-bb3', '2026-11-24', 'Bike: Beispiel Intervalle', 65),
    old('tp-cc1', '2026-11-28', 'Bike: Beispiel Locker', 64),
    old('tp-cc2', '2026-11-28', 'Bike: Beispiel Locker', 64),
  ];
  await seed(page, [
    ['settings', { key: 'training.plan', value: { sessions: copies } }],
    ['settings', { key: 'trainingpeaks', value: { url: LINK, on: false, fetchedAt: '2026-11-20T08:00:00.000Z', found: 3 } }],
  ]);
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-planned]')).toHaveCount(8);
  await shot('tp-doppelt-vorher');

  await seed(page, [['settings', { key: 'trainingpeaks', value: { url: LINK, on: true, fetchedAt: '2026-11-20T08:00:00.000Z', found: 3 } }]]);
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-planned]')).toHaveCount(3);
  for (const name of ['Beispiel Grundlage', 'Beispiel Intervalle', 'Beispiel Locker']) await expect(page.locator('[data-planned]', { hasText: name })).toHaveCount(1);
  await expect(page.locator('[data-planned]', { hasText: 'Beispiel Grundlage' })).toHaveClass(/ok/); // the tick stays
  await shot('tp-doppelt-nachher');

  // fetching again (new UIDs at TrainingPeaks) adds nothing
  await page.goto('./#/me/connections');
  await ready(page);
  const card = page.locator('[data-section="trainingpeaks"]');
  await card.getByRole('button', { name: 'Neu abrufen' }).click();
  await expect(card.getByRole('status')).toContainText('Auf dem neuesten Stand');
  await page.goto('./#/flow/training');
  await ready(page);
  await expect(page.locator('[data-planned]')).toHaveCount(3);
  expect(errors).toEqual([]);
});
