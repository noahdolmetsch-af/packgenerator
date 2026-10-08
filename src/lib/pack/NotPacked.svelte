<script>
  /**
   * "Other gear" (v0.22.0, AP04; was "Not packed"): everything you own that is not on this trip
   * (or template) yet, grouped by category. "To pack" and "packed" only mean items on the list.
   * Mockup answers (4.10.2026): groups start folded (2b), hints as small labels (3a),
   * "+" puts an item into the chosen bag, or drag it onto a bag (4a).
   */
  import { CATEGORIES, formatWeight } from '../gear.js';
  import { t, tn, nameOf } from '../i18n.svelte.js';
  import FavStar from '../gear/FavStar.svelte';

  /**
   * items: the candidates, already sorted. tagOf(item): a short label or ''.
   * target: name of the bag "+" puts things into. onadd(itemId). drag: allow dragging (not on a phone).
   * children: optional extra controls under the search (the "Adding to" choice).
   * empty (v0.21.0): what to say when nothing is left and nothing is searched (an area without items).
   * oncreate(name) (v0.24.0, Noah): what is not in your gear yet can be added from the search.
   * onaddmany(itemIds) (v0.24.1, Noah 6a): tick boxes per item, "Select all" per group and one
   * button that adds every ticked item at once. Without it the list has only the "+" per row.
   */
  let { items, tagOf, target, onadd, drag = true, q = $bindable(''), children, empty = '', oncreate = null, onaddmany = null } = $props();
  const multi = $derived(!!onaddmany);
  // The ticked items; they stay ticked while searching, so a search can add to them.
  let picked = $state([]);
  const isPicked = (id) => picked.includes(id);
  const pick = (id, on) => (picked = on ? (picked.includes(id) ? picked : [...picked, id]) : picked.filter((x) => x !== id));
  const allPicked = (g) => g.items.every((i) => picked.includes(i.id));
  function pickGroup(g) {
    const ids = g.items.map((i) => i.id);
    picked = allPicked(g) ? picked.filter((x) => !ids.includes(x)) : [...picked, ...ids.filter((x) => !picked.includes(x))];
  }
  function addOne(id) {
    pick(id, false);
    onadd(id);
  }
  let busy = $state(false);
  async function addPicked() {
    if (!picked.length || busy) return;
    busy = true;
    try {
      await onaddmany([...picked]);
      picked = []; // the ticks clear after adding
    } catch {
      /* the page says it could not save; the ticks stay for another try */
    } finally {
      busy = false;
    }
  }
  const exact = $derived(!!q.trim() && items.some((i) => i.name.toLowerCase() === q.trim().toLowerCase() || nameOf(i).toLowerCase() === q.trim().toLowerCase()));

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
      <h2 id="np-h" class="title">{t('Other gear')}</h2>
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
            {#if multi}
              <li class="all"><button type="button" class="pick-all" aria-label={allPicked(g) ? t('Select none: {group}', { group: t(g.name) }) : t('Select all: {group}', { group: t(g.name) })} onclick={() => pickGroup(g)}>{allPicked(g) ? t('Select none') : t('Select all')}</button></li>
            {/if}
            {#each g.items as i (i.id)}
              {@const tag = tagOf(i)}
              <li draggable={drag} ondragstart={(e) => start(e, i.id)} class:drag class:multi class:picked={multi && isPicked(i.id)}>
                {#if multi}<input type="checkbox" class="pick" id="pick-{i.id}" aria-label={nameOf(i)} checked={isPicked(i.id)} onchange={(e) => pick(i.id, e.currentTarget.checked)} />{/if}
                <!-- v0.22.0 (AP05): the star is a button here too, one tap marks or unmarks. -->
                <FavStar item={i} size="sm" describedby="np-{i.id}" />
                {#if multi}<label class="nm" id="np-{i.id}" for="pick-{i.id}">{nameOf(i)}{#if tag}<small class="lab">{tag}</small>{/if}</label>
                {:else}<span class="nm" id="np-{i.id}">{nameOf(i)}{#if tag}<small class="lab">{tag}</small>{/if}</span>{/if}
                <span class="w num">{i.weightG == null ? '–' : formatWeight(i.weightG)}</span>
                <button type="button" class="plus" aria-label={t('Add {name} to {bag}', { name: nameOf(i), bag: target })} onclick={() => addOne(i.id)}>+</button>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    {:else}
      <p class="empty">{q.trim() ? t('Nothing matches.') : empty || t('Everything you own is on this trip.')}</p>
    {/each}
    {#if oncreate && q.trim() && !exact}
      <button type="button" class="create" onclick={() => oncreate(q.trim())}>+ {t('Add "{q}" as a new item and pack it', { q: q.trim() })}</button>
    {/if}
  </div>
  {#if multi && picked.length}
    <!-- v0.24.1 (Noah 6a): stays at the bottom while scrolling; one write for every ticked item. -->
    <div class="pick-bar">
      <button type="button" class="pick-add" disabled={busy} onclick={addPicked}>{tn(picked.length, 'Add {n} item to {bag}', 'Add {n} items to {bag}', { bag: target })}</button>
      <button type="button" class="pick-clear" onclick={() => (picked = [])}>{t('Select none')}</button>
    </div>
  {/if}
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
    border-bottom: 1px solid var(--line-strong);
  }
  .np-h {
    display: flex;
    align-items: baseline;
    gap: 10px;
  }
  .np-h .title {
    font-size: var(--fs-section);
  }
  .m {
    flex: 1;
    color: var(--ink-3);
    font-size: 14px;
  }
  .create {
    display: block;
    width: calc(100% - 20px);
    min-height: 44px;
    margin: 8px 10px;
    padding: 8px 12px;
    border: 1.5px dashed var(--ink-3);
    border-radius: 6px;
    background: var(--paper);
    color: var(--ink);
    font: 600 15px var(--font-body);
    text-align: left;
    overflow-wrap: anywhere;
    cursor: pointer;
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
    min-height: 44px; /* v0.27.0 (AP21): a thumb high (was 35 px) */
    padding: 9px 10px;
    border: 0;
    border-bottom: 1px solid var(--line);
    background: var(--paper-2);
    color: var(--ink);
    font: 600 13px var(--font-body);
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
    grid-template-columns: auto 1fr auto auto;
    gap: 4px 8px;
    align-items: center;
    min-height: 40px;
    padding: 2px 10px 2px 2px;
    border-bottom: 1px solid var(--line);
  }
  li.drag {
    cursor: grab;
  }
  li.multi {
    grid-template-columns: auto auto 1fr auto auto;
  }
  li.picked {
    background: var(--paper-2);
  }
  li.all {
    display: flex;
    min-height: 36px;
  }
  .pick {
    width: 22px;
    height: 22px;
    margin: 0 0 0 8px;
    accent-color: var(--ink);
    cursor: pointer;
  }
  label.nm {
    cursor: pointer;
    padding: 6px 0;
  }
  .pick-all,
  .pick-clear {
    border: 0;
    background: none;
    color: var(--ink);
    font: 400 14px var(--font-body);
    text-decoration: underline;
    text-underline-offset: 3px;
    padding: 8px 10px;
    cursor: pointer;
  }
  .pick-bar {
    position: sticky;
    bottom: 0;
    z-index: 2;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
    padding: 10px;
    background: var(--paper);
    border-top: 1px solid var(--line-strong);
    box-shadow: 0 -6px 16px #14352e14;
  }
  .pick-add {
    flex: 1 1 200px;
    min-height: 44px;
    padding: 8px 14px;
    border: 1px solid var(--hi);
    border-radius: 6px;
    background: var(--hi);
    color: #fff;
    font: 600 15px var(--font-body);
    text-align: center;
    overflow-wrap: anywhere;
    cursor: pointer;
  }
  .pick-add:disabled {
    opacity: 0.6;
    cursor: default;
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
    font-size: var(--fs-small);
    color: var(--ink-2);
    white-space: nowrap;
  }
  .w {
    font-size: var(--fs-small);
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
