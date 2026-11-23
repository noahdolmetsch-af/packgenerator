<script>
  /**
   * The map of the tour suggestions (Noah 23.11.2026 «die karte unbedingt 1:1 so übernehmen»): the cantons, the start (dot) and the
   * line of every tour of the list, a black dot for Zurich, the number of tours in each canton. Tap a dot to open the tour, tap a canton
   * to show only its tours. Tours that are grey in the list (snow) are grey here too. Drawn as one SVG in the frame of data/kantone.js.
   */
  import K from './data/kantone.js';
  import { REGIONS } from './regeln.js';
  import { pathOf, toXY, ZURICH, countBy, sizes } from './karte.js';
  import { t } from '../i18n.svelte.js';

  let { tours = [], grey = [], regions = [], onregion = () => {}, region = (key) => key } = $props();
  let cw = $state(0);
  const z = $derived(sizes(cw ? cw / K.w : 1));
  const greySet = $derived(new Set(grey));
  const count = $derived(countBy(tours));
  const drawn = $derived(tours.map((x) => ({ id: x.id, title: x.title, hard: x.cond === 'difficult', grey: greySet.has(x.id), d: pathOf(x.line), start: toXY(x.line[0]) })));
</script>

<figure class="karte" bind:clientWidth={cw} data-vs-karte>
  <svg viewBox="0 0 {K.w} {K.h}" role="group" aria-label={t('Map of Switzerland with the tours of the list')}>
    {#each REGIONS as r (r.key)}
      {#if K.paths[r.key]}
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
        <path d={K.paths[r.key]} class="kt" class:on={regions.includes(r.key)} onclick={() => onregion(r.key)} />
      {/if}
    {/each}
    {#each drawn as x (x.id)}
      <path d={x.d} class="ln" class:hard={x.hard} class:grey={x.grey} stroke-width={z.line} />
    {/each}
    {#each drawn as x (x.id)}
      <a href={`#/trips/vorschlaege/${x.id}`} aria-label={x.title}>
        <circle cx={x.start[0]} cy={x.start[1]} r={z.dot * 1.4} class="hit" />
        <circle cx={x.start[0]} cy={x.start[1]} r={z.dot} class="dot" class:hard={x.hard} class:grey={x.grey} stroke-width={z.dot * 0.3} />
      </a>
    {/each}
    {#each REGIONS as r (r.key)}
      {#if K.labels[r.key]}
        <g class="kl" role="button" tabindex="0" aria-pressed={regions.includes(r.key)} aria-label={region(r.key)} data-vs-kt={r.key} onclick={() => onregion(r.key)} onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onregion(r.key))}>
          <text x={K.labels[r.key][0]} y={K.labels[r.key][1]} font-size={z.font} class="kc">{r.key.toUpperCase()}</text>
          <text x={K.labels[r.key][0]} y={K.labels[r.key][1] + z.font * 1.15} font-size={z.font * 0.92} class="kn" class:none={!count[r.key]}>{count[r.key] ?? '–'}</text>
        </g>
      {/if}
    {/each}
    <circle cx={ZURICH[0]} cy={ZURICH[1]} r={z.dot * 1.6} class="zh" />
    <text x={ZURICH[0] - z.dot * 2.4} y={ZURICH[1] + z.font * 0.35} font-size={z.font * 1.05} class="zt" text-anchor="end">{t('Zurich|tour')}</text>
  </svg>
  <figcaption>
    <span class="key"><i class="kswatch hard"></i>{t('Fitness|tour')}: {t('Difficult|level')}</span>
    <span class="key"><i class="kswatch"></i>{t('Fitness|tour')}: {t('Medium|level')}</span>
    {#if grey.length}<span class="key"><i class="kswatch grey"></i>{t('Snow likely')}</span>{/if}
    <span class="note">{t('Dot = start, line = tour. The number is how many tours the canton has in the list. Tap a dot to open the tour, tap a canton to show only its tours.')} {t('Map: © swisstopo, SchweizMobil (ASTRA).')}</span>
  </figcaption>
</figure>

<style>
  /* the map is drawn like paper in every light: its own colours, as custom properties */
  .karte {
    --k-paper: #fff;
    --k-land: #eef1ea;
    --k-border: #b9c1b0;
    --k-on: #dbe6d0;
    --k-on-border: #6f8560;
    --k-mid: #2563eb;
    --k-hard: #c2410c;
    --k-grey: #9ca3af;
    --k-zh: #111827;
    --k-text: #374151;
    margin: 0 0 var(--sp-4);
  }
  svg { display: block; width: 100%; height: auto; background: var(--k-paper); border: 1px solid var(--line); border-radius: var(--r-md, 14px); }
  .kt { cursor: pointer; fill: var(--k-land); stroke: var(--k-border); stroke-width: 1; }
  .kt.on { fill: var(--k-on); stroke: var(--k-on-border); stroke-width: 2; }
  .ln { pointer-events: none; fill: none; stroke: var(--k-mid); opacity: 0.55; stroke-linejoin: round; }
  .ln.hard { stroke: var(--k-hard); }
  .ln.grey { stroke: var(--k-grey); opacity: 0.45; }
  .dot { fill: var(--k-mid); stroke: var(--k-paper); }
  .dot.hard { fill: var(--k-hard); }
  .dot.grey { fill: var(--k-grey); }
  .hit { fill: transparent; }
  a { cursor: pointer; }
  .zh { fill: var(--k-zh); }
  .zt { font-weight: 700; fill: var(--k-zh); }
  .kl { pointer-events: none; outline: none; }
  .kl:focus-visible .kc { text-decoration: underline; }
  .kc { text-anchor: middle; font-weight: 700; fill: var(--k-text); }
  .kn { text-anchor: middle; fill: var(--k-hard); }
  .kn.none { fill: var(--k-grey); }
  figcaption { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-top: var(--sp-2); color: var(--ink-2); font-size: var(--fs-small); }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .kswatch { width: 12px; height: 12px; border-radius: 50%; background: var(--k-mid); display: inline-block; }
  .kswatch.hard { background: var(--k-hard); }
  .kswatch.grey { background: var(--k-grey); }
  .note { flex-basis: 100%; }
</style>
