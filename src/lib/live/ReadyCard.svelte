<script>
  /**
   * «Bereit für unterwegs?» (Noah 02.11.2026, Schritt 6 «Offline»): on the page before the start, what makes a
   * long ride calm: the map along the route on this phone and the voice on. Each row says yes or no and offers
   * the next step (keep the map here, switch the voice on). Nothing is forced; the ride starts either way.
   */
  import { liveQuery } from 'dexie';
  import { Check, Circle } from '@lucide/svelte';
  import OfflineBox from '../map/OfflineBox.svelte';
  import { STRIPS_KEY, presentIds } from '../map/offline.js';
  import { readiness } from './ready.js';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';

  let { line = [], name = '', tripId = null, reserve = null, voice = false, onvoice } = $props();
  const stripsQ = liveQuery(() => db.settings.get(STRIPS_KEY));
  const strips = $derived(Array.isArray($stripsQ?.value?.strips) ? $stripsQ.value.strips : []);
  let present = $state(new Set());
  $effect(() => {
    const list = strips;
    presentIds(list).then((s) => (present = s), () => {});
  });
  const r = $derived(readiness({ strips, present, tripId, voice }));
  let keeping = $state(false);
</script>

<section class="rc-box lv-ready" data-live-ready={r.ready ? 'yes' : 'no'} aria-label={t('Ready for the ride?')}>
  <h2 class="rc-h2">{t('Ready for the ride?')}</h2>
  <ul class="lv-ready-list">
    <li class="lv-ready-row" data-live-ready-map={r.mapOk ? 'yes' : 'no'}>
      {#if r.mapOk}<Check size={18} aria-hidden="true" />{:else}<Circle size={18} aria-hidden="true" />{/if}
      <span class="lv-ready-main"><b>{r.mapOk ? t('The map along the route is on this phone.') : t('The map along the route is not on this phone yet.')}</b>
        <small>{r.mapOk ? t('It works without internet.') : t('Without it the map stays empty when you have no signal.')}</small></span>
      {#if !r.mapOk}<button type="button" class="btn sm" aria-expanded={keeping} onclick={() => (keeping = !keeping)} data-live-ready-keep>{t('Keep the map')}</button>{/if}
    </li>
    <li class="lv-ready-row" data-live-ready-voice={r.voiceOk ? 'yes' : 'no'}>
      {#if r.voiceOk}<Check size={18} aria-hidden="true" />{:else}<Circle size={18} aria-hidden="true" />{/if}
      <span class="lv-ready-main"><b>{r.voiceOk ? t('The voice is on.') : t('The voice is off.')}</b>
        <small>{t('The phone says the next shop or climb a few km ahead, so you can keep your eyes on the road.')}</small></span>
      {#if !r.voiceOk}<button type="button" class="btn sm" onclick={() => onvoice?.(true)} data-live-ready-voice-on>{t('Switch the voice on')}</button>{/if}
    </li>
  </ul>
  {#if r.ready}<p class="rc-note" data-live-ready-say>{t('All set. Have a good ride.')}</p>{/if}
  {#if keeping && !r.mapOk}
    <div data-live-ready-box><OfflineBox {line} {name} {tripId} {reserve} /></div>
  {/if}
</section>

<style>
  .lv-ready-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .lv-ready-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }
  .lv-ready-main {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .lv-ready-main small {
    color: var(--ink-2);
  }
</style>
