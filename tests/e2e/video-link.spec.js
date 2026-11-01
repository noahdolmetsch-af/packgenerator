// «Video-Link statt Datei» (Noah 28.10.2026 «2a»): a link to a video site in a note is shown as a video link
// (play symbol and «the video stays where it is»); an ordinary link stays an ordinary link.
import { test, expect } from './clock.js';
import { prep, newNote, noSideScroll } from './notes-helpers.js';

test('a note keeps a link to a video as a video link, other links stay plain', async ({ page, context }) => {
  const errors = await prep(page, context);
  const sheet = await newNote(page, 'test_data_gtp_ Ausfahrt Video');
  const add = async (url, title) => {
    await sheet.locator('[data-note-adds] button[aria-pressed]').click();
    await sheet.locator('form.lform input[type="url"]').fill(url);
    await sheet.locator('form.lform input[type="text"]').fill(title);
    await sheet.locator('form.lform button[type="submit"]').click();
  };
  await add('https://www.youtube.com/watch?v=test_data_gtp_', 'Jura Ausfahrt');
  await add('https://example.org/packliste', 'Packliste');
  const links = sheet.locator('[data-note-link]');
  await expect(links).toHaveCount(2);
  await expect(links.nth(0)).toHaveAttribute('data-link-kind', 'video');
  await expect(links.nth(0).locator('[data-link-video]')).toBeVisible();
  await expect(links.nth(1)).not.toHaveAttribute('data-link-kind', 'video');
  await expect(links.nth(1).locator('[data-link-video]')).toHaveCount(0);
  await noSideScroll(page);
  expect(errors).toEqual([]);
});
