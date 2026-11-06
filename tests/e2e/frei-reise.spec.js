// «Reise-Wünsche» › «Zur Traumtour machen» (Noah 05.11.2026 «6a»): a wish becomes a dream trip in one tap and the
// card shows the months that fit. German, phone 390 and computer 1440, fictional data only. The clock stands on
// Friday 9 October 2026 (home0460-fixture); SHOTS=<folder> saves screenshots.
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
const wish = (id, text, data) => ({ id, kind: 'longing', day: '2026-10-05', at: '2026-10-05T10:00:00.000Z', text, photos: [], data });
const data = () => {
  const d = homeFixture();
  d.tables.frei = [
    wish('test_data_gtp_w1', 'Warm in winter, far from the grey.', { moods: ['space'], dest: 'Tessin' }),
    wish('test_data_gtp_w2', 'Mehr Ruhe im Kopf.', { moods: ['quiet'], dest: '' }),
  ];
  return d;
};

test('a wish with a place shows its season and becomes a dream trip; Undo takes it back', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: data() });
  await page.goto('./#/me/frei/reise');
  const card = page.locator('[data-thought="test_data_gtp_w1"]');
  await expect(card.locator('[data-season]')).toContainText('Passt: Okt–Apr');
  await expect(card.locator('[data-season]')).toContainText('gerade jetzt');
  // no clear hint, no season guessed
  await expect(page.locator('[data-thought="test_data_gtp_w2"] [data-season]')).toHaveCount(0);
  await shot(page, info, 'reise-1-vorher');
  await card.locator('[data-make-dream]').click();
  await expect(card.locator('[data-dream-link]')).toBeVisible();
  const dreams = (await stored(page, 'settings', 'dreams')).value.dreams;
  expect(dreams[0]).toMatchObject({ title: 'Tessin', kind: 'south' });
  await shot(page, info, 'reise-2-traumtour');
  expect(errors).toEqual([]);
});

test('the dream shows up in the dream trips and Undo removes it again', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: data() });
  await page.goto('./#/me/frei/reise');
  const card = page.locator('[data-thought="test_data_gtp_w1"]');
  await card.locator('[data-make-dream]').click();
  await page.getByRole('button', { name: /Rückgängig/ }).first().click();
  await expect(card.locator('[data-make-dream]')).toBeVisible();
  expect(((await stored(page, 'settings', 'dreams'))?.value?.dreams ?? []).length).toBe(0);
  await card.locator('[data-make-dream]').click();
  await card.locator('[data-dream-link]').click();
  await expect(page).toHaveURL(/#\/trips\/dreams/);
  await expect(page.getByText('Tessin').first()).toBeVisible();
});

test('the kind of tour chosen on a wish sets the season', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: data() });
  await page.goto('./#/me/frei/reise');
  await page.locator('[data-thought="test_data_gtp_w2"] [data-thought-open]').click();
  await page.locator('[data-thought-kind]').selectOption('alps');
  await page.locator('[data-sheet-save]').click();
  await expect(page.locator('[data-thought="test_data_gtp_w2"] [data-season]')).toContainText('Jul–Sep');
  await shot(page, info, 'reise-3-art-gewaehlt');
});
