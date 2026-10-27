<script>
  /**
   * Garmin-Übersicht «Im Fokus» (screenshot 1): per sport one card to swipe: the sport and the 7 days,
   * the distance and the total time, one bar per day (today on the right), the 28 days as dots
   * («Letzte 4 Wochen»). A tap opens the sport's page (#/flow/stats/<sport>).
   */
  import { focus } from '../../uebersicht.js';
  import { SPORT_ICON, sportName, hms, km2, wdLetter, rangeText } from './words.js';
  import { t } from '../../i18n.svelte.js';

  let { table, today, kinds = [] } = $props();
  const cards = $derived(kinds.map((k) => focus(table, today, k)));
  let at = $state(0);
  let strip = $state();
  function onscroll() {
    if (!strip) return;
    at = Math.round(strip.scrollLeft / Math.max(1, strip.clientWidth * 0.92));
  }
  function go(i) {
    strip?.children[i]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
  }
  const val = (b) => b.km || b.time / 1800;
</script>

<div class="fo" data-focus>
  <div class="strip noswipe" bind:this={strip} {onscroll}>
    {#each cards as c (c.kind)}
      {@const I = SPORT_ICON[c.kind]}
      {@const top = Math.max(0.001, ...c.bars.map(val))}
      <a class="card fc" href="#/flow/stats/{c.kind}" data-focus-card={c.kind}>
        <span class="hd"><I size={20} aria-hidden="true" /><span>{sportName(c.kind)} · {rangeText(c.from, c.to)}</span></span>
        <span class="tot">
          {#if c.km}<b class="num">{km2(c.km)} <small>km</small></b>{/if}
          <span class="tm"><b class="num">{hms(c.time)}</b><small>{t('Total time')}</small></span>
        </span>
        <span class="bars" role="img" aria-label={t('{name}: one bar per day, today on the right', { name: sportName(c.kind) })}>
          {#each c.bars as b (b.day)}
            <span class="b"><i style="height:{val(b) ? Math.max(10, Math.round((val(b) / top) * 100)) : 0}%"></i><small>{wdLetter(b.day)}</small></span>
          {/each}
        </span>
        <span class="dots" aria-hidden="true">
          {#each c.dots as d (d.day)}<i class="s{d.size}" class:now={d.day === today}></i>{/each}
        </span>
        <small class="l4">{t('Last 4 weeks')}</small>
      </a>
    {/each}
  </div>
  {#if cards.length > 1}
    <div class="pg">
      {#each cards as c, i (c.kind)}<button type="button" class:on={at === i} aria-label={sportName(c.kind)} aria-current={at === i ? 'true' : undefined} onclick={() => go(i)}></button>{/each}
    </div>
  {/if}
</div>

<style>
  .fo {
    display: grid;
    gap: 8px;
    min-width: 0;
  }
  .strip {
    display: grid;
    grid-auto-columns: 92%;
    grid-auto-flow: column;
    gap: 10px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
  }
  .strip::-webkit-scrollbar {
    display: none;
  }
  .strip:has(> :only-child) {
    grid-auto-columns: 100%;
  }
  .fc {
    display: grid;
    gap: 12px;
    padding: 14px 16px;
    scroll-snap-align: start;
    color: var(--ink);
    text-decoration: none;
  }
  .fc:hover {
    background: var(--paper-2);
  }
  .hd {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .hd :global(svg) {
    flex: none;
    color: var(--hi);
  }
  .tot {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 6px 28px;
  }
  .tot > b {
    font: 600 var(--fs-display) / 1.1 var(--font-body);
  }
  .tot > b small {
    font-size: var(--fs-sub);
  }
  .tm {
    display: grid;
  }
  .tm b {
    font: 600 var(--fs-sub) / 1.2 var(--font-body);
  }
  .tm small,
  .l4 {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .bars {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 10px;
    height: 120px;
    padding-bottom: 4px;
    border-bottom: 1px solid var(--line);
  }
  /* Handy-Längenbudget: a little lower on a phone */
  @media (max-width: 640px) {
    .bars {
      height: 88px;
    }
  }
  .b {
    display: grid;
    grid-template-rows: 1fr auto;
    justify-items: center;
    gap: 6px;
    min-height: 0;
  }
  .b i {
    align-self: end;
    width: 70%;
    max-width: 28px;
    border-radius: 99px 99px 0 0;
    background: var(--hi);
  }
  .b small {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .dots {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2px;
  }
  .dots i {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--line-strong);
  }
  .dots i.s1 {
    width: 7px;
    height: 7px;
    background: var(--ink-3);
  }
  .dots i.s2 {
    width: 9px;
    height: 9px;
    background: var(--ink-3);
  }
  .dots i.s3 {
    width: 11px;
    height: 11px;
    background: var(--ink-3);
  }
  .dots i.now {
    background: var(--hi);
  }
  .pg {
    display: flex;
    justify-content: center;
    gap: 2px;
  }
  .pg button {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
  }
  .pg button::after {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--line-strong);
  }
  .pg button.on::after {
    background: var(--ink);
  }
  /* Klick-Rundgang 2: on a touch screen each dot is a 44 px button (the dot itself stays small) */
  @media (pointer: coarse) {
    .pg {
      gap: 0;
    }
    .pg button {
      width: 44px;
      height: 44px;
    }
  }
</style>
