<script>
  /**
   * TR7d «Belastung pro Woche»: 16 bars with the week's load (power, else Relative Effort), this week (until
   * today) lighter, KW under every third bar, and a quiet note on the weeks without any activity. weeks.js.
   */
  import AnaCard from '../AnaCard.svelte';
  import { t } from '../../i18n.svelte.js';
  import { weekLoads, WEEKS } from './weeks.js';

  let { acts = [], today = '' } = $props();
  const weeks = $derived(today ? weekLoads(acts, today) : []);
  const max = $derived(Math.max(0, ...weeks.map((x) => x.load)));
  const empty = $derived(weeks.filter((x) => !x.current && x.n === 0).map((x) => x.kw));

  let w = $state(0);
  const H = 120;
  const TOP = 18;
  const width = $derived(Math.max(240, w || 600));
  const gap = $derived(width < 500 ? 6 : 10);
  const bw = $derived((width - gap * (WEEKS - 1)) / WEEKS);
  const showNums = $derived(bw >= 26);
  const foot = $derived(showNums ? 20 : 34);
  const X = (i) => i * (bw + gap);
  const h = (v) => (max > 0 ? (v / max) * H : 0);
  const label = $derived(weeks.map((x) => `${t('Wk {n}', { n: x.kw })}: ${x.load}`).join(', '));
</script>

{#if max > 0}
  <AnaCard key="wload" wide sub={t('Bars')}>
    <div class="plot" bind:clientWidth={w}>
      <svg width={width} height={TOP + H + foot} viewBox="0 0 {width} {TOP + H + foot}" role="img" aria-label={label}>
        {#each weeks as x, i (x.monday)}
          {#if x.load > 0}
            <rect x={X(i)} y={TOP + H - h(x.load)} width={bw} height={h(x.load)} rx="3" class:now={x.current} />
            {#if showNums}<text class="v" x={X(i) + bw / 2} y={TOP + H - h(x.load) - 6} text-anchor="middle">{x.load}</text>{/if}
          {/if}
          {#if i % 3 === 0}
            {#if showNums}
              <text x={X(i) + bw / 2} y={TOP + H + 15} text-anchor="middle">{t('Wk {n}', { n: x.kw })}</text>
            {:else}
              {@const tx = i === WEEKS - 1 ? X(i) + bw : X(i)}
              <text x={tx} y={TOP + H + 15} text-anchor={i === WEEKS - 1 ? 'end' : 'start'}><tspan x={tx}>{t('Wk|unit')}</tspan><tspan x={tx} dy="14">{x.kw}</tspan></text>
            {/if}
          {/if}
        {/each}
      </svg>
    </div>
    <p class="cap">
      {t('Load per week (power, else Relative Effort). Light = this week until today.')}
      {#if empty.length}{t('Wk {list} without activity.', { list: empty.join(', ') })}{/if}
    </p>
  </AnaCard>
{/if}

<style>
  .plot {
    min-width: 0;
    overflow: hidden;
  }
  svg {
    display: block;
  }
  rect {
    fill: var(--ch-w);
  }
  rect.now {
    fill: var(--ch-w);
    opacity: 0.45;
  }
  text {
    fill: var(--ink-3);
    font: 400 var(--fs-tiny) / 1 var(--font-body);
  }
  text.v {
    fill: var(--ink);
    font-weight: 600;
  }
</style>
