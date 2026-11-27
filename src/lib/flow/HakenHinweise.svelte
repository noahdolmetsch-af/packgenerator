<script>
  /**
   * «Was auffällt» (Noah 27.11.2026 «4a»): the card under the Haken-Verlauf on Auswerten › Woche. What the ticks of the last 60 days
   * show across the activities (a week without recovery, a gap, a series, what you often tick together, a weekday), each with its
   * reason in one line. Only looking: nothing is graded and no number is a goal. The rules are flow/hakenhinweise.js, the words
   * flow/hakenhinweise-text.js. acts, log: from the page; today: the local day.
   */
  import { Leaf, Clock, Flame, Link2, CalendarDays } from '@lucide/svelte';
  import { tripDayQuery } from './tripdaylist.js';
  import { hintsOf, cardHints } from './hakenhinweise.js';
  import { hintText } from './hakenhinweise-text.js';
  import { actName } from './ui.svelte.js';
  import { normAct } from '../flow.js';
  import { t } from '../i18n.svelte.js';

  let { acts = [], log = [], today } = $props();
  const tq = tripDayQuery(today);
  const list = $derived(cardHints(hintsOf({ acts, log, tripDayList: $tq ?? [], today })));
  const names = $derived(new Map(acts.map((a) => [a.id, actName(normAct(a))])));
  const nameOf = (id) => names.get(id) ?? id;
  const ICONS = { balance: Leaf, gap: Clock, streak: Flame, together: Link2, rhythm: CalendarDays };
</script>

<section class="card hh" aria-labelledby="hh-h" data-haken-hinweise>
  <h2 id="hh-h" class="h2">{t('What stands out')}</h2>
  <p class="det">{t('From your ticks of the last 60 days. Only an observation, nothing is graded.')}</p>
  {#if list.length}
    <ul class="hl">
      {#each list as h (`${h.kind}-${h.actId ?? ''}-${h.other ?? ''}`)}
        {@const x = hintText(h, nameOf)}
        {@const Icon = ICONS[h.kind]}
        <li data-hint={h.kind}>
          <span class="ic" aria-hidden="true"><Icon size={16} /></span>
          <div class="tx"><b>{x.text}</b><span class="why">{x.why}</span></div>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="det" data-hh-none>{t('Nothing stands out right now. After a few weeks of ticks this shows more.')}</p>
  {/if}
</section>

<style>
  .hh {
    padding: var(--sp-4);
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    min-width: 0;
  }
  .h2 {
    margin: 0;
    font: 600 var(--fs-h3, 1.1rem) / 1.25 var(--font-body);
    color: var(--ink);
  }
  .det {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    line-height: 1.45;
  }
  .hl {
    display: flex;
    flex-direction: column;
    margin: var(--sp-1) 0 0;
    padding: 0;
    list-style: none;
  }
  .hl li {
    display: grid;
    grid-template-columns: 28px minmax(0, 1fr);
    gap: var(--sp-2);
    padding: var(--sp-3) 0;
    border-top: 1px solid var(--line);
  }
  .hl li:first-child {
    border-top: 0;
  }
  .ic {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: var(--r-pill);
    background: var(--paper-2);
    color: var(--accent);
  }
  .tx {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .tx b {
    color: var(--ink);
    font-weight: 600;
    font-size: var(--fs-body);
    line-height: 1.35;
  }
  .why {
    color: var(--ink-3);
    font-size: var(--fs-small);
    line-height: 1.45;
  }
</style>
