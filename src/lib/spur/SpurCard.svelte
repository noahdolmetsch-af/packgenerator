<script>
  /**
   * Paket S «Reise-Spur» on «Unterwegs»: «Hier bin ich», «Aufzeichnen» and the way to the tour map.
   * What today holds so far in one line.
   */
  import { liveQuery } from 'dexie';
  import { MapPin, Map as MapIcon, ChevronRight } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, tn } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import RecordButton from './RecordButton.svelte';
  import PlaceSheet from './PlaceSheet.svelte';

  let { trip } = $props();
  const today = localDay();
  const tracksQ = liveQuery(() => db.tracks.where('tripId').equals(trip.id).toArray());
  const todayN = $derived(($tracksQ ?? []).filter((x) => x.kind === 'place' && x.day === today).length);
  const recN = $derived(($tracksQ ?? []).filter((x) => x.kind === 'rec').length);
  let place = $state(false);
</script>

<section class="spurc" aria-labelledby="spur-h">
  <h2 id="spur-h" class="sh">{t('Travel track')}</h2>
  <p class="ssub">{t('Your line, places and photos of this tour')}</p>
  <div class="card">
    <div class="btns">
      <button type="button" class="btn" onclick={() => (place = true)}><MapPin size={18} aria-hidden="true" />{t('I am here')}</button>
      <RecordButton {trip} />
    </div>
    <p class="tp-muted tp-small">{todayN || recN ? [todayN ? tn(todayN, '{n} place today', '{n} places today') : '', recN ? tn(recN, '{n} recording', '{n} recordings') : ''].filter(Boolean).join(' · ') : t('The line comes from Strava or Garmin by itself; record only when you want.')}</p>
    <a class="row" href="#/spur/{trip.id}"><MapIcon size={18} aria-hidden="true" /><span>{t('Tour map and days')}</span><ChevronRight size={16} aria-hidden="true" /></a>
  </div>
</section>

{#if place}<PlaceSheet {trip} onclose={() => (place = false)} />{/if}

<style>
  .btns {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .btns :global(.btn) {
    gap: 6px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid var(--line);
    color: var(--ink);
    text-decoration: none;
    font-weight: 600;
    min-height: 44px;
  }
  .row span {
    flex: 1;
  }
</style>
