<script>
  /**
   * All my favourite things (v0.21.0, package 5): every item with a star, grouped by area, with
   * its weight and why it is a favourite. Read only; a name opens the item in Gear. Printable.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { favoritesByDomain } from '../lib/domains.js';
  import { formatWeight, itemWeight, CATEGORY } from '../lib/gear.js';
  import { t, tn, nameOf } from '../lib/i18n.svelte.js';

  const itemsQ = liveQuery(() => db.items.toArray());
  const groups = $derived(favoritesByDomain($itemsQ ?? []));
  const count = $derived(new Set(groups.flatMap((g) => g.items.map((i) => i.id))).size);
  const gearHref = (i) => `#/gear?q=${encodeURIComponent(i.name)}`;
  const wish = (i) => i.ownership === 'wishlist' || i.ownership === 'to-buy';
</script>

<div class="favs">
  <p class="lbl no-print"><a href="#/gear">← {t('Gear')}</a></p>
  <h1 class="title big">{t('All my favourite things')}</h1>
  {#if $itemsQ}
    <p class="meta">{tn(count, '{n} item', '{n} items')}{groups.length > 1 ? ` · ${tn(groups.length, '{n} area', '{n} areas')}` : ''}</p>
    {#if count}
      <p class="no-print"><button type="button" class="btn" onclick={() => window.print()}>{t('Print or save as PDF')}</button></p>
    {/if}
    {#each groups as g (g.key)}
      <section class="grp" aria-labelledby="fav-{g.key}">
        <h2 id="fav-{g.key}" class="title">{t(g.name)} <small class="num">{tn(g.items.length, '{n} item', '{n} items')}{g.grams ? ` · ${formatWeight(g.grams)}` : ''}</small></h2>
        <ul>
          {#each g.items as i (i.id)}
            <li style:--c={CATEGORY[i.category]?.color ?? 'var(--line)'}>
              <span class="nm">
                <a href={gearHref(i)}>{nameOf(i)}</a>{#if i.qty > 1}<small> × {i.qty}</small>{/if}
                {#if i.brand || i.model || wish(i)}<small class="sub">{[i.brand, i.model, wish(i) ? t('wishlist') : ''].filter(Boolean).join(' · ')}</small>{/if}
                {#if i.favNote}<span class="why">{i.favNote}</span>{/if}
              </span>
              <span class="w num" class:nw={i.weightG == null}>{i.weightG == null ? t('not weighed') : formatWeight(itemWeight(i))}</span>
            </li>
          {/each}
        </ul>
      </section>
    {:else}
      <p class="card">{t('No favourites yet. In Gear tap the ☆ in front of an item.')}</p>
    {/each}
  {/if}
</div>

<style>
  .favs {
    max-width: 900px;
    margin: 0 auto;
  }
  h1 {
    margin: 2px 0 0;
    font-size: var(--fs-page);
    line-height: var(--lh-title);
  }
  .meta {
    margin: 6px 0 12px;
    color: var(--ink-2);
  }
  .grp {
    margin: 22px 0 0;
    break-inside: avoid-page;
  }
  h2 {
    margin: 0 0 6px;
    font-size: var(--fs-section);
    border-bottom: 1px solid var(--line-strong);
    padding-bottom: 4px;
  }
  h2 small {
    font: 400 14px var(--font-body);
    color: var(--ink-3);
    text-transform: none;
    letter-spacing: 0;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 0 8px 10px;
    border-bottom: 1px solid var(--line);
    border-left: 4px solid var(--c);
    break-inside: avoid;
  }
  .nm {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .nm a {
    font-weight: 700;
    color: var(--ink);
  }
  .sub {
    display: block;
    color: var(--ink-3);
  }
  .why {
    display: block;
    font-size: 14px;
    color: var(--ink-2);
    font-style: italic;
  }
  .w {
    flex: none;
    font-weight: 600;
  }
  .nw {
    color: var(--ink-3);
    font-weight: 400;
    font-size: var(--fs-small);
  }
  @media print {
    :global(header.top),
    :global(nav.bottom),
    :global(.demo),
    .no-print {
      display: none !important;
    }
    :global(body),
    :global(main) {
      background: #fff !important;
      padding: 0 !important;
    }
    .favs {
      max-width: none;
      color: #000;
      font-size: 11pt;
    }
    .nm a {
      text-decoration: none;
    }
  }
</style>
