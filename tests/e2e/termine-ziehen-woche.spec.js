// «Termine ziehen» (Noah 24.11.2026 «1a 2b 3a 4a») in «Woche planen» (#/week): an own to-do is moved to another day with
// «Move …» (phone and computer) or by pulling it (computer: mouse); a suggestion pulled out of «Still to plan» onto a day is
// planned for that day. Every move offers Undo. Fictional data (home0460-fixture.js); the clock stands on Friday 9 October 2026.
import { test, expect } from './clock.js';
import { openHome, homeFixture, day } from './home0460-fixture.js';

function fixture() {
  const data = homeFixture();
  data.tables.settings.push({
    key: 'week.items',
    value: [
      { id: 'test_data_gtp_t1', kind: 'todo', title: 'test_data_gtp_ Schlauch bestellen', day: day(0) },
      { id: 'test_data_gtp_t2', kind: 'todo', title: 'test_data_gtp_ Fotos sichern', day: null },
      { id: 'test_data_gtp_t3', kind: 'todo', title: 'test_data_gtp_ Kette ölen', day: day(0) },
    ],
  });
  return data;
}

test('Termine ziehen Woche: Move window and Undo, pulling onto a day, a suggestion pulled onto a day', async ({ page, context }, info) => {
  const T = await openHome(page, context, info, { data: fixture() });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/week');
  const entry = (id) => page.locator(`[data-entry="test_data_gtp_${id}"]`);
  await expect(entry('t1')).toBeVisible();

  // «Move …»: day and time in a small window (the way without dragging)
  await page.locator('[data-entry-move="test_data_gtp_t1"]').click();
  const sheet = page.locator('[data-move-sheet]');
  await expect(sheet).toBeVisible();
  await sheet.getByLabel(T('Day')).fill(day(1));
  await sheet.getByRole('button', { name: T('Move|button') }).click();
  await expect(page.locator(`[data-day="${day(1)}"] [data-entry="test_data_gtp_t1"]`)).toHaveCount(1);
  await expect(page.locator(`[data-day="${day(0)}"] [data-entry="test_data_gtp_t1"]`)).toHaveCount(0);
  await page.locator('.rtoast').getByRole('button', { name: T('Undo') }).click();
  await expect(page.locator(`[data-day="${day(0)}"] [data-entry="test_data_gtp_t1"]`)).toHaveCount(1);

  // «Copy»: the same window makes a copy on another day and leaves the first one
  await page.locator('[data-entry-move="test_data_gtp_t1"]').click();
  await page.locator('[data-move-sheet]').getByLabel(T('Day')).fill(day(2));
  await page.locator('[data-move-copy]').click();
  await expect(page.locator(`[data-day="${day(2)}"] [data-entry]`).filter({ hasText: 'Schlauch bestellen' })).toHaveCount(1);
  await expect(page.locator(`[data-day="${day(0)}"] [data-entry="test_data_gtp_t1"]`)).toHaveCount(1);
  await page.locator('.rtoast').getByRole('button', { name: T('Undo') }).first().click();
  await expect(page.locator('[data-entry]').filter({ hasText: 'Schlauch bestellen' })).toHaveCount(1);

  // «Move all …»: when a day falls out, everything that can move goes to another day together (tomorrow is preset), one Undo
  await page.locator(`[data-day-shift="${day(0)}"]`).click();
  const shift = page.locator('[data-shift-sheet]');
  await expect(shift).toBeVisible();
  await expect(shift.locator('[data-shift-entry]')).toHaveCount(2);
  await shift.locator('[data-shift-go]').click();
  await expect(page.locator(`[data-day="${day(1)}"] [data-entry^="test_data_gtp_t"]`)).toHaveCount(2);
  await expect(page.locator(`[data-day="${day(0)}"] [data-entry^="test_data_gtp_t"]`)).toHaveCount(0);
  await page.locator('.rtoast').getByRole('button', { name: T('Undo') }).first().click();
  await expect(page.locator(`[data-day="${day(0)}"] [data-entry^="test_data_gtp_t"]`)).toHaveCount(2);

  if (info.project.name === 'desktop') {
    // the mouse pulls the to-do onto the column of the next day
    const b = await entry('t1').boundingBox();
    const col = await page.locator(`.dc[data-day="${day(1)}"]`).boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.down();
    await page.mouse.move(col.x + col.width / 2, col.y + 120, { steps: 8 });
    await page.mouse.up();
    await expect(page.locator(`[data-day="${day(1)}"] [data-entry="test_data_gtp_t1"]`)).toHaveCount(1);
    await page.locator('.rtoast').getByRole('button', { name: T('Undo') }).first().click();
    await expect(page.locator(`[data-day="${day(0)}"] [data-entry="test_data_gtp_t1"]`)).toHaveCount(1);

    // a suggestion pulled out of «Still to plan» onto a day is planned for that day
    const sg = page.locator('[data-sg-toggle]');
    if ((await sg.getAttribute('aria-expanded')) !== 'true') await sg.click();
    const row = page.locator('[data-sugg="todo:test_data_gtp_t2"]');
    await row.scrollIntoViewIfNeeded();
    const r = await row.boundingBox();
    const target = page.locator(`.dc[data-day="${day(2)}"]`);
    await target.scrollIntoViewIfNeeded();
    const c2 = await target.boundingBox();
    const r2 = await row.boundingBox();
    expect(r2).not.toBeNull();
    await page.mouse.move(r2.x + 20, r2.y + r2.height / 2);
    await page.mouse.down();
    await page.mouse.move(c2.x + c2.width / 2, c2.y + 100, { steps: 8 });
    await page.mouse.up();
    await expect(page.locator(`[data-day="${day(2)}"] [data-entry="test_data_gtp_t2"]`)).toHaveCount(1);
    expect(r).not.toBeNull();
  }
  expect(errors).toEqual([]);
});
