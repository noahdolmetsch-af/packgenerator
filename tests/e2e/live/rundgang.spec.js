// Live-Rundgang (Noah 21.11.2026 «2», thread «Prüfungen so einrichten, dass main grün bleibt»): after every going
// online, a robot does what Noah does every day, on the real app on GitHub Pages: tick off an activity, look at the
// Sportjahr, save a backup, take the tick back, and put the backup in again. The Live-Check (live.spec.js) only
// opens pages; this one acts, so a broken tick or a broken backup shows up the minute it is online, not when
// Noah's thumb finds it. Only .github/workflows/live.yml runs it (LIVE=1). A fresh browser has its own empty
// data: it reads nothing and writes nothing of Noah's (the app's data lives in the browser it runs in).
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import DE from '../../../src/lib/i18n/de/index.js';
import { settle, openData } from '../settle.js';

const URL_LIVE = process.env.LIVE_URL || 'https://noahdolmetsch-af.github.io/packgenerator/';
const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');

test.use({ serviceWorkers: 'allow', baseURL: URL_LIVE, timezoneId: 'Europe/Zurich' });
test.setTimeout(4 * 60_000);

// a tap with the finger on the phone, a click on the computer (a tile reacts to a real tap)
const press = (loc, info) => (info.project.name === 'phone' ? loc.tap() : loc.click());

/** How many ticks of an activity the browser holds (flowLog in IndexedDB). */
const ticksOf = (page, actId) =>
  page.evaluate(
    (id) =>
      new Promise((res) => {
        const r = indexedDB.open('pack-generator');
        r.onerror = () => res(-1);
        r.onsuccess = () => {
          const db = r.result;
          if (!db.objectStoreNames.contains('flowLog')) return (db.close(), res(0));
          const q = db.transaction('flowLog').objectStore('flowLog').getAll();
          q.onsuccess = () => (db.close(), res(q.result.filter((e) => e.actId === id).length));
          q.onerror = () => (db.close(), res(-1));
        };
      }),
    actId,
  );

// the title stays ASCII: the output folder is named after it, and Chromium cannot take a file from a path with an umlaut
test('Live walk: tick off, Sportjahr, save backup, take the tick back, put the backup in', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  // dialogs (the app uses its own windows) would block the walk
  page.on('dialog', (d) => d.accept());
  await context.addInitScript(() => {
    try {
      if (!sessionStorage.getItem('rundgang.lang')) (localStorage.setItem('lang', 'de'), sessionStorage.setItem('rundgang.lang', '1'));
    } catch {
      /* ignore */
    }
  });

  // 1. Aktiv: tick tennis, it stays ticked after a reload
  await page.goto('./#/flow');
  await settle(page, { sameTrips: false });
  const tennis = page.locator('[data-act="tennis"]');
  await expect(tennis).toHaveAttribute('aria-pressed', 'false', { timeout: 30_000 });
  await press(tennis, info);
  // a tap on a tile of Aktiv ticks it and opens «Geschafft» (the page after the tick)
  await expect(page).toHaveURL(/#\/flow\/geschafft/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Tennis', { timeout: 30_000 });
  await expect.poll(() => ticksOf(page, 'tennis')).toBe(1);
  await page.goto('./#/flow');
  await settle(page, { sameTrips: false });
  await expect(page.locator('[data-act="tennis"]')).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await settle(page, { sameTrips: false });
  await expect(page.locator('[data-act="tennis"]')).toHaveAttribute('aria-pressed', 'true', { timeout: 30_000 });

  // 2. Sportjahr: opens, no error page, and the tick is in it (Tennis)
  await page.goto('./#/auswerten/sportjahr');
  await expect(page.locator('main')).toContainText(T('Sports year'), { timeout: 30_000 });
  await expect(page.locator('[data-error-page]')).toHaveCount(0);
  await expect(page.locator('main')).toContainText(T('Tennis'));

  // 3. Backup: save it, the file holds the tick
  const panel = await openData(page); // «Ich › Daten und Backup», settled, its folds open
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    panel.getByRole('button', { name: T('Save backup') }).and(page.locator(':not([data-status-save])')).click(),
  ]);
  const file = info.outputPath('live-backup.json');
  await download.saveAs(file);
  const backup = JSON.parse(readFileSync(file, 'utf8'));
  expect(backup.tables.flowLog.filter((e) => e.actId === 'tennis'), 'the backup holds the tick').toHaveLength(1);

  // 4. Take the tick back on Aktiv (a second tap)
  await page.goto('./#/flow');
  await settle(page, { sameTrips: false });
  await press(page.locator('[data-act="tennis"]'), info);
  await expect(page.locator('[data-act="tennis"]')).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(() => ticksOf(page, 'tennis')).toBe(0);

  // 5. Put the backup in again (replace all): the tick is back
  const data = await openData(page);
  await data.getByLabel(T('Import backup')).setInputFiles(file);
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  const sure = data.getByRole('group', { name: T('Really replace all data?') });
  await expect
    .poll(
      async () => {
        if (await sure.isVisible()) await sure.getByRole('button', { name: T('Yes, replace all') }).click();
        return ticksOf(page, 'tennis');
      },
      { timeout: 30_000 },
    )
    .toBe(1);
  await page.goto('./#/flow');
  await settle(page, { sameTrips: false });
  await expect(page.locator('[data-act="tennis"]')).toHaveAttribute('aria-pressed', 'true', { timeout: 30_000 });

  expect(errors).toEqual([]);
});
