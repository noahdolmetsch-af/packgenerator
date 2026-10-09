<script>
  /**
   * v0.45.1 (Noah: "vor jedem Ride einen kurzen Reminder"): the base check on the ride page.
   * The trip's ready check (trips.js READY_DEFAULT: lock, mini backpack, bottle, sunglasses, cap,
   * wind jacket …) as big tap buttons until everything is ticked, then one quiet line.
   */
  import { db } from '../db.js';
  import { readyDone, tickReady, touched } from '../trips.js';
  import { t } from '../i18n.svelte.js';
  import { Check } from '@lucide/svelte';

  let { trip } = $props();

  const rows = $derived((trip.ready ?? []).filter((r) => !r.itemId));
  const open = $derived(rows.filter((r) => !readyDone(r, trip)));
  let show = $state(false);

  const save = (ready) => db.trips.update(trip.id, touched({ ready }));
  const toggle = (row) => save($state.snapshot(trip.ready).map((r) => (r.id === row.id ? { ...r, done: !r.done } : r)));
  const all = () => save(tickReady($state.snapshot(trip.ready)));
</script>

{#if rows.length}
  <section class="bc" class:ok={!open.length} aria-labelledby="bc-h-{trip.id}">
    <div class="hd">
      <h2 id="bc-h-{trip.id}">{t('Base check')}</h2>
      {#if open.length}
        <span class="n num">{rows.length - open.length}/{rows.length}</span>
        <button type="button" class="link" onclick={all}>{t('All with me')}</button>
      {:else}
        <span class="done"><Check size={18} aria-hidden="true" /> {t('All with me')}</span>
        <button type="button" class="link" aria-expanded={show} onclick={() => (show = !show)}>{show ? t('Hide') : t('Show')}</button>
      {/if}
    </div>
    {#if open.length || show}
      <ul class="chips">
        {#each rows as r (r.id)}
          <li><button type="button" class="chip" aria-pressed={readyDone(r, trip)} onclick={() => toggle(r)}>{#if readyDone(r, trip)}<Check size={16} aria-hidden="true" />{/if}{t(r.label)}</button></li>
        {/each}
      </ul>
    {/if}
  </section>
{/if}

<style>
  .bc {
    display: grid;
    gap: 10px;
    padding: 14px 16px;
    margin: 12px 0;
    border: 2px solid var(--hi);
    border-radius: 12px;
    background: var(--paper);
  }
  .bc.ok {
    border: 1px solid var(--line);
    padding: 8px 16px;
  }
  .hd {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  h2 {
    margin: 0;
    font-size: var(--fs-section);
    flex: 1 1 auto;
  }
  .n {
    color: var(--ink-3);
  }
  .done {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-weight: 600;
  }
  .chips {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 48px;
    padding: 8px 14px;
    border: 2px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 600 16px/1.2 var(--font-body);
    cursor: pointer;
  }
  .chip[aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .link {
    border: 0;
    background: none;
    min-height: 44px;
    padding: 0 4px;
    font: inherit;
    font-size: 15px;
    color: var(--ink);
    text-decoration: underline;
    cursor: pointer;
  }
</style>
