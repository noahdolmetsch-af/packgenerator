<script>
  /**
   * v0.26.1 (AP17, Noah 14a): "Suggested places" on an outdoor trip. Sleep and cook items in a poor
   * place (on the body, or where the trip has no bag) get a better bag. Nothing moves by itself:
   * Apply one row, Apply all, or dismiss a row (×). Pack writes it through change(), so Undo works.
   * rows: from bagsuggest.js suggestPlaces.
   */
  import { t, tn, nameOf } from '../i18n.svelte.js';
  import { placeKey } from '../bagsuggest.js';

  let { rows, itemsById, bags, onapply, ondismiss } = $props();

  const bagName = (r) => bags.find((b) => b.id === r.bagId)?.name ?? t(placeKey(r.to));
  const fromName = (r) => (r.from === 'body' ? t('on you') : t('{place} (no bag)', { place: t(placeKey(r.from)) }));
</script>

<section class="place-suggest" aria-labelledby="ps-h">
  <h2 id="ps-h">{t('Suggested places')}</h2>
  <p class="ps-why">{tn(rows.length, 'For a night outdoors: {n} sleep or cook item sits in a poor place. Nothing moves until you apply it.', 'For a night outdoors: {n} sleep or cook items sit in a poor place. Nothing moves until you apply them.')}</p>
  <ul>
    {#each rows as r (r.itemId)}
      {@const item = itemsById[r.itemId]}
      {@const name = item ? nameOf(item) : r.itemId}
      <li>
        <span class="ps-text"><b>{name}</b> → {bagName(r)}<small>{t('now: {place}', { place: fromName(r) })}{#if r.addBag} · {t('adds this bag for this trip only')}{/if}</small></span>
        <span class="ps-acts">
          <button type="button" class="btn sm" onclick={() => onapply([r])} aria-label={t('Apply: {name} to {bag}', { name, bag: bagName(r) })}>{t('Apply')}</button>
          <button type="button" class="x" onclick={() => ondismiss(r.itemId)} aria-label={t('Dismiss the suggestion for {name}', { name })}>×</button>
        </span>
      </li>
    {/each}
  </ul>
  {#if rows.length > 1}<button type="button" class="btn hi sm" onclick={() => onapply(rows)}>{t('Apply all')}</button>{/if}
</section>

<style>
  .place-suggest {
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 12px 14px;
    margin: 0 0 14px;
    background: var(--paper-2, var(--paper));
  }
  h2 {
    font-size: 18px;
    margin: 0 0 4px;
  }
  .ps-why {
    margin: 0 0 8px;
    font-size: 14px;
    color: var(--ink-2);
  }
  ul {
    list-style: none;
    margin: 0 0 10px;
    padding: 0;
    display: grid;
    gap: 8px;
  }
  li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 6px 10px;
  }
  .ps-text {
    flex: 1 1 180px;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .ps-text small {
    display: block;
    color: var(--ink-2);
    font-size: 13px;
  }
  .ps-acts {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .x {
    background: none;
    border: 0;
    min-width: 44px;
    min-height: 44px;
    font-size: 20px;
    color: var(--ink-2);
    cursor: pointer;
  }
</style>
