<script>
  /**
   * v0.68.0 «Q1 Jeder km zählt» (Q1.4 a): the small chips of a ride: where the km come from (FIT file,
   * Strava CSV, by hand, correction), where its bike comes from (sensor, Strava bike, profile rule, by
   * you) and how sure it is (sure, likely, unclear, by you). Used in the ride ledger, the import and
   * on Today. Each prop is optional.
   */
  import { t } from '../i18n.svelte.js';
  import { SOURCE_NAME, SURE_NAME, BY_NAME } from '../kmbook.js';

  let { source = null, kind = null, by = null, sure = null, extra = null } = $props();
  const src = $derived(kind === 'correction' ? 'corr' : source);
</script>

<span class="kc">
  {#if src}<span class="k src-{src}">{src === 'corr' ? t('Correction') : t(SOURCE_NAME[src] ?? src)}</span>{/if}
  {#if by && by !== 'user'}<span class="k by-{by}">{t(BY_NAME[by])}</span>{/if}
  {#if sure}<span class="k sure-{sure}">{t(SURE_NAME[sure])}</span>{/if}
  {#if extra}<span class="k plain">{extra}</span>{/if}
</span>

<style>
  .kc {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 6px;
  }
  .k {
    display: inline-flex;
    align-items: center;
    min-height: 22px;
    padding: 0 8px;
    border: 1px solid transparent;
    border-radius: 999px;
    background: var(--paper-2);
    color: var(--ink-2);
    font: 500 var(--fs-tiny) / 1.6 var(--font-body);
    white-space: nowrap;
  }
  .src-fit,
  .by-sensor {
    background: var(--info-soft);
    color: var(--ink);
  }
  .src-csv,
  .src-strava,
  .by-gear {
    background: var(--hi-soft);
    color: var(--badge-ink);
  }
  .src-corr,
  .src-sync {
    background: var(--warn-soft);
    color: var(--warn);
  }
  .sure-sure {
    background: var(--accent-soft);
    color: var(--ok);
  }
  .sure-likely {
    background: transparent;
    border-color: var(--ok);
    color: var(--ok);
  }
  .sure-unclear {
    background: transparent;
    border-color: var(--bad);
    color: var(--bad);
  }
  .sure-user {
    background: var(--ink);
    color: var(--paper);
  }
</style>
