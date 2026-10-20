<script>
  /**
   * Kleidung nach Wetter (Noah 20.10.2026 «5a»): one quiet line under the weather of a trip being packed:
   * what you wore on earlier finished tours at a similar temperature (tourextra.js clothesAt), and what you
   * took but did not use. «Add the missing ones» puts the worn clothes that are not on the list yet on it
   * (with Undo, through onadd). Only a suggestion: nothing changes without a tap.
   * info: clothesAt(); itemsById; have: the item ids on the list; onadd(ids, label).
   */
  import { t, tn, num, nameOf } from '../i18n.svelte.js';
  import { Shirt, ChevronDown, Plus } from '@lucide/svelte';

  let { info, itemsById = {}, have = new Set(), onadd } = $props();
  let open = $state(false);
  const worn = $derived(info.items.filter((x) => x.worn > 0 && itemsById[x.id]));
  const unused = $derived(info.items.filter((x) => x.unused > 0 && !x.worn && itemsById[x.id]));
  const missing = $derived(worn.filter((x) => !have.has(x.id)).map((x) => x.id));
  const nm = (id) => nameOf(itemsById[id]);
</script>

{#if worn.length || unused.length}
  <div class="cat" data-clothes-at>
    <button type="button" class="cl" aria-expanded={open} aria-controls="clothes-at" onclick={() => (open = !open)}>
      <Shirt size={16} aria-hidden="true" />
      <span>{tn(info.n, 'At {from} to {to} °C you wore on {n} tour: {list}', 'At {from} to {to} °C you wore on {n} tours: {list}', { from: num(info.from), to: num(info.to), list: worn.slice(0, 3).map((x) => nm(x.id)).join(', ') || '–' })}</span>
      <ChevronDown class="chev" size={16} aria-hidden="true" />
    </button>
    {#if open}
      <div id="clothes-at" class="cr">
        {#if worn.length}<p><b>{t('Worn')}</b> {worn.map((x) => `${nm(x.id)}${x.worn > 1 ? ` (${num(x.worn)}×)` : ''}`).join(', ')}</p>{/if}
        {#if unused.length}<p><b>{t('Along but not used')}</b> {unused.map((x) => nm(x.id)).join(', ')}</p>{/if}
        {#if missing.length}
          <button type="button" class="btn" onclick={() => onadd?.(missing, t('Clothes of similar weather'))} data-clothes-add><Plus size={16} aria-hidden="true" />{tn(missing.length, 'Add the {n} missing one', 'Add the {n} missing ones')}</button>
        {:else}
          <p class="tp-muted tp-small">{t('All of it is on the list already.')}</p>
        {/if}
      </div>
    {/if}
  </div>
{/if}

<style>
  .cat {
    margin: 6px 0 0;
  }
  .cl {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--ink-2);
    font: inherit;
    font-size: var(--fs-small);
    text-align: left;
    cursor: pointer;
  }
  .cl span {
    flex: 1;
    min-width: 0;
  }
  .cl[aria-expanded='true'] :global(.chev) {
    transform: rotate(180deg);
  }
  .cr {
    display: grid;
    gap: 6px;
    padding: 0 0 8px 24px;
    font-size: var(--fs-small);
  }
  .cr p {
    margin: 0;
  }
  .cr .btn {
    justify-self: start;
  }
</style>
