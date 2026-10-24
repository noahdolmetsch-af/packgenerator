<script>
  /**
   * «Stopps in der Nähe» on Heute (Noah 24.10.2026 «1a»: «als stand alone button auf dem home screen»): one small
   * button to the stops page (#/stopps). On a day with a trip that has a route, it opens the stops along that
   * route. «×» hides it (with Undo); the stops page switches it on again. Home.svelte mounts it with one line
   * (owner of Heute: «Heute neu gestalten»).
   */
  import { liveQuery } from 'dexie';
  import { MapPin, X, ChevronRight } from '@lucide/svelte';
  import { db } from '../db.js';
  import { onTripDay } from '../ride.js';
  import { HEUTE_OFF_KEY, stopsHref } from './nearby.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { t } from '../i18n.svelte.js';

  let { today } = $props();
  const offQ = liveQuery(async () => (await db.settings.get(HEUTE_OFF_KEY)) ?? null); // null: never set (shown)
  const tripsQ = liveQuery(() => db.trips.toArray());
  const trip = $derived(($tripsQ ?? []).find((tr) => !tr.skipped && onTripDay(tr, today) && Array.isArray(tr.route?.line) && tr.route.line.length > 1) ?? null);

  async function hide() {
    await db.settings.put({ key: HEUTE_OFF_KEY, value: true });
    offerDone(t('«Stops nearby» hidden on Today. Switch it on again on the stops page.'), () => db.settings.put({ key: HEUTE_OFF_KEY, value: false }));
  }
</script>

{#if $offQ !== undefined && $offQ?.value !== true}
  <div class="hs" data-heute-stops>
    <a class="btn sm hs-go" href={stopsHref(trip)} data-heute-stops-go><MapPin size={16} aria-hidden="true" />{trip ? t("Stops along today's route") : t('Stops nearby')}<ChevronRight size={16} aria-hidden="true" /></a>
    <button type="button" class="hs-x" onclick={hide} aria-label={t('Hide «Stops nearby» on Today')} data-heute-stops-hide><X size={16} aria-hidden="true" /></button>
  </div>
{/if}

<style>
  .hs {
    display: flex;
    align-items: center;
    gap: 4px;
    /* close under the sentence above, so «Dein Körper heute» still starts in the first screen of a phone */
    margin: -8px 0 6px;
  }
  .hs-go {
    min-width: 0;
  }
  .hs-x {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--ink-3);
    cursor: pointer;
  }
  .hs-x:hover {
    background: var(--paper-2);
    color: var(--ink);
  }
</style>
