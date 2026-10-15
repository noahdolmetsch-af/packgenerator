// «Werte messen» Teil 1 (Noah 15.10.2026, W1–W3 «freigeben», «1a 2b 3a 4a 5a»): a value saved in the
// Pick-up check is «checked at the pick-up» on the Bike pass and «as it should be again» on the next
// Workshop order; a replaced part shows on the Bike pass, the Theft sheet, Warranty and the Repair kit.
import { test, expect } from '@playwright/test';
import { start, fixture, tr, day, table } from './gesamttest/lib.js';

const T = tr('de');
const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);
/** The start of a day as the app writes it in German («10. Okt. 2026» → «10.»). */
const dd = (iso) => `${Number(iso.slice(8))}.`;

/** The fictional data, with a new chain on the hardtail five days ago. */
function data() {
  const d = structuredClone(fixture().data);
  const bike = d.tables.bikes.find((b) => /hardtail/.test(b.id));
  bike.parts.find((p) => p.key === 'chain').history.push({ date: day(-5), km: 6320, action: 'replace', result: 'done', by: 'shop', value: null });
  return { d, id: bike.id };
}

test('W1 W2: a value of the Pick-up check is checked on the Bike pass and comes back on the Workshop order', async ({ page, context }, info) => {
  const { d, id } = data();
  const errors = await start(page, context, info, { data: d });
  await page.goto(`./#/bikes?bike=${id}&sheet=pickup`);
  const card = page.locator('.paper li.vcard').filter({ hasText: T('Saddle height') });
  await card.getByRole('button').click();
  await card.locator('input').fill('745');
  await card.locator('input').press('Enter');
  await expect(card).toHaveClass(/done/);
  await expect.poll(async () => (await table(page, 'bikes')).find((b) => b.id === id).sheets?.pickup?.checked).toBe(day());

  // W1: the Bike pass says when it was checked
  await page.goto(`./#/bikes?bike=${id}&sheet=pass`);
  const row = page.locator('.paper .vr').filter({ hasText: T('Saddle height') });
  await expect(row.locator('.vnote')).toContainText(fill(T('checked at the pick-up {date}'), { date: '' }).trim());
  // W3: the new chain, with the km of the one before
  const chain = page.locator('.paper .vr').filter({ has: page.getByRole('term').getByText(T('Chain'), { exact: true }) });
  const since = T('new since {date} · the one before rode {km} km').split(/\{\w+\}/).map((x) => x.replace(/[.*+?^$()|[\]\\]/g, '\\$&'));
  await expect(chain.locator('.vnote')).toHaveText(new RegExp(since.join('.+')));

  // W2: the next Workshop order lists the value as «as it should be again»
  await page.goto(`./#/bikes?bike=${id}&sheet=order`);
  const again = page.locator('section').filter({ has: page.getByRole('heading', { name: T('As it should be again') }) });
  await expect(again).toBeVisible();
  await expect(again).toContainText('745');
  expect(errors).toEqual([]);
});

test('W3: a replaced part shows on the Theft sheet, under Warranty and in the Repair kit', async ({ page, context }, info) => {
  const { d, id } = data();
  const errors = await start(page, context, info, { data: d });
  await page.goto(`./#/bikes?bike=${id}&sheet=theft`);
  await expect(page.locator('.paper')).toContainText(fill(T('{part} replaced, {date}'), { part: T('Chain'), date: dd(day(-5)) }));
  await page.goto(`./#/bikes?bike=${id}&sheet=warranty`);
  await expect(page.locator('.paper')).toContainText(fill(T('{part} (replaced)'), { part: T('Chain') }));
  await page.goto(`./#/bikes?bike=${id}&sheet=kit`);
  await expect(page.locator('.paper')).toContainText(fill(T('New chain since {date}: does the quick link still fit?'), { date: dd(day(-5)) }).split(':')[0]);
  expect(errors).toEqual([]);
});
