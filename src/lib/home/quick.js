/**
 * «Heute ruhiger» part 1 (Noah 26.10.2026 «1a», mockup H1 on «Offene Mockups 3»): every small tile goes into one calm
 * list «Schnell öffnen». The wall keeps its own order; the list stands where the first small tile stands, so
 * reordering under «Customise the start page» still works. Pure function, tested in tests/home-quick.test.js.
 */

/** → [{ key, tiles }] with key 'quick' for the list of small tiles and 'all' for the other tiles (in runs). */
export function runsOf(tiles = []) {
  const small = tiles.filter((x) => x.size === 's');
  const out = [];
  let quickDone = false;
  for (const x of tiles) {
    if (x.size === 's') {
      if (!quickDone) out.push({ key: 'quick', tiles: small });
      quickDone = true;
    } else if (out.at(-1)?.key === 'all') out.at(-1).tiles.push(x);
    else out.push({ key: 'all', tiles: [x] });
  }
  return out;
}

/** The tiles in the order Heute shows them: the small tiles together where the first one stands. */
export const inShownOrder = (tiles = []) => runsOf(tiles).flatMap((r) => r.tiles);
