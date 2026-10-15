/**
 * Test trips and archived trips (moved from home/heute.js in 0.161.0, Bugfixes 0.132.2 B1/B2): Noah 1b,
 * test trips count nowhere, so nextTrip() (debrief.js) leaves them out too. No imports.
 */

/** The prefix of the fictional e2e fixtures; it is not a "test" Noah typed. */
export const FIXTURE_MARK = /test_data_gtp_/gi;
/**
 * "test" at the start of a word (any case: "TEST-Runde", "Testtour", "my test") or glued on with a
 * capital ("realTest", "3hTestLicht"); not inside a word ("Contest", "latest"). 0.161.0 (Bugfixes
 * 0.132.2 B2): one rule for Today and «Clean up test data»; before, Today hid "…TestLicht" (any
 * "test") while the clean-up did not find it, so a trip was neither shown nor offered for tidying.
 */
export const isTestName = (name) => {
  const s = String(name ?? '').replace(FIXTURE_MARK, '');
  return /(^|[^\p{L}])test/iu.test(s) || /\p{Ll}T(est|EST)/u.test(s);
};
/**
 * A trip with the «Test trip» switch on (Noah H3a, 15.10.2026: only the switch hides a trip, a name
 * like "Contest" or "Test ride Jura" never does). The update testTrips2026 sets the switch once on the
 * trips whose name isTestName matched before, so nothing reappears; Noah can turn it off per trip.
 */
export const isTestTrip = (trip) => trip?.testTrip === true;
/** Archived from Today ("Clean up test trips"): it stays in the data, Today leaves it out. */
export const isArchived = (trip) => !!trip?.archivedAt;
