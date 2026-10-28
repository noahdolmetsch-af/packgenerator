/**
 * Fixed clock for the browser tests (Noah 26.10.2026 «1a», test proposal T2).
 *
 * The app changes by the hour (Heute's evening block, «Gute Nacht» on Unterwegs, morning checks). A test
 * that ran green at midday could go red in the evening (#263 on 26.10.2026). So every spec that does not
 * set its own clock imports `test` from here: the page starts at 12:00 Europe/Zurich of the real day
 * (dates stay «today», so the fixtures keep working) and the time then runs on normally.
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

// The test side too: fixtures that write «now» or «today» from here agree with the page.
const OFFSET = process.env.E2E_REAL_CLOCK ? 0 : noonToday().getTime() - Date.now();

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
    globalThis.__pgShift = 0;
  },
});
