// «Erste Nacht» › «Nach der Nacht» (Noah 05.11.2026 «7a»): three questions (sleep, cold, what was missing) and
// the take-over onto the packing list of a real trip, with Undo. German, phone 390 and computer 1440, fictional
// data only. The clock stands on Friday 9 October 2026 (home0460-fixture); SHOTS=<folder> saves screenshots.
import { test, expect } from './clock.js';
import { homeFixture, openHome } from './home0460-fixture.js';

const stored = (page, table, id) =>
  page.evaluate(([table, id]) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(table).objectStore(table).get(id);
      q.onsuccess = () => { r.result.close(); ok(q.result ?? null); };
    };
  }), [table, id]);
async function shot(page, info, name) {
  if (!process.env.SHOTS) return;
  await page.waitForTimeout(11000); // the toast leaves first
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
}

const data = (extra = {}) => {
  const d = homeFixture();
  Object.assign(d.tables, extra);
  return d;
};

test('after the night: three questions, then onto the packing list of the next trip; Undo takes it back', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: data() });
  await page.goto('./#/me/frei/nacht');
  await page.locator('[data-night-step="after"]').click();
  await expect(page.locator('[data-night-three]')).toBeVisible();
  await expect(page.locator('[data-night-take-box]')).toContainText('Beantworte');
  await page.locator('[data-night-sleep="bad"]').click();
  await page.locator('[data-night-cold="yes"]').click();
  await page.locator('[data-night-cold-where]').fill('Füsse und Rücken');
  await page.locator('[data-night-cold-where]').blur();
  await page.locator('[data-night-missing]').fill('test_data_gtp_ Wärmere Mütze\nRain jacket');
  await page.locator('[data-night-missing]').blur();
  await expect(page.locator('[data-night-take-trip] option:checked')).toHaveText('test_data_gtp_ Herbstrunde');
  await shot(page, info, 'nacht-1-fragen');
  const before = await stored(page, 'trips', 'test_data_gtp_Herbstrunde');
  await page.locator('[data-night-take]').click();
  await expect(page.locator('[data-night-taken]')).toContainText('test_data_gtp_ Herbstrunde');
  const after = await stored(page, 'trips', 'test_data_gtp_Herbstrunde');
  expect(after.entries.length).toBe(before.entries.length + 2); // the new hat and the rain jacket (known by name)
  expect(after.planNotes.map((n) => n.text)).toEqual([
    'Erste Nacht: Es war zu kalt. Plane etwas Wärmeres zum Schlafen ein. (Füsse und Rücken)',
    'Erste Nacht: Ich habe schlecht geschlafen. Denk an Matte, Kissen und einen ruhigeren Platz.',
  ]);
  await page.getByRole('button', { name: /Rückgängig/ }).first().click();
  expect((await stored(page, 'trips', 'test_data_gtp_Herbstrunde')).entries.length).toBe(before.entries.length);
  await expect(page.locator('[data-night-taken]')).toHaveCount(0);
  await page.locator('[data-night-take]').click(); // again, for the picture
  await expect(page.locator('[data-night-taken]')).toBeVisible();
  await shot(page, info, 'nacht-2-uebernommen');
  // the answers stay after a reload (they are saved as you go)
  await page.reload();
  await page.locator('[data-night-step="after"]').click();
  await expect(page.locator('[data-night-sleep="bad"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-night-missing]')).toHaveValue('test_data_gtp_ Wärmere Mütze\nRain jacket');
  expect(errors).toEqual([]);
});

test('the packing list choice shows trip names, and without a trip the page says so', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: data({ trips: [], debriefs: [] }) });
  await page.goto('./#/me/frei/nacht');
  await page.locator('[data-night-step="after"]').click();
  await page.locator('[data-night-missing]').fill('Warm hat');
  await page.locator('[data-night-missing]').blur();
  await expect(page.locator('[data-night-take-none] a')).toHaveAttribute('href', '#/trips');
  await shot(page, info, 'nacht-3-ohne-tour');
  await page.locator('[data-night-step="plan"]').click();
  await expect(page.locator('[data-night-trip] option')).toHaveCount(1);
});

test('step two lists the real trip names (not empty labels)', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: data() });
  await page.goto('./#/me/frei/nacht');
  await page.locator('[data-night-step="plan"]').click();
  await expect(page.locator('[data-night-trip] option', { hasText: 'test_data_gtp_ Herbstrunde' })).toHaveCount(1);
});
