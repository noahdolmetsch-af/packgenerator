<script>
  /**
   * «Dein Stand in Zahlen» (Noah 24.11.2026 «b», thread «Mini-Landingpage pro Bereich bauen»): the same small landing on top of
   * every area, so you see your standing at once: three big numbers, below them a quiet chart (the `children` snippet).
   * It is content, not help (Content first): it starts what you came for, it never explains. Every number leads on to where
   * it comes from (`href`), nothing is mandatory: «Hide» switches it off for all areas (Ich › Darstellung › Bedienung) with Undo.
   *
   * area: the area's key (data-stand); name: the area as a word («Bikes»), for the screen reader; tiles: up to three
   * { value (text of the number, already formatted), unit (small, after it), label (one quiet line), href, tone: 'warn' | 'good' | '' };
   * chartLabel: the one line over the chart (what it shows); the chart is one open line on a computer and one closed line on a
   * phone («Inhalt zuerst»: the bikes stay in sight); foot: one quiet line when there is no chart (what to do); an area adds its own wrapper (stand/StandVelos.svelte),
   * which reads the data and builds these props. Texts arrive translated (t() at the caller).
   */
  import { ChevronRight, ChevronDown, EyeOff } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { ops, setOp } from '../bedienung.svelte.js';
  import { offerDone } from './rename.svelte.js';
  import { phone } from '../media.svelte.js';

  let { area, name = '', tiles = [], chartLabel = '', foot = '', children } = $props();
  // closed on a phone, open on a computer; your own tap wins for this visit
  let own = $state(null);
  const open = $derived(own ?? !phone.matches);

  function hide() {
    setOp('standzahlen', false);
    offerDone(t('«Your standing in numbers» is off.'), async () => setOp('standzahlen', true));
  }
</script>

{#if ops.standzahlen && tiles.length}
  <section class="stand" class:wide={!!children} aria-labelledby={`stand-${area}`} data-stand={area}>
    <h2 id={`stand-${area}`} class="stand-sr">{name ? t('Your standing in numbers · {area}', { area: name }) : t('Your standing in numbers')}</h2>
    <ul class="tiles">
      {#each tiles as x, i (i)}
        <li>
          <svelte:element this={x.href ? 'a' : 'div'} class="tile {x.tone ?? ''}" href={x.href} data-stand-tile={i}>
            <span class="v"><b class="num">{x.value}</b>{#if x.unit}{' '}<small>{x.unit}</small>{/if}</span>
            <!-- the last word and the arrow never part (a lone arrow on its own line looks broken) -->
            <span class="l">{x.label.slice(0, x.label.lastIndexOf(' ') + 1)}<span class="nb">{x.label.slice(x.label.lastIndexOf(' ') + 1)}{#if x.href}<ChevronRight size={14} class="lc" aria-hidden="true" />{/if}</span></span>
          </svelte:element>
        </li>
      {/each}
    </ul>
    {#if children}
      <details class="chart" {open} ontoggle={(e) => (own = e.currentTarget.open)} data-stand-chart>
        <summary><span>{chartLabel}</span><ChevronDown size={16} class="cv" aria-hidden="true" /></summary>
        {#if open}<div class="chart-in">{@render children()}</div>{/if}
      </details>
    {/if}
    <div class="foot">
      {#if foot}<p class="note">{foot}</p>{/if}
      <button type="button" class="hide" onclick={hide} data-stand-hide><EyeOff size={16} aria-hidden="true" />{t('Hide')}</button>
    </div>
  </section>
{/if}

<style>
  .stand {
    display: grid;
    gap: 12px;
    margin: 0 0 16px;
    padding: 14px 16px 6px;
    background: var(--paper);
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    box-shadow: var(--card-shadow);
  }
  .stand-sr {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
  .tiles {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 1.1fr) minmax(0, 1fr);
    gap: 8px 12px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .tile {
    display: grid;
    align-content: start;
    gap: 2px;
    min-height: 44px;
    min-width: 0;
    color: var(--ink);
    text-decoration: none;
  }
  a.tile:hover .l {
    color: var(--ink);
  }
  .v {
    display: inline-flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 2px 4px;
    color: var(--ink);
  }
  .v b {
    font: 700 var(--fs-num) / 1.1 var(--font-body);
    font-variant-numeric: tabular-nums;
  }
  .v small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  /* one quiet colour for «something is due», one for «all good»; never red (a hint, not an alarm) */
  .warn .v b {
    color: var(--warn);
  }
  .good .v b {
    color: var(--accent);
  }
  .l {
    display: block;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
    min-width: 0;
  }
  .nb {
    white-space: nowrap;
  }
  .l :global(.lc) {
    display: inline-block;
    vertical-align: -2px;
  }
  .chart {
    min-width: 0;
    border-top: 1px solid var(--card-line);
  }
  .chart summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 44px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    cursor: pointer;
    list-style: none;
  }
  .chart summary::-webkit-details-marker {
    display: none;
  }
  .chart summary :global(.cv) {
    flex: none;
    transition: transform var(--t-fast, 120ms);
  }
  .chart[open] summary :global(.cv) {
    transform: rotate(180deg);
  }
  .chart-in {
    padding: 0 0 8px;
  }
  .foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0 12px;
  }
  .note {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .foot {
    margin-top: -6px;
  }
  .hide {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    margin-left: auto;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--ink-2);
    font: 500 var(--fs-small) / 1.3 var(--font-body);
    cursor: pointer;
  }
  .hide:hover {
    color: var(--ink);
  }
  /* a computer has the room: the numbers stand in a column on the left, the chart beside them, so the bikes stay in sight */
  @media (min-width: 1100px) {
    .stand.wide {
      grid-template-columns: 220px minmax(0, 1fr);
      grid-template-areas:
        'tiles chart'
        'foot foot';
      column-gap: 28px;
      align-items: start;
    }
    .stand.wide .tiles {
      grid-area: tiles;
      grid-template-columns: minmax(0, 1fr);
      gap: 14px;
    }
    .stand.wide .chart {
      grid-area: chart;
      border-top: 0;
    }
    .stand.wide .foot {
      grid-area: foot;
    }
  }
</style>
