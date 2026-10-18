<script>
  /**
   * v0.162.0 Saisonstart-Check (Noah 15.10.2026 «5a»): on the page of a ski tour in October and November,
   * the things to do before the first tour of the winter. Folded on the phone to one line with its sum
   * (Noah 14.10.2026 «2a»), open on the computer. A tap ticks a thing and keeps its date; «Für diese Saison
   * ausblenden» hides the card until next October, with Undo. The things are the start tasks of the
   * Saison-Pflege (Touren › Skitouren), so a tick here counts there too (skiseason.js).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { localDay } from '../localday.js';
  import { t, locale } from '../i18n.svelte.js';
  import { SKI_SEASON_KEY, SKI_SEASON_MONTHS, skiSeasonState, seasonStartTasks, seasonStartDone, seasonStartCount } from '../skiseason.js';
  import { CARE_KEY, CARE_TASKS_KEY } from '../ski.js';
  import { careDone, careDrop } from '../ski/skidb.js';
  import { Snowflake, Check, ChevronRight } from '@lucide/svelte';

  let { day = localDay() } = $props();

  // undefined only while it loads
  const rowQ = liveQuery(async () => {
    const [row, care, custom] = await Promise.all([db.settings.get(SKI_SEASON_KEY), db.settings.get(CARE_KEY), db.settings.get(CARE_TASKS_KEY)]);
    return { value: row?.value ?? null, care: care?.value ?? [], custom: custom?.value ?? null };
  });
  const state = $derived(skiSeasonState($rowQ?.value, day));
  const tasks = $derived(seasonStartTasks($rowQ?.custom));
  const doneOf = (x) => seasonStartDone(x, $rowQ?.care ?? [], day);
  const count = $derived(seasonStartCount(tasks, $rowQ?.care ?? [], day));
  const inMonths = $derived(SKI_SEASON_MONTHS.includes(Number(day.slice(5, 7))));
  let justHid = $state(false);

  // decided once: open on a wide screen, one folded line on the phone
  let opened = $state(typeof matchMedia === 'function' && matchMedia('(min-width: 900px)').matches);

  const tick = async (x) => {
    const on = doneOf(x);
    if (on) await careDrop(($rowQ?.care ?? []).filter((e) => e.task === x.id && e.season === on.season).map((e) => e.id));
    else await careDone(x, day, 0);
  };
  const setHidden = (hidden) => db.settings.put({ key: SKI_SEASON_KEY, value: { season: state.season, hidden } });
  const hide = async () => {
    await setHidden(true);
    justHid = true;
  };
  const undoHide = async () => {
    await setHidden(false);
    justHid = false;
  };
  const dateOf = (d) => new Date(`${d}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short' });
</script>

{#if inMonths && $rowQ}
  {#if !state.hidden}
    <details class="ssc" bind:open={opened} data-ski-season>
      <summary>
        <span class="ic" aria-hidden="true"><Snowflake size={18} /></span>
        <span class="tx"><b>{t('Season start check')}</b><small class="num" data-ski-season-sum>{count.done === count.total ? t('All {n} done, the winter can come', { n: count.total }) : t('{done} of {n} done before the first tour', { done: count.done, n: count.total })}</small></span>
        <span class="mini" aria-hidden="true"><i style:width="{(count.done / (count.total || 1)) * 100}%"></i></span>
        <ChevronRight class="chev" size={18} aria-hidden="true" />
      </summary>
      <div class="in">
        <p class="what">{t('Before the first ski tour of the winter. Everything is a suggestion.')}</p>
        <ul class="rows">
          {#each tasks as r (r.id)}
            {@const on = doneOf(r)}
            <li>
              <button type="button" class="row" aria-pressed={!!on} data-ski-season-item={r.id} onclick={() => tick(r)}>
                <span class="tk" class:on aria-hidden="true">{#if on}<Check size={16} />{/if}</span>
                <span class="tx"><b>{r.own ? r.task : t(r.task)}</b>{#if on}<small>{t('done on {day}', { day: dateOf(on.day) })}</small>{/if}</span>
              </button>
            </li>
          {/each}
        </ul>
        <a class="text-button more" href="#/ski/care" data-ski-season-care>{t('All of the season care')}</a>
        <button type="button" class="text-button hide" onclick={hide} data-ski-season-hide>{t('Hide for this season')}</button>
      </div>
    </details>
  {:else if justHid}
    <p class="hid" role="status">{t('Season start check hidden until next October.')} <button type="button" class="text-button" onclick={undoHide}>{t('Undo')}</button></p>
  {/if}
{/if}

<style>
  .ssc {
    min-width: 0;
    margin: 0 0 12px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
  }
  summary {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    padding: 8px 16px;
    list-style: none;
    cursor: pointer;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  summary :global(.chev) {
    flex: none;
    color: var(--ink-3);
    transition: transform 0.15s;
  }
  .ssc[open] summary :global(.chev) {
    transform: rotate(90deg);
  }
  .ic {
    display: grid;
    flex: none;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .tx {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .tx b {
    display: block;
    font-weight: 500;
  }
  .tx small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .mini {
    flex: none;
    width: 48px;
    height: 6px;
    overflow: hidden;
    border-radius: 3px;
    background: var(--line);
  }
  .mini i {
    display: block;
    height: 100%;
    background: var(--ok);
  }
  .in {
    padding: 0 16px 12px;
  }
  .what {
    margin: 0 0 4px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .rows {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .rows li {
    border-top: 1px solid var(--line);
  }
  .rows li:first-child {
    border-top: 0;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 48px;
    padding: 6px 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .tk {
    display: grid;
    flex: none;
    place-items: center;
    width: 24px;
    height: 24px;
    border: 1.5px solid var(--ink-3);
    border-radius: 50%;
  }
  .tk.on {
    border-color: var(--ok);
    background: var(--ok);
    color: var(--paper);
  }
  .hide,
  .more {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    margin: 4px 12px 0 0;
  }
  .hid {
    margin: 0 0 12px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
