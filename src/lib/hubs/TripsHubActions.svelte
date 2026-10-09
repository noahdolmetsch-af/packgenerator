<script>
  /**
   * v0.25.1 (Noah 1b, 3a): the buttons of the Trips tile on Today, in order of priority.
   * Visible: Day ride (Noah 1a) · New trip · Write debrief (only while a finished trip waits for one) · Past trips · Setups.
   * Under "More": Compare trips · Learnings · All templates · Building blocks (v0.26.0).
   * "Setups" (Noah 1b) = how the bags sit on the bike: the bag setup of the next trip's bike
   * (or the first bike) on Bikes → Setup.
   */
  import HubActions from './HubActions.svelte';
  import { openTrip } from '../nav.js';
  import { toDebrief } from '../debrief.js';
  import { bikesHash } from '../bikes.js';
  import { hubBike } from '../hubs.js';
  import { t } from '../i18n.svelte.js';

  let { trips = [], debriefs = [], next = null, bikes = [] } = $props();

  const waiting = $derived(toDebrief(trips, debriefs)[0] ?? null);
  const setupBike = $derived(hubBike(next, bikes));
  const actions = $derived(
    [
      // v0.38.0 (Noah 13a): one place per target. Day ride, New trip, Past trips, Compare trips,
      // Learnings, All templates and Building blocks are in "New" and "More" (and Day ride in the quick
      // row of Today); here stays what only this tile knows.
      waiting ? { key: 'debrief', label: t('Write debrief'), href: `#/debrief/${encodeURIComponent(waiting.id)}`, run: () => openTrip(waiting.id) } : null,
      { key: 'setups', label: t('Setups'), href: bikesHash({ bike: setupBike }) },
    ].filter(Boolean),
  );
</script>

<HubActions {actions} label={t('Trips|place')} />
