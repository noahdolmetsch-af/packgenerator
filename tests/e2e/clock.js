/**
 * Fixed clock for the browser tests (Noah 26.10.2026 «1a», test proposal T2).
 *
 * The app changes by the hour (Heute's evening block, «Gute Nacht» on Unterwegs, morning checks). A test
 * that ran green at midday could go red in the evening (#263 on 26.10.2026). So every spec that does not
 * set its own clock imports `test` from here: the page starts at 12:00 Europe/Zurich of the real day
 * on a fixed mid-month Wednesday of the real month (Noah 01.11.2026 «1a»: no test depends on the day of the month or
 * on the weekday; before, the 1st of a month turned «two days ago» into last month and broke most PRs) and the time then runs on normally.
 * It does not fake the timers: it shifts Date by a fixed amount, in the page and in the test itself.
 * A spec (or a fixture helper) that tests a time of day calls page.clock.install / setFixedTime /
 * setSystemTime: then the shift switches off for that test and Playwright's clock alone counts.
 * A spec can also turn it off with test.use({ fixedNoon: false }).
 * The guard test tests/clock-fixture.test.js checks that no spec is left without a clock.
 */
import { test as base } from '@playwright/test';

export * from '@playwright/test';

/** 12:00 in Europe/Zurich on the day it is there now (calendar-day arithmetic, no 864e5). */
export function noonToday(now = new Date(), timeZone = 'Europe/Zurich') {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', timeZoneName: 'longOffset' }).formatToParts(now).map((p) => [p.type, p.value]));
  const offset = parts.timeZoneName.replace('GMT', '') || '+00:00';
  return new Date(`${parts.year}-${parts.month}-${parts.day}T12:00:00${offset}`);
}

/**
 * Shifts Date by `offset` ms in this JavaScript world: Date.now() and new Date() read «real time + offset», so
 * time keeps running and timers stay real (page.clock.install fakes the timers, which broke some pages).
 * Every date is still a real Date (same prototype), so `instanceof Date` and dates from IndexedDB keep working.
 */
export function shiftDate(offset) {
  globalThis.__pgShift = offset;
  if (!offset || globalThis.__realDate) return;
  const Real = globalThis.Date;
  const shift = () => globalThis.__pgShift || 0;
  function Shifted(...a) {
    if (!new.target) return new Real(Real.now() + shift()).toString();
    return a.length ? new Real(...a) : new Real(Real.now() + shift());
  }
  Shifted.prototype = Real.prototype;
  Shifted.now = () => Real.now() + shift();
  Shifted.parse = Real.parse;
  Shifted.UTC = Real.UTC;
  globalThis.__realDate = Real;
  globalThis.Date = Shifted;
}

/** The calendar day in Zurich, n days from the test day (calendar arithmetic, never now + n × 24 h). */
export function zurichDay(n = 0) {
  const d = new Date(`${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * 12:00 in Zurich on the first Wednesday on or after the 15th of the Zurich month it is now: always in the middle of
 * the month (days 15–21) and never a Sunday, a month start or an end of month.
 */
export function midMonthNoon(now = new Date(), timeZone = 'Europe/Zurich') {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit' }).formatToParts(now).map((p) => [p.type, p.value]));
  const day15 = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, 15, 12));
  const ahead = (3 - day15.getUTCDay() + 7) % 7; // 3 = Wednesday
  return noonToday(new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, 15 + ahead, 12)), timeZone);
}

// The test side too: fixtures that write «now» or «today» from here agree with the page.
const OFFSET = process.env.E2E_REAL_CLOCK ? 0 : midMonthNoon().getTime() - Date.now();
// Already at import: dates a spec builds at the top of the file («day(-1)») must agree with the page too. With the old
// «today at noon» the gap was under a day and went unseen; with a mid-month day it is up to 30 days.
shiftDate(OFFSET);

/**
 * For a context a spec makes itself (browser.newContext in beforeAll …): it does not get the fixture's page, so its
 * pages would run on the real day while the data (built on the test day) is for another one.
 */
export async function shiftContext(context) {
  if (OFFSET) await context.addInitScript(shiftDate, OFFSET);
}

/** Puts the real Date back (before Playwright's clock goes in, so its clock is the only one). */
function unshift() {
  globalThis.__pgShift = 0;
  if (globalThis.__realDate) globalThis.Date = globalThis.__realDate;
  delete globalThis.__realDate;
}

const OWN_CLOCK = ['install', 'setFixedTime', 'setSystemTime'];

export const test = base.extend({
  fixedNoon: [true, { option: true }],
  page: async ({ page, fixedNoon }, use) => {
    const on = fixedNoon && OFFSET;
    shiftDate(on ? OFFSET : 0);
    if (on) {
      await page.addInitScript(shiftDate, OFFSET);
      // a test with its own clock: the shift steps aside, here and in the page
      for (const m of OWN_CLOCK) {
        const own = page.clock[m].bind(page.clock);
        page.clock[m] = async (...a) => {
          globalThis.__pgShift = 0;
          await page.addInitScript(unshift);
          await page.evaluate(unshift).catch(() => {});
          return own(...a);
        };
      }
    }
    await use(page);
    // Back to the test day, not to 0: the next spec file in this worker builds its dates at the top of the file
    // (day(1) …) while it loads, after this test, and must see the same day as the page it opens.
    globalThis.__pgShift = process.env.E2E_REAL_CLOCK ? 0 : OFFSET;
  },
});
