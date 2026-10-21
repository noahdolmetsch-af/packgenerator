<script>
  /**
   * UI-Ziele I2 / #17 (Noah 20.10.2026 «freigabe für alles»): «Was häsch vor?» as chips under the greeting.
   * One tap starts the flow: «Heute fahren» the quick start with the suggested bike, «Tour planen» a new trip,
   * «Velo schrauben» the bike care (what is due first), «Woche planen» the week. While Heute is customised
   * the chips are a list: switch each on or off, move it with the arrows or drag it (goals.js).
   */
  import { liveQuery } from 'dexie';
  import { Bike, Map as MapIcon, Wrench, CalendarDays, NotebookPen, Hourglass } from '@lucide/svelte';
  import { countdown } from './heute.js';
  import { openTrip } from '../nav.js';
  import { db } from '../db.js';
  import { GOALS_KEY, goalsOf, goalsRecord, moveGoal, toggleGoal } from './goals.js';
  import { sortable } from '../ui/sortable.js';
  import SortGrip from '../ui/SortGrip.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import { t } from '../i18n.svelte.js';

  // next: the next trip (debrief.js nextTrip) for the countdown chip; now: the clock of Heute
  let { editing = false, onride = () => {}, ontrip = () => {}, next = null, now = new Date() } = $props();
  const ICON = { count: Hourglass, ride: Bike, trip: MapIcon, care: Wrench, week: CalendarDays, diary: NotebookPen };
  // the countdown chip: the trip's own name (never through t()) and «In 5 days», «Tomorrow · 22 h to go», «On the way · day 2 of 3»
  const cd = $derived(next?.startDate ? countdown(next, now) : null);
  const q = liveQuery(() => db.settings.get(GOALS_KEY));
  const list = $derived(goalsOf($q?.value));
  const shown = $derived(list.filter((g) => g.on && (!g.trip || cd)));
  const save = (l) => db.settings.put({ key: GOALS_KEY, value: goalsRecord(l) });
  const run = (g) => (g.key === 'ride' ? onride() : g.key === 'trip' ? ontrip() : null);
</script>

{#if editing}
  <section class="ge" aria-labelledby="ge-h" data-goals-edit>
    <h2 id="ge-h">{t('Chips under the greeting')}</h2>
    <p class="hint">{t('Switch a chip off or move it with the arrows or by dragging.')}</p>
    <ul use:sortable={{ onmove: (from, to) => save(moveGoal(list, from, to)) }}>
      {#each list as g, i (g.key)}
        {@const I = ICON[g.key]}
        <li data-sort-id={g.key} data-goal-row={g.key}>
          <SortGrip name={t(g.label)} onstep={(dir) => save(moveGoal(list, i, i + dir))} />
          <label><input type="checkbox" role="switch" checked={g.on} onchange={() => save(toggleGoal(list, g.key))} /><I size={16} aria-hidden="true" />{t(g.label)}</label>
          <SortArrows name={t(g.label)} {i} n={list.length} onstep={(dir) => save(moveGoal(list, i, i + dir))} />
        </li>
      {/each}
    </ul>
  </section>
{:else if shown.length}
  <nav class="gc" aria-label={t('What are you up to?')} data-goals>
    {#each shown as g (g.key)}
      {@const I = ICON[g.key]}
      {#if g.trip}<a class="chip cd" class:near={cd.near} href="#/pack" onclick={() => openTrip(next.id)} data-goal={g.key} data-goal-countdown><I size={16} aria-hidden="true" /><span class="tn">{next.title || t('Trip')}</span><span class="cw num">{cd.text}</span></a>
      {:else if g.href}<a class="chip" href={g.href} data-goal={g.key}><I size={16} aria-hidden="true" />{t(g.label)}</a>
      {:else}<button type="button" class="chip" onclick={() => run(g)} data-goal={g.key}><I size={16} aria-hidden="true" />{t(g.label)}</button>{/if}
    {/each}
  </nav>
{/if}

<style>
  .gc {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 4px 0 0;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 600 var(--fs-small) / 1.2 var(--font-body);
    text-decoration: none;
    cursor: pointer;
  }
  .chip :global(svg) {
    flex: none;
    color: var(--hi);
  }
  .chip.cd {
    max-width: 100%;
    min-width: 0;
  }
  .chip.cd.near {
    border-color: var(--hi);
    background: color-mix(in srgb, var(--hi) 8%, var(--paper));
  }
  .tn {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .cw {
    flex: none;
    color: var(--ink-2);
    font-weight: 500;
  }
  .chip:hover {
    border-color: var(--hi);
  }
  .ge {
    margin: 8px 0 0;
    padding: 12px 14px;
    border: 1px dashed var(--line);
    border-radius: 12px;
    background: var(--paper);
  }
  .ge h2 {
    margin: 0;
    font: 700 var(--fs-body) / 1.3 var(--font-body);
  }
  .hint {
    margin: 2px 0 8px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .ge ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .ge li {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 48px;
    border-top: 1px solid var(--line);
  }
  .ge label {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    cursor: pointer;
  }
</style>
