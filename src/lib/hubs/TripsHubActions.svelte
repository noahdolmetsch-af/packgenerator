<script>
  /**
   * v0.25.1 (Noah 1b, 3a): the buttons of the Trips tile on Today, in order of priority.
   * Visible: Day ride (Noah 1a) · New trip · Write debrief (only while a finished trip waits for one) · Past trips · Setups.
   * Under "More": Compare trips · Learnings · All templates.
   * "Setups" (Noah 1b) = how the bags sit on the bike: the bag setup of the next trip's bike
   * (or the first bike) on Bikes → Setup.
   */
  import HubActions from './HubActions.svelte';
  import { openNew, openTrip, dayRide } from '../nav.js';
  import { toDebrief } from '../debrief.js';
  import { bikesHash } from '../bikes.js';
  import { hubBike } from '../hubs.js';
  import { t } from '../i18n.svelte.js';

  let { trips = [], debriefs = [], next = null, bikes = [] } = $props();

  const waiting = $derived(toDebrief(trips, debriefs)[0] ?? null);
  const setupBike = $derived(hubBike(next, bikes));
  const actions = $derived(
    [
      // v0.25.1 (Noah 1a): the day ride first (what happens on 'pg:dayride' lives elsewhere).
      { key: 'day', label: t('Day ride'), plus: true, run: dayRide },
      { key: 'new', label: t('New trip'), plus: true, run: () => openNew('list') },
      waiting ? { key: 'debrief', label: t('Write debrief'), href: `#/debrief/${encodeURIComponent(waiting.id)}`, run: () => openTrip(waiting.id) } : null,
      { key: 'past', label: t('Past trips'), href: '#/pack/past' },
      { key: 'setups', label: t('Setups'), href: bikesHash({ bike: setupBike }) },
      { key: 'compare', label: t('Compare trips'), href: '#/debrief/compare' },
      { key: 'learnings', label: t('Learnings'), href: '#/debrief/learnings' },
      { key: 'templates', label: t('All templates'), href: '#/pack/templates' },
    ].filter(Boolean),
  );
</script>

<HubActions {actions} label={t('Trips|place')} />
