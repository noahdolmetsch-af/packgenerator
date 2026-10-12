<script>
  /**
   * v0.101.0 Design-Refresh P2 (H1): «Next milestone» on Today: how far the closest bike is from its
   * next full 1000 km (else the next number of trips), with a bar. A tap opens all milestones.
   */
  import { Trophy } from '@lucide/svelte';
  import TileHead from './TileHead.svelte';
  import { nextMilestone } from './bausteine.js';
  import { t, tn, num } from '../i18n.svelte.js';

  let { bikes = [], tripsDone = 0, isnew = false } = $props();
  const m = $derived(nextMilestone({ bikes, tripsDone }));
</script>

<a class="ms surf" href="#/flow/milestones" aria-labelledby="nm-h" data-section="nextms">
  <TileHead icon={Trophy} id="nm-h" title={t('Next milestone')} {isnew} />
  {#if m}
    <p class="ln num">{m.kind === 'bike' ? t('{left} km to {at} km · {bike}', { left: num(m.left), at: num(m.at), bike: m.bike }) : tn(m.left, 'One more trip to your {at}th', '{n} more trips to your {at}th', { at: num(m.at) })}</p>
    <span class="bar" aria-hidden="true"><span style:width="{Math.round(m.share * 100)}%"></span></span>
  {:else}
    <p class="ln">{t('Your first ride or trip starts the count.')}</p>
  {/if}
</a>

<style>
  .ms {
    display: flex;
    flex-direction: column;
    gap: 10px;
    height: 100%;
    padding: 14px 18px;
    box-sizing: border-box;
    color: var(--ink);
    text-decoration: none;
  }
  .ms:hover {
    background: var(--paper-2);
  }
  .ln {
    margin: 0;
    font-size: var(--fs-small);
    font-weight: 500;
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
</style>
