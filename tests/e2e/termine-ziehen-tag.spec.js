// «Termine ziehen» (Noah 24.11.2026 «1a 2b 3a 4a», «2+3 dazu») in «Mein Tag» (#/day): the page uses the shared pull block
// (src/lib/ui/timedrag.js). An own entry is pulled by its body (mouse: pull; finger: press and hold, then pull) to a new time;
// an entry without a time and a unit of the training plan are pulled onto the chip of another day; «Move all …» moves
// everything that can move to another day with one Undo. German, fictional data only, clock fixed (Tuesday 13 Oct 2026).
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const TODAY = '2026-10-13';
const D0 = `${TODAY}T09:00:00+02:00`;
const addDays = (day, n) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const TOMORROW = addDays(TODAY, 1);

const ITEMS = [
  { id: 'wi1', kind: 'date', title: 'Zahnarzt', day: TODAY, time: '12:00', mins: 45 },
  { id: 'wi2', kind: 'todo', title: 'Einkaufen', day: TODAY, time: '17:30', mins: 30 },
  { id: 'wi3', kind: 'todo', title: 'Garage anrufen', day: TODAY, time: '' },
];
const PLAN = { sessions: [{ id: 'ss1', day: TODAY, kind: 'run', name: 'Lockerer Lauf', mins: 40, zone: 2 }] };

async function open(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: page.viewportSize().width, height: 2000 }); // the chips and the entries in view together
  await page.goto('./#/day');
  await page.waitForSelector('h1');
  await page.evaluate(
    async ([items, plan]) => {
      const db = await new Promise((res, rej) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      });
      await new Promise((res, rej) => {
        const tx = db.transaction('settings', 'readwrite');
        tx.objectStore('settings').put({ key: 'week.items', value: items });
        tx.objectStore('settings').put({ key: 'training.plan', value: plan });
        tx.oncomplete = res;
        tx.onerror = () => rej(tx.error);
      });
      db.close();
    },
    [ITEMS, PLAN],
  );
  await page.reload();
  return errors;
}

/** Pull from one point to another: the mouse on a computer, press-hold-move with a finger on a phone. */
async function pull(page, info, from, to) {
  if (info.project.name !== 'phone') {
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x + (to.x - from.x) / 2, from.y + (to.y - from.y) / 2, { steps: 4 });
    await page.mouse.move(to.x, to.y, { steps: 6 });
    await page.mouse.up();
    return;
  }
  const cdp = await page.context().newCDPSession(page);
  const pt = (p) => [{ x: p.x, y: p.y }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(from) });
  await page.waitForTimeout(700); // the hold: the entry lifts
  for (let i = 1; i <= 8; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt({ x: from.x + ((to.x - from.x) * i) / 8, y: from.y + ((to.y - from.y) * i) / 8 }) });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
const mid = (b) => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 });

test('Termine ziehen Mein Tag: an entry is pulled by its body to a new time, Undo takes it back', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const blk = page.locator('[data-entry="wi1"]'); // Zahnarzt 12:00, 45 min
  await expect(blk).toContainText('12:00–12:45');
  const b = await blk.boundingBox();
  // not the grip: the body of the entry; an hour with an entry is 72 px, so 72 px later = one hour later
  const from = { x: b.x + 20, y: b.y + b.height / 2 };
  await pull(page, info, from, { x: from.x, y: from.y + 72 });
  await expect(blk).toContainText('13:00–13:45');
  await expect(page.locator('[data-move-sheet], [data-entry-sheet]')).toHaveCount(0); // the pull did not open the entry
  await page.locator('.rtoast').getByRole('button', { name: T('Undo') }).click();
  await expect(blk).toContainText('12:00–12:45');
  expect(errors).toEqual([]);
});

test('Termine ziehen Mein Tag: an entry without a time and a unit of the plan are pulled onto another day, Undo', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const chip = () => page.locator(`.chip[data-day="${TOMORROW}"]`).boundingBox();
  const garage = page.locator('[data-entry="wi3"]');
  await expect(garage).toBeVisible();
  await pull(page, info, mid(await garage.boundingBox()), mid(await chip()));
  await expect(garage).toHaveCount(0);
  await page.locator('.rtoast').getByRole('button', { name: T('Undo') }).click();
  await expect(garage).toHaveCount(1);

  const unit = page.locator('[data-entry="tr:ss1"]');
  await expect(unit).toBeVisible();
  await pull(page, info, mid(await unit.boundingBox()), mid(await chip()));
  await expect(unit).toHaveCount(0);
  await page.locator(`.chip[data-day="${TOMORROW}"]`).click();
  await expect(page.locator('[data-entry="tr:ss1"]')).toHaveCount(1);
  await page.locator(`.chip[data-day="${TODAY}"]`).click();
  await page.locator('.rtoast').getByRole('button', { name: T('Undo') }).click();
  await expect(page.locator('[data-entry="tr:ss1"]')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('Termine ziehen Mein Tag: «Move all …» moves the whole day to tomorrow, one Undo', async ({ page, context }) => {
  const errors = await open(page, context);
  const all = page.locator('[data-day-shift]');
  await expect(all).toBeVisible();
  await all.click();
  const shift = page.locator('[data-shift-sheet]');
  await expect(shift).toBeVisible();
  await expect(shift.locator('[data-shift-entry]')).toHaveCount(4); // three own entries and the unit
  await shift.locator('[data-shift-go]').click();
  await expect(page.locator('[data-entry]')).toHaveCount(0);
  await page.locator('.rtoast').getByRole('button', { name: T('Undo') }).first().click();
  await expect(page.locator('[data-entry="wi1"]')).toHaveCount(1);
  await expect(page.locator('[data-entry="tr:ss1"]')).toHaveCount(1);
  await page.locator(`.chip[data-day="${TOMORROW}"]`).click();
  await expect(page.locator('[data-entry="wi1"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
