<script>
  import { formatWeight, itemWeight, CATEGORY } from '../gear.js';
  import { phone } from '../media.svelte.js';

  /** stats from gearStats(); category = the active filter; onpick(key) toggles it; onopen(item) opens an item */
  let { stats, category, onpick, onopen } = $props();

  // Heaviest category first; categories without weighed items are not in the bar.
  const cats = $derived(stats.cats.filter((c) => c.g > 0).sort((a, b) => b.g - a.g));
  const total = $derived(stats.total || 1);
  const maxTop = $derived(stats.top.length ? itemWeight(stats.top[0]) : 1);
</script>

<div class="ov">
  <section aria-labelledby="ov-cat">
    <h2 id="ov-cat" class="h">Weight by category <small>{stats.unweighed} not weighed, not in the bar</small></h2>
    <div class="bar" role="group" aria-label="Weight by category, tap to filter">
      {#each cats as c (c.key)}
        <button
          type="button"
          class="seg"
          class:on={category === c.key}
          class:dim={category && category !== c.key}
          style:flex-grow={c.g}
          style:background={c.color}
          aria-label="{c.name}, {formatWeight(c.g)}. Filter"
          aria-pressed={category === c.key}
          onclick={() => onpick(c.key)}
        ></button>
      {/each}
    </div>
    <details class="fold" open={!phone.matches}>
    <summary>Category totals</summary>
    <ul class="legend">
      {#each cats as c (c.key)}
        <li>
          <button type="button" aria-pressed={category === c.key} onclick={() => onpick(c.key)}>
            <span class="sw" style:background={c.color}></span>
            <span class="n">{c.name}</span>
            <span class="num w">{formatWeight(c.g)}</span>
            <span class="num p">{Math.round((c.g / total) * 100)}%</span>
          </button>
        </li>
      {/each}
    </ul>
    </details>
  </section>

  <section aria-labelledby="ov-top">
    <details class="fold" open={!phone.matches}>
    <summary><h2 id="ov-top" class="h">10 heaviest <small>owned + unclear</small></h2></summary>
    <ol class="top">
      {#each stats.top as item, i (item.id)}
        <li>
          <button type="button" onclick={() => onopen(item)}>
            <span class="rk num">{String(i + 1).padStart(2, '0')}</span>
            <span class="tn">
              <span>{item.name}</span>
              <span class="rule"><i style:width="{(itemWeight(item) / maxTop) * 100}%" style:background={CATEGORY[item.category]?.color}></i></span>
            </span>
            <span class="num tw">{formatWeight(itemWeight(item))}</span>
          </button>
        </li>
      {/each}
    </ol>
    </details>
  </section>
</div>

<style>
  .ov {
    display: grid;
    gap: 20px;
    margin-bottom: 22px;
  }
  @media (min-width: 900px) {
    .ov {
      grid-template-columns: 3fr 2fr;
      gap: 32px;
    }
  }
  .h {
    font-family: var(--font-title);
    font-weight: 800;
    text-transform: uppercase;
    font-size: 22px;
    margin: 0 0 8px;
  }
  .h small {
    font-family: var(--font-body);
    font-weight: 400;
    text-transform: none;
    font-size: 13px;
    color: var(--ink-3);
    margin-left: 6px;
  }
  /* The bar looks like an elevation profile strip: one segment per category. */
  .bar {
    display: flex;
    height: 34px;
    border: 2px solid var(--ink);
    border-radius: 4px;
    overflow: hidden;
  }
  .seg {
    border: 0;
    border-right: 1px solid var(--paper);
    padding: 0;
    min-width: 3px;
    cursor: pointer;
  }
  .seg.dim {
    opacity: 0.3;
  }
  /* On the phone the lists fold away; on the desktop they are always open. */
  .fold > summary {
    list-style: none;
    cursor: pointer;
  }
  .fold > summary::-webkit-details-marker {
    display: none;
  }
  @media (max-width: 719px) {
    .fold > summary {
      margin-top: 10px;
      padding: 8px 0;
      border-bottom: 2px solid var(--ink);
      font-weight: 700;
    }
    .fold > summary::after {
      content: ' ▾';
    }
    .fold[open] > summary::after {
      content: ' ▴';
    }
    .fold > summary .h {
      display: inline;
      font-size: 18px;
    }
  }
  @media (min-width: 720px) {
    .fold > summary:not(:has(.h)) {
      display: none;
    }
    .fold > summary {
      pointer-events: none;
    }
  }
  .legend {
    list-style: none;
    margin: 10px 0 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 0 18px;
  }
  .legend button,
  .top button {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    background: none;
    border: 0;
    border-bottom: 1px solid var(--line);
    padding: 6px 2px;
    font: inherit;
    color: inherit;
    text-align: left;
    cursor: pointer;
  }
  .legend button[aria-pressed='true'] {
    background: var(--hi-soft);
  }
  .legend .n {
    flex: 1;
  }
  .legend .p {
    width: 3.2em;
    text-align: right;
    color: var(--ink-3);
  }
  .top {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .rk {
    font-family: var(--font-title);
    font-weight: 900;
    font-size: 20px;
    color: var(--hi);
    width: 1.6em;
  }
  .tn {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .tn > span:first-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .rule {
    height: 4px;
    background: var(--paper-2);
    border-radius: 2px;
  }
  .rule i {
    display: block;
    height: 100%;
    border-radius: 2px;
  }
  .tw {
    font-weight: 700;
  }
</style>
