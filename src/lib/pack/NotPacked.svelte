<script>
  /**
   * "Not packed": everything you own that is not on the trip yet, grouped by category.
   * Mockup answers (4.10.2026): groups start folded (2b), hints as small labels (3a),
   * "+" puts an item into the chosen bag, or drag it onto a bag (4a).
   */
  import { CATEGORIES, formatWeight } from '../gear.js';

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

  // Which groups are open. While searching every group with a match is open.
  let open = $state(new Set());
  const isOpen = (key) => !!q.trim() || open.has(key);
  function flip(key) {
    const next = new Set(open);
    next.has(key) ? next.delete(key) : next.add(key);
    open = next;
  }
  const allOpen = $derived(groups.length > 0 && groups.every((g) => open.has(g.key)));
  const flipAll = () => (open = allOpen ? new Set() : new Set(groups.map((g) => g.key)));

  function start(event, id) {
    event.dataTransfer.setData('text/plain', id);
    event.dataTransfer.effectAllowed = 'copy';
  }
</script>

<section class="np" aria-labelledby="np-h">
  <div class="np-top">
    <div class="np-h">
      <h2 id="np-h" class="title">Not packed</h2>
      <span class="m num">{items.length} items</span>
      {#if groups.length && !q.trim()}<button type="button" class="link" onclick={flipAll}>{allOpen ? 'Fold all' : 'Open all'}</button>{/if}
    </div>
    <input class="inp" type="search" placeholder="Search your gear" bind:value={q} aria-label="Search your gear" />
    {@render children?.()}
  </div>
  <div class="np-list">
    {#each groups as g (g.key)}
      <div class="grp">
        <button type="button" class="gh" aria-expanded={isOpen(g.key)} onclick={() => flip(g.key)}>
          <span class="sq" style:background={g.color} aria-hidden="true"></span>
          <span class="gn">{g.name}</span>
          <span class="gc num">{g.items.length}</span>
          <span class="ar" aria-hidden="true">{isOpen(g.key) ? '▾' : '▸'}</span>
        </button>
        {#if isOpen(g.key)}
          <ul>
            {#each g.items as i (i.id)}
              {@const tag = tagOf(i)}
              <li draggable={drag} ondragstart={(e) => start(e, i.id)} class:drag>
                <span class="nm">{i.name}{#if tag}<small class="lab">{tag}</small>{/if}</span>
                <span class="w num">{i.weightG == null ? '–' : formatWeight(i.weightG)}</span>
                <button type="button" class="plus" aria-label="Add {i.name} to {target}" onclick={() => onadd(i.id)}>+</button>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    {:else}
      <p class="empty">{q.trim() ? 'Nothing matches.' : 'Everything you own is on this trip.'}</p>
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
  .link {
    border: 0;
    background: none;
    padding: 0;
    font: inherit;
    font-size: 14px;
    color: var(--ink);
    text-decoration: underline;
    cursor: pointer;
  }
  .np-list {
    flex: 1;
    min-height: 0;
    overflow: auto;
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
    background: #e6ebe3;
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
    min-height: 44px;
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
  .plus {
    width: 40px;
    height: 34px;
    border: 0;
    border-radius: 4px;
    background: var(--ink);
    color: var(--paper);
    font: 700 20px/1 var(--font-body);
    cursor: pointer;
  }
  .empty {
    padding: 12px 10px;
    color: var(--ink-3);
  }
</style>
