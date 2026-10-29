// «Video-Probe» (Noah 28.10.2026): Werkzeugkasten › Video verkleinern shows a 5-second test piece and the
// size of the whole video before the whole video is made smaller. A made-up video (a moving square) is
// recorded in the page itself, so the test needs no file.
import { test, expect } from './clock.js';
import { ready } from './settle.js';
import DE from '../../src/lib/i18n/de/index.js';

const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** A label in English or German (the test browser may start in either). */
const both = (en) => new RegExp(`^(${esc(en.replace(/\|[a-z]+$/, ''))}${DE[en] ? `|${esc(DE[en])}` : ''})$`);

/** A made-up video of `secs` seconds (a green square moves over grey) as WebM bytes. */
const video = async (page, secs) =>
  Buffer.from(
    await page.evaluate(async (secs) => {
      const c = document.createElement('canvas');
      c.width = 320;
      c.height = 240;
      const g = c.getContext('2d');
      const rec = new MediaRecorder(c.captureStream(20), { mimeType: 'video/webm' });
      const parts = [];
      rec.ondataavailable = (e) => e.data.size && parts.push(e.data);
      const done = new Promise((ok) => (rec.onstop = ok));
      const t0 = performance.now();
      rec.start(250);
      await new Promise((ok) => {
        const draw = () => {
          const k = (performance.now() - t0) / 1000;
          g.fillStyle = '#cccccc';
          g.fillRect(0, 0, 320, 240);
          g.fillStyle = '#2d5a3d';
          g.fillRect(20 + k * 40, 80, 60, 60);
          if (k < secs) requestAnimationFrame(draw);
          else ok();
        };
        draw();
      });
      rec.stop();
      await done;
      const buf = new Uint8Array(await new Blob(parts, { type: 'video/webm' }).arrayBuffer());
      let s = '';
      for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
      return btoa(s);
    }, secs),
    'base64',
  );

test('Video-Probe: a test piece first, then the whole video; another size removes the piece', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('#/me');
  await ready(page);
  const bytes = await video(page, 7);
  await page.goto('#/me/tools/video');
  await ready(page);
  await expect(page.locator('.tools-view[data-tool="video"]')).toBeVisible();
  // no buttons for the test piece before a video is chosen
  await expect(page.locator('[data-video-probe]')).toHaveCount(0);

  const pick = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: both('Choose video') }).click();
  await (await pick).setFiles([{ name: 'test-film.webm', mimeType: 'video/webm', buffer: bytes }]);
  await expect(page.locator('[data-video-file]')).toContainText('test-film.webm');
  await expect(page.locator('[data-video-all]')).toBeVisible();

  await page.locator('[data-video-probe]').click();
  await expect(page.locator('[data-video-probe-view]')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('[data-video-guess]')).toContainText(/Test piece|Teststück/);

  // another size: the piece does not fit any more
  await page.getByLabel(/Medium|Mittel/).check();
  await expect(page.locator('[data-video-probe-view]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
