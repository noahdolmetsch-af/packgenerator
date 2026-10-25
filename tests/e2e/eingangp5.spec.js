// Paket P5 «Eingang» (Noah 21.10.2026, mockup A-J4 «Ablegen-Runde»): the open notes one after the other with the
// suggestion and why; file, keep, skip, delete; the end screen counts it. A chip opens another target, «Pause»
// goes back to the list. German UI, fictional data (test_data_gtp_), the clock on Fri 9.10.2026 09:00.
import { test, expect } from '@playwright/test';
import { openHome, homeFixture, D0 } from './home0460-fixture.js';

const noSideScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
function withNotes() {
  const data = homeFixture();
  data.tables.notes = [
    { id: 'test_data_gtp_r1', text: 'test_data_gtp_ Bremse hinten quietscht', status: 'open', at: `${D0}T06:00:00.000Z` },
    { id: 'test_data_gtp_r2', text: 'test_data_gtp_ irgendwas notieren', status: 'open', at: `${D0}T05:00:00.000Z` },
    { id: 'test_data_gtp_r3', text: 'test_data_gtp_ später schauen', status: 'open', at: `${D0}T04:00:00.000Z` },
    { id: 'test_data_gtp_r4', text: 'test_data_gtp_ alter Zettel', status: 'open', at: `${D0}T03:00:00.000Z` },
  ];
  return data;
}

test('Sorting round: file with the suggestion, keep, skip, delete, then the end screen', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info, { data: withNotes() });
  await page.goto('./#/inbox');
  const go = page.locator('[data-round-start]');
  await expect(go).toContainText(T('{n} notes are waiting', { n: 4 }));
  await go.locator('[data-round-go]').click();
  const round = page.locator('[data-sort-round]');
  await expect(round.locator('[data-abr-pos]')).toHaveText(T('{n} of {total}', { n: 1, total: 4 }));
  await expect(round.locator('[data-abr-text]')).toHaveText('test_data_gtp_ Bremse hinten quietscht');
  const sug = round.locator('[data-abr-sug]');
  await expect(sug).toHaveAttribute('data-abr-sug', 'problem');
  await expect(sug).toContainText(T('because «{a}» and «{b}» appear', { a: 'Bremse', b: 'quietscht' }));
  expect(await noSideScroll(page)).toBe(true);
  // 1: file as suggested (the form of the target opens, one tap saves)
  await round.locator('[data-abr-file]').click();
  const sheet = page.locator('dialog.fsheet');
  await expect(sheet).toBeVisible();
  await sheet.getByRole('button', { name: T('Into bike care') }).click();
  await expect(sheet).toHaveCount(0);
  await expect(round.locator('[data-abr-pos]')).toHaveText(T('{n} of {total}', { n: 2, total: 4 }));
  // 2: «keep» is the suggestion: one tap
  await expect(sug).toHaveAttribute('data-abr-sug', 'keep');
  await round.locator('[data-abr-file]').click();
  await expect(round.locator('[data-abr-pos]')).toHaveText(T('{n} of {total}', { n: 3, total: 4 }));
  // 3: skip
  await round.locator('[data-abr-skip]').click();
  await expect(round.locator('[data-abr-text]')).toHaveText('test_data_gtp_ alter Zettel');
  // 4: delete, asked first
  await round.locator('[data-abr-delete]').click();
  await page.getByTestId('ask-delete').getByRole('button', { name: T('Delete'), exact: true }).click();
  const end = page.locator('[data-sort-end]');
  await expect(end).toBeVisible();
  await expect(end.getByRole('heading')).toHaveText(T('Round done'));
  await expect(end.locator('[data-abr-sum]')).toHaveText(
    `${T('{n} filed', { n: 1 })} · ${T('{n} kept', { n: 1 })} · ${T('{n} deleted', { n: 1 })} · ${T('{n} skipped|round', { n: 1 })}`,
  );
  await expect(end.locator('[data-abr-home]')).toHaveAttribute('href', '#/');
  await end.locator('[data-abr-back]').click();
  // back in the list: only the skipped note waits; one note is not a round
  await expect(page.locator('[data-note-id="test_data_gtp_r3"]').first()).toBeVisible();
  await expect(page.locator('[data-round-start]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Sorting round: a chip opens another target, Pause goes back to the list', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info, { data: withNotes() });
  await page.goto('./#/inbox');
  await page.locator('[data-round-go]').click();
  const round = page.locator('[data-sort-round]');
  await expect(round.locator('[data-abr-chip]')).toHaveCount(4);
  await round.locator('[data-abr-chip="tour"]').click();
  const sheet = page.locator('dialog.fsheet');
  await expect(sheet.getByRole('button', { name: T('Into the debrief') })).toBeVisible();
  await sheet.getByRole('button', { name: T('Cancel') }).click();
  await expect(sheet).toHaveCount(0);
  // nothing filed: still the first note
  await expect(round.locator('[data-abr-pos]')).toHaveText(T('{n} of {total}', { n: 1, total: 4 }));
  await round.locator('[data-abr-pause]').click();
  await expect(round).toHaveCount(0);
  await expect(page.locator('[data-round-start]')).toContainText(T('{n} notes are waiting', { n: 4 }));
  expect(errors).toEqual([]);
});
