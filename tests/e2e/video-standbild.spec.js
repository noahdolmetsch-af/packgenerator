// «Standbild aus Video» (Noah 28.10.2026 «2a»): a video in a note gets «Keep this picture»; the picture on
// screen becomes one of the note's photos. The video stays as it is. Fictional video made in the page.
import { test, expect } from './clock.js';
import { prep, newNote, noSideScroll } from './notes-helpers.js';
import { madeUpVideo } from './video-helper.js';

test('a video in a note: keep the picture on screen as a photo of the note', async ({ page, context }) => {
  test.setTimeout(90_000);
  const errors = await prep(page, context);
  const bytes = await madeUpVideo(page, 3);
  const sheet = await newNote(page, 'test_data_gtp_ Ausfahrt Jura');
  await sheet.locator('[data-add-file]').setInputFiles([{ name: 'ausfahrt.webm', mimeType: 'video/webm', buffer: bytes }]);
  await expect(sheet.locator('[data-note-files] li')).toHaveCount(1, { timeout: 30_000 });
  await expect(sheet.locator('[data-note-photo]')).toHaveCount(0);

  await sheet.locator('[data-note-file="video"] .fo').click();
  const fv = page.locator('dialog[data-file-view]');
  await expect(fv.locator('[data-file-video]')).toBeVisible();
  await expect.poll(() => fv.locator('[data-file-video]').evaluate((v) => v.readyState)).toBeGreaterThanOrEqual(2);
  await noSideScroll(page);
  await fv.locator('[data-video-still]').click();
  await expect(fv.locator('.ok')).toBeVisible();
  await fv.getByRole('button', { name: /^(Close|Schliessen)$/ }).last().click();

  // the picture is a photo of the note now, the video is still there
  await expect(sheet.locator('[data-note-photo]')).toHaveCount(1);
  await expect(sheet.locator('[data-note-files] li')).toHaveCount(1);
  expect(errors).toEqual([]);
});
