// «Was die Woche wirklich hält» (Noah 23.11.2026 «4a»): over «Meine Woche» stands «geplant X von 15 Std.» with the suggestions of the weekly
// plan counted in, and the weekly plan says per sport «Diese Woche 2 von 3».
// German, phone + desktop, fictional data only, clock fixed (Wednesday 2 Dec 2026, Europe/Zurich).
import { test, expect } from '@playwright/test';
import { ready } from './settle.js';

async function seed(page, rows) {
  await page.evaluate(
    (list) =>
      new Promise((ok) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const tx = r.result.transaction([...new Set(list.map((x) => x[0]))], 'readwrite');
          for (const [store, rec] of list) tx.objectStore(store).put(rec);
          tx.oncomplete = () => (r.result.close(), ok());
        };
      }),
    rows,
  );
}
const tp = (id, day, mins, name) => ({ id, day, kind: 'bike', name, mins, zone: 2, src: 'tp', time: '07:30' });
const hm = (txt) => { const m = /von (\d+):(\d+) Std/.exec(txt); return m ? Number(m[1]) + Number(m[2]) / 60 : null; };
const planned = (txt) => { const m = /geplant (\d+):(\d+) von/.exec(txt); return m ? Number(m[1]) + Number(m[2]) / 60 : null; };

test('Meine Woche: «geplant» counts the suggestions of the weekly plan, the weekly plan says «Diese Woche a von b»', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.setFixedTime(new Date('2026-12-02T09:00:00+01:00'));
  await page.goto('./#/flow/wochenplan');
  await ready(page);
  await page.locator('[data-wochenplan] [data-empty] button').first().click();
  await expect(page.locator('[data-wp-hvalue]')).toHaveText('15 Std');
  // every sport that is planned says how many of its goal the week holds
  await expect(page.locator('[data-goal="tennis"]')).toContainText('Diese Woche 3 von 3');
  await expect(page.locator('[data-goal="yoga"]')).toContainText('Diese Woche 2 von 2');
  // Meine Woche: the line counts the suggestions, near the goal of the weekly plan
  await page.goto('./#/flow/training');
  await ready(page);
  const line = page.locator('[data-week-range]');
  await expect(line).toContainText('von 15:00 Std.');
  const own = planned(await line.innerText());
  expect(own).toBeGreaterThan(8);
  // a week with TrainingPeaks: it counts as well, the goal stays
  await seed(page, [['settings', { key: 'training.plan', value: { sessions: [tp('tp-a', '2026-12-03', 120, 'Test Ausdauer'), tp('tp-b', '2026-12-05', 240, 'Test Langer Tag')] } }]]);
  await page.reload();
  await ready(page);
  const txt = await page.locator('[data-week-range]').innerText();
  expect(hm(txt)).toBe(15);
  expect(planned(txt)).toBeGreaterThan(own - 6);
  await page.goto('./#/flow/wochenplan');
  await ready(page);
  await expect(page.locator('[data-goal="bikeOut"]')).toContainText('Diese Woche 0 von 1');
  await expect(page.locator('[data-goal="bikeIn"]')).toContainText('Diese Woche 0 von 1');
  // Spielerplus: the team dates are the ice hockey; the weekly plan says so and the line over the week counts them
  const day = (n) => ((x) => (x.setUTCDate(x.getUTCDate() + n), x.toISOString().slice(0, 10)))(new Date('2026-11-30T12:00:00Z'));
  await seed(page, [['settings', { key: 'spielerplus', value: { cals: [{ id: 'c1', name: 'Team', url: 'https://www.spielerplus.de/events/ics?t=aaa&u=bbb', on: true, act: 'hockey', fetchedAt: '2026-12-01T08:00:00.000Z', error: '', events: [
    { id: 'e1', title: 'Training', day: day(1), from: '20:30', to: '22:00', allDay: false, where: '' },
    { id: 'e2', title: 'Spiel', day: day(5), from: '18:00', to: '19:30', allDay: false, where: '' }] }] } }]]);
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-goal="hockey"]')).toContainText('Diese Woche 2 aus dem Spielplan');
  await page.goto('./#/flow/training');
  await ready(page);
  await expect(page.locator('[data-week-range]')).toContainText('von 15:00 Std.');
  expect(errors).toEqual([]);
});
