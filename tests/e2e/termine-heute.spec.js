// Paket G #226 «Feste Termine unter Heute im Blick»: the morning check lists today's fixed dates
// (Aktiv › Woche) and the timed Google appointments on this device, by time. Fictional data only.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
const FIXED_KEY = 'flow.fixed'; // src/lib/flowweek.js FIXED_KEY (that module needs Svelte runes)
import { ready } from './settle.js';
import { put } from './aktiv-fixture.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const DAY = '2026-10-15'; // a Thursday (weekday 4)

test('morning check: today at a glance shows the fixed date and the Google appointment by time', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(`${DAY}T07:30:00+02:00`) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/');
  await ready(page);
  await expect(page.locator('[data-section="flow"]')).toBeVisible();
  await put(page, {
    settings: [{ key: FIXED_KEY, value: [{ actId: 'meditation', wd: 4, time: '18:30', minutes: 30 }, { actId: 'meditation', wd: 5, time: '07:00' }] }],
    gEvents: [
      { id: 'primary|t1', gid: 't1', cal: 'primary', title: 'Zahnarzt Test', allDay: false, day: DAY, start: `${DAY}T09:15:00+02:00`, end: `${DAY}T10:00:00+02:00` },
      { id: 'primary|t2', gid: 't2', cal: 'primary', title: 'Ganzer Tag Test', allDay: true, day: DAY },
      { id: 'primary|t3', gid: 't3', cal: 'primary', title: 'Morgen Test', allDay: false, day: '2026-10-16', start: '2026-10-16T09:00:00+02:00' },
    ],
  });
  await page.goto('./#/check/morning');
  await ready(page);
  const rows = page.locator('[data-row="appt"]');
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText('09:15 · Zahnarzt Test');
  await expect(rows.nth(0)).toContainText(T('Google calendar'));
  await expect(rows.nth(1)).toContainText('18:30');
  await expect(rows.nth(1)).toContainText(T('fixed date'));
  expect(errors).toEqual([]);
});
