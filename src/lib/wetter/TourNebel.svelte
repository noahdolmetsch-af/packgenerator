<script>
  /**
   * «Nebel auf der Tour-Route» (Noah 05.11.2026 «4b 5b»): one line in «Weather for this tour» (TourWetter mounts it
   * with one line): the fog line at the start time, where the route lies against it («Start in the fog, from km 17
   * above it»), and when the fog clears so a later start is possible. For a trip in the next 3 days only (the air
   * layers go that far); it shows nothing otherwise. The profile of the route shows the same fog band (ProfileStrip).
   * A suggestion from a guess (about 200 m precise), never a rating of danger.
   */
  import { CloudFog } from '@lucide/svelte';
  import { db } from '../db.js';
  import { tripFog, routeFog } from './nebelroute.js';
  import { t, num } from '../i18n.svelte.js';

  let { trip, startMs = null } = $props();
  let fog = $state(null);
  let seq = 0;
  $effect(() => {
    const key = `${trip?.id}|${trip?.startDate}|${trip?.place?.lat ?? trip?.route?.start?.lat}|${startMs}`;
    const mine = ++seq;
    void key;
    tripFog(db, trip, { startMs }).then((f) => mine === seq && (fog = f)).catch(() => mine === seq && (fog = null));
  });

  const r = $derived(fog?.top != null ? routeFog(trip?.route?.profile, fog.top) : null);
</script>

{#if fog}
  <p class="tn" data-tour-fog>
    <CloudFog size={16} aria-hidden="true" />
    <span>
      {#if fog.top == null}
        {t('No fog expected at the start.')}
      {:else if !r}
        {t('Fog line about {m} m at the start.', { m: num(fog.top) })}
      {:else if r.startIn && r.aboveKm == null}
        {t('The whole route stays in the fog (fog line about {m} m, highest point {top} m).', { m: num(fog.top), top: num(r.topM) })}
      {:else if r.startIn}
        {t('Start in the fog (fog line about {m} m), from km {km} above it.', { m: num(fog.top), km: num(r.aboveKm) })}
      {:else}
        {t('Start above the fog (fog line about {m} m).', { m: num(fog.top) })}{#if r.kmIn >= 0.5}{' '}{t('{km} km of the route lie in the fog.', { km: num(r.kmIn) })}{/if}
      {/if}
      {#if fog.top != null && fog.clears != null && (!r || r.kmIn >= 0.5)}{' '}{t('The fog clears around {h} h: start then and the route is without fog.', { h: num(fog.clears) })}{/if}
      {#if fog.old}{' '}{t('(older data)')}{/if}
    </span>
  </p>
{/if}

<style>
  .tn {
    margin: 0;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    overflow-wrap: break-word;
  }
</style>
