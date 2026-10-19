/**
 * The sports list of «Sportart statt Tourart» (SA1–SA3, Noah 14.10.2026), on its own without imports so
 * the tests can read it; the rules are in sports.js. area: the area a sport packs from (domains.js;
 * 'bikepacking' is the bike area).
 */
/** The sports in their fixed order (a tie in 5b keeps it). area: the area they pack from. */
export const SPORTS = [
  { key: 'cycling', name: 'Cycling|sport', icon: 'bike', area: 'bikepacking' },
  { key: 'gravel', name: 'Gravel', icon: 'route', area: 'bikepacking' },
  { key: 'xc', name: 'Cross country', icon: 'mountain', area: 'bikepacking' },
  { key: 'downhill', name: 'Downhill', icon: 'downhill', area: 'bikepacking' },
  { key: 'bikepacking', name: 'Bikepacking', icon: 'tent', area: 'bikepacking' },
  { key: 'ski', name: 'Ski touring|sport', icon: 'ski', area: 'ski' },
  { key: 'hiking', name: 'Hiking', icon: 'walk', area: 'hiking' },
];
