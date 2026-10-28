// Paket NE «Notizen wie Evernote», part 3 (Noah 20.10.2026 «9a 10a»): an earlier version of a note comes
// back; a deleted note waits in the trash and comes back from there; a reminder on a note shows on top
// of Notes when it is due, until «Done». In German, on a phone and a computer; no sideways scroll, no page
// errors. Fictional data only.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { prep, newNote, storedNote, noSideScroll } from './notes-helpers.js';

const T = (en, vars = {}) => Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, v), DE[en] ?? en.replace(/\|[a-z]+$/, ''));

test('an earlier version comes back; a deleted note waits in the trash and comes back', async ({ page, context }) => {
  const errors = await prep(page, context);
  let sheet = await newNote(page, 'test_data_gtp_ Packliste\nZelt und Kocher');
  // change the text: the text from before stays as a version
  await sheet.locator('[data-rt-edit]').fill('Nur noch Zelt');
  await sheet.getByRole('button', { name: T('Done'), exact: true }).click();
  await expect.poll(async () => (await storedNote(page, 'Packliste'))?.text).toBe('Nur noch Zelt');

  await page.locator('li.ncard', { hasText: 'Packliste' }).locator('button').first().click();
  sheet = page.locator('dialog.nsheet');
  await sheet.locator('[data-note-versions-open]').click();
  const versions = sheet.locator('[data-note-versions] [data-version]');
  await expect(versions).toHaveCount(1);
  await versions.first().locator('button').first().click();
  await expect(sheet.locator('[data-version-text]')).toContainText('Zelt und Kocher');
  await sheet.locator('[data-version-put]').click();
  await expect(sheet.locator('[data-rt-edit]')).toContainText('Zelt und Kocher');
  await expect(versions).toHaveCount(2); // «Nur noch Zelt» is kept as a version before the old text comes back
  await noSideScroll(page);
  await sheet.getByRole('button', { name: T('Done'), exact: true }).click();
  await expect.poll(async () => (await storedNote(page, 'Packliste'))?.text).toBe('Zelt und Kocher');

  // delete: into the trash
  await page.locator('li.ncard', { hasText: 'Packliste' }).locator('button').first().click();
  await sheet.getByRole('button', { name: T('Delete'), exact: true }).click();
  const ask = page.getByTestId('ask-delete');
  await expect(ask).toContainText(T('It waits {n} days in the trash of Notes (More › Trash).', { n: 30 }));
  await ask.getByRole('button', { name: T('Delete'), exact: true }).click();
  await expect(page.getByText(T('"{name}" is in the trash.', { name: 'test_data_gtp_ Packliste' }))).toBeVisible();
  await expect.poll(() => storedNote(page, 'Packliste')).toBe(null);

  // the trash: put back
  await page.locator('[data-notes-trash], [data-notes-trash-empty]').first().click();
  const trash = page.locator('dialog[data-note-trash]');
  await expect(trash.locator('[data-trash-row]')).toHaveCount(1);
  await expect(trash.locator('[data-trash-row]')).toContainText(T('{n} days left', { n: 30 }));
  await noSideScroll(page);
  await trash.locator('[data-trash-put]').click();
  await expect(trash.locator('[data-trash-row]')).toHaveCount(0);
  await expect(trash).toContainText(T('The trash is empty.'));
  await trash.getByRole('button', { name: T('Done'), exact: true }).click();
  await expect(page.locator('li.ncard', { hasText: 'Packliste' })).toBeVisible();
  expect((await storedNote(page, 'Packliste')).text).toBe('Zelt und Kocher');
  expect(errors).toEqual([]);
});

// Auffälligkeiten 28.10.2026 (Noah «3a»): without notes and with an empty trash the trash still shows
test('without notes the empty trash still shows and opens', async ({ page, context }) => {
  const errors = await prep(page, context);
  const link = page.locator('[data-notes-trash-empty]');
  await expect(link).toBeVisible();
  await expect(link).toHaveText(T('Trash · empty'));
  await link.click();
  const trash = page.locator('dialog[data-note-trash]');
  await expect(trash).toContainText(T('The trash is empty.'));
  await noSideScroll(page);
  await trash.getByRole('button', { name: T('Done'), exact: true }).click();
  expect(errors).toEqual([]);
});

test('a reminder on a note: set, it shows on top when due, «Done» takes it away', async ({ page, context }) => {
  const errors = await prep(page, context);
  const sheet = await newNote(page, 'test_data_gtp_ Schlauch kaufen\nim Veloladen');
  await sheet.locator('[data-note-remind-open]').click();
  const box = sheet.locator('[data-note-remind]');
  // a time a minute ago: due at once (the device's own clock)
  const past = await page.evaluate(() => {
    const d = new Date(Date.now() - 60_000);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  });
  await box.locator('[data-remind-at]').fill(past);
  await box.locator('[data-remind-set]').click();
  await expect(box.locator('[data-remind-off]')).toBeVisible();
  await expect(box).toContainText(T('Reminders on the phone|guide')); // the reminders are off: the way there
  await noSideScroll(page);
  await sheet.getByRole('button', { name: T('Done'), exact: true }).click();
  await expect.poll(async () => (await storedNote(page, 'Schlauch'))?.remind?.at).toBe(past);

  const due = page.locator('[data-notes-due]');
  await expect(due.locator('li')).toHaveCount(1);
  await expect(due).toContainText('Schlauch kaufen');
  await due.locator('[data-remind-done]').click();
  await expect(due).toHaveCount(0);
  expect((await storedNote(page, 'Schlauch')).remind.done).toBe(true);
  expect(errors).toEqual([]);
});
