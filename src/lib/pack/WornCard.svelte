<script>
  /**
   * v0.59.0 «Tauschen» (OP2a, Noah a): the clothing I wear on the trip as the first card of the packing
   * list, «On me», by zone from head to feet, inside a zone by layer from the skin outwards (swap.js
   * wornClothes). Each piece is one row; a tap opens «Swap» for it (SwapSheet). A swapped piece says
   * what it stands for. The way to the wardrobe with the trip band is at the bottom of the card.
   */
  import { UserRound, ArrowLeftRight, Shirt } from '@lucide/svelte';
  import TempBar from '../ui/TempBar.svelte';
  import { t, tn, nameOf, locale } from '../i18n.svelte.js';
  import { formatWeight, itemWeight } from '../gear.js';
  import { ZONES, tempRange } from '../wardrobe.js';
  let { worn, itemsById, range = null, reasons = {}, wardrobeHref, onswap } = $props();

  const LN = { base: 1, mid: 2, outer: 3, accessory: 4 };
  const zoneName = (key) => (key === 'other' ? t('More clothing') : t(ZONES.find((z) => z.key === key)?.name ?? key));
  const grams = $derived(worn.zones.reduce((s, z) => s + z.rows.reduce((g, r) => g + (itemWeight(r.item) ?? 0) * (r.entry.qty || 1), 0), 0));
  const kg = (g) => `${(g / 1000).toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`;
  const CLASS = { warm: 'warm|temp', mittel: 'medium|temp', kalt: 'cold|temp' };
  const tr = (s, v) => t(s, v);
  const range0 = (i) => (typeof i.tempMin === 'number' && typeof i.tempMax === 'number' ? `${i.tempMin}–${i.tempMax}°` : tempRange(i.tempMin, i.tempMax, tr) || (i.tempClass ? t(CLASS[i.tempClass] ?? i.tempClass) : ''));
  const changed = $derived(worn.zones.reduce((n, z) => n + z.rows.filter((r) => r.entry.swappedFrom).length, 0));
</script>

<section class="worn-card" aria-labelledby="worn-h">
  <header class="wh">
    <span class="wi" aria-hidden="true"><UserRound size={20} /></span>
    <span class="wt">
      <h3 id="worn-h">{t('On me')}</h3>
      <small class="num">{tn(worn.n, '{n} piece', '{n} pieces')} · {kg(grams)} · {t('a tap swaps')}</small>
    </span>
    {#if changed}<i class="pill act">{tn(changed, '{n} swapped', '{n} swapped')}</i>{/if}
  </header>
  {#each worn.zones as z (z.zone)}
    <h4 class="zlabel">{zoneName(z.zone)}</h4>
    <ul class="wrows">
      {#each z.rows as r (r.entry.itemId)}
        {@const was = r.entry.swappedFrom ? itemsById[r.entry.swappedFrom] : null}
        <li class:changed={!!was}>
          <button type="button" class="wrow" data-item={r.entry.itemId} aria-label={t('Swap {name}', { name: nameOf(r.item) })} onclick={() => onswap(r.entry, r.item)}>
            <span class="dot" style="background: var(--l{LN[r.layer] ?? 4})" aria-hidden="true"></span>
            <span class="mid">
              <span class="nm">{nameOf(r.item)}{(r.entry.qty || 1) > 1 ? ` × ${r.entry.qty}` : ''}</span>
              <span class="tl"><TempBar item={r.item} mark={range} width={64} /><small class="num">{range0(r.item)}</small>{#if was}<small class="was">{t('instead of {name}', { name: nameOf(was) })}</small>{:else if reasons[r.entry.itemId]?.line}<small class="why">{reasons[r.entry.itemId].line}</small>{/if}</span>
            </span>
            <span class="w num">{r.item.weightG == null ? '–' : formatWeight(itemWeight(r.item) * (r.entry.qty || 1))}</span>
            <span class="swi" aria-hidden="true"><ArrowLeftRight size={18} /></span>
          </button>
        </li>
      {/each}
    </ul>
  {/each}
  <p class="foot">
    <a class="btn wbtn" href={wardrobeHref}><Shirt size={18} aria-hidden="true" />{t('Open in the wardrobe')}</a>
  </p>
  <p class="legend">
    {#each [['base', 'Base|layer'], ['mid', 'Mid|layer'], ['outer', 'Outer|layer'], ['accessory', 'Accessories|layer']] as [k, name] (k)}<span><i style="background: var(--l{LN[k]})" aria-hidden="true"></i>{t(name)}</span>{/each}
    {#if range}<span><b class="mk" aria-hidden="true"></b>{t('Frame: this trip')}</span>{/if}
  </p>
</section>

<style>
  .worn-card { grid-column: 1 / -1; background: var(--paper); border: 1px solid var(--card-line); border-radius: var(--radius-card); box-shadow: var(--card-shadow); padding: 12px 14px 10px; min-width: 0; }
  .wh { display: flex; align-items: center; gap: 12px; }
  .wi { display: grid; place-items: center; flex: none; width: 40px; height: 40px; border-radius: 10px; background: var(--hi-soft); color: var(--hi); }
  .wt { flex: 1; min-width: 0; }
  .wt h3 { margin: 0; font: 600 var(--fs-sub)/1.25 var(--font-body); }
  .wt small { display: block; color: var(--ink-3); font-size: var(--fs-small); overflow-wrap: break-word; }
  .wrows { list-style: none; margin: 0; padding: 0; }
  .wrows li { border-top: 1px solid var(--line); }
  .wrows li:first-child { border-top: 0; }
  .wrow { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 56px; padding: 6px 4px; border: 0; border-radius: 8px; background: none; color: var(--ink); text-align: left; cursor: pointer; font: inherit; }
  @media (hover: hover) { .wrow:hover { background: var(--paper-2); } }
  .wrow:focus-visible { outline: 3px solid var(--hi); outline-offset: 2px; }
  .changed .wrow { background: var(--hi-soft); }
  .dot { flex: none; width: 9px; height: 9px; border-radius: 50%; }
  .mid { flex: 1; min-width: 0; display: grid; gap: 4px; }
  .nm { font-weight: 500; overflow-wrap: break-word; hyphens: auto; }
  .tl { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; }
  .tl small { color: var(--ink-3); font-size: var(--fs-small); white-space: nowrap; }
  .tl .why { white-space: normal; overflow-wrap: break-word; }
  .tl .was { color: var(--badge-ink); white-space: normal; overflow-wrap: break-word; }
  .w { flex: none; color: var(--ink-2); font-size: var(--fs-small); }
  .swi { flex: none; display: grid; place-items: center; width: 36px; height: 36px; border-radius: 8px; background: var(--paper-2); color: var(--ink-2); }
  .foot { margin: 10px 0 4px; }
  .wbtn { display: flex; justify-content: center; gap: 8px; width: 100%; box-sizing: border-box; }
  .legend { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px 14px; margin: 6px 0 0; color: var(--ink-3); font-size: var(--fs-small); }
  .legend span { display: inline-flex; align-items: center; gap: 6px; }
  .legend i { width: 8px; height: 8px; border-radius: 50%; }
  .legend .mk { width: 14px; height: 10px; border: 1.5px solid var(--ink); border-radius: 4px; }
</style>
