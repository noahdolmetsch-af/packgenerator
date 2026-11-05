// «Versteckte Funktionen» (Noah 03.11.2026 «2a 5a»): every function's page is at most 3 taps from Heute:
// one tap in the bar (computer: sidebar) and 2 more, without the search, Quick Links or the catalogue.
// tests/e2e/tippzahl.spec.js counts the taps on the phone; a link inside a closed fold or window counts 2.

/** Taps from Heute to a function's page (HOME in heimat.js), the bar tap included. */
export const MAX_TAPS = 3;

/** Pages that only find others: a way through them does not count. */
export const FINDERS = ['#/quick', '#/features', '#/me/handbook', '#/me/karte'];

/**
 * Pages that are still further away (03.11.2026). Only gets shorter: the robot fails when one of them is
 * near enough, so it is taken off, and tests/tippzahl.test.js keeps the list from growing.
 */
export const TAP_GAPS = [
  '#/bikes?tab=setup',
  '#/live',
  '#/me/data?mehr',
  '#/me/data?names',
  '#/me/pros',
  '#/me/regeln',
  '#/notes/zusammenhang',
  '#/notes?open=:note',
  '#/pack?new',
  '#/ski/after',
  '#/ski/check',
  '#/ski/start',
  '#/tagebuch/:entry',
];

/**
 * Pages in TAP_GAPS whose distance depends on the data: «#/live» is the free ride, and the tile «Fahrt starten» on
 * Heute and Aktiv leads there only while no trip is planned for today (otherwise to «#/live/<trip>»). The robot
 * may find such a page near or far, so «Near enough now» does not fail for it. Every entry must be in TAP_GAPS.
 */
export const TAP_GAPS_BY_DATA = ['#/live'];
