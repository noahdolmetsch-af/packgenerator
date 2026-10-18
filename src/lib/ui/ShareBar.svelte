<script>
  /**
   * 0.159.0 «UI-Regeln» Teil 1 (Noah 14.10.2026 «1a», «4a»: UI1 one key line, UI8 small charts):
   * where the weight sits, as one thin bar split into parts, with the names and kilos under it.
   * Parts at 0 g stay out; the whole bar hides when nothing is weighed.
   * label: the quiet caption; parts: [{ key, label, g, color }]; fmt: the weight formatter.
   */
  import { formatWeight } from '../gear.js';

  let { label, parts = [], fmt = formatWeight } = $props();
  const shown = $derived(parts.filter((p) => p.g > 0));
  const total = $derived(shown.reduce((s, p) => s + p.g, 0));
  const pct = (g) => Math.round((g / total) * 100);
</script>

{#if total > 0}
  <figure class="sharebar" data-share-bar>
    <figcaption class="cap">{label}</figcaption>
    <div class="bar" role="img" aria-label={`${label}: ${shown.map((p) => `${p.label} ${fmt(p.g)}`).join(', ')}`}>
      {#each shown as p (p.key)}
        <span class="seg" style:flex-grow={p.g} style:background={p.color}></span>
      {/each}
    </div>
    <ul class="legend">
      {#each shown as p (p.key)}
        <li><i class="dot" style:background={p.color} aria-hidden="true"></i><span class="nm">{p.label}</span> <b class="num">{fmt(p.g)}</b> <span class="pc num">{pct(p.g)} %</span></li>
      {/each}
    </ul>
  </figure>
{/if}

<style>
  .sharebar {
    margin: 0;
    display: grid;
    gap: 6px;
    min-width: 0;
  }
  .cap {
    font-size: var(--fs-tiny);
    color: var(--ink-3);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .bar {
    display: flex;
    gap: 2px;
    height: 10px;
    border-radius: 999px;
    overflow: hidden;
    background: var(--line);
  }
  .seg {
    flex-basis: 0;
    min-width: 4px;
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 14px;
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .legend li {
    display: inline-flex;
    align-items: baseline;
    gap: 5px;
    min-width: 0;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex: none;
    align-self: center;
  }
  .legend b {
    color: var(--ink);
    font-weight: 600;
  }
  .pc {
    color: var(--ink-3);
  }
</style>
