<script>
  /**
   * «Inhalte Flow» IF1 + IF3 (Noah 14.10.2026 «2a», mockups approved 04:32): the line «Good to know» with
   * one tip a day under the page title. × hides it for today, «All tips ›» opens the sheet with every tip
   * of the page (TipsSheet.svelte).
   * page: a key of PAGES (pageinfo.js); name: the page's name for the sheet title.
   */
  import { Leaf, X } from '@lucide/svelte';
  import TipsSheet from './TipsSheet.svelte';
  import { pageInfo } from './store.svelte.js';
  import { tipOfDay, tipPlace, hideToday } from '../pageinfo.js';
  import { localDay } from '../localday.js';
  import { t } from '../i18n.svelte.js';

  let { page, name } = $props();
  const pi = pageInfo();
  const today = localDay();
  const tip = $derived(pi.loaded ? tipOfDay(pi.info, page, today) : null);
  const place = $derived(tipPlace(pi.info, page, today));
  const tipText = (x) => (x.own ? x.text : t(x.text));
  let open = $state(false);
</script>

{#if tip}
  <div class="card tipl" data-tip={tip.id} role="note">
    <Leaf size={18} aria-hidden="true" />
    <p>
      <span><b>{t('Good to know:')}</b> {tipText(tip)}</span>
      <small>{t('Tip {n} of {of} for {page}', { n: place.n, of: place.of, page: name })} · <button type="button" class="lk" onclick={() => (open = true)}>{t('All tips ›')}</button></small>
    </p>
    <button type="button" class="ib" aria-label={t('Hide the tip for today')} onclick={() => pi.save(hideToday(pi.info, page, today))}><X size={18} aria-hidden="true" /></button>
  </div>
{/if}

{#if open}<TipsSheet {page} {name} onclose={() => (open = false)} />{/if}

<style>
  .tipl {
    display: flex;
    background: var(--hi-soft);
    align-items: flex-start;
    gap: 10px;
    padding: 12px 8px 12px 16px;
  }
  .tipl > :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--hi);
  }
  .tipl > p {
    flex: 1;
    min-width: 0;
    margin: 0;
    display: grid;
    gap: 2px;
  }
  .tipl > p small {
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .lk {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    margin: -12px 0;
    border: 0;
    padding: 0 4px;
    background: none;
    color: inherit;
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
  }
  .ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin: -10px 0;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
</style>
