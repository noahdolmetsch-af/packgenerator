<script>
  /**
   * v0.101.0 Design-Refresh P2 (H1): «A year ago» on Today: the trip that started around this day one
   * year ago, its days and a line from its debrief. Without one it says so quietly.
   */
  import { Image } from '@lucide/svelte';
  import TileHead from './TileHead.svelte';
  import { yearAgo } from './bausteine.js';
  import { t, tn } from '../i18n.svelte.js';

  let { trips = [], debriefs = [], today, isnew = false } = $props();
  const r = $derived(yearAgo({ trips, debriefs, today }));
</script>

<svelte:element this={r ? 'a' : 'section'} class="ya surf" href={r ? `#/debrief/${encodeURIComponent(r.trip.id)}` : undefined} aria-labelledby="ya-h" data-section="yearago">
  <TileHead icon={Image} id="ya-h" title={t('A year ago')} {isnew} />
  {#if r}
    <p class="tt">{r.trip.title}{#if Number(r.trip.days) > 1}, {tn(Number(r.trip.days), '{n} day', '{n} days')}{/if}</p>
    {#if r.note}<p class="nt">«{r.note}»</p>{/if}
  {:else}
    <p class="nt">{t('No trip around this day last year.')}</p>
  {/if}
</svelte:element>

<style>
  .ya {
    display: flex;
    flex-direction: column;
    gap: 6px;
    height: 100%;
    padding: 14px 18px;
    box-sizing: border-box;
    color: var(--ink);
    text-decoration: none;
  }
  a.ya:hover {
    background: var(--paper-2);
  }
  p {
    margin: 0;
    overflow-wrap: break-word;
  }
  .tt {
    font-weight: 500;
  }
  .nt {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
