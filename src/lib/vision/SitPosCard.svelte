<script>
  /**
   * Paket L2 «Sitzposition» (Noah «4a»): on the bike page, under the fit numbers: the last measurement
   * of the sitting position, «Messen» (photo or video, Werkzeugkasten › Sitzposition) and the history.
   */
  import { PersonStanding, ChevronRight } from '@lucide/svelte';
  import { sitPosOf } from './fit.js';
  import SitPosList from './SitPosList.svelte';
  import { t, tn } from '../i18n.svelte.js';

  let { bike } = $props();
  const rows = $derived(sitPosOf(bike));
  let open = $state(false);
  const href = $derived(`#/me/tools/sitpos?bike=${encodeURIComponent(bike.id)}`);
</script>

<section class="spc" aria-labelledby="spc-h-{bike.id}">
  <a class="spc-row" {href} data-sitpos-measure>
    <span class="spc-ib" aria-hidden="true"><PersonStanding size={18} /></span>
    <span class="spc-m">
      <b id="spc-h-{bike.id}">{t('Sitting position')}</b>
      <small>{rows.length ? t('Measure again with a photo or video') : t('Measure knee and back angles with a photo or video')}</small>
    </span>
    <ChevronRight size={18} aria-hidden="true" />
  </a>
  {#if rows.length}
    <SitPosList {bike} limit={open ? 0 : 1} />
    {#if rows.length > 1}
      <button type="button" class="spc-more" aria-expanded={open} onclick={() => (open = !open)}>{open ? t('Show less') : tn(rows.length - 1, 'Show {n} earlier measurement', 'Show {n} earlier measurements')}</button>
    {/if}
  {/if}
</section>

<style>
  .spc {
    display: grid;
    gap: var(--sp-1, 4px);
    margin-top: var(--sp-3);
  }
  .spc-row {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    min-height: 52px;
    color: var(--ink);
    text-decoration: none;
  }
  .spc-ib {
    display: inline-grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--paper-2);
    flex: none;
  }
  .spc-m {
    display: grid;
    flex: 1;
    min-width: 0;
  }
  .spc-m small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .spc-more {
    justify-self: start;
    min-height: 44px;
    border: 0;
    background: none;
    color: var(--ink);
    text-decoration: underline;
    cursor: pointer;
    font: inherit;
    font-size: var(--fs-small);
  }
</style>
