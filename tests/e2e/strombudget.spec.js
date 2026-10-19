// Strombudget pro Tour und Powerbank-Rechner (Noah 19.10.2026 «2a»), in German, with the fictional data of
// home0460-fixture.js (clock on Friday 9 October 2026). The trip «Herbstrunde» becomes 4 days in a bivouac
// with phone, front light and bike computer.
// 1. Material › Strom: the 20'000 power bank is enough, the 10'000 not; «Auf die Packliste» adds it.
// 2. With a socket every night: no power bank needed, and the charger with 3 sockets.
// 3. A device without values says «geschätzt»; its window has «Akku (mAh)».
// 4. Packen › «Am Vorabend laden» shows the same answer in one line.
import { test, expect } from '@playwright/test';
import { openHome, homeFixture } from './home0460-fixture.js';

const ID = 'test_data_gtp_Herbstrunde';
const fixture = () => {
  const data = homeFixture();
  const own = (id, name, category, weightG, extra = {}) => ({ id, name, category, weightG, qty: 1, ownership: 'owned', domains: ['bikepacking'], defaultBag: 'top', ...extra });
  data.tables.items.push(
    own('test_data_sb_phone', 'test_data_sb_ Handy', 'elec', 200),
    own('test_data_sb_light', 'test_data_sb_ Frontlicht', 'light', 150),
    own('test_data_sb_edge', 'test_data_sb_ Velocomputer', 'elec', 130, { mah: 2000, runH: 20 }),
    own('test_data_sb_bank10', 'test_data_sb_ Powerbank 10000', 'elec', 150),
    own('test_data_sb_bank20', 'test_data_sb_ Powerbank 20000', 'elec', 290),
    own('test_data_sb_plug', 'test_data_sb_ Stecker 3-fach', 'elec', 130),
  );
  const t = data.tables.trips.find((x) => x.id === ID);
  t.days = 4;
  t.overnight = 'outdoor';
  t.entries = [...t.entries, ...['test_data_sb_phone', 'test_data_sb_light', 'test_data_sb_edge'].map((itemId) => ({ itemId, slot: 'top', qty: 1, packed: false }))];
  return data;
};

test('Strombudget: power bank, charger, estimated values, line in Pack', async ({ page, context }, info) => {
  test.setTimeout(120_000);
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  const T = await openHome(page, context, info, { data: fixture() });
  const main = page.locator('main');

  // 1. four days without a socket
  await page.goto(`./#/gear/power?trip=${ID}`);
  await expect(main.getByRole('heading', { level: 1, name: T('Power|electric') })).toBeVisible();
  const res = main.locator('[data-power-result]');
  await expect(res.getByText(T('Take: {names}', { names: 'test_data_sb_ Powerbank 20000' }))).toBeVisible();
  await res.getByRole('button', { name: T('Put on the packing list') }).click();
  await expect(res.getByRole('button', { name: T('Put on the packing list') })).toHaveCount(0);

  // 2. a socket every night
  await main.getByLabel(T('Nights with a socket')).fill('3');
  await main.getByLabel(T('Nights with a socket')).press('Enter');
  await expect(res.getByText(T('No power bank needed.'))).toBeVisible();
  await expect(res.getByText(T('Charger: {name}', { name: 'test_data_sb_ Stecker 3-fach' }))).toBeVisible();
  await main.getByRole('button', { name: T('Use the values from the trip') }).click();
  await expect(res.getByText(T('Take: {names}', { names: 'test_data_sb_ Powerbank 20000' }))).toBeVisible();

  // 3. the phone has no own values: estimated, and its window asks for the battery
  const phone = main.locator('li', { hasText: 'test_data_sb_ Handy' });
  await expect(phone.getByText(T('estimated'))).toBeVisible();
  await phone.getByRole('button', { name: T('Add values') }).click();
  const dlg = page.getByRole('dialog').last();
  await expect(dlg.getByLabel(T('Battery (mAh)'))).toBeAttached();
  await page.keyboard.press('Escape');

  // 4. the same answer in Pack
  await page.evaluate((id) => localStorage.setItem('pack.currentTrip', id), ID); // Pack opens this trip
  await page.goto('./#/pack?charge');
  await expect(page.locator('[data-power-line]').first()).toContainText(T('Power: take {names}.', { names: 'test_data_sb_ Powerbank 20000' }));

  expect(errors).toEqual([]);
});
