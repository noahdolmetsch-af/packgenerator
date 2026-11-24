<script>
  /**
   * «Bereit für unterwegs?» (Noah 02.11.2026, Schritt 6 «Offline»): on the page before the start, what makes a
   * long ride calm: the map along the route on this phone and the voice on. Each row says yes or no and offers
   * the next step (keep the map here, switch the voice on). Nothing is forced; the ride starts either way.
   */
  import { liveQuery } from 'dexie';
  import { Check, ChevronDown, Circle } from '@lucide/svelte';
  import OfflineBox from '../map/OfflineBox.svelte';
  import OsmandHandoff from './OsmandHandoff.svelte';
  import { STRIPS_KEY, presentIds } from '../map/offline.js';
  import { readiness } from './ready.js';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';

  let { line = [], name = '', tripId = null, reserve = null, voice = false, onvoice, points = [] } = $props();
  const stripsQ = liveQuery(() => db.settings.get(STRIPS_KEY));
  const strips = $derived(Array.isArray($stripsQ?.value?.strips) ? $stripsQ.value.strips : []);
  let present = $state(new Set());
  $effect(() => {
    const list = strips;
    presentIds(list).then((s) => (present = s), () => {});
  });
  const r = $derived(readiness({ strips, present, tripId, voice }));
  let keeping = $state(false);
  // Open while something is missing, closed once the map and the voice are set (Noah 23.11.2026 «a»: the page gets calmer
  // before the start). A tap on the head wins over this: a person who opened it keeps it open.
  let userOpen = $state(null);
  const isOpen = $derived(userOpen ?? !r.ready);
  function toggle(e) {
    e.preventDefault();
    userOpen = !isOpen;
  }
</script>

<details class="rc-box lv-ready" open={isOpen} data-live-ready={r.ready ? 'yes' : 'no'} aria-label={t('Ready for the ride?')}>
  <summary class="lv-ready-sum" onclick={toggle} data-live-ready-head>
    <h2 class="rc-h2">{t('Ready for the ride?')}</h2>
    {#if r.ready && !isOpen}<span class="lv-ready-yes" data-live-ready-yes><Check size={16} aria-hidden="true" />{t('Map and voice are set.')}</span>{/if}
    <ChevronDown size={20} class="lv-ready-chev" aria-hidden="true" />
  </summary>
  <ul class="lv-ready-list">
    <li class="lv-ready-row" data-live-ready-map={r.mapOk ? 'yes' : 'no'}>
      {#if r.mapOk}<Check size={20} aria-hidden="true" />{:else}<Circle size={20} aria-hidden="true" />{/if}
      <span class="lv-ready-main"><b>{r.mapOk ? t('The map along the route is on this phone.') : t('The map along the route is not on this phone yet.')}</b>
        <small>{r.mapOk ? t('It works without internet.') : t('Without it the map stays empty when you have no signal.')}</small></span>
      {#if !r.mapOk}<button type="button" class="btn sm" aria-expanded={keeping} onclick={() => (keeping = !keeping)} data-live-ready-keep>{t('Keep the map')}</button>{/if}
    </li>
    <li class="lv-ready-row" data-live-ready-voice={r.voiceOk ? 'yes' : 'no'}>
      {#if r.voiceOk}<Check size={20} aria-hidden="true" />{:else}<Circle size={20} aria-hidden="true" />{/if}
      <span class="lv-ready-main"><b>{r.voiceOk ? t('The voice is on.') : t('The voice is off.')}</b>
        <small>{t('The phone says the next shop or climb a few km ahead, so you can keep your eyes on the road.')}</small></span>
      {#if !r.voiceOk}<button type="button" class="btn sm" onclick={() => onvoice?.(true)} data-live-ready-voice-on>{t('Switch the voice on')}</button>{/if}
    </li>
    <OsmandHandoff route={{ line, name }} {points} {name} />
  </ul>
  {#if r.ready}<p class="rc-note" data-live-ready-say>{t('All set. Have a good ride.')}</p>{/if}
  {#if keeping && !r.mapOk}
    <div data-live-ready-box><OfflineBox {line} {name} {tripId} {reserve} /></div>
  {/if}
</details>

<style>
  .lv-ready-sum {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    min-height: 44px;
    cursor: pointer;
    list-style: none;
  }
  .lv-ready-sum::-webkit-details-marker {
    display: none;
  }
  .lv-ready-sum :global(.rc-h2) {
    margin: 0;
  }
  .lv-ready-sum :global(.lv-ready-chev) {
    margin-left: auto;
    flex: none;
    transition: transform 0.15s;
  }
  details[open] > .lv-ready-sum :global(.lv-ready-chev) {
    transform: rotate(180deg);
  }
  .lv-ready-yes {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--ink-2);
  }
  details[open] > .lv-ready-sum {
    margin-bottom: 10px;
  }
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
