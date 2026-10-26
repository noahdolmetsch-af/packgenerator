<script>
  /**
   * Idee 58 «Verbrauch buchen»: the hint on the next packing list, «Letztes Mal: 5 von 8 verbraucht (2 Tage)»,
   * from the newest booked tour of the same type. Only a hint; nothing changes the list.
   */
  import { History } from '@lucide/svelte';
  import { usedRows, lastUse } from './verbrauch.js';
  import { t, nameOf, num } from '../i18n.svelte.js';

  let { trip, trips = [], itemsById = {} } = $props();
  const lines = $derived(
    usedRows(trip, itemsById)
      .map((r) => ({ item: r.item, last: lastUse(trips, trip, r.item.id) }))
      .filter((x) => x.last),
  );
</script>

{#if lines.length}
  <section class="tp-card uh" aria-labelledby="uh-h" data-used-hint>
    <h2 id="uh-h"><History size={18} aria-hidden="true" /> {t('Used last time')}</h2>
    <ul>
      {#each lines as l (l.item.id)}
        <li><b>{nameOf(l.item)}</b> · {l.last.taken ? t('{used} of {taken} used', { used: num(l.last.used), taken: num(l.last.taken) }) : t('{used} used', { used: num(l.last.used) })} · <small>{l.last.days > 1 ? t('{n} days, {title}', { n: num(l.last.days), title: l.last.title }) : l.last.title}</small></li>
      {/each}
    </ul>
  </section>
{/if}

<style>
  .uh {
    margin: 0 0 var(--sp-4);
  }
  .uh h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 4px;
    font-size: var(--fs-sub);
  }
  .uh ul {
    margin: 0;
    padding-left: 18px;
  }
  .uh small {
    color: var(--ink-2);
  }
</style>
