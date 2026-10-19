<script>
  /**
   * «Was war neu?» (wish #1006): what one trip reached for the first time (a canton, a pass, a hut …),
   * from Neuland (newOnTrip). Shows nothing when nothing was new or Neuland has nothing switched on.
   * For the debrief and the Tour-Tagebuch; mount it lazily ({#await import(…)}) so the data stays out
   * of the main file. tripId: the trip; heading: the level of the title (h2 or h3).
   */
  import { db } from '../db.js';
  import { computeNeuland } from './store.js';
  import { newOnTrip } from './neuland.js';
  import { Sparkles, ChevronRight } from '@lucide/svelte';
  import '../review/review.css';
  import { t, tn } from '../i18n.svelte.js';

  let { tripId, heading = 'h2' } = $props();

  let list = $state.raw([]);
  $effect(() => {
    const id = tripId;
    let live = true;
    computeNeuland(db)
      .then((r) => live && (list = newOnTrip(id, r)))
      .catch((err) => console.error(err));
    return () => (live = false);
  });
  const groups = $derived.by(() => {
    const m = new Map();
    for (const x of list) {
      if (!m.has(x.cid)) m.set(x.cid, { cid: x.cid, what: x.what, items: [] });
      m.get(x.cid).items.push(x);
    }
    return [...m.values()];
  });
</script>

{#if list.length}
  <section class="rv-sec wasneu" aria-labelledby="wn-{tripId}" data-testid="was-neu">
    <div class="rv-h">
      <div>
        <svelte:element this={heading} id="wn-{tripId}">{t('What was new?')}</svelte:element>
        <p class="rv-sub">{tn(list.length, 'First time on this trip: {n} thing', 'First time on this trip: {n} things')}</p>
      </div>
      <a class="rv-more" href="#/neuland">{t('New ground')}<ChevronRight size={14} aria-hidden="true" /></a>
    </div>
    <ul class="rv-box wn-list">
      {#each groups as g (g.cid)}
        <li class="wn-row">
          <span class="wn-ic" aria-hidden="true"><Sparkles size={16} /></span>
          <span class="wn-m"><small>{g.what}</small><b>{g.items.map((x) => x.label).join(', ')}</b></span>
        </li>
      {/each}
    </ul>
  </section>
{/if}

<style>
  .wn-list {
    padding: 4px 16px;
  }
  .wn-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 10px 0;
  }
  .wn-ic {
    flex: none;
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--accent-soft);
    color: var(--accent);
  }
  .wn-m {
    display: grid;
    min-width: 0;
  }
  .wn-m small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .wn-m b {
    font-weight: 500;
    overflow-wrap: break-word;
  }
</style>
