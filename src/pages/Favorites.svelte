<script>
  /**
   * All my favourite things (v0.21.0, package 5): every item with a star, grouped by area, with
   * its weight and why it is a favourite. Read only; a name opens the item in Gear. Printable.
   * SN5 «Seiten neu» (Noah 13.10.2026 «ich gebe alle bild mockups frei»): the head with its path and
   * «Drucken»; one card per area with the weight right and «…» per item (open it, change the note,
   * take the star away with Undo).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { favoritesByDomain } from '../lib/domains.js';
  import { formatWeight, itemWeight, CATEGORY } from '../lib/gear.js';
  import { t, tn, nameOf } from '../lib/i18n.svelte.js';
  import Empty from '../lib/ui/Empty.svelte';
  import PathHead from '../lib/ui/PathHead.svelte';
  import Section from '../lib/ui/Section.svelte';
  import Btn from '../lib/ui/Btn.svelte';
  import MoreActions from '../lib/ui/MoreActions.svelte';
  import RenameSheet from '../lib/ui/RenameSheet.svelte';
  import { catIcon } from '../lib/gear/caticon.js';
  import { Star, Printer, StarOff, PenLine, ExternalLink } from '@lucide/svelte';

  const itemsQ = liveQuery(() => db.items.toArray());
  const groups = $derived(favoritesByDomain($itemsQ ?? []));
  const count = $derived(new Set(groups.flatMap((g) => g.items.map((i) => i.id))).size);
  const gearHref = (i) => `#/gear?q=${encodeURIComponent(i.name)}`;
  const wish = (i) => i.ownership === 'wishlist' || i.ownership === 'to-buy';
  const subOf = (i) => [CATEGORY[i.category] ? t(CATEGORY[i.category].name) : '', i.brand, i.model, wish(i) ? t('wishlist') : ''].filter(Boolean).join(' · ');

  /* SN5: «…» of an item: open it in Gear, change why it is a favourite, take the star away (with Undo) */
  let noting = $state(null); // the item whose note is changed
  let undo = $state(null); // { text, item }
  let timer;
  const stamp = () => new Date().toISOString();
  async function unstar(i) {
    await db.items.update(i.id, { favorite: null, updatedAt: stamp() });
    clearTimeout(timer);
    undo = { text: t('{name}: no longer a favourite.', { name: nameOf(i) }), item: i };
    timer = setTimeout(() => (undo = null), 10_000);
  }
  async function restar() {
    const i = undo?.item;
    clearTimeout(timer);
    undo = null;
    if (i) await db.items.update(i.id, { favorite: true, updatedAt: stamp() });
  }
  $effect(() => () => clearTimeout(timer));
  const saveNote = (i, text) => db.items.update(i.id, { favNote: text.trim() || null, updatedAt: stamp() });
  const actionsOf = (i) => [
    { name: t('Open|item'), explain: t('In Gear, with all its details'), icon: ExternalLink, run: () => (location.hash = gearHref(i)) },
    { name: t('Change note'), explain: t('Why it is a favourite'), icon: PenLine, run: () => (noting = i) },
    { name: t('Remove star'), explain: t('The item stays in your gear'), icon: StarOff, run: () => unstar(i) },
  ];
</script>

<div class="favs">
  <!-- v0.40.0 (design check): one name for the page, as in the menu: Favourites. -->
  <PathHead crumbs={[{ label: t('Gear|place'), href: '#/gear' }]} title={t('Favourites')} sub={$itemsQ ? [tn(count, '{n} item', '{n} items'), count ? t('your favourite things per kind of trip') : ''].filter(Boolean).join(' · ') : ''}>
    {#if count}<Btn icon={Printer} label={t('Print|pdf')} explain={t('Print or save as PDF')} onclick={() => window.print()} />{/if}
  </PathHead>
  {#if $itemsQ}
    {#if count}
      <div class="fgrid">
        {#each groups as g (g.key)}
          <div class="grp">
            <Section title={t(g.name)} sub={`${tn(g.items.length, '{n} item', '{n} items')}${g.grams ? ` · ${formatWeight(g.grams)}` : ''}`} id="fav-{g.key}">
              <ul class="card slist">
                {#each g.items as i (i.id)}
                  {@const Icon = catIcon(i.category)}
                  <!-- v0.40.0 (design check R2): the whole name opens the item; the category in words. -->
                  <li class="srow frow">
                    <span class="sib" aria-hidden="true"><Icon size={18} /></span>
                    <a class="sm fname" href={gearHref(i)}>
                      <b>{nameOf(i)}{#if i.qty > 1}<small class="qx"> × {i.qty}</small>{/if}</b>
                      {#if i.favNote}<small class="why">«{i.favNote}»</small>{/if}
                      {#if subOf(i)}<small class="sub">{subOf(i)}</small>{/if}
                    </a>
                    <span class="sv num" class:nw={i.weightG == null}>{i.weightG == null ? t('not weighed') : formatWeight(itemWeight(i))}</span>
                    <span class="rowacts no-print"><MoreActions title={nameOf(i)} label={t('More for {name}', { name: nameOf(i) })} actions={actionsOf(i)} /></span>
                  </li>
                {/each}
              </ul>
            </Section>
          </div>
        {/each}
      </div>
      <p class="hint no-print"><Star size={15} aria-hidden="true" /><span>{t('You set the star in the item itself. Under «…»: remove the star, change the note.')}</span></p>
    {:else}
      <!-- v0.127.0 A-U2: the one empty building block -->
      <Empty icon={Star} title={t('No favourites yet')} text={t('No favourites yet. In Gear tap the ☆ in front of an item.')} action={{ label: t('Open Gear'), href: '#/gear' }} />
    {/if}
  {/if}
</div>

{#if undo}
  <div class="undo no-print" role="status">
    <span>{undo.text}</span>
    <Btn label={t('Undo')} onclick={restar} />
  </div>
{/if}

{#if noting}
  {@const i = noting}
  <RenameSheet kicker={nameOf(i)} title={t('Why it is a favourite')} value={i.favNote ?? ''} empty={t('no note')} hint={t('Shown under the item here and in its details.')} onsave={(text) => saveNote(i, text)} onclose={() => (noting = null)} />
{/if}

<style>
  .favs {
    max-width: 1240px;
  }
  .fgrid {
    display: grid;
    gap: var(--sp-5);
  }
  @media (min-width: 900px) {
    .fgrid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: start;
    }
  }
  .grp {
    min-width: 0;
    break-inside: avoid-page;
  }
  .frow {
    break-inside: avoid;
  }
  .fname {
    color: var(--ink);
    text-decoration: none;
  }
  .qx {
    display: inline;
    font-weight: 400;
  }
  .why {
    font-style: italic;
  }
  .nw {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .hint {
    display: flex;
    align-items: flex-start;
    gap: var(--sp-2);
    margin: var(--sp-3) 2px 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .hint :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .undo {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 5;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding: 8px max(12px, calc((100vw - 1560px) / 2)) calc(8px + env(safe-area-inset-bottom));
    border-top: 1.5px solid var(--line-strong);
    background: var(--paper);
    box-shadow: 0 -4px 14px var(--shadow);
  }
  .undo span {
    flex: 1 1 180px;
    min-width: 0;
    overflow-wrap: break-word;
  }
  @media (max-width: 719px) {
    .undo {
      bottom: calc(76px + env(safe-area-inset-bottom));
    }
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
      background: var(--paper) !important;
      padding: 0 !important;
    }
    .favs {
      max-width: none;
      color: var(--ink);
    }
  }
</style>
