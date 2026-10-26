<script>
  // «332 sichtbar» (Noah 26.10.2026): «Lighter alternatives» and «Power values of a device» lived only inside
  // each item's window. This short list on Gear shows them for all items at once; a tap opens the item.
  import { X } from '@lucide/svelte';
  import { t, nameOf } from '../i18n.svelte.js';
  import { lighterAlts } from './material.js';
  import { CHARGE_CATEGORIES, isInventory } from '../gear.js';
  import { powerLine } from '../strom.js';

  /** kind: 'light' | 'power' */
  let { kind, items = [], onopen, onclose } = $props();

  const rows = $derived.by(() => {
    const mine = items.filter(isInventory);
    if (kind === 'light') {
      return mine
        .map((item) => ({ item, alt: lighterAlts(item, items)[0] }))
        .filter((r) => r.alt)
        .sort((a, b) => a.alt.diffG - b.alt.diffG)
        .map((r) => ({ item: r.item, line: t('{name} is {g} g lighter', { name: nameOf(r.alt.item), g: -r.alt.diffG }) }));
    }
    return mine
      .filter((i) => CHARGE_CATEGORIES.includes(i.category))
      .map((item) => ({ item, line: powerLine(item, t) || t('not set') }))
      .sort((a, b) => nameOf(a.item).localeCompare(nameOf(b.item)));
  });
</script>

<section class="finds" data-gear-finds={kind} aria-labelledby="gf-h">
  <div class="fh">
    <h2 id="gf-h">{kind === 'light' ? t('Lighter alternatives') : t('Power values of a device')}</h2>
    <button type="button" class="gfx" aria-label={t('Close')} onclick={onclose}><X size={18} aria-hidden="true" /></button>
  </div>
  <p class="quiet">{kind === 'light' ? t('Lighter things from your own gear. Tap an item to see all of them at its weight.') : t('Battery, how long it lasts and charges. Tap a device to type or measure the values.')}</p>
  {#if rows.length}
    <ul>
      {#each rows.slice(0, 12) as r (r.item.id)}
        <li><button type="button" onclick={() => onopen?.(r.item)}><b>{nameOf(r.item)}</b><span>{r.line}</span></button></li>
      {/each}
    </ul>
    {#if rows.length > 12}<p class="quiet">{t('and {n} more', { n: rows.length - 12 })}</p>{/if}
  {:else}
    <p class="quiet" data-gear-finds-empty>{kind === 'light' ? t('No lighter alternative in your gear.') : t('No device that charges yet.')}</p>
  {/if}
</section>

<style>
  .finds {
    margin: var(--sp-2) 0 var(--sp-3);
    padding: var(--sp-3);
    border: 1px solid var(--line);
    border-radius: var(--radius, 12px);
    background: var(--paper);
  }
  .fh {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-2);
  }
  .gfx {
    display: inline-grid;
    place-items: center;
    min-width: 44px;
    min-height: 44px;
    border: 0;
    background: none;
    color: var(--ink);
    cursor: pointer;
  }
  h2 {
    margin: 0;
    font-size: var(--fs-body);
  }
  ul {
    list-style: none;
    margin: var(--sp-2) 0 0;
    padding: 0;
  }
  li button {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    width: 100%;
    min-height: 44px;
    padding: var(--sp-2) 0;
    border: 0;
    border-top: 1px solid var(--line);
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  li button span {
    color: var(--ink-soft, var(--muted));
    font-size: var(--fs-small);
  }
</style>
