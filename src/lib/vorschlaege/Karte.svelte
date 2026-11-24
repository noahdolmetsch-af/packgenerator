<script>
  /**
   * The map of the tour suggestions (Noah 23.11.2026 «die karte unbedingt 1:1 so übernehmen»): the cantons, the start (dot) and the
   * line of every tour of the list, a black dot for Zurich, the number of tours in each canton. Tap a dot to open the tour, tap a canton
   * to show only its tours. Tours that are grey in the list (snow) are grey here too. Drawn as one SVG in the frame of data/kantone.js.
   */
  import K from './data/kantone.js';
  import { REGIONS } from './regeln.js';
  import { pathOf, toXY, ZURICH, countBy, sizes, tipPos } from './karte.js';
  import { hoursOf, splitHours } from './regeln.js';
  import { t, num } from '../i18n.svelte.js';

  /** pace: your own pace (for the time on the hover card). */
  let { tours = [], grey = [], regions = [], onregion = () => {}, region = (key) => key, pace = null, light = {}, lightText = {}, lightDay = '' } = $props();
  let cw = $state(0);
  // The hover card (Noah 23.11.2026 «mouseover soll gleich wichtigste daten zeigen»): the mouse over a dot, or the focus on it; on a touch screen
  // the first tap shows the card and the line, the second tap (or the link in the card) opens the tour. The line of that tour is thick, the others pale.
  let tip = $state(null);
  let figH = $state(0);
  const byId = $derived(new Map(tours.map((x) => [x.id, x])));
  const tipTour = $derived(tip ? byId.get(tip) ?? null : null);
  const scale = $derived(cw ? cw / K.w : 1);
  const tipAt = $derived(tipTour ? tipPos([toXY(tipTour.line[0])[0] * scale, toXY(tipTour.line[0])[1] * scale], [cw, figH || cw * (K.h / K.w)]) : null);
  const timeText = (h) => {
    const { h: hh, min } = splitHours(h);
    return min ? t('{h} h {min}', { h: hh, min }) : t('{h} h|tour', { h: hh });
  };
  const LEVEL_NAME = { easy: 'Easy|level', medium: 'Medium|level', difficult: 'Difficult|level' };
  // on a touch screen a tap also focuses the link: the card then comes from the tap (onTap), not from the focus, or the first tap would open the tour
  const touch = () => typeof matchMedia === 'function' && matchMedia('(hover: none)').matches;
  const onEnter = (id, e) => e.pointerType === 'mouse' && (tip = id);
  const onLeave = (e) => e.pointerType === 'mouse' && (tip = null);
  const onTap = (id, e) => {
    if (touch() && tip !== id) {
      e.preventDefault(); // the first tap only shows the card
      tip = id;
    }
  };
  const z = $derived(sizes(cw ? cw / K.w : 1));
  const greySet = $derived(new Set(grey));
  const count = $derived(countBy(tours));
  const lit = $derived(Object.keys(light).length > 0);
  const drawn = $derived(tours.map((x) => ({ id: x.id, title: x.title, light: light[x.id] ?? null, hard: x.cond === 'difficult', grey: greySet.has(x.id), d: pathOf(x.line), start: toXY(x.line[0]) })));
</script>

<figure class="karte" bind:clientWidth={cw} data-vs-karte>
  <div class="frame" bind:clientHeight={figH}>
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
  <svg viewBox="0 0 {K.w} {K.h}" role="group" aria-label={t('Map of Switzerland with the tours of the list')} onclick={(e) => e.target.closest?.('a') || (tip = null)}>
    {#each REGIONS as r (r.key)}
      {#if K.paths[r.key]}
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
        <path d={K.paths[r.key]} class="kt" class:on={regions.includes(r.key)} onclick={() => onregion(r.key)} />
      {/if}
    {/each}
    {#each drawn as x (x.id)}
      <path d={x.d} class="ln" class:hard={x.hard} class:grey={x.grey} class:hot={tip === x.id} class:dim={tip && tip !== x.id} stroke-width={tip === x.id ? z.line * 2.4 : z.line} />
    {/each}
    {#each drawn as x (x.id)}
      <a href={`#/trips/vorschlaege/${x.id}`} aria-label={x.title} data-explain="off" data-vs-dot={x.id} onpointerenter={(e) => onEnter(x.id, e)} onpointerleave={onLeave} onfocus={() => touch() || (tip = x.id)} onblur={() => (tip = null)} onclick={(e) => onTap(x.id, e)}>
        <circle cx={x.start[0]} cy={x.start[1]} r={z.dot * 1.4} class="hit" />
        {#if x.light}<circle cx={x.start[0]} cy={x.start[1]} r={z.dot * 1.75} class="ring {x.light}" stroke-width={z.dot * 0.42} data-vs-ring={x.light} />{/if}
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
  {#if tipTour && tipAt}
    <div class="tip" role="status" style:left="{tipAt.left}px" style:top="{tipAt.top}px" style:width="{tipAt.width}px" data-vs-tip={tipTour.id}>
      <b>{tipTour.title}</b>
      <span class="tnums num"><span>{num(tipTour.km)} km</span><span>{timeText(hoursOf(tipTour, pace))}</span><span>+{num(tipTour.up)} m</span></span>
      <span class="tlv">
        {#if tipTour.cond}<i class="tp" data-lv={tipTour.cond}>{t('Fitness|tour')}: {t(LEVEL_NAME[tipTour.cond])}</i>{/if}
        {#if tipTour.tech}<i class="tp" data-lv={tipTour.tech}>{t('Skill|tour')}: {t(LEVEL_NAME[tipTour.tech])}</i>{/if}
      </span>
      {#if lightText[tipTour.id]}<span class="twx" data-vs-tip-wx>{lightText[tipTour.id]}</span>{/if}
      <a class="topen" href={`#/trips/vorschlaege/${tipTour.id}`}>{t('Open the tour')}</a>
    </div>
  {/if}
  </div>
  <figcaption>
    <span class="key"><i class="kswatch hard"></i>{t('Fitness|tour')}: {t('Difficult|level')}</span>
    <span class="key"><i class="kswatch"></i>{t('Fitness|tour')}: {t('Medium|level')}</span>
    {#if grey.length}<span class="key"><i class="kswatch grey"></i>{t('Snow likely')}</span>{/if}
    {#if lit}<span class="key" data-vs-ring-key>{t('Ring = weather {day}', { day: lightDay })}: <i class="kring good"></i>{t('Fits|wx')} <i class="kring fair"></i>{t('With care|wx')} <i class="kring bad"></i>{t('Better not|wx')}</span>{/if}
    <span class="note">{t('Dot = start, line = tour. The number is how many tours the canton has in the list. Point at a dot to see the numbers, click it to open the tour; on a phone tap once for the numbers and again to open. Tap a canton to show only its tours.')} {t('Map: © swisstopo, SchweizMobil (ASTRA).')}</span>
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
    --k-good: #15803d;
    --k-fair: #ca8a04;
    --k-bad: #b91c1c;
    --k-zh: #111827;
    --k-text: #374151;
    --k-shadow: #0000002e;
    margin: 0 0 var(--sp-4);
  }
  svg { display: block; width: 100%; height: auto; background: var(--k-paper); border: 1px solid var(--line); border-radius: var(--r-md, 14px); }
  .kt { cursor: pointer; fill: var(--k-land); stroke: var(--k-border); stroke-width: 1; }
  .kt.on { fill: var(--k-on); stroke: var(--k-on-border); stroke-width: 2; }
  .ln { pointer-events: none; fill: none; stroke: var(--k-mid); opacity: 0.55; stroke-linejoin: round; }
  .ln.hard { stroke: var(--k-hard); }
  .ln.grey { stroke: var(--k-grey); opacity: 0.45; }
  .ln.hot { opacity: 1; }
  .ln.dim { opacity: 0.18; }
  .frame { position: relative; }
  .tip { position: absolute; z-index: 2; display: grid; gap: 4px; padding: 8px 10px; background: var(--k-paper); color: var(--k-text); border: 1px solid var(--k-border); border-radius: 10px; box-shadow: 0 4px 14px var(--k-shadow); font-size: var(--fs-small); }
  .tip b { overflow-wrap: break-word; }
  .tnums { display: flex; flex-wrap: wrap; gap: 2px 12px; }
  .tlv { display: flex; flex-wrap: wrap; gap: 4px; }
  .tp { font-style: normal; font-weight: 600; border: 1px solid var(--k-border); border-radius: 99px; padding: 0 8px; }
  .tp[data-lv='difficult'] { border-color: var(--k-hard); color: var(--k-hard); }
  .topen { font-weight: 700; color: var(--k-mid); }
  .dot { fill: var(--k-mid); stroke: var(--k-paper); }
  .dot.hard { fill: var(--k-hard); }
  .dot.grey { fill: var(--k-grey); }
  .hit { fill: transparent; }
  .ring { fill: none; pointer-events: none; }
  .ring.good { stroke: var(--k-good); }
  .ring.fair { stroke: var(--k-fair); }
  .ring.bad { stroke: var(--k-bad); stroke-dasharray: 3 2; }
  .kring { display: inline-block; width: 12px; height: 12px; border-radius: 50%; border: 3px solid var(--k-good); vertical-align: -2px; margin-inline: 2px 0; }
  .kring.fair { border-color: var(--k-fair); }
  .kring.bad { border-color: var(--k-bad); border-style: dashed; }
  .twx { font-weight: 600; }
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
