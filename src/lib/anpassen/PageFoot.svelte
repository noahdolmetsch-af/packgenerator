<script>
  /**
   * «Anpassen» 1a (Noah 20.10.2026): at the end of every page a quiet line «Diese Seite anpassen». It
   * opens the window (AnpassenSheet, loaded on the first tap) and keeps your choice for this page on it
   * while the page loads and redraws (parts.js watchParts). Without a choice nothing watches the page.
   *
   * page: the key of the page (anpassen.js pageKeyOf); place: its place (for the tabs).
   */
  import { SlidersHorizontal } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { pageCfg, isEmptyPage } from '../anpassen.js';
  import { anp } from '../anpassen.svelte.js';
  import { findParts, watchParts, clearParts } from './parts.js';

  let { page, place = null, fallback = '' } = $props();

  let foot;
  let open = $state(false);
  let Sheet = $state(null);
  let failed = $state(false);

  const cfg = $derived((void anp.v, pageCfg(anp.cfg, page)));
  const active = $derived(open || !isEmptyPage(cfg));
  const rootOf = () => foot?.closest('main') ?? null;

  $effect(() => {
    const root = rootOf();
    if (!root) return;
    if (!active) {
      // nothing chosen for this page: take off what an earlier choice (or «As at the start») left
      if (root.querySelector('[data-anp-hide], [data-anp-orig], [data-anp-sorted]')) clearParts(root);
      return;
    }
    void cfg; // a new choice: watch again, which applies it at once
    const key = page;
    return watchParts(root, () => pageCfg(anp.cfg, key));
  });

  /** The name of the page for the list under Darstellung: its big title, else the place and tab. */
  function title() {
    const h1 = rootOf()?.querySelector('h1');
    return (h1?.textContent ?? '').replace(/\s+/g, ' ').trim() || fallback;
  }

  async function show() {
    failed = false;
    try {
      Sheet ??= (await import('./AnpassenSheet.svelte')).default;
      open = true;
    } catch (err) {
      console.error(err);
      failed = true;
    }
  }
</script>

<p class="anp-foot" bind:this={foot}>
  <button type="button" class="anp-open" onclick={show} data-anp-open><SlidersHorizontal size={16} aria-hidden="true" />{t('Customise this page')}</button>
  {#if failed}<span class="err" role="status">{t('Could not open. Check the connection and try again.')}</span>{/if}
</p>
{#if open && Sheet}
  <Sheet {page} {place} title={title()} getParts={() => findParts(rootOf()).parts} onclose={() => (open = false)} />
{/if}

<style>
  .anp-foot {
    order: 99999; /* stays last when you sorted the parts */
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--sp-2);
    margin: var(--sp-2) 0 0;
  }
  .anp-open {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 var(--sp-3);
    border: 0;
    border-radius: 999px;
    background: none;
    color: var(--ink-3);
    font: 500 var(--fs-small) / 1.2 var(--font-body);
    cursor: pointer;
  }
  .anp-open:hover {
    color: var(--ink);
    background: var(--paper-2);
  }
  .err {
    color: var(--warn-ink, var(--ink-2));
    font-size: var(--fs-small);
  }
</style>
