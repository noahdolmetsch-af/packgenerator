// «Alltag sichtbar» (Noah 24.10.2026 «1a»): «Heute fällig» on Heute, right under «Dein Körper heute», shows only what
// is really due today (a late to-do, a birthday today, a plant to water); a tap opens Planen › Merken.
// Fictional data (home0460-fixture.js; Friday 9 October 2026, 09:00). Then the five tour-free places: the Merken tab
// in Planen, the quick links on a bike's Setup page and on Material.
import { test, expect } from './clock.js';
import { openHome, homeFixture, day } from './home0460-fixture.js';

test('Heute faellig: due to-do, birthday and plant under the body check, a tap opens Merken', async ({ page, context }, info) => {
  const d = homeFixture();
  const md = day(0).slice(5);
  const merken = [
    { id: 'test_data_hf_1', text: 'Velo putzen', due: day(-2), created: `${day(-5)}T08:00:00Z`, doneAt: null },
    { id: 'test_data_hf_2', text: 'Brief schreiben', due: day(5), created: `${day(-5)}T08:00:00Z`, doneAt: null },
    { id: 'test_data_hf_3', kind: 'birthday', area: 'birthday', text: 'Mia', bday: { md, year: 1990 }, created: `${day(-5)}T08:00:00Z`, doneAt: null },
    { id: 'test_data_hf_4', kind: 'plant', area: 'plant', text: 'Basilikum', plant: { every: 3, last: day(-4) }, created: `${day(-5)}T08:00:00Z`, doneAt: null },
  ];
  const row = d.tables.settings.find((x) => x.key === 'merken');
  if (row) row.value = merken;
  else d.tables.settings.push({ key: 'merken', value: merken });
  const T = await openHome(page, context, info, { data: d });
  const ab = page.locator('[data-section="abfragen"]');
  if (await ab.isVisible().catch(() => false)) await ab.locator('[data-ab-later]').click();
  const due = page.locator('[data-due-today]');
  await expect(due.getByRole('heading', { name: T('Due today') })).toBeVisible();
  await expect(due.locator('[data-due="todo"]')).toContainText('Velo putzen');
  await expect(due.locator('[data-due="birthday"]')).toContainText('Mia');
  await expect(due.locator('[data-due="plant"]')).toContainText('Basilikum');
  await expect(due).not.toContainText('Brief schreiben');
  // it stands right under «Dein Körper heute»
  const [bodyBottom, dueTop] = await Promise.all([
    page.locator('[data-section="body"]').evaluate((el) => el.getBoundingClientRect().bottom),
    due.evaluate((el) => el.getBoundingClientRect().top),
  ]);
  expect(dueTop).toBeGreaterThanOrEqual(bodyBottom - 1);
  await page.locator('[data-section="body"]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('heute-faellig.png') });
  await due.locator('[data-due="todo"]').click();
  await expect(page).toHaveURL(/#\/calendar/);
  await expect(page.getByRole('link', { name: T('Remember|tab') }).first()).toBeVisible();
});
