<script>
  /**
   * One window on Heute at a time (windows.js, Noah 19.10.2026): the evening before a trip («Packen») and
   * Sunday's Wochenrückblick, and (Paket V, Idee 277) the evening before a flight. «Später» brings it back in one hour (✕, Escape and back count as «Später»),
   * «Heute nicht» puts it away until tomorrow, the main button leads to the page.
   */
  import { liveQuery } from 'dexie';
  import { X, Backpack, CalendarCheck, ChevronRight, Plane } from '@lucide/svelte';
  import { db } from '../db.js';
  import { backClose } from '../ui/backclose.js';
  import { openTrip } from '../nav.js';
  import { t } from '../i18n.svelte.js';
  import { WINDOWS_KEY, windowNow, later, notToday, done, dayOfStamp } from './windows.js';
  import SurpriseLines from '../wohl/SurpriseLines.svelte'; // Paket P #256: surprises of the week
  import { flightUrl } from '../alltag.js';
  import '../bikes/velo-dlg.css';

  // blocked (Paket C): the Tages-Check window is open or loading; this one waits and comes after it
  let { now, trips = [], itemsById = {}, name = undefined, blocked = false } = $props();
  const recQ = liveQuery(async () => (await db.settings.get(WINDOWS_KEY))?.value ?? {});
  const rec = $derived($recQ);
  const win = $derived(rec && !blocked ? windowNow({ rec, now, trips, itemsById, name }) : null);
  const put = (value) => db.settings.put({ key: WINDOWS_KEY, value: JSON.parse(JSON.stringify(value)) });

  let dialog = $state();
  let shownId = $state(null);
  $effect(() => {
    if (!dialog) return;
    if (win && !dialog.open) dialog.showModal();
    else if (!win && dialog.open) dialog.close();
    shownId = win?.id ?? null;
  });
  const soon = () => win && put(later(rec, win.id, now));
  const away = () => win && put(notToday(rec, win.id, now));
  function go() {
    if (!win) return;
    if (win.id === 'eve' || win.id === 'flight') openTrip(win.trip.id);
    put(done(rec, win.id, now));
  }
  // ✕, Escape and back: «Später»
  function closed() {
    if (win && shownId === win.id) soon();
  }
</script>

{#if win}
  <dialog class="sheet vdlg from-below hw" bind:this={dialog} use:backClose={closed} onclose={closed} aria-labelledby="hw-h" data-window={win.id}>
    <div class="vd-head">
      <span class="ib" aria-hidden="true">{#if win.id === 'eve'}<Backpack size={18} />{:else if win.id === 'flight'}<Plane size={18} />{:else}<CalendarCheck size={18} />{/if}</span>
      <div class="vd-t">
        {#if win.id === 'eve'}
          <h2 id="hw-h">{t('Tomorrow: {title}', { title: win.trip.title })}</h2>
          <p class="vd-sub">{t('Pack tonight, so the morning stays calm.')}</p>
        {:else if win.id === 'flight'}
          <h2 id="hw-h">{t('Tomorrow you fly: {no}', { no: win.flight })}</h2>
          <p class="vd-sub">{t('{title}. Check in online tonight, have your ID ready and plan the way to the airport.', { title: win.trip.title })}</p>
        {:else}
          <h2 id="hw-h">{t('Your week in review')}</h2>
          <p class="vd-sub">{t('The week is nearly over: what went well, what was missing, and one idea for next week.')}</p>
        {/if}
      </div>
      <button type="button" class="vd-x" aria-label={t('Later|mask')} onclick={soon}><X size={20} aria-hidden="true" /></button>
    </div>
    {#if win.id === 'eve'}
      {#if win.packed}
        <div class="bar" role="progressbar" aria-label={t('Packed')} aria-valuemin="0" aria-valuemax={win.packed.of} aria-valuenow={win.packed.packed}><span style:width="{Math.round((win.packed.packed / win.packed.of) * 100)}%"></span></div>
        <p class="ln" data-window-packed><b>{t('{n} of {m} packed', { n: win.packed.packed, m: win.packed.of })}</b>{#if win.packed.left.length}{' '}· {t('Still: {list}', { list: win.packed.left.join(', ') })}{/if}</p>
      {:else}
        <p class="ln" data-window-packed>{t('No packing list yet.')}</p>
      {/if}
      {#if win.flight}<p class="ln" data-window-flight><Plane size={14} aria-hidden="true" /> {t('Flight {no}: check in online and have your ID ready.', { no: win.flight })} <a href={flightUrl(win.flight)} target="_blank" rel="noopener">{t('Follow the flight')}</a></p>{/if}
    {:else}
      <SurpriseLines today={dayOfStamp(now)} />
    {/if}
    <div class="ft">
      <button type="button" class="btn" onclick={away} data-window-today>{t('Not today|mask')}</button>
      <button type="button" class="btn" onclick={soon} data-window-later>{t('Later|mask')}</button>
      {#if win.id === 'eve'}
        <a class="btn hi" href="#/pack" onclick={go} data-window-go>{t('Pack now')}<ChevronRight size={16} aria-hidden="true" /></a>
      {:else if win.id === 'flight'}
        <a class="btn hi" href={flightUrl(win.flight)} target="_blank" rel="noopener" onclick={() => put(done(rec, win.id, now))} data-window-go>{t('Follow the flight')}<ChevronRight size={16} aria-hidden="true" /></a>
      {:else}
        <a class="btn hi" href="#/flow/review" onclick={go} data-window-go>{t('Open the review')}<ChevronRight size={16} aria-hidden="true" /></a>
      {/if}
    </div>
    <small class="hint">{t('«Later» brings this window back in one hour. «Not today» puts it away until tomorrow.')}</small>
  </dialog>
{/if}

<style>
  .ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .bar {
    height: 8px;
    border-radius: 4px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .bar span {
    display: block;
    height: 100%;
    background: var(--hi);
  }
  .ln {
    margin: 8px 0 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
    overflow-wrap: break-word;
  }
  .ln b {
    color: var(--ink);
    font-weight: 600;
  }
  .ft {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  .ft .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
  }
  .hint {
    display: block;
    margin-top: 8px;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    overflow-wrap: break-word;
  }
  @media (max-width: 719px) {
    .ft .btn {
      flex: 1 1 30%;
      min-height: 48px;
    }
  }
</style>
