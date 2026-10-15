/**
 * Test trips and archived trips (moved from home/heute.js in 0.161.0, Bugfixes 0.132.2 B1/B2): Noah 1b,
 * trips with «test» in the name count nowhere, so nextTrip() (debrief.js) leaves them out too. No imports.
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
/** A trip with "test" in its name, as isTestName. */
export const isTestTrip = (trip) => isTestName(trip?.title);
/** Archived from Today ("Clean up test trips"): it stays in the data, Today leaves it out. */
export const isArchived = (trip) => !!trip?.archivedAt;
