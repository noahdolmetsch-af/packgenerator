// «Datei auf das Fenster ziehen» (Noah 23.11.2026 «3a»): on a computer a file dragged onto the window shows «Loslassen zum Öffnen»,
// a drop asks «Was soll mit dieser Datei geschehen?», «Abbrechen» keeps nothing, the suggestion opens the page that reads the file.
// German UI, no network, fictional data only. The drag is made with synthetic events (a browser test cannot drag from the desktop).
import { test, expect } from './clock.js';
import { ready } from './settle.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const backup = readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8');
const GPX = `<?xml version="1.0"?><gpx version="1.1"><trk><name>Testrunde</name><trkseg>${[0, 1, 2, 3].map((i) => `<trkpt lat="47.${10 + i}" lon="8.${10 + i}"><ele>${400 + i}</ele><time>2026-10-0${1}T08:0${i}:00Z</time></trkpt>`).join('')}</trkseg></trk></gpx>`;

async function open(page, context, hash = '#/') {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto(`./${hash}`);
  await ready(page);
}

/** Fires drag events with one file on the body, like a drag from the desktop. kinds: 'over' (dragenter + dragover) or 'drop'. */
const drag = (page, kind, name, type, content) =>
  page.evaluate(([kind, name, type, content]) => {
    const dt = new DataTransfer();
    dt.items.add(new File([content], name, { type }));
    const fire = (t) => document.body.dispatchEvent(new DragEvent(t, { bubbles: true, cancelable: true, dataTransfer: dt }));
    if (kind === 'over') {
      fire('dragenter');
      fire('dragover');
    } else fire('drop');
  }, [kind, name, type, content]);

test.describe('on a computer', () => {
  test.skip(({ isMobile }) => isMobile, 'a phone has the share sheet, no dragging of files');

  test('a file over the window shows the hint, a drop opens the sheet with the kind found', async ({ page, context }) => {
    await open(page, context);
    await drag(page, 'over', 'runde.gpx', 'application/gpx+xml', GPX);
    await expect(page.locator('[data-drop-veil]')).toBeVisible();
    await expect(page.locator('[data-drop-veil]')).toContainText('Loslassen zum Öffnen');
    await drag(page, 'drop', 'runde.gpx', 'application/gpx+xml', GPX);
    const sheet = page.locator('[data-drop-sheet]');
    await expect(sheet).toBeVisible();
    await expect(sheet).toContainText('Was soll mit dieser Datei geschehen?');
    await expect(sheet).toContainText('runde.gpx');
    await expect(sheet).toContainText('Eine aufgezeichnete Fahrt');
    await expect(page.locator('[data-drop-veil]')).toHaveCount(0);
    // «Abbrechen» is the default: it has the focus
    await expect(page.locator('[data-drop-cancel]')).toBeFocused();
  });

  test('«Abbrechen» keeps nothing and stays on the page', async ({ page, context }) => {
    await open(page, context, '#/week');
    await drag(page, 'drop', 'runde.gpx', 'application/gpx+xml', GPX);
    await expect(page.locator('[data-drop-sheet]')).toBeVisible();
    await page.locator('[data-drop-cancel]').click();
    await expect(page.locator('[data-drop-sheet]')).toHaveCount(0);
    expect(new URL(page.url()).hash).toBe('#/week');
    const kept = await page.evaluate(async () => (await caches.has('pg-shared-ride')) && (await (await caches.open('pg-shared-ride')).keys()).length);
    expect(kept).toBeFalsy();
  });

  test('a ride: the suggestion opens the ride upload with the file', async ({ page, context }) => {
    await open(page, context);
    await drag(page, 'drop', 'runde.gpx', 'application/gpx+xml', GPX);
    await page.locator('[data-drop-yes]').click();
    await expect.poll(() => new URL(page.url()).hash).toBe('#/debrief/ride/shared');
    await expect(page.locator('main')).toContainText(/Testrunde|runde\.gpx/);
  });

  test('a planned route (a GPX without times) says so', async ({ page, context }) => {
    await open(page, context);
    await drag(page, 'drop', 'plan.gpx', 'application/gpx+xml', GPX.replace(/<time>[^<]*<\/time>/g, ''));
    await expect(page.locator('[data-drop-sheet]')).toContainText('Eine geplante Strecke');
    await expect(page.locator('[data-drop-yes]')).toHaveText('Als geplante Tour übernehmen');
  });

  test('a backup goes to «Backup prüfen», never straight in', async ({ page, context }) => {
    await open(page, context);
    await drag(page, 'drop', 'pack-generator-test.json', 'application/json', backup);
    await expect(page.locator('[data-drop-sheet]')).toContainText('Eine Backup-Datei');
    await page.locator('[data-drop-yes]').click();
    await expect.poll(() => new URL(page.url()).hash).toMatch(/^#\/me\/data/);
    await expect(page.getByText(/Backup prüfen|Prüfen|Vorschau|ersetzen/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('a file the app cannot use has only «Abbrechen»', async ({ page, context }) => {
    await open(page, context);
    await drag(page, 'drop', 'notizen.txt', 'text/plain', 'hallo');
    await expect(page.locator('[data-drop-sheet]')).toContainText('kann diese Datei nicht verwenden');
    await expect(page.locator('[data-drop-yes]')).toHaveCount(0);
  });

  test('a drag of something that is no file does nothing', async ({ page, context }) => {
    await open(page, context);
    await page.evaluate(() => {
      const dt = new DataTransfer();
      dt.setData('text/plain', 'ein Wort');
      document.body.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }));
    });
    await expect(page.locator('[data-drop-veil]')).toHaveCount(0);
  });
});

test('on a phone no layer listens', async ({ page, context, isMobile }) => {
  test.skip(!isMobile, 'computer project');
  await open(page, context);
  await drag(page, 'over', 'runde.gpx', 'application/gpx+xml', GPX);
  await expect(page.locator('[data-drop-veil]')).toHaveCount(0);
});
