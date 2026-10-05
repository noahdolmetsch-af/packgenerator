<script>
  /**
   * "Not packed": everything you own that is not on the trip yet, grouped by category.
   * Mockup answers (4.10.2026): groups start folded (2b), hints as small labels (3a),
   * "+" puts an item into the chosen bag, or drag it onto a bag (4a).
   */
  import { CATEGORIES, formatWeight } from '../gear.js';
  import { t, tn, nameOf } from '../i18n.svelte.js';

  /**
   * items: the candidates, already sorted. tagOf(item): a short label or ''.
   * target: name of the bag "+" puts things into. onadd(itemId). drag: allow dragging (not on a phone).
   * children: optional extra controls under the search (the "Adding to" choice).
   */
  let { items, tagOf, target, onadd, drag = true, q = $bindable(''), children } = $props();

  const groups = $derived(
    CATEGORIES.map((c) => ({ ...c, items: items.filter((i) => i.category === c.key) }))
      .concat([{ key: '', name: 'Other', color: '#97a69b', items: items.filter((i) => !CATEGORIES.some((c) => c.key === i.category)) }])
      .filter((g) => g.items.length),
  );

  // Only one group is open at a time (Noah, 4.10.2026). While searching every group with a match is open.
  let open = $state(null);
  const isOpen = (key) => !!q.trim() || open === key;
  const flip = (key) => (open = open === key ? null : key);

  function start(event, id) {
    event.dataTransfer.setData('text/plain', id);
    event.dataTransfer.effectAllowed = 'copy';
  }
</script>

<section class="np" aria-labelledby="np-h">
  <div class="np-top">
    <div class="np-h">
      <h2 id="np-h" class="title">{t('Not packed')}</h2>
      <span class="m num">{tn(items.length, '{n} item', '{n} items')}</span>
    </div>
    <input class="inp" type="search" placeholder={t('Search your gear')} bind:value={q} aria-label={t('Search your gear')} />
    {@render children?.()}
  </div>
  <div class="np-list">
    {#each groups as g (g.key)}
      <div class="grp">
        <button type="button" class="gh" aria-expanded={isOpen(g.key)} onclick={() => flip(g.key)}>
          <span class="sq" style:background={g.color} aria-hidden="true"></span>
          <span class="gn">{t(g.name)}</span>
          <span class="gc num">{g.items.length}</span>
          <span class="ar" aria-hidden="true">{isOpen(g.key) ? '▾' : '▸'}</span>
        </button>
        {#if isOpen(g.key)}
          <ul>
            {#each g.items as i (i.id)}
              {@const tag = tagOf(i)}
              <li draggable={drag} ondragstart={(e) => start(e, i.id)} class:drag>
                <span class="nm">{#if i.favorite}<span class="star" title={t('Favourite')}>★</span>{/if}{nameOf(i)}{#if tag}<small class="lab">{tag}</small>{/if}</span>
                <span class="w num">{i.weightG == null ? '–' : formatWeight(i.weightG)}</span>
                <button type="button" class="plus" aria-label={t('Add {name} to {bag}', { name: nameOf(i), bag: target })} onclick={() => onadd(i.id)}>+</button>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    {:else}
      <p class="empty">{q.trim() ? t('Nothing matches.') : t('Everything you own is on this trip.')}</p>
    {/each}
  </div>
</section>

<style>
  .np {
    display: flex;
    flex-direction: column;
    min-height: 0;
    background: var(--paper);
    border: 1px solid var(--line);
  }
  .np-top {
    display: grid;
    gap: 8px;
    padding: 10px;
    border-bottom: 3px solid var(--ink);
  }
  .np-h {
    display: flex;
    align-items: baseline;
    gap: 10px;
  }
  .np-h .title {
    font-size: 28px;
  }
  .m {
    flex: 1;
    color: var(--ink-3);
    font-size: 14px;
  }
  .np-list {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }
  /* A soft fade at the bottom shows there is more to scroll (design review: rows were cut off). */
  .np-list::after {
    content: '';
    position: sticky;
    bottom: 0;
    display: block;
    height: 28px;
    background: linear-gradient(rgba(251, 251, 248, 0), var(--paper));
    pointer-events: none;
  }
  .gh {
    position: sticky;
    top: 0;
    z-index: 1;
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 10px;
    border: 0;
    border-bottom: 1px solid var(--line);
    background: var(--paper-2);
    color: var(--ink);
    font: 700 12px var(--font-body);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-align: left;
    cursor: pointer;
  }
  .sq {
    width: 10px;
    height: 10px;
    border-radius: 2px;
    flex: none;
  }
  .gn {
    flex: 1;
  }
  .gc {
    color: var(--ink-3);
  }
  .ar {
    width: 12px;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 8px;
    align-items: center;
    min-height: 40px;
    padding: 2px 10px;
    border-bottom: 1px solid var(--line);
  }
  li.drag {
    cursor: grab;
  }
  .nm {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .lab {
    display: inline-block;
    margin-left: 6px;
    padding: 0 6px;
    border: 1px solid var(--ink-3);
    border-radius: 999px;
    font-size: 11px;
    color: var(--ink-2);
    white-space: nowrap;
  }
  .w {
    font-size: 13px;
    color: var(--ink-3);
  }
  /* Small, so it sits with the text (Noah, 4.10.2026); the row is still easy to hit on a phone. */
  .plus {
    width: 26px;
    height: 26px;
    border: 1.5px solid var(--ink);
    border-radius: 4px;
    background: var(--paper);
    color: var(--ink);
    font: 700 16px/1 var(--font-body);
    cursor: pointer;
  }
  @media (max-width: 719px) {
    .plus {
      width: 32px;
      height: 32px;
    }
  }
  @media (hover: hover) {
    .plus:hover {
      background: var(--ink);
      color: var(--paper);
    }
  }
  .empty {
    padding: 12px 10px;
    color: var(--ink-3);
  }
</style>
