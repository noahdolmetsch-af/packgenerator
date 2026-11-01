<script>
  /**
   * «Eigenes Diagramm» D3 «Wert hinzufügen»: search and every value by its group, as chips; a tap adds or
   * takes away a value at once (at most 6). «Zuletzt gewählt» on top. Values Google or Garmin do not give
   * out are left out here (they have no days yet).
   * groups: analyseGroups(); keys: the values now; recent: keys picked before; ontoggle(key); onclose().
   */
  import { tick } from 'svelte';
  import { X, Check, Search } from '@lucide/svelte';
  import { backClose } from '../../lib/ui/backclose.js';
  import { MAX_VALUES, recentKeys, matches } from '../../lib/analyse/diagram.js';
  import { t } from '../../lib/i18n.svelte.js';

  let { groups = [], keys = [], recent = [], ontoggle, onclose } = $props();
  let dialog;
  let input;
  let q = $state('');

  $effect(() => {
    dialog.showModal();
    tick().then(() => input?.focus());
  });

  const usable = $derived(groups.map((g) => ({ ...g, items: g.items.filter((x) => !x.later && x.get) })).filter((g) => g.items.length));
  const byKey = $derived(new Map(usable.flatMap((g) => g.items.map((x) => [x.key, x]))));
  const shown = $derived(usable.map((g) => ({ ...g, items: g.items.filter((x) => matches(x.name, q) || matches(g.name, q)) })).filter((g) => g.items.length));
  const lately = $derived(recentKeys(recent, keys).filter((k) => byKey.has(k)));
  const full = $derived(keys.length >= MAX_VALUES);
</script>

<dialog class="sheet from-below vp" bind:this={dialog} use:backClose onclose={() => onclose?.()} aria-labelledby="vp-h" data-value-picker>
  <div class="head">
    <h2 id="vp-h">{t('Add a value|diagram')}</h2>
    <button type="button" class="ib" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <label class="find">
    <Search size={16} aria-hidden="true" />
    <span class="sr">{t('Search a value|diagram')}</span>
    <input class="inp" type="search" bind:this={input} bind:value={q} placeholder={t('Search a value, e.g. «pulse» or «sauna»|diagram')} autocomplete="off" data-find />
  </label>
  <div class="scroll">
    {#if lately.length && !q}
      <h3>{t('Picked lately|diagram')}</h3>
      <div class="chips">
        {#each lately as k (k)}
          <button type="button" class="chip" disabled={full} data-pick={k} onclick={() => ontoggle?.(k)}>{byKey.get(k).name}</button>
        {/each}
      </div>
    {/if}
    {#each shown as g (g.key)}
      <h3>{g.name}</h3>
      <div class="chips">
        {#each g.items as x (x.key)}
          {@const on = keys.includes(x.key)}
          <button type="button" class="chip" class:on aria-pressed={on} disabled={!on && full} data-pick={x.key} onclick={() => ontoggle?.(x.key)}>{#if on}<Check size={14} aria-hidden="true" />{/if}{x.name}</button>
        {/each}
      </div>
    {:else}
      <p class="hint">{t('No value matches «{q}».|diagram', { q })}</p>
    {/each}
  </div>
  <div class="foot">
    <span class="n" data-count>{t('{n} of {max} chosen|diagram', { n: keys.length, max: MAX_VALUES })}</span>
    <button type="button" class="btn hi" onclick={() => dialog.close()}>{t('Done')}</button>
  </div>
</dialog>

<style>
  .vp {
    width: min(560px, calc(100vw - 24px));
  }
  .head,
  .foot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }
  .foot {
    margin-top: 12px;
  }
  h2 {
    margin: 0;
    font-size: var(--fs-section);
  }
  h3 {
    margin: 14px 0 6px;
    color: var(--ink-3);
    font-size: var(--fs-label);
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .ib {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .find {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
    padding: 0 12px;
    border: 1px solid var(--line);
    border-radius: 999px;
    color: var(--ink-3);
  }
  .find .inp {
    flex: 1;
    min-width: 0;
    border: 0;
    background: none;
  }
  .scroll {
    max-height: min(56vh, 520px);
    overflow-y: auto;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 36px;
    padding: 4px 12px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .chip.on {
    border-color: var(--hi);
    background: var(--hi-soft);
    font-weight: 600;
  }
  .chip:disabled {
    opacity: 0.45;
    cursor: default;
  }
  @media (pointer: coarse) {
    .chip {
      min-height: 44px;
    }
  }
  .n,
  .hint {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
