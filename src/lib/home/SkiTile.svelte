<script>
  /**
   * v0.97.0 «Skitouren»: the tile «Skitour» on Today → #/ski. In season (November–May) it names the
   * backpack check of the next ski tour; outside the season it stays quiet («from November»).
   */
  import { liveQuery } from 'dexie';
  import SmallTile from './SmallTile.svelte';
  import { db } from '../db.js';
  import { TILE } from './tiles.js';
  import { inSeason, nextSkiTrip, checkGroups, checkCount } from '../ski.js';
  import { t } from '../i18n.svelte.js';

  let { today, size = 's', isnew = false } = $props();
  const q = liveQuery(async () => ({ trips: await db.trips.where('domain').equals('ski').toArray(), items: await db.items.toArray() }));
  const season = $derived(inSeason(today));
  const nx = $derived($q && season ? nextSkiTrip($q.trips, today) : null);
  const c = $derived(nx?.upcoming ? checkCount(checkGroups(nx.trip, $q.items)) : null);
  const sub = $derived(!season ? t('from November') : c ? t('Backpack {n}/{m}', { n: c.packed, m: c.total }) : t('Plan a ski tour'));
</script>

<SmallTile tile={TILE.ski} {size} {isnew} hot={season} {sub} href="#/ski" />
