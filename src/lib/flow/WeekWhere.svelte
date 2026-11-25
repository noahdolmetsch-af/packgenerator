<script>
  /**
   * «Woher?» (Noah 22.11.2026 «3a»): one tap on a number of the week opens a window with what the number is made of, instead of a fixed
   * footnote: the sessions with their time («ca.» where nothing was measured) and the rides with their km, each with its source. Only
   * reading (weekcalc.js `items`); nothing is changed here. Escape and ✕ close it.
   */
  import { X } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { hmm } from '../training.js';
  import { t, num, locale } from '../i18n.svelte.js';

  let { calc, onclose } = $props();
  let dialog;
  $effect(() => {
    dialog?.showModal();
  });

  const day = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'numeric' });
  const QUELLE = { strava: 'Strava', timer: 'Timer', plan: 'Plan|source', tp: 'TrainingPeaks', weg: 'Ride to work', hand: 'ticked' };
  const SOURCE = { fit: 'File|source', csv: 'Strava list', strava: 'Strava', wait: 'waits in «Zum Prüfen»', file: 'File|source' };
  const sessions = $derived(calc?.items?.sessions ?? []);
  const rides = $derived(calc?.items?.rides ?? []);
  const timeOf = (s) => (s.min ? `${s.minQuelle === 'ca.' ? t('ca.') + ' ' : ''}${hmm(s.min * 60)} h` : '–');
</script>

<dialog bind:this={dialog} use:backClose class="where" aria-labelledby="ww-h" onclose={() => onclose?.()} data-wr-where>
  <header>
    <h2 id="ww-h">{t('Where the numbers come from')}</h2>
    <button type="button" class="x" onclick={() => dialog.close()} aria-label={t('Close')}><X size={20} aria-hidden="true" /></button>
  </header>
  <p class="cap">{t('Hours: measured time (Strava, timer, typed) plus the usual duration where nothing was measured, marked «ca.». km and Hm: each ride once, also rides that wait in «Zum Prüfen». Only reading: nothing here is changed.')}</p>

  <h3>{t('Sessions and time')}</h3>
  {#if sessions.length}
    <ul data-where="sessions">
      {#each sessions as s (s.id)}
        <li><span class="d">{day(s.day)}</span><span class="n">{s.name}</span><span class="v num">{timeOf(s)}</span><small>{t(QUELLE[s.quelle] ?? 'ticked')}</small></li>
      {/each}
    </ul>
  {:else}
    <p class="cap">{t('No session in this week.')}</p>
  {/if}

  <h3>{t('Rides (km and Hm)')}</h3>
  {#if rides.length}
    <ul data-where="rides">
      {#each rides as r, i (i)}
        <li><span class="d">{day(r.day)}</span><span class="n">{num(r.km)} km{r.hm ? ` · ${num(Math.round(r.hm))} m` : ''}</span><small>{t(SOURCE[r.source] ?? 'File|source')}</small></li>
      {/each}
    </ul>
  {:else}
    <p class="cap">{t('No ride in this week.')}</p>
  {/if}
  <p class="cap">{t('The watch is only told: a workout without a tick never counts by itself.')}</p>
</dialog>

<style>
  .where {
    width: min(92vw, 480px);
    max-height: 80dvh;
    padding: var(--sp-4);
    border: 1px solid var(--line);
    border-radius: var(--radius-card);
    background: var(--paper);
    color: var(--ink);
    overflow: auto;
  }
  .where::backdrop {
    background: var(--scrim);
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-2);
  }
  h2 {
    margin: 0;
    font-size: var(--fs-sub);
  }
  h3 {
    margin: var(--sp-3) 0 var(--sp-1);
    font-size: var(--fs-body);
  }
  .x {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border: 0;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 4px;
  }
  li {
    display: grid;
    grid-template-columns: 5.5em minmax(0, 1fr) auto;
    gap: 2px var(--sp-2);
    align-items: baseline;
    font-size: var(--fs-body);
  }
  li small {
    grid-column: 2 / -1;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .d {
    color: var(--ink-3);
  }
  .n {
    overflow-wrap: break-word;
  }
  .cap {
    margin: var(--sp-2) 0 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
</style>
