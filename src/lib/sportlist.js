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

/** The sports as the app comes (the Standard); SPORTS above is the person's version (setSportNames). */
export const STD_SPORTS = SPORTS.map((s) => ({ ...s }));
/** The four sports that have no area of their own in «Sportarten und Bereiche»: their names live in the list «tripSports» (standard.js). */
export const BIKE_DAY_SPORTS = ['cycling', 'gravel', 'xc', 'downhill'];

/**
 * «Alles selbst bearbeiten» (Noah 05.11.2026, «Sportarten umbenennen funktioniert nicht»): the person's names
 * and hidden sports go into SPORTS itself, so every page that reads the sports (the new-trip window, the trip's
 * kind, the sport pages) shows the same name. Like setDomains: SPORTS changes in place.
 *  - cycling, gravel, xc, downhill: their own list «tripSports» (list: listFor('tripSports') [{ id, name, renamed?, hidden? }];
 *    an entry missing from it was deleted, which hides the sport);
 *  - bikepacking, ski, hiking: the area of the same name (domains: DOMAIN of domains.js).
 * A name the person typed is raw: it never goes through t().
 */
export function setSportNames(list = [], domains = {}) {
  const mine = Object.fromEntries(list.map((e) => [e.id, e]));
  STD_SPORTS.forEach((std, i) => {
    const target = SPORTS[i];
    const own = BIKE_DAY_SPORTS.includes(std.key);
    const e = own ? mine[std.key] : domains[std.key];
    const renamed = own ? !!e?.renamed : !!e?.raw;
    target.name = renamed ? e.name : std.name;
    target.raw = renamed;
    target.hidden = own ? !e || !!e.hidden : !!e?.hidden;
  });
}
/** The name of a sport for the page: a typed one as it is, the app's own through tr (an English key). */
export const sportLabel = (s, tr = (x) => x) => (!s ? '' : s.raw ? s.name : tr(s.name));
