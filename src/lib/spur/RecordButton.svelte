<script>
  /**
   * Paket S «Reise-Spur» (Noah 19.10.2026 «1b»): the button «Aufzeichnen». It shows once on «Unterwegs»
   * (SpurCard) and in the Lenker view of Paket K (#114): drop in <RecordButton {trip} />.
   * First a short hint (battery, screen stays on, gaps), then the dark big recording view.
   * A recording left open (reload, app closed) is offered to continue.
   */
  import { liveQuery } from 'dexie';
  import { Circle, Square } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, num } from '../i18n.svelte.js';
  import { rec, startRecording, openRecording } from './recorder.svelte.js';
  import { zurichTime } from './spur.js';
  import { runningTrip } from '../notes.js';
  import { localDay } from '../localday.js';
  import { backClose } from '../ui/backclose.js';
  import RecordView from './RecordView.svelte';

  /** trip: the tour the recording belongs to; without it (Lenker view) the tour running today. */
  let { trip: given = null, big = false } = $props();
  const tripsQ = liveQuery(() => db.trips.toArray());
  const trip = $derived(given ?? runningTrip($tripsQ ?? [], localDay()) ?? null);
  const openQ = liveQuery(() => openRecording(db));
  const left = $derived(!rec.on ? ($openQ ?? null) : null);
  let ask = $state(false);
  let view = $state(false);
  let err = $state('');
  let dialog = $state();

  $effect(() => {
    if (ask) dialog?.showModal();
  });

  async function go(cont = null) {
    err = '';
    const e = await startRecording(trip, { cont });
    if (e) return (err = t(e));
    ask = false;
    view = true;
  }
</script>

{#if rec.on}
  <button type="button" class="btn rec on" class:big onclick={() => (view = true)}><Square size={18} aria-hidden="true" />{t('Recording')} · <span class="num">{num(rec.km)} km</span></button>
{:else if left}
  <button type="button" class="btn rec" class:big onclick={() => go(left)}><Circle size={18} aria-hidden="true" />{t('Continue recording from {time}', { time: zurichTime(left.startAt) })}</button>
{:else}
  <button type="button" class="btn rec" class:big onclick={() => (ask = true)}><Circle size={18} aria-hidden="true" />{t('Record|spur')}</button>
{/if}
{#if err}<p class="warn tp-small" role="alert">{err}</p>{/if}

{#if ask}
  <dialog class="sheet from-below" bind:this={dialog} use:backClose={() => dialog.close()} onclose={() => (ask = false)} aria-labelledby="rec-h">
    <h2 id="rec-h">{t('Record the route')}</h2>
    <p>{t('The app records where you ride, but only while the screen is on. That needs a lot of battery: best with the phone on the handlebar and on power.')}</p>
    <p class="tp-muted tp-small">{t('If the screen goes off or the app closes, there is a gap. A Strava or Garmin ride of that day fills it later by itself, and its line counts first.')}</p>
    <p class="tp-muted tp-small">{t('The points stay on this device.')}</p>
    {#if err}<p class="warn" role="alert">{err}</p>{/if}
    <div class="acts">
      <button type="button" class="btn hi" onclick={() => go()}><Circle size={18} aria-hidden="true" />{t('Start recording')}</button>
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
    </div>
  </dialog>
{/if}

{#if view}<RecordView {trip} onclose={() => (view = false)} />{/if}

<style>
  .rec {
    gap: 6px;
  }
  .rec.on {
    border-color: var(--bad);
    color: var(--bad);
  }
  .rec.big {
    min-height: 56px;
    font-size: var(--fs-section);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
  }
</style>
