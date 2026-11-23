/**
 * The real Date for specs that read the day in Node and whose page runs on the real day (no fixed clock in the page).
 *
 * 23.11.2026: tests/e2e/clock.js shifts `Date` in the whole Node worker to a mid-month Wednesday and leaves it shifted
 * after every test that used the fixture (the next spec file builds its dates at the top while it loads, see the end of
 * clock.js). A spec that imports `test` straight from '@playwright/test', does not fix the page's clock and runs in
 * such a worker after one with the fixture, then computed «today» and «tomorrow» in Node on the test day while its page
 * stood on the real day: pf.spec (short ride «tomorrow» was in the past) and live-speichern (the ride, dated by the real
 * GPS time, was «in the future» of the page clock) went red in the full run, and green again in a fresh worker (the
 * retry, or alone). Their dates come from here: the real time, whatever came before.
 */
export const RealDate = globalThis.__realDate ?? Date;
export const realNow = () => RealDate.now();
