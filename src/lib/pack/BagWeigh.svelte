<script>
  /**
   * K3 «Wiegen am Starttag» (Noah 23.11.2026): in an open bag of the packing list, the packed bag on the scale. One
   * number; the app says what it calculated (items plus the bag itself) and whether the two fit. Only a suggestion:
   * the number can be changed or taken away (with Undo). The number belongs to the trip (trip.weighed), see bagweigh.js.
   */
  import { t } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { formatWeight } from '../gear.js';
  import { readGrams } from '../weigh.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { weighCompare, weighedOf, withWeighed } from './bagweigh.js';

  /** calcG: the items in grams; bagG: the bag itself (null: not weighed in the gear); missing: items without a weight. */
  let { trip, slot, calcG = 0, bagG = null, missing = 0, onsave = null } = $props();
  const mine = $derived(weighedOf(trip)[slot] ?? null);
  const total = $derived(calcG + (bagG ?? 0));
  const result = $derived(mine ? weighCompare({ calcG: total, weighedG: mine.g, missing }) : null);
  let text = $state('');
  let msg = $state('');
  let editing = $state(false);

  async function save(e) {
    e.preventDefault();
    const g = readGrams(text);
    if (g == null) return (msg = t('Type the weight in grams, e.g. 1850.'));
    msg = '';
    const before = $state.snapshot(trip.weighed ?? {});
    await onsave?.(withWeighed(trip, slot, g, localDay()));
    editing = false;
    text = '';
    offerDone(t('Weight of the bag saved.'), () => onsave?.(before));
  }
  async function remove() {
    const before = $state.snapshot(trip.weighed ?? {});
    await onsave?.(withWeighed(trip, slot, 0));
    offerDone(t('Weight of the bag removed.'), () => onsave?.(before));
  }
  const kg = (g) => formatWeight(Math.abs(g));
</script>

{#if onsave}
  <div class="bw" data-bag-weigh={slot}>
    {#if mine && !editing}
      <p class="bw-line" data-bag-weigh-result={result?.status ?? ''}>
        <b>{t('On the scale: {kg}', { kg: kg(mine.g) })}</b>
        {#if result?.status === 'ok'}<span class="ok">{t('The calculation says {kg}: this fits.', { kg: kg(total) })}</span>
        {:else if result?.status === 'more'}<span class="warn">{t('{kg} more than the calculation ({calc}). Is a piece missing from the list, or does a weight in your gear not fit?', { kg: kg(result.diffG), calc: kg(total) })}</span>
        {:else if result?.status === 'less'}<span class="warn">{t('{kg} less than the calculation ({calc}). Is a piece on the list that is not in the bag, or does a weight in your gear not fit?', { kg: kg(result.diffG), calc: kg(total) })}</span>
        {:else if result?.status === 'unsure'}<span>{t('The calculation ({calc}) lacks the weight of {n} items, so it cannot say yet. Weigh them and look again.', { calc: kg(total), n: missing })}</span>{/if}
        {#if bagG == null && result?.status !== 'ok'}<span class="note">{t('The bag itself is not weighed in your gear; its weight is part of the difference.')}</span>{/if}
      </p>
      <span class="bw-row">
        <button type="button" class="tp-link" onclick={() => ((editing = true), (text = String(mine.g)))} data-bag-weigh-edit>{t('Change')}</button>
        <button type="button" class="tp-link" onclick={remove} data-bag-weigh-remove>{t('Remove')}</button>
      </span>
    {:else}
      <form class="bw-row" onsubmit={save}>
        <label class="bw-lab">{t('Packed bag on the scale (g)')}<input class="inp" type="text" inputmode="numeric" autocomplete="off" bind:value={text} placeholder={t('e.g. 1850')} data-bag-weigh-input /></label>
        <button type="submit" class="btn sm" data-bag-weigh-save>{t('Save')}</button>
        {#if editing}<button type="button" class="btn sm" onclick={() => ((editing = false), (msg = ''))}>{t('Cancel')}</button>{/if}
      </form>
      {#if msg}<p class="err" role="alert">{msg}</p>{/if}
    {/if}
  </div>
{/if}

<style>
  .bw { margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--line); display: grid; gap: 6px; }
  .bw-line { margin: 0; display: grid; gap: 4px; overflow-wrap: break-word; min-width: 0; }
  .bw-line .warn { color: var(--warn, var(--ink)); }
  .bw-line .note { font-size: var(--fs-small); color: var(--ink-2); }
  .bw-row { display: flex; flex-wrap: wrap; align-items: end; gap: 8px 12px; }
  .bw-lab { display: grid; gap: 4px; font-size: var(--fs-small); color: var(--ink-2); flex: 1 1 12em; min-width: 0; }
  .bw-row :global(.tp-link) { min-height: 44px; }
</style>
